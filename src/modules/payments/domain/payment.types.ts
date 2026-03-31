// Domain types for Order and Payment

// Re-export Prisma enums for domain use
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'CANCELED' | 'FAILED' | 'EXPIRED';
export type Currency = 'USD' | 'UAH';

export interface Order {
  id: string;
  buyerId: string;
  listingId: string;
  amount: number; // in cents
  currency: Currency;
  status: OrderStatus;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderWithRelations extends Order {
  buyer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  listing: {
    id: string;
    title: string;
    price: number;
    currency: Currency;
    status: string;
  };
}

export interface PaymentEvent {
  id: string;
  stripeEventId: string;
  type: string;
  processedAt: Date;
  orderId: string | null;
}

export interface CreateOrderData {
  buyerId: string;
  listingId: string;
  amount: number;
  currency: Currency;
  stripeCheckoutSessionId: string;
}

export interface UpdateOrderStatusData {
  status: OrderStatus;
  stripePaymentIntentId?: string;
}

export interface CreatePaymentEventData {
  stripeEventId: string;
  type: string;
  orderId?: string;
}
