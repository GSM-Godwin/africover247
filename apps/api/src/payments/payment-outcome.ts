export type PaymentOutcome = 'successful' | 'cancelled' | 'failed' | 'pending' | 'none';

export type GatewayOutcome = 'paid' | 'cancelled' | 'failed' | 'pending';

const PAID_STATUSES = new Set(['PAID']);
const CANCELLED_STATUSES = new Set(['USER_CANCELLED', 'CANCELLED', 'ABANDONED']);
const FAILURE_REASONS: Record<string, string> = {
  FAILED: 'The payment was declined or could not be processed.',
  EXPIRED: 'The payment session expired before it was completed.',
  REVERSED: 'The payment was reversed by the bank or card issuer.',
};

export const GENERIC_FAILURE_REASON = 'The payment could not be completed.';

function normalise(status: unknown): string {
  return typeof status === 'string' ? status.trim().toUpperCase() : '';
}

export function gatewayStatusToOutcome(status: unknown): GatewayOutcome {
  const value = normalise(status);
  if (PAID_STATUSES.has(value)) return 'paid';
  if (CANCELLED_STATUSES.has(value)) return 'cancelled';
  if (value in FAILURE_REASONS) return 'failed';
  return 'pending';
}

export function failureReasonFor(status: unknown): string {
  return FAILURE_REASONS[normalise(status)] ?? GENERIC_FAILURE_REASON;
}

export function storedGatewayStatus(gatewayResponse: unknown): string | null {
  if (typeof gatewayResponse !== 'object' || gatewayResponse === null) return null;
  const record = gatewayResponse as Record<string, unknown>;
  const status = record.paymentStatus ?? record.status;
  return typeof status === 'string' ? status : null;
}

export function resolvePaymentOutcome(input: {
  applicationStatus: string;
  paymentStatus: 'pending' | 'successful' | 'failed' | null;
  liveGatewayStatus: string | null;
}): PaymentOutcome {
  if (input.applicationStatus === 'paid' || input.applicationStatus === 'issued') {
    return 'successful';
  }
  if (input.paymentStatus === null) return 'none';
  if (input.paymentStatus === 'successful') return 'successful';
  if (input.paymentStatus === 'failed' || input.applicationStatus === 'rejected') return 'failed';
  return gatewayStatusToOutcome(input.liveGatewayStatus) === 'cancelled' ? 'cancelled' : 'pending';
}
