export const PAYMENT_ID_STORAGE_KEY = "africover_payment_id";
export const PENDING_APPLICATION_ID_KEY = "africover_pending_application_id";
export const STEP_UP_TOKEN_HEADER = "X-Step-Up-Token";

export interface InitiatePaymentResponse {
  checkoutUrl: string;
  paymentId: string;
  amount: string | number;
  currency: string;
}

export type PaymentOutcome = "successful" | "cancelled" | "failed" | "pending" | "none";

export interface PaymentStatusResponse {
  applicationStatus: string;
  productId?: string;
  outcome?: PaymentOutcome;
  failureReason?: string | null;
  payment: {
    id: string;
    status: string;
    amount: string | number;
    applicationId: string;
    paymentPlan?: "monthly" | "annual";
    gatewayReference?: string | null;
  } | null;
}

export type PaymentCallbackOutcome = "success" | "cancelled" | "failed" | "not_found";

export function callbackOutcomeFor(status: PaymentStatusResponse): PaymentCallbackOutcome | null {
  if (status.outcome === "successful" || isPaymentSuccessful(status)) return "success";
  if (status.outcome === "cancelled") return "cancelled";
  if (status.outcome === "failed" || isPaymentFailed(status)) return "failed";
  if (status.outcome === "none") return "not_found";
  return null;
}

export function isPaymentSuccessful(status: PaymentStatusResponse): boolean {
  return (
    status.payment?.status === "successful" ||
    status.applicationStatus === "paid" ||
    status.applicationStatus === "issued"
  );
}

export function isPaymentFailed(status: PaymentStatusResponse): boolean {
  return (
    status.payment?.status === "failed" ||
    status.applicationStatus === "rejected"
  );
}
