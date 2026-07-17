import type { Product } from "@/types/product";

export interface KycDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
}

export interface ApplicationRecord {
  id: string;
  productId: string;
  stepCompleted: number;
  formData: Record<string, unknown>;
  product: Product;
  kycDocuments?: KycDocument[];
}

export function applyStepPath(
  productId: string,
  applicationId: string,
  step: number,
): string {
  return `/apply/${productId}/${applicationId}/step-${step}`;
}
