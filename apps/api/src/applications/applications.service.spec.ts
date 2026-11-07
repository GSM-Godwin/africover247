import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { KycService } from '../kyc/kyc.service';
import { PremiumService } from '../premium/premium.service';

const USER_ID = 'user-1';
const APPLICATION_ID = 'application-1';

function buildApplication(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: APPLICATION_ID,
    userId: USER_ID,
    status: 'draft',
    stepCompleted: 1,
    formData: { firstName: 'Ada' },
    product: { id: 'product-1' },
    kycDocuments: [],
    policy: null,
    ...overrides,
  };
}

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: {
    application: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    product: { findUnique: jest.Mock };
    kycDocument: { findMany: jest.Mock };
  };
  let redisService: { saveDraft: jest.Mock };

  beforeEach(async () => {
    prisma = {
      application: {
        findUnique: jest.fn().mockResolvedValue(buildApplication()),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ ...buildApplication(), ...data }),
        ),
      },
      product: {
        findUnique: jest.fn().mockResolvedValue({
          pricingType: 'calculable',
          rate: '0.05',
          assetFields: [{ key: 'vehicleValue' }],
        }),
      },
      kycDocument: { findMany: jest.fn().mockResolvedValue([]) },
    };
    redisService = { saveDraft: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        PremiumService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redisService },
        { provide: KycService, useValue: {} },
      ],
    }).compile();

    service = module.get(ApplicationsService);
  });

  function updateData() {
    return prisma.application.update.mock.calls[0][0].data;
  }

  describe('update', () => {
    it('stores stepCompleted together with the merged form data', async () => {
      await service.update(APPLICATION_ID, USER_ID, {
        formData: { city: 'Lagos' },
        stepCompleted: 2,
      });

      expect(updateData()).toEqual({
        formData: { firstName: 'Ada', city: 'Lagos' },
        stepCompleted: 2,
      });
      expect(redisService.saveDraft).toHaveBeenCalledWith(APPLICATION_ID, {
        firstName: 'Ada',
        city: 'Lagos',
      });
    });

    it('stores stepCompleted on its own without touching form data or the draft cache', async () => {
      await service.update(APPLICATION_ID, USER_ID, { stepCompleted: 3 });

      expect(updateData()).toEqual({ stepCompleted: 3 });
      expect(redisService.saveDraft).not.toHaveBeenCalled();
    });

    it('never moves stepCompleted backwards when the user edits an earlier step', async () => {
      prisma.application.findUnique.mockResolvedValue(buildApplication({ stepCompleted: 3 }));

      await service.update(APPLICATION_ID, USER_ID, {
        formData: { firstName: 'Adaeze' },
        stepCompleted: 1,
      });

      expect(updateData()).not.toHaveProperty('stepCompleted');
      expect(updateData().formData).toEqual({ firstName: 'Adaeze' });
    });

    it('leaves stepCompleted unchanged when it is not sent', async () => {
      await service.update(APPLICATION_ID, USER_ID, { formData: { city: 'Abuja' } });

      expect(updateData()).not.toHaveProperty('stepCompleted');
    });

    it("refuses to update another user's application", async () => {
      prisma.application.findUnique.mockResolvedValue(buildApplication({ userId: 'someone-else' }));

      await expect(
        service.update(APPLICATION_ID, USER_ID, { stepCompleted: 2 }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.application.update).not.toHaveBeenCalled();
    });

    it('ignores premium and quote fields sent by the client and keeps the server values', async () => {
      prisma.application.findUnique.mockResolvedValue(
        buildApplication({ formData: { firstName: 'Ada', calculatedPremium: 100000 } }),
      );

      await service.update(APPLICATION_ID, USER_ID, {
        formData: {
          city: 'Lagos',
          calculatedPremium: 1,
          quotedPremium: 1,
          quoteId: 'someone-elses-quote',
          fromQuote: true,
          fromQuoteId: 'someone-elses-quote',
        },
      });

      expect(updateData().formData).toEqual({
        firstName: 'Ada',
        calculatedPremium: 100000,
        city: 'Lagos',
      });
    });

    it.each([
      ['pending_payment', /awaiting payment/i],
      ['paid', /already been paid/i],
      ['issued', /policy has already been issued/i],
      ['rejected', /rejected/i],
    ])('refuses to update an application in %s', async (status, message) => {
      prisma.application.findUnique.mockResolvedValue(buildApplication({ status }));

      const attempt = service.update(APPLICATION_ID, USER_ID, { formData: { city: 'Lagos' } });

      await expect(attempt).rejects.toThrow(BadRequestException);
      await expect(attempt).rejects.toThrow(message);
      expect(prisma.application.update).not.toHaveBeenCalled();
      expect(redisService.saveDraft).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('stores the server-calculated premium and ignores the client value', async () => {
      await service.create(USER_ID, {
        productId: 'product-1',
        assetDetails: { vehicleValue: '2000000' },
        calculatedPremium: 1,
      });

      const { data } = prisma.application.create.mock.calls[0][0];
      expect(data.formData).toEqual({
        assetDetails: { vehicleValue: '2000000' },
        calculatedPremium: 100000,
      });
      expect(data.assetDetails).toEqual({ vehicleValue: '2000000' });
    });

    it('stores no premium when the product is not calculable, whatever the client sends', async () => {
      prisma.product.findUnique.mockResolvedValue({
        pricingType: 'quote_based',
        rate: null,
        assetFields: null,
      });

      await service.create(USER_ID, { productId: 'product-1', calculatedPremium: 1 });

      expect(prisma.application.create.mock.calls[0][0].data.formData).toEqual({});
    });

    it('rejects an unknown product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.create(USER_ID, { productId: 'missing-product' }),
      ).rejects.toThrow(/product not found/i);
      expect(prisma.application.create).not.toHaveBeenCalled();
    });
  });
});
