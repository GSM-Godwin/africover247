"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { claimStepPath } from "@/types/claim-wizard";

interface ClaimWizardActionsProps {
  step: number;
  loading?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
  error?: string;
  fullWidthSubmit?: boolean;
  onSubmit: () => void;
}

export function ClaimWizardActions({
  step,
  loading,
  submitDisabled,
  submitLabel = "Save & Continue",
  error,
  fullWidthSubmit,
  onSubmit,
}: ClaimWizardActionsProps) {
  return (
    <div className="mt-10 pt-6 border-t border-slate/10">
      {error && (
        <p className="font-body text-xs text-alert-coral text-right mb-3">
          {error}
        </p>
      )}

      {fullWidthSubmit ? (
        <div className="space-y-6">
          {step > 1 && (
            <Link
              href={claimStepPath(step - 1)}
              className="font-body text-sm font-medium text-midnight underline underline-offset-2 hover:text-daybreak transition-colors"
            >
              Back
            </Link>
          )}
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || submitDisabled}
            className="w-full bg-daybreak text-midnight font-body font-bold text-base py-4 rounded-lg hover:bg-[#C4700E] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Submitting..." : submitLabel}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          {step > 1 ? (
            <Link
              href={claimStepPath(step - 1)}
              className="font-body text-sm font-medium text-midnight underline underline-offset-2 hover:text-daybreak transition-colors"
            >
              Back
            </Link>
          ) : (
            <Link
              href="/claims"
              className="font-body text-sm font-medium text-midnight underline underline-offset-2 hover:text-daybreak transition-colors"
            >
              Back
            </Link>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || submitDisabled}
            className="bg-daybreak text-midnight font-body font-bold text-sm px-8 py-3 rounded-lg hover:bg-[#C4700E] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Saving..." : submitLabel}
          </button>
        </div>
      )}
    </div>
  );
}
