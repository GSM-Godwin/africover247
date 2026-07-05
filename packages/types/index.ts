// User types
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'customer' | 'admin'
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

// Product types
export interface Product {
  id: string
  name: string
  category: string
  description: string
  premiumAmount: number
  premiumFrequency: string
  durationMonths: number
  coverageHighlights: string
  exclusions?: string
  requiredDocuments?: string
  status: 'active' | 'inactive'
}

// Application types
export type ApplicationStatus = 'draft' | 'pending_payment' | 'paid' | 'issued' | 'rejected'

export interface Application {
  id: string
  userId: string
  productId: string
  status: ApplicationStatus
  formData?: Record<string, unknown>
  stepCompleted: number
  createdAt: string
  updatedAt: string
  product?: Product
}

// Policy types
export type PolicyStatus = 'active' | 'expired' | 'cancelled'

export interface Policy {
  id: string
  applicationId: string
  userId: string
  productId: string
  policyNumber: string
  issueDate: string
  startDate: string
  expiryDate: string
  premiumPaid: number
  policyPdfUrl?: string
  status: PolicyStatus
  product?: Product
}

// Claim types
export type ClaimStatus = 'submitted' | 'in_review' | 'approved' | 'rejected'

export interface Claim {
  id: string
  policyId: string
  userId: string
  claimReference: string
  claimType: string
  incidentDate: string
  incidentLocation: string
  description: string
  estimatedAmount?: number
  policeReportFiled: boolean
  policeReportNumber?: string
  status: ClaimStatus
  createdAt: string
  updatedAt: string
}

export interface ClaimStatusHistory {
  id: string
  claimId: string
  oldStatus?: ClaimStatus
  newStatus: ClaimStatus
  changedBy: string
  note?: string
  changedAt: string
}

// Payment types
export type PaymentStatus = 'pending' | 'successful' | 'failed'

export interface Payment {
  id: string
  applicationId: string
  gatewayReference?: string
  amount: number
  currency: string
  status: PaymentStatus
  createdAt: string
}

// Notification types
export interface Notification {
  id: string
  userId: string
  message: string
  type: string
  read: boolean
  referenceType?: string
  referenceId?: string
  createdAt: string
}

// API response types
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Auth types
export interface AuthTokens {
  accessToken: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}
