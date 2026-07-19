"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useClaimWizard } from "@/contexts/claim-wizard-context";
import { claimStepPath } from "@/types/claim-wizard";

export default function ClaimSuccessPage() {
  const router = useRouter();
  const { claimId, claimReference } = useClaimWizard();

  useEffect(() => {
    if (!claimId || !claimReference) {
      router.replace(claimStepPath(1));
    }
  }, [claimId, claimReference, router]);

  if (!claimId || !claimReference) return null;

  return (
    <div className="text-center py-6 sm:py-10">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-cover-green flex items-center justify-center">
        <Check size={32} className="text-white" strokeWidth={2.5} />
      </div>

      <h2 className="font-display font-bold text-midnight text-2xl sm:text-3xl mb-6">
        Claim submitted successfully
      </h2>

      <span className="inline-block font-mono text-sm text-midnight border border-slate/25 rounded-full px-4 py-2 mb-10">
        {claimReference}
      </span>

      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <Link
          href={`/claims/${claimId}`}
          className="flex-1 font-body font-semibold text-midnight text-sm border border-slate/25 rounded-lg py-3.5 hover:bg-slate-100 transition-colors duration-200 text-center"
        >
          Track My Claim
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 bg-daybreak text-midnight font-body font-bold text-sm rounded-lg py-3.5 hover:bg-[#D4921A] transition-colors duration-200 text-center"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
