import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PremiumService, PremiumApplication, PremiumProduct } from './premium.service';
import { PrismaService } from '../prisma/prisma.service';

const USER_ID = 'user-1';
const PRODUCT_ID = 'product-1';
const QUOTE_ID = 'quote-1';

const MOTOR_FIELDS = [
  { key: 'vehicleValue', label: 'Vehicle Market Value (₦)', type: 'number' },
  { key: 'vehicleMake', label: 'Make', type: 'text' },
];

function buildProduct(overrides: Partial<PremiumProduct> = {}): PremiumProduct {
  return {
    pricingType: 'calculable',
    premiumAmount: null,
    rate: new Prisma.Decimal('0.05'),
    assetFields: MOTOR_FIELDS,
    ...overrides,
  };
}

function buildApplication(overrides: Partial<PremiumApplication> = {}): PremiumApplication {
  return {
    userId: USER_ID,
    productId: PRODUCT_ID,
    formData: {},
    assetDetails: { vehicleValue: '2000000' },
    product: buildProduct(),
    ...overrides,
  };
}

describe('PremiumService', () => {
  let service: PremiumService;
  let prisma: { quote: { findFirst: jest.Mock } };

  beforeEach(async () => {
    prisma = { quote: { findFirst: jest.fn().mockResolvedValue(null) } };
    const module: TestingModule = await Test.createTestingModule({
      providers: [PremiumService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(PremiumService);
  });

  describe('calculatePremium', () => {
    it('multiplies the declared asset value by the product rate', () => {
      expect(service.calculatePremium(buildProduct(), { vehicleValue: '2000000' })).toBe(100000);
    });

    it('accepts thousands separators and a naira sign in the declared value', () => {
      expect(service.calculatePremium(buildProduct(), { vehicleValue: '₦2,000,000' })).toBe(100000);
    });

    it('rounds to the nearest kobo', () => {
      const product = buildProduct({
        rate: '0.0006',
        assetFields: [{ key: 'totalAnnualSalary' }],
      });

      expect(service.calculatePremium(product, { totalAnnualSalary: '1234567' })).toBe(740.74);
    });

    it('recognises the salary field used by Group Life', () => {
      const product = buildProduct({
        rate: '0.0006',
        assetFields: [{ key: 'numberOfEmployees' }, { key: 'totalAnnualSalary' }],
      });

      expect(
        service.calculatePremium(product, { numberOfEmployees: '40', totalAnnualSalary: '50000000' }),
      ).toBe(30000);
    });

    it('reads asset fields stored as a JSON string', () => {
      const product = buildProduct({ assetFields: JSON.stringify(MOTOR_FIELDS) });

      expect(service.calculatePremium(product, { vehicleValue: '1000000' })).toBe(50000);
    });

    it.each([
      ['a non-calculable product', buildProduct({ pricingType: 'quote_based' }), { vehicleValue: '1000000' }],
      ['a product without a rate', buildProduct({ rate: null }), { vehicleValue: '1000000' }],
      ['no value field on the product', buildProduct({ assetFields: [{ key: 'vehicleMake' }] }), { vehicleMake: 'Kia' }],
      ['a missing declared value', buildProduct(), {}],
      ['a zero declared value', buildProduct(), { vehicleValue: '0' }],
      ['a negative declared value', buildProduct(), { vehicleValue: '-5000' }],
      ['a non-numeric declared value', buildProduct(), { vehicleValue: 'lots' }],
      ['no asset details', buildProduct(), null],
    ])('returns null for %s', (_label, product, assetDetails) => {
      expect(service.calculatePremium(product, assetDetails)).toBeNull();
    });
  });

  describe('resolveAnnualPremium', () => {
    it('uses the product premium first, even when other sources exist', async () => {
      const application = buildApplication({
        product: buildProduct({ premiumAmount: new Prisma.Decimal('60000') }),
        formData: { fromQuoteId: QUOTE_ID, calculatedPremium: 1 },
      });
      prisma.quote.findFirst.mockResolvedValue({ finalAmount: new Prisma.Decimal('90000') });

      await expect(service.resolveAnnualPremium(application)).resolves.toBe(60000);
      expect(prisma.quote.findFirst).not.toHaveBeenCalled();
    });

    it('uses the server calculation second and ignores calculatedPremium in formData', async () => {
      const application = buildApplication({ formData: { calculatedPremium: 1, quotedPremium: 1 } });

      await expect(service.resolveAnnualPremium(application)).resolves.toBe(100000);
    });

    it('uses the accepted quote amount third, looked up from the quote record', async () => {
      prisma.quote.findFirst.mockResolvedValue({ finalAmount: new Prisma.Decimal('75000') });
      const application = buildApplication({
        product: buildProduct({ pricingType: 'quote_based', rate: null }),
        assetDetails: null,
        formData: { fromQuoteId: QUOTE_ID, calculatedPremium: 1, quotedPremium: 1 },
      });

      await expect(service.resolveAnnualPremium(application)).resolves.toBe(75000);
      expect(prisma.quote.findFirst).toHaveBeenCalledWith({
        where: {
          id: QUOTE_ID,
          customerId: USER_ID,
          productId: PRODUCT_ID,
          status: 'accepted',
        },
        select: { finalAmount: true },
      });
    });

    it('also finds the quote through the legacy quoteId key', async () => {
      prisma.quote.findFirst.mockResolvedValue({ finalAmount: new Prisma.Decimal('75000') });
      const application = buildApplication({
        product: buildProduct({ pricingType: 'quote_based', rate: null }),
        formData: { quoteId: QUOTE_ID },
      });

      await expect(service.resolveAnnualPremium(application)).resolves.toBe(75000);
      expect(prisma.quote.findFirst.mock.calls[0][0].where.id).toBe(QUOTE_ID);
    });

    it('returns 0 when the linked quote is not an accepted quote for this customer and product', async () => {
      const application = buildApplication({
        product: buildProduct({ pricingType: 'quote_based', rate: null }),
        formData: { fromQuoteId: QUOTE_ID, quotedPremium: 5000 },
      });

      await expect(service.resolveAnnualPremium(application)).resolves.toBe(0);
    });

    it('returns 0 when there is no product premium, no calculation and no quote', async () => {
      const application = buildApplication({
        product: buildProduct({ pricingType: 'quote_based', rate: null }),
        assetDetails: null,
        formData: { calculatedPremium: 5000, quotedPremium: 5000 },
      });

      await expect(service.resolveAnnualPremium(application)).resolves.toBe(0);
      expect(prisma.quote.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('amountForPlan', () => {
    it('charges the annual premium on the annual plan', () => {
      expect(service.amountForPlan(100000, 'annual')).toBe(100000);
    });

    it('rounds the monthly instalment up to the next naira', () => {
      expect(service.amountForPlan(100000, 'monthly')).toBe(8334);
    });
  });
});
