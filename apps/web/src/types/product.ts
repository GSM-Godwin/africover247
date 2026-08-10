import type { AssetField } from "./asset-field";

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  pricingType: "fixed" | "calculable" | "quote_based";
  premiumAmount: string | null;
  rate: string | null;
  rateMin: string | null;
  rateMax: string | null;
  calculationBasis: string | null;
  assetFields: string | AssetField[] | null;
  durationMonths: number;
  coverageHighlights: string;
  exclusions: string;
  requiredDocuments: string;
  status: string;
  keywords?: string[];
}
