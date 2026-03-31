import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { OrderRepository } from '../infrastructure/order.repository';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import type { Order, Currency } from '../domain/payment.types';
import type { CheckoutSessionResponseDto } from '../dto/checkout.dto';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly listingRepository: ListingRepository,
    private readonly configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('stripe.secretKey');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-02-25.clover', // Use latest stable API version
    });
  }

  async createCheckoutSession(
    buyerId: string,
    listingId: string,
  ): Promise<CheckoutSessionResponseDto> {
    this.logger.log(`Creating checkout session for listing ${listingId}, buyer ${buyerId}`);

    // Fetch listing from database - price CANNOT be accepted from client
    const listing = await this.listingRepository.findById(listingId);
    if (!listing) {
      this.logger.warn(`Listing not found: ${listingId}`);
      throw new NotFoundException('Listing not found');
    }

    // Check if listing is available for purchase
    if (listing.status !== 'PUBLISHED') {
      this.logger.warn(`Listing ${listingId} cannot be purchased - status is ${listing.status}`);
      throw new ConflictException(
        `Listing cannot be purchased (current status: ${listing.status})`,
      );
    }

    // Prevent buying own listing
    if (listing.sellerId === buyerId) {
      this.logger.warn(`Buyer ${buyerId} attempted to buy own listing ${listingId}`);
      throw new ConflictException('Cannot purchase your own listing');
    }

    // Check for existing pending order for this buyer + listing
    const existingOrder = await this.orderRepository.findPendingByBuyerAndListing(
      buyerId,
      listingId,
    );
    if (existingOrder) {
      this.logger.log(
        `Found existing pending order ${existingOrder.id} for buyer ${buyerId} and listing ${listingId}`,
      );
      // Return existing order's checkout URL if session is still valid
      // For simplicity, we create a new session but could check Stripe for existing session
    }

    // Get configuration for success/cancel URLs
    const frontendUrl =
      this.configService.get<string>('stripe.frontendUrl') || 'http://localhost:3000';
    const successPath = this.configService.get<string>('stripe.successPath') || '/checkout/success';
    const cancelPath = this.configService.get<string>('stripe.cancelPath') || '/checkout/cancel';

    const successUrl = `${frontendUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}${cancelPath}?order_id={ORDER_ID_PLACEHOLDER}`;

    try {
      // Create Stripe Checkout Session
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: listing.currency.toLowerCase(),
              product_data: {
                name: listing.title,
                description: listing.description.substring(0, 500), // Stripe has limits
              },
              unit_amount: listing.price, // Already in cents
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl.replace('{ORDER_ID_PLACEHOLDER}', 'pending'),
        metadata: {
          orderId: 'pending', // Will update after order creation
          buyerId,
          listingId,
        },
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes expiry
      });

      if (!session.url) {
        throw new InternalServerErrorException('Failed to create Stripe checkout session');
      }

      // Now create the order in our database with the real session ID
      const order = await this.orderRepository.create({
        buyerId,
        listingId,
        amount: listing.price,
        currency: listing.currency as Currency,
        stripeCheckoutSessionId: session.id,
      });

      // Update the cancel URL with the actual order ID
      // Note: Stripe doesn't allow updating session URLs, but we handle this via metadata
      // The webhook will handle the actual order ID

      this.logger.log(`Created order ${order.id} with Stripe session ${session.id}`);

      return {
        checkoutUrl: session.url,
        orderId: order.id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create checkout session for listing ${listingId}: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException('Failed to create checkout session');
    }
  }

  async getOrderByCheckoutSessionId(sessionId: string): Promise<Order | null> {
    return this.orderRepository.findByStripeCheckoutSessionId(sessionId);
  }

  async markOrderAsPaid(orderId: string, stripePaymentIntentId: string): Promise<Order> {
    this.logger.log(
      `Marking order ${orderId} as paid with payment intent ${stripePaymentIntentId}`,
    );

    // Update order status and payment intent ID
    const order = await this.orderRepository.updateStatus(orderId, {
      status: 'PAID',
      stripePaymentIntentId,
    });

    // Mark listing as SOLD
    await this.listingRepository.updateStatus(order.listingId, 'SOLD');

    this.logger.log(`Order ${orderId} marked as paid, listing ${order.listingId} marked as SOLD`);

    return order;
  }

  async markOrderAsFailed(orderId: string): Promise<Order> {
    this.logger.log(`Marking order ${orderId} as failed`);

    return this.orderRepository.updateStatus(orderId, {
      status: 'FAILED',
    });
  }

  async markOrderAsExpired(orderId: string): Promise<Order> {
    this.logger.log(`Marking order ${orderId} as expired`);

    return this.orderRepository.updateStatus(orderId, {
      status: 'EXPIRED',
    });
  }
}
