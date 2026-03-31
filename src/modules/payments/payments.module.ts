import { Module, type NestModule, type MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { ListingsModule } from '../listings/listings.module';
import { CheckoutController } from './controllers/checkout.controller';
import { StripeWebhookController } from './controllers/stripe-webhook.controller';
import { CheckoutService } from './application/checkout.service';
import { WebhookService } from './application/webhook.service';
import { OrderRepository } from './infrastructure/order.repository';
import { PaymentEventRepository } from './infrastructure/payment-event.repository';
import { RawBodyMiddleware } from './infrastructure/raw-body.middleware';

@Module({
  imports: [ConfigModule, DatabaseModule, ListingsModule],
  controllers: [CheckoutController, StripeWebhookController],
  providers: [CheckoutService, WebhookService, OrderRepository, PaymentEventRepository],
  exports: [CheckoutService],
})
export class PaymentsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Apply raw body parsing to webhook routes for signature verification
    consumer.apply(RawBodyMiddleware).forRoutes('webhooks/stripe');
  }
}
