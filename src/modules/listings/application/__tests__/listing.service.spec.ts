import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ListingService } from '../listing.service';
import { ListingRepository } from '../../infrastructure/listing.repository';
import { ListingCondition, ListingStatus, Currency } from '../../domain/listing.types';

describe('ListingService', () => {
  let service: ListingService;
  let repository: jest.Mocked<ListingRepository>;

  const mockListingRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdWithRelations: jest.fn(),
    findBySellerId: jest.fn(),
    findPublished: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    canUserUpdateListing: jest.fn(),
    canUserPublishListing: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingService,
        {
          provide: ListingRepository,
          useValue: mockListingRepository,
        },
      ],
    }).compile();

    service = module.get<ListingService>(ListingService);
    repository = module.get<ListingRepository>(ListingRepository) as jest.Mocked<ListingRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createListing', () => {
    it('should create a listing successfully', async () => {
      const sellerId = 'seller-123';
      const createData = {
        categoryId: 'category-123',
        title: 'Test GPU',
        description: 'A great graphics card',
        price: 50000, // $500.00 in cents
        currency: Currency.USD,
        condition: ListingCondition.GOOD,
        city: 'New York',
        attributes: { brand: 'NVIDIA', model: 'RTX 3080' },
      };

      const expectedListing = {
        id: 'listing-123',
        sellerId,
        status: ListingStatus.DRAFT,
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.create.mockResolvedValue(expectedListing);

      const result = await service.createListing(sellerId, createData);

      expect(repository.create).toHaveBeenCalledWith({ ...createData, sellerId });
      expect(result).toEqual(expectedListing);
    });

    it('should throw BadRequestException for invalid attributes', async () => {
      const sellerId = 'seller-123';
      const createData = {
        categoryId: 'category-123',
        title: 'Test GPU',
        description: 'A great graphics card',
        price: 50000,
        currency: Currency.USD,
        condition: ListingCondition.GOOD,
        attributes: { invalid: 'attributes' }, // Invalid structure
      };

      await expect(service.createListing(sellerId, createData)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('publishListing', () => {
    it('should publish a listing successfully', async () => {
      const listingId = 'listing-123';
      const userId = 'seller-123';
      const expectedListing = {
        id: listingId,
        sellerId: userId,
        categoryId: 'category-123',
        title: 'Test GPU',
        description: 'Test description',
        price: 50000,
        currency: Currency.USD,
        condition: ListingCondition.GOOD,
        city: null,
        attributes: {},
        status: ListingStatus.PUBLISHED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.canUserPublishListing.mockResolvedValue(true);
      repository.updateStatus.mockResolvedValue(expectedListing);

      const result = await service.publishListing(listingId, userId);

      expect(repository.canUserPublishListing).toHaveBeenCalledWith(listingId, userId);
      expect(repository.updateStatus).toHaveBeenCalledWith(listingId, 'PUBLISHED');
      expect(result).toEqual(expectedListing);
    });

    it('should throw ConflictException if listing cannot be published', async () => {
      const listingId = 'listing-123';
      const userId = 'seller-123';

      repository.canUserPublishListing.mockResolvedValue(false);
      repository.findById.mockResolvedValue({ id: listingId } as any);

      await expect(service.publishListing(listingId, userId)).rejects.toThrow(ConflictException);
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if listing does not exist', async () => {
      const listingId = 'listing-123';
      const userId = 'seller-123';

      repository.canUserPublishListing.mockResolvedValue(false);
      repository.findById.mockResolvedValue(null);

      await expect(service.publishListing(listingId, userId)).rejects.toThrow(NotFoundException);
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('updateListing', () => {
    it('should update a listing successfully', async () => {
      const listingId = 'listing-123';
      const userId = 'seller-123';
      const updateData = {
        title: 'Updated GPU',
        price: 45000,
      };

      const expectedListing = {
        id: listingId,
        sellerId: userId,
        categoryId: 'category-123',
        title: 'Updated GPU',
        description: 'Test description',
        price: 45000,
        currency: Currency.USD,
        condition: ListingCondition.GOOD,
        city: null,
        attributes: {},
        status: ListingStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.canUserUpdateListing.mockResolvedValue(true);
      repository.update.mockResolvedValue(expectedListing);

      const result = await service.updateListing(listingId, userId, updateData);

      expect(repository.canUserUpdateListing).toHaveBeenCalledWith(listingId, userId);
      expect(repository.update).toHaveBeenCalledWith(listingId, updateData);
      expect(result).toEqual(expectedListing);
    });

    it('should throw ForbiddenException if user cannot update listing', async () => {
      const listingId = 'listing-123';
      const userId = 'seller-123';
      const updateData = { title: 'Updated GPU' };

      repository.canUserUpdateListing.mockResolvedValue(false);

      await expect(service.updateListing(listingId, userId, updateData)).rejects.toThrow(
        ForbiddenException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('archiveListing', () => {
    it('should archive a listing successfully', async () => {
      const listingId = 'listing-123';
      const userId = 'seller-123';
      const existingListing = {
        id: listingId,
        sellerId: userId,
        status: ListingStatus.PUBLISHED,
      };

      const expectedListing = {
        id: listingId,
        sellerId: userId,
        categoryId: 'category-123',
        title: 'Test GPU',
        description: 'Test description',
        price: 50000,
        currency: Currency.USD,
        condition: ListingCondition.GOOD,
        city: null,
        attributes: {},
        status: ListingStatus.ARCHIVED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findById.mockResolvedValue(existingListing as any);
      repository.updateStatus.mockResolvedValue(expectedListing);

      const result = await service.archiveListing(listingId, userId);

      expect(repository.findById).toHaveBeenCalledWith(listingId);
      expect(repository.updateStatus).toHaveBeenCalledWith(listingId, 'ARCHIVED');
      expect(result).toEqual(expectedListing);
    });

    it('should throw NotFoundException if listing does not exist', async () => {
      const listingId = 'listing-123';
      const userId = 'seller-123';

      repository.findById.mockResolvedValue(null);

      await expect(service.archiveListing(listingId, userId)).rejects.toThrow(NotFoundException);
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const listingId = 'listing-123';
      const userId = 'different-user';
      const existingListing = {
        id: listingId,
        sellerId: 'different-owner',
        status: ListingStatus.PUBLISHED,
      };

      repository.findById.mockResolvedValue(existingListing as any);

      await expect(service.archiveListing(listingId, userId)).rejects.toThrow(ForbiddenException);
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if listing is already sold', async () => {
      const listingId = 'listing-123';
      const userId = 'seller-123';
      const existingListing = {
        id: listingId,
        sellerId: userId,
        status: ListingStatus.SOLD,
      };

      repository.findById.mockResolvedValue(existingListing as any);

      await expect(service.archiveListing(listingId, userId)).rejects.toThrow(ConflictException);
      expect(repository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('deleteListing', () => {
    it('should delete a draft listing successfully', async () => {
      const listingId = 'listing-123';
      const userId = 'seller-123';
      const existingListing = {
        id: listingId,
        sellerId: userId,
        status: ListingStatus.DRAFT,
      };

      repository.findById.mockResolvedValue(existingListing as any);
      repository.delete.mockResolvedValue();

      await service.deleteListing(listingId, userId);

      expect(repository.findById).toHaveBeenCalledWith(listingId);
      expect(repository.delete).toHaveBeenCalledWith(listingId);
    });

    it('should throw ConflictException if listing is not draft', async () => {
      const listingId = 'listing-123';
      const userId = 'seller-123';
      const existingListing = {
        id: listingId,
        sellerId: userId,
        status: ListingStatus.PUBLISHED,
      };

      repository.findById.mockResolvedValue(existingListing as any);

      await expect(service.deleteListing(listingId, userId)).rejects.toThrow(ConflictException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
