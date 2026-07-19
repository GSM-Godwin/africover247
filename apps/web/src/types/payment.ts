export const PAYMENT_ID_STORAGE_KEY = "africover_payment_id";
export const PENDING_APPLICATION_ID_KEY = "africover_pending_application_id";

export interface InitiatePaymentResponse {
  checkoutUrl: string;
  paymentId: string;
  amount: string | number;
  currency: string;
}

export interface PaymentStatusResponse {
  applicationStatus: string;
  payment: {
    id: string;
    status: string;
    amount: string | number;
    applicationId: string;
  } | null;
}

export function isPaymentSuccessful(status: PaymentStatusResponse): boolean {
  return (
    status.payment?.status === "successful" ||
    status.applicationStatus === "paid" ||
    status.applicationStatus === "issued"
  );
}

export function isPaymentFailed(status: PaymentStatusResponse): boolean {
  return status.payment?.status === "failed";
}
