export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  emailVerified: boolean
}

export interface AssetField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea'
  required: boolean
  hint?: string
  options?: string[]
}

export interface Product {
  id: string
  name: string
  category: string
  description: string
  pricingType: 'fixed' | 'calculable' | 'quote_based'
  premiumAmount: string | null
  rate: string | null
  rateMin: string | null
  rateMax: string | null
  calculationBasis: string | null
  assetFields: string | null
  coverageHighlights: string
  exclusions: string
  requiredDocuments: string
  status: string
  keywords?: string[]
}

export interface Policy {
  id: string
  policyNumber: string
  status: string
  premiumPaid: string
  issueDate: string
  startDate: string
  expiryDate: string
  policyPdfUrl: string | null
  product: {
    name: string
    category: string
    coverageHighlights: string
  }
}

export interface Claim {
  id: string
  claimReference: string
  claimType: string
  status: string
  incidentDate: string
  estimatedAmount: string | null
  description: string
  policy: {
    policyNumber: string
    product: { name: string; category: string }
  }
}

export interface NegotiationEntry {
  actor: 'customer' | 'admin'
  action: string
  amount?: number
  note?: string
  timestamp: string
}

export interface Quote {
  id: string
  status: string
  adminQuoteAmount: string | null
  customerCounterAmount: string | null
  finalAmount: string | null
  adminNote: string | null
  customerNote: string | null
  negotiationHistory: NegotiationEntry[]
  roundsUsed: number
  expiresAt: string | null
  createdAt: string
  product: { id: string; name: string; category: string }
}

export interface Notification {
  id: string
  message: string
  type: string
  read: boolean
  referenceType: string
  referenceId: string
  createdAt: string
}
