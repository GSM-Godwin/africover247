// Format currency in Naira
export const formatNaira = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Format date to readable string
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Format date with time
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Relative time (e.g. "2 hours ago")
export const timeAgo = (dateString: string): string => {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Generate policy number
export const generatePolicyNumber = (): string => {
  const year = new Date().getFullYear()
  const random = Math.floor(10000 + Math.random() * 90000)
  return `AFC-${year}-${random}`
}

// Generate claim reference
export const generateClaimReference = (): string => {
  const year = new Date().getFullYear()
  const random = Math.floor(10000 + Math.random() * 90000)
  return `CLM-${year}-${random}`
}

// Truncate filename for display
export const truncateFilename = (filename: string, maxLength = 30): string => {
  if (filename.length <= maxLength) return filename
  const ext = filename.split('.').pop()
  const name = filename.substring(0, maxLength - (ext?.length ?? 0) - 4)
  return `${name}...${ext}`
}

// Validate Nigerian phone number
export const isValidNigerianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\s+/g, '').replace(/^\+234/, '0')
  return /^0[789][01]\d{8}$/.test(cleaned)
}

// Claim status label and colour
export const getClaimStatusMeta = (status: string): { label: string; colour: string } => {
  const map: Record<string, { label: string; colour: string }> = {
    submitted: { label: 'Submitted', colour: 'blue' },
    in_review: { label: 'In Review', colour: 'yellow' },
    approved: { label: 'Approved', colour: 'green' },
    rejected: { label: 'Rejected', colour: 'red' },
  }
  return map[status] ?? { label: status, colour: 'grey' }
}

// Policy status label
export const getPolicyStatusMeta = (status: string): { label: string; colour: string } => {
  const map: Record<string, { label: string; colour: string }> = {
    active: { label: 'Active', colour: 'green' },
    expired: { label: 'Expired', colour: 'grey' },
    cancelled: { label: 'Cancelled', colour: 'red' },
  }
  return map[status] ?? { label: status, colour: 'grey' }
}
