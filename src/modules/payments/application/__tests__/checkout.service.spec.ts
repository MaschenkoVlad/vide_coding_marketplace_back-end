import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CheckoutService } from '../checkout.service';
import { OrderRepository } from '../../infrastructure/order.repository';
import { ListingRepository } from '../../../listings/infrastructure/listing.repository';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Currency, ListingStatus, ListingCondition } from '../../../listings/domain/listing.types';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  }));
});

describe('CheckoutService', () => {
  let service: CheckoutService;
  let orderRepository: jest.Mocked<OrderRepository>;
  let listingRepository: jest.Mocked<ListingRepository>;

  const mockListing = {
    id: 'listing-1',
    title: 'Test Item',
    description: 'Test Description',
    price: 10000,
    currency: Currency.USD,
    status: ListingStatus.PUBLISHED,
    sellerId: 'seller-1',
    categoryId: 'cat-1',
    condition: ListingCondition.NEW,
    city: null,
    attributes: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        {
          provide: OrderRepository,
          useValue: {
            create: jest.fn(),
            findByStripeCheckoutSessionId: jest.fn(),
            findPendingByBuyerAndListing: jest.fn(),
          },
        },
        {
          provide: ListingRepository,
          useValue: {
            findById: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'stripe.secretKey': 'sk_test_123',
                'stripe.frontendUrl': 'http://localhost:3000',
                'stripe.successPath': '/checkout/success',
                'stripe.cancelPath': '/checkout/cancel',
              };
              return config[key] || '';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
    orderRepository = module.get(OrderRepository);
    listingRepository = module.get(ListingRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session with price from database', async () => {
      // Arrange
      listingRepository.findById.mockResolvedValue(mockListing);
      orderRepository.findPendingByBuyerAndListing.mockResolvedValue(null);

      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      };

      const stripe = (await import('stripe')).default;
      const mockStripeInstance = new stripe('test');
      const createSession = mockStripeInstance.checkout.sessions.create as jest.Mock;
      createSession.mockResolvedValue(mockSession);

      orderRepository.create.mockResolvedValue({
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

      // Act
      const result = await service.createCheckoutSession('buyer-1', 'listing-1');

      // Assert
      expect(listingRepository.findById).toHaveBeenCalledWith('listing-1');
      expect(result.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_test_123');
      expect(result.orderId).toBe('order-1');
    });

    it('should throw NotFoundException when listing does not exist', async () => {
      // Arrange
      listingRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createCheckoutSession('buyer-1', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when listing is not published', async () => {
      // Arrange
      listingRepository.findById.mockResolvedValue({
        ...mockListing,
        status: ListingStatus.DRAFT,
      });

      // Act & Assert
      await expect(service.createCheckoutSession('buyer-1', 'listing-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when buyer tries to buy own listing', async () => {
      // Arrange
      listingRepository.findById.mockResolvedValue({
        ...mockListing,
        sellerId: 'buyer-1',
      });

      // Act & Assert
      await expect(service.createCheckoutSession('buyer-1', 'listing-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('markOrderAsPaid', () => {
    it('should mark order as paid and listing as sold', async () => {
      // Arrange
      const mockOrder = {
        id: 'order-1',
        buyerId: 'buyer-1',
        listingId: 'listing-1',
        amount: 10000,
        currency: 'USD' as const,
        status: 'PAID' as const,
        stripeCheckoutSessionId: 'cs_test_123',
        stripePaymentIntentId: 'pi_test_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(orderRepository, 'updateStatus').mockResolvedValue(mockOrder);

      // Act
      await service.markOrderAsPaid('order-1', 'pi_test_123');

      // Assert
      expect(listingRepository.updateStatus).toHaveBeenCalledWith('listing-1', 'SOLD');
    });
  });
});
