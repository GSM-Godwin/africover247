export interface PolicyRecord {
  id: string;
  applicationId: string;
  productId: string;
  policyNumber: string;
  issueDate: string;
  startDate: string;
  expiryDate: string;
  status: "active" | "renewal_due" | "renewal_in_progress" | "renewed" | "expired" | "cancelled" | "non_renewed" | "pending_underwriting";
  createdAt: string;
  policyPdfUrl: string | null;
  product: {
    name: string;
    category: string;
  };
}

export interface PolicyDetailRecord extends PolicyRecord {
  premiumPaid: string;
  product: {
    name: string;
    category: string;
    coverageHighlights?: string;
  };
  application?: {
    kycDocuments?: unknown[];
  };
  claims?: unknown[];
}

export function formatPolicyDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
