export interface ClaimRecord {
  id: string;
  claimReference: string;
  claimType: string;
  status: "submitted" | "in_review" | "approved" | "rejected";
  createdAt: string;
  policy?: {
    product: {
      name: string;
      category?: string;
    };
  };
}

export interface ClaimStatusHistoryEntry {
  id: string;
  newStatus: "submitted" | "in_review" | "approved" | "rejected";
  changedAt: string;
  user: {
    firstName: string;
    lastName: string;
    role: "customer" | "admin";
  };
}

export interface ClaimDetailRecord extends ClaimRecord {
  description: string;
  estimatedAmount: string | null;
  statusHistory: ClaimStatusHistoryEntry[];
  documents?: unknown[];
  comments?: unknown[];
}
