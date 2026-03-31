import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from '../webhook.service';
import { CheckoutService } from '../checkout.service';
import { PaymentEventRepository } from '../../infrastructure/payment-event.repository';
import { OrderRepository } from '../../infrastructure/order.repository';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

describe('WebhookService', () => {
  let service: WebhookService;
  let checkoutService: jest.Mocked<CheckoutService>;
  let paymentEventRepository: jest.Mocked<PaymentEventRepository>;
  let orderRepository: jest.Mocked<OrderRepository>;

  const mockStripeEvent = {
    id: 'evt_test_123',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        metadata: {
          orderId: 'order-1',
          buyerId: 'buyer-1',
          listingId: 'listing-1',
        },
        payment_intent: 'pi_test_123',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: CheckoutService,
          useValue: {
            markOrderAsPaid: jest.fn(),
            markOrderAsExpired: jest.fn(),
          },
        },
        {
          provide: PaymentEventRepository,
          useValue: {
            hasBeenProcessed: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: OrderRepository,
          useValue: {
            findById: jest.fn(),
            findByStripeCheckoutSessionId: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'stripe.secretKey': 'sk_test_123',
                'stripe.webhookSecret': 'whsec_test_123',
              };
              return config[key] || '';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    checkoutService = module.get(CheckoutService);
    paymentEventRepository = module.get(PaymentEventRepository);
    orderRepository = module.get(OrderRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyWebhookSignature', () => {
    it('should return event for valid signature', async () => {
      // Arrange
      const stripe = (await import('stripe')).default;
      const mockStripeInstance = new stripe('test');
      const constructEvent = mockStripeInstance.webhooks.constructEvent as jest.Mock;
      constructEvent.mockReturnValue(mockStripeEvent);

      // Act
      const result = service.verifyWebhookSignature('payload', 'valid_sig');

      // Assert
      expect(result).toEqual(mockStripeEvent);
    });

    it('should return null for invalid signature', async () => {
      // Arrange
      const stripe = (await import('stripe')).default;
      const mockStripeInstance = new stripe('test');
      const constructEvent = mockStripeInstance.webhooks.constructEvent as jest.Mock;
      constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      // Act
      const result = service.verifyWebhookSignature('payload', 'invalid_sig');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('handleWebhookEvent', () => {
    it('should skip already processed events (idempotency)', async () => {
      // Arrange
      paymentEventRepository.hasBeenProcessed.mockResolvedValue(true);

      // Act
      const result = await service.handleWebhookEvent(mockStripeEvent as any);

      // Assert
      expect(result).toBe(true);
      expect(checkoutService.markOrderAsPaid).not.toHaveBeenCalled();
    });

    it('should process checkout.session.completed event', async () => {
      // Arrange
      paymentEventRepository.hasBeenProcessed.mockResolvedValue(false);
      orderRepository.findById.mockResolvedValue({
        id: 'order-1',
        buyerId: 'buyer-1',
        listingId: 'listing-1',
        amount: 10000,
        currency: 'USD',
        status: 'PENDING_PAYMENT',
        stripeCheckoutSessionId: 'cs_test_123',
        stripePaymentIntentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      paymentEventRepository.create.mockResolvedValue({
        id: 'event-1',
        stripeEventId: 'evt_test_123',
        type: 'checkout.session.completed',
        processedAt: new Date(),
        orderId: null,
      });

      // Act
      const result = await service.handleWebhookEvent(mockStripeEvent as any);

      // Assert
      expect(result).toBe(true);
      expect(checkoutService.markOrderAsPaid).toHaveBeenCalledWith('order-1', 'pi_test_123');
      expect(paymentEventRepository.create).toHaveBeenCalledWith({
        stripeEventId: 'evt_test_123',
        type: 'checkout.session.completed',
      });
    });

    it('should handle missing order gracefully', async () => {
      // Arrange
      paymentEventRepository.hasBeenProcessed.mockResolvedValue(false);
      orderRepository.findById.mockResolvedValue(null);
      orderRepository.findByStripeCheckoutSessionId.mockResolvedValue(null);

      // Act
      const result = await service.handleWebhookEvent(mockStripeEvent as any);

      // Assert
      expect(result).toBe(false);
      expect(paymentEventRepository.create).not.toHaveBeenCalled();
    });

    it('should process checkout.session.expired event', async () => {
      // Arrange
      const expiredEvent = {
        ...mockStripeEvent,
        type: 'checkout.session.expired',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {},
          },
        },
      };
      paymentEventRepository.hasBeenProcessed.mockResolvedValue(false);
      orderRepository.findByStripeCheckoutSessionId.mockResolvedValue({
        id: 'order-1',
        buyerId: 'buyer-1',
        listingId: 'listing-1',
        amount: 10000,
        currency: 'USD',
        status: 'PENDING_PAYMENT',
        stripeCheckoutSessionId: 'cs_test_123',
        stripePaymentIntentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      paymentEventRepository.create.mockResolvedValue({
        id: 'event-1',
        stripeEventId: 'evt_test_123',
        type: 'checkout.session.expired',
        processedAt: new Date(),
        orderId: null,
      });

      // Act
      const result = await service.handleWebhookEvent(expiredEvent as any);

      // Assert
      expect(result).toBe(true);
      expect(checkoutService.markOrderAsExpired).toHaveBeenCalledWith('order-1');
    });
  });
});
