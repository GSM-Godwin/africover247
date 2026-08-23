export const SLA_CONFIG: Record<string, { firstResponseHours: number; resolutionHours: number }> = {
  payment_issue: { firstResponseHours: 2, resolutionHours: 24 },
  claim_support: { firstResponseHours: 4, resolutionHours: 48 },
  complaint: { firstResponseHours: 4, resolutionHours: 72 },
  policy_query: { firstResponseHours: 8, resolutionHours: 48 },
  product_enquiry: { firstResponseHours: 24, resolutionHours: 72 },
  appointment: { firstResponseHours: 4, resolutionHours: 24 },
  other: { firstResponseHours: 24, resolutionHours: 72 },
};

export function getSlaDeadline(category: string, createdAt: Date): Date {
  const config = SLA_CONFIG[category] || SLA_CONFIG.other;
  const deadline = new Date(createdAt);
  deadline.setHours(deadline.getHours() + config.resolutionHours);
  return deadline;
}

export function getSlaStatus(
  deadline: Date | null,
  status: string,
): 'on_track' | 'at_risk' | 'breached' | 'completed' {
  if (!deadline) return 'on_track';
  if (['resolved', 'closed'].includes(status)) return 'completed';
  const now = new Date();
  const msLeft = deadline.getTime() - now.getTime();
  if (msLeft < 0) return 'breached';
  if (msLeft < 2 * 60 * 60 * 1000) return 'at_risk';
  return 'on_track';
}

export function getCompletionTime(createdAt: Date, resolvedAt: Date): string {
  const ms = resolvedAt.getTime() - createdAt.getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
