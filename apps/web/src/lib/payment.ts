import api from "@/lib/api";
import {
  PAYMENT_ID_STORAGE_KEY,
  PENDING_APPLICATION_ID_KEY,
  STEP_UP_TOKEN_HEADER,
  type InitiatePaymentResponse,
} from "@/types/payment";

export async function initiateAndRedirect(
  applicationId: string,
  paymentPlan: "monthly" | "annual" = "annual",
  stepUpToken?: string,
): Promise<string> {
  sessionStorage.setItem(PENDING_APPLICATION_ID_KEY, applicationId);
  const res = await api.post<InitiatePaymentResponse>(
    "/payments/initiate",
    { applicationId, paymentPlan },
    stepUpToken ? { headers: { [STEP_UP_TOKEN_HEADER]: stepUpToken } } : undefined,
  );
  sessionStorage.setItem(PAYMENT_ID_STORAGE_KEY, res.data.paymentId);
  return res.data.checkoutUrl;
}

export function isStepUpRejection(err: unknown): boolean {
  return (err as { response?: { status?: number } })?.response?.status === 403;
}

export function paymentErrorMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  if (Array.isArray(message)) return String(message[0] ?? fallback);
  return typeof message === "string" && message ? message : fallback;
}
