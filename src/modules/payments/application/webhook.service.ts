import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CheckoutService } from './checkout.service';
import { PaymentEventRepository } from '../infrastructure/payment-event.repository';
import { OrderRepository } from '../infrastructure/order.repository';
import type { Order } from '../domain/payment.types';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly paymentEventRepository: PaymentEventRepository,
    private readonly orderRepository: OrderRepository,
    private readonly configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('stripe.secretKey');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-02-25.clover',
    });
  }

  /**
   * Verifies Stripe webhook signature
   * @param payload Raw request body
   * @param signature Stripe signature header
   * @returns Verified event or null if verification fails
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event | null {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      return null;
    }

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return event;
    } catch (error) {
      this.logger.warn(`Webhook signature verification failed: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Handles Stripe webhook event
   * @param event Verified Stripe event
   * @returns true if handled successfully, false otherwise
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<boolean> {
    this.logger.log(`Processing webhook event: ${event.id} (${event.type})`);

    // Idempotency check - skip if already processed
    const isProcessed = await this.paymentEventRepository.hasBeenProcessed(event.id);
    if (isProcessed) {
      this.logger.log(`Event ${event.id} already processed, skipping`);
      return true;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event);
          break;
        case 'checkout.session.expired':
          await this.handleCheckoutSessionExpired(event);
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      // Record event as processed for idempotency
      await this.paymentEventRepository.create({
        stripeEventId: event.id,
        type: event.type,
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to process event ${event.id}: ${(error as Error).message}`);
      return false;
    }
  }

  private async handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    this.logger.log(`Processing checkout.session.completed for session ${session.id}`);

    // Get order from metadata or by session ID
    let order: Order | null = null;
    if (session.metadata?.orderId && session.metadata.orderId !== 'pending') {
      order = await this.orderRepository.findById(session.metadata.orderId);
    }

    if (!order) {
      order = await this.orderRepository.findByStripeCheckoutSessionId(session.id);
    }

    if (!order) {
      this.logger.error(`Order not found for session ${session.id}`);
      throw new NotFoundException('Order not found');
    }

    // Check order status
    if (order.status !== 'PENDING_PAYMENT') {
      this.logger.warn(`Order ${order.id} has status ${order.status}, expected PENDING_PAYMENT`);
      // Still consider this successful - payment was already processed or order was handled
      return;
    }

    // Get payment intent ID from session
    const paymentIntentId =
      typeof session.payment_intent === 'string' ? session.payment_intent : null;

    // Mark order as paid in a transaction (handled by Prisma)
    await this.checkoutService.markOrderAsPaid(order.id, paymentIntentId || 'unknown');

    this.logger.log(`Successfully processed payment for order ${order.id}`);
  }

  private async handleCheckoutSessionExpired(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    this.logger.log(`Processing checkout.session.expired for session ${session.id}`);

    const order = await this.orderRepository.findByStripeCheckoutSessionId(session.id);
    if (!order) {
      this.logger.warn(`Order not found for expired session ${session.id}`);
      return;
    }

    // Only mark as expired if still pending
    if (order.status === 'PENDING_PAYMENT') {
      await this.checkoutService.markOrderAsExpired(order.id);
      this.logger.log(`Marked order ${order.id} as expired`);
    }
  }
}
