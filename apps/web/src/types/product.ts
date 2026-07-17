export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  premiumAmount: string | number;
  premiumFrequency: string;
  durationMonths: number;
  coverageHighlights: string;
  exclusions: string | null;
  requiredDocuments: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}
