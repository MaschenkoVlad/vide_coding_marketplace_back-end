import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type {
  Order,
  OrderWithRelations,
  CreateOrderData,
  UpdateOrderStatusData,
} from '../domain/payment.types';
import type { Prisma } from '@prisma/client';

@Injectable()
export class OrderRepository {
  private readonly logger = new Logger(OrderRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrderData): Promise<Order> {
    const order = await this.prisma.order.create({
      data: {
        buyerId: data.buyerId,
        listingId: data.listingId,
        amount: data.amount,
        currency: data.currency,
        stripeCheckoutSessionId: data.stripeCheckoutSessionId,
        status: 'PENDING_PAYMENT',
      },
    });

    return this.mapPrismaOrderToDomain(order);
  }

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    return order ? this.mapPrismaOrderToDomain(order) : null;
  }

  async findByIdWithRelations(id: string): Promise<OrderWithRelations | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            status: true,
          },
        },
      },
    });

    return order ? this.mapPrismaOrderToDomainWithRelations(order) : null;
  }

  async findByStripeCheckoutSessionId(sessionId: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
    });

    return order ? this.mapPrismaOrderToDomain(order) : null;
  }

  async updateStatus(id: string, data: UpdateOrderStatusData): Promise<Order> {
    const updateData: Prisma.OrderUpdateInput = {
      status: data.status,
    };

    if (data.stripePaymentIntentId !== undefined) {
      updateData.stripePaymentIntentId = data.stripePaymentIntentId;
    }

    const order = await this.prisma.order.update({
      where: { id },
      data: updateData,
    });

    return this.mapPrismaOrderToDomain(order);
  }

  async findPendingByBuyerAndListing(buyerId: string, listingId: string): Promise<Order | null> {
    const order = await this.prisma.order.findFirst({
      where: {
        buyerId,
        listingId,
        status: 'PENDING_PAYMENT',
      },
    });

    return order ? this.mapPrismaOrderToDomain(order) : null;
  }

  private mapPrismaOrderToDomain(order: Prisma.OrderGetPayload<Record<string, never>>): Order {
    return {
      id: order.id,
      buyerId: order.buyerId,
      listingId: order.listingId,
      amount: order.amount,
      currency: order.currency as 'USD' | 'UAH',
      status: order.status as Order['status'],
      stripeCheckoutSessionId: order.stripeCheckoutSessionId,
      stripePaymentIntentId: order.stripePaymentIntentId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private mapPrismaOrderToDomainWithRelations(
    order: Prisma.OrderGetPayload<{
      include: {
        buyer: { select: { id: true; email: true; firstName: true; lastName: true } };
        listing: { select: { id: true; title: true; price: true; currency: true; status: true } };
      };
    }>,
  ): OrderWithRelations {
    return {
      id: order.id,
      buyerId: order.buyerId,
      listingId: order.listingId,
      amount: order.amount,
      currency: order.currency as 'USD' | 'UAH',
      status: order.status as Order['status'],
      stripeCheckoutSessionId: order.stripeCheckoutSessionId,
      stripePaymentIntentId: order.stripePaymentIntentId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      buyer: order.buyer,
      listing: {
        ...order.listing,
        currency: order.listing.currency as 'USD' | 'UAH',
      },
    };
  }
}
