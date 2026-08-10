import api from "@/lib/api";
import {
  PAYMENT_ID_STORAGE_KEY,
  PENDING_APPLICATION_ID_KEY,
  type InitiatePaymentResponse,
} from "@/types/payment";

export async function initiateAndRedirect(
  applicationId: string,
  paymentPlan: "monthly" | "annual" = "annual",
): Promise<string> {
  sessionStorage.setItem(PENDING_APPLICATION_ID_KEY, applicationId);
  const res = await api.post<InitiatePaymentResponse>("/payments/initiate", {
    applicationId,
    paymentPlan,
  });
  sessionStorage.setItem(PAYMENT_ID_STORAGE_KEY, res.data.paymentId);
  return res.data.checkoutUrl;
}
