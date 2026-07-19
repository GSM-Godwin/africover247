import api from "@/lib/api";
import {
  PAYMENT_ID_STORAGE_KEY,
  PENDING_APPLICATION_ID_KEY,
  type InitiatePaymentResponse,
} from "@/types/payment";

export async function initiateAndRedirect(applicationId: string): Promise<void> {
  sessionStorage.setItem(PENDING_APPLICATION_ID_KEY, applicationId);
  const res = await api.post<InitiatePaymentResponse>("/payments/initiate", {
    applicationId,
  });
  sessionStorage.setItem(PAYMENT_ID_STORAGE_KEY, res.data.paymentId);
  window.location.href = res.data.checkoutUrl;
}
