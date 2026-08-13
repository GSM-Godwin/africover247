export interface QuoteProduct {
  id: string;
  name: string;
  category: string;
  pricingType?: string;
  rate?: number | string | null;
  rateMin?: number | string | null;
  rateMax?: number | string | null;
  calculationBasis?: string | null;
  assetFields?: unknown;
}

export interface QuoteRecord {
  id: string;
  status: string;
  adminQuoteAmount: string | null;
  customerCounterAmount: string | null;
  finalAmount: string | null;
  adminNote?: string | null;
  customerNote?: string | null;
  negotiationHistory: NegotiationEntry[];
  roundsUsed: number;
  expiresAt: string | null;
  createdAt: string;
  customerDetails?: Record<string, unknown>;
  product: QuoteProduct;
  customer?: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface NegotiationEntry {
  actor: "customer" | "admin";
  action: string;
  amount?: number;
  note?: string;
  timestamp: string;
}
