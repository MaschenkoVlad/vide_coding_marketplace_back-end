import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { PaymentEvent, CreatePaymentEventData } from '../domain/payment.types';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PaymentEventRepository {
  private readonly logger = new Logger(PaymentEventRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePaymentEventData): Promise<PaymentEvent> {
    const event = await this.prisma.paymentEvent.create({
      data: {
        stripeEventId: data.stripeEventId,
        type: data.type,
        orderId: data.orderId,
      },
    });

    return this.mapPrismaPaymentEventToDomain(event);
  }

  async findByStripeEventId(stripeEventId: string): Promise<PaymentEvent | null> {
    const event = await this.prisma.paymentEvent.findUnique({
      where: { stripeEventId },
    });

    return event ? this.mapPrismaPaymentEventToDomain(event) : null;
  }

  async hasBeenProcessed(stripeEventId: string): Promise<boolean> {
    const count = await this.prisma.paymentEvent.count({
      where: { stripeEventId },
    });

    return count > 0;
  }

  private mapPrismaPaymentEventToDomain(
    event: Prisma.PaymentEventGetPayload<Record<string, never>>,
  ): PaymentEvent {
    return {
      id: event.id,
      stripeEventId: event.stripeEventId,
      type: event.type,
      processedAt: event.processedAt,
      orderId: event.orderId,
    };
  }
}
