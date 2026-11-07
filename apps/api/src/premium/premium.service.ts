import { Injectable } from '@nestjs/common';
import { PaymentPlan, Prisma, PricingType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { linkedQuoteId } from '../common/helpers/linked-quote-id';

const VALUE_FIELD_KEYWORDS = ['value', 'amount', 'assured', 'salary'];

type NumericLike = Prisma.Decimal | number | string | null | undefined;

export interface PremiumProduct {
  pricingType: PricingType;
  premiumAmount: NumericLike;
  rate: NumericLike;
  assetFields: Prisma.JsonValue | null;
}

export interface PremiumApplication {
  userId: string;
  productId: string;
  formData: Prisma.JsonValue | null;
  assetDetails: Prisma.JsonValue | null;
  product: PremiumProduct;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toPositiveNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(String(value).replace(/[,\s₦]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function roundToKobo(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function parseAssetFieldKeys(assetFields: Prisma.JsonValue | null): string[] {
  let fields: unknown = assetFields;
  if (typeof assetFields === 'string') {
    try {
      fields = JSON.parse(assetFields);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(fields)) return [];
  return fields
    .map((field) => (isRecord(field) && typeof field.key === 'string' ? field.key : null))
    .filter((key): key is string => Boolean(key));
}

@Injectable()
export class PremiumService {
  constructor(private prisma: PrismaService) {}

  calculatePremium(
    product: Pick<PremiumProduct, 'pricingType' | 'rate' | 'assetFields'>,
    assetDetails: unknown,
  ): number | null {
    if (product.pricingType !== 'calculable' || !isRecord(assetDetails)) return null;

    const rate = toPositiveNumber(product.rate);
    const valueFieldKey = parseAssetFieldKeys(product.assetFields).find((key) =>
      VALUE_FIELD_KEYWORDS.some((keyword) => key.toLowerCase().includes(keyword)),
    );
    if (!rate || !valueFieldKey) return null;

    const declaredValue = toPositiveNumber(assetDetails[valueFieldKey]);
    return declaredValue ? roundToKobo(declaredValue * rate) : null;
  }

  async resolveAnnualPremium(application: PremiumApplication): Promise<number> {
    const fixedPremium = toPositiveNumber(application.product.premiumAmount);
    if (fixedPremium) return fixedPremium;

    const calculatedPremium = this.calculatePremium(
      application.product,
      application.assetDetails,
    );
    if (calculatedPremium) return calculatedPremium;

    return (await this.findAcceptedQuoteAmount(application)) ?? 0;
  }

  amountForPlan(annualPremium: number, paymentPlan: PaymentPlan): number {
    return paymentPlan === 'monthly' ? Math.ceil(annualPremium / 12) : annualPremium;
  }

  private async findAcceptedQuoteAmount(application: PremiumApplication): Promise<number | null> {
    const quoteId = linkedQuoteId(application.formData);
    if (!quoteId) return null;

    const quote = await this.prisma.quote.findFirst({
      where: {
        id: quoteId,
        customerId: application.userId,
        productId: application.productId,
        status: 'accepted',
      },
      select: { finalAmount: true },
    });
    return toPositiveNumber(quote?.finalAmount);
  }
}
