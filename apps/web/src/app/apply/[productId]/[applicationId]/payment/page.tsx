"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useApplicationWizard } from "@/contexts/application-wizard-context";
import { initiateAndRedirect } from "@/lib/payment";
import { PENDING_APPLICATION_ID_KEY } from "@/types/payment";
import { formatNaira } from "@/lib/utils";

export default function PaymentPage() {
  const router = useRouter();
  const { applicationId, application, formData } = useApplicationWizard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentPlan, setPaymentPlan] = useState<"monthly" | "annual">("annual");

  const productName = application?.product?.name ?? "Insurance";
  const calculatedPremium = formData?.calculatedPremium
    ? Number(formData.calculatedPremium)
    : null;
  const annualAmount = application?.product?.premiumAmount
    ? parseFloat(String(application.product.premiumAmount))
    : calculatedPremium ?? 0;
  const monthlyAmount = annualAmount ? Math.ceil(annualAmount / 12) : 0;
  const displayAmount =
    paymentPlan === "monthly" ? monthlyAmount : annualAmount;

  async function handleProceed() {
    setLoading(true);
    setError("");
    try {
      sessionStorage.setItem(PENDING_APPLICATION_ID_KEY, applicationId);
      const url = await initiateAndRedirect(applicationId, paymentPlan);
      setLoading(false);
      if (url) window.location.href = url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="text-center py-4">
      <h1 className="font-display font-bold text-midnight text-3xl sm:text-4xl mb-3">
        You&apos;re almost covered
      </h1>

      <p className="font-body text-slate text-base mb-6">
        {productName} · {formatNaira(displayAmount)}
        {paymentPlan === "monthly" ? "/month" : ""}
      </p>

      {annualAmount > 0 && (
        <div className="mb-6 text-left">
          <p className="font-body text-sm font-semibold text-midnight mb-3">
            Payment Plan
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentPlan("annual")}
              className={`p-4 rounded-xl border-2 text-left transition-colors ${
                paymentPlan === "annual"
                  ? "border-daybreak bg-daybreak/5"
                  : "border-slate/20 hover:border-slate/40"
              }`}
            >
              <p className="font-body font-bold text-midnight text-sm">Annual</p>
              <p className="font-display font-bold text-midnight text-xl mt-1">
                ₦{annualAmount.toLocaleString("en-NG")}
              </p>
              <p className="font-body text-xs text-slate mt-0.5">per year</p>
              <p className="font-body text-xs text-cover-green font-semibold mt-2">
                Save{" "}
                {Math.round(
                  ((monthlyAmount * 12 - annualAmount) / (monthlyAmount * 12)) *
                    100,
                )}
                %
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPaymentPlan("monthly")}
              className={`p-4 rounded-xl border-2 text-left transition-colors ${
                paymentPlan === "monthly"
                  ? "border-daybreak bg-daybreak/5"
                  : "border-slate/20 hover:border-slate/40"
              }`}
            >
              <p className="font-body font-bold text-midnight text-sm">
                Monthly
              </p>
              <p className="font-display font-bold text-midnight text-xl mt-1">
                ₦{monthlyAmount.toLocaleString("en-NG")}
              </p>
              <p className="font-body text-xs text-slate mt-0.5">per month</p>
              <p className="font-body text-xs text-slate font-semibold mt-2">
                ₦{(monthlyAmount * 12).toLocaleString("en-NG")} total/year
              </p>
            </button>
          </div>
        </div>
      )}

      <p className="font-body text-slate/70 text-xs bg-slate-100 rounded-full px-4 py-2 inline-block mb-8">
        Secured by Monnify
      </p>

      {error && (
        <p className="font-body text-xs text-alert-coral mb-4">{error}</p>
      )}

      <button
        type="button"
        onClick={handleProceed}
        disabled={loading || !annualAmount}
        className="w-full bg-daybreak text-midnight font-body font-bold text-base py-4 rounded-lg hover:bg-[#D4921A] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 mb-6"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {loading ? "Please wait..." : "Proceed to Payment"}
      </button>

      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="font-body text-sm font-medium text-midnight underline underline-offset-2 hover:text-daybreak transition-colors"
      >
        Cancel and return to dashboard
      </button>
    </div>
  );
}
