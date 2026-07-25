export interface AdminApplication {
  id: string;
  status: string;
  stepCompleted: number;
  formData: Record<string, unknown>;
  assetDetails: Record<string, unknown> | null;
  kycVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  product: {
    id: string;
    name: string;
    category: string;
    pricingType: string;
    premiumAmount: string | null;
    rate: string | null;
    calculationBasis: string | null;
  };
  kycDocuments: {
    id: string;
    documentType: string;
    fileUrl: string;
    fileName: string;
    uploadedAt: string;
  }[];
  payments: {
    id: string;
    status: string;
    amount: string;
    createdAt: string;
  }[];
  policy: {
    id: string;
    policyNumber: string;
    status: string;
    policyPdfUrl: string | null;
  } | null;
}

export interface AdminClaim {
  id: string;
  claimReference: string;
  claimType: string;
  status: string;
  incidentDate: string;
  incidentLocation: string;
  description: string;
  estimatedAmount: string | null;
  policeReportFiled: boolean;
  policeReportNumber: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  policy: {
    id: string;
    policyNumber: string;
    product: { name: string; category: string };
  };
  documents: {
    id: string;
    documentType: string;
    fileUrl: string;
    fileName: string;
    uploadedAt: string;
  }[];
  statusHistory: {
    id: string;
    oldStatus: string | null;
    newStatus: string;
    note: string | null;
    changedAt: string;
    user: { firstName: string; lastName: string; role: string };
  }[];
  comments: {
    id: string;
    comment: string;
    createdAt: string;
    user: { firstName: string; lastName: string; role: string };
  }[];
}

export interface AdminPolicy {
  id: string;
  policyNumber: string;
  status: string;
  premiumPaid: string;
  issueDate: string;
  startDate: string;
  expiryDate: string;
  policyPdfUrl: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  product: {
    name: string;
    category: string;
    coverageHighlights: string;
    exclusions: string;
  };
  application: {
    id: string;
    kycDocuments: {
      id: string;
      documentType: string;
      fileUrl: string;
      fileName: string;
    }[];
  };
  claims: {
    id: string;
    claimReference: string;
    claimType: string;
    status: string;
    createdAt: string;
  }[];
}
