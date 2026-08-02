"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { ClaimWizardActions } from "@/components/claims/claim-wizard-actions";
import { useClaimWizard } from "@/contexts/claim-wizard-context";
import { formatNaira } from "@/lib/utils";
import { claimStepPath, resolveClaimType } from "@/types/claim-wizard";

export default function ClaimStep3Page() {
  const router = useRouter();
  const { claimId, formData, documents } = useClaimWizard();

  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!claimId) {
      router.replace(claimStepPath(1));
      return;
    }
    if (documents.length < 1) {
      router.replace(claimStepPath(2));
    }
  }, [claimId, documents.length, router]);

  const claimTypeLabel = resolveClaimType(
    formData.claimTypePreset,
    formData.customClaimType,
  );

  const estimatedDisplay = formData.estimatedAmount
    ? formatNaira(parseFloat(formData.estimatedAmount))
    : formatNaira(0);

  function onSubmit() {
    setSubmitting(true);
    setSubmitting(false);
    router.push("/claims/new/success");
  }

  if (!claimId) return null;

  return (
    <div>
      <h2 className="font-display font-bold text-midnight text-2xl sm:text-3xl mb-6">
        Review your claim
      </h2>

      <div className="space-y-4 mb-8">
        <div className="rounded-xl border border-slate/15 p-5">
          <h3 className="font-body font-semibold text-midnight text-base mb-1">
            Claim Details
          </h3>
          <p className="font-body text-slate text-sm">
            {claimTypeLabel} · {estimatedDisplay}
          </p>
        </div>

        <div className="rounded-xl border border-slate/15 p-5">
          <h3 className="font-body font-semibold text-midnight text-base mb-1">
            Documents
          </h3>
          <p className="font-body text-slate text-sm flex items-center gap-1.5">
            {documents.length} files uploaded
            <Check size={16} className="text-cover-green" strokeWidth={2.5} />
          </p>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer mb-8">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate/40 text-daybreak focus:ring-daybreak"
        />
        <span className="font-body text-sm text-midnight">
          I confirm the information provided is accurate
        </span>
      </label>

      <ClaimWizardActions
        step={3}
        submitLabel="Submit Claim"
        submitDisabled={!confirmed}
        loading={submitting}
        fullWidthSubmit
        onSubmit={onSubmit}
      />
    </div>
  );
}
