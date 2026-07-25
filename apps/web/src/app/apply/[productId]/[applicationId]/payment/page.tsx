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
  const { applicationId, application } = useApplicationWizard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const productName = application?.product?.name ?? "Insurance";
  const premium = application?.product?.premiumAmount ?? 0;

  async function handleProceed() {
    setLoading(true);
    setError("");
    try {
      sessionStorage.setItem(PENDING_APPLICATION_ID_KEY, applicationId);
      await initiateAndRedirect(applicationId);
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
        {productName} · {formatNaira(premium)}
      </p>

      <p className="font-body text-slate/70 text-xs bg-slate-100 rounded-full px-4 py-2 inline-block mb-8">
        Secured by Monnify
      </p>

      {error && (
        <p className="font-body text-xs text-alert-coral mb-4">{error}</p>
      )}

      <button
        type="button"
        onClick={handleProceed}
        disabled={loading}
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
