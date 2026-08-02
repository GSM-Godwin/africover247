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
  note?: string | null;
  user: {
    firstName: string;
    lastName: string;
    role: "customer" | "admin";
  };
}

export interface ClaimDocumentEntry {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface ClaimCommentEntry {
  id: string;
  comment: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface ClaimDetailRecord extends ClaimRecord {
  description: string;
  estimatedAmount: string | null;
  statusHistory: ClaimStatusHistoryEntry[];
  documents?: ClaimDocumentEntry[];
  comments?: ClaimCommentEntry[];
}
