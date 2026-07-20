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
  status: "draft" | "pending_payment" | "paid" | "issued" | "rejected";
  stepCompleted: number;
  formData: Record<string, unknown>;
  updatedAt: string;
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
