"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { applyStepPath } from "@/types/application";

interface WizardActionsProps {
  step: number;
  productId: string;
  applicationId: string;
  loading?: boolean;
  submitDisabled?: boolean;
  error?: string;
  onSubmit: () => void;
  onSaveDraft?: () => void;
  draftSaved?: boolean;
}

export function WizardActions({
  step,
  productId,
  applicationId,
  loading,
  submitDisabled,
  error,
  onSubmit,
  onSaveDraft,
  draftSaved,
}: WizardActionsProps) {
  return (
    <div className="mt-10 pt-6 border-t border-slate/10">
      {error && (
        <p className="font-body text-xs text-alert-coral text-right mb-3">
          {error}
        </p>
      )}

      {draftSaved && (
        <p className="font-body text-xs text-cover-green text-right mb-3">
          Draft saved successfully.
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        {step > 1 ? (
          <Link
            href={applyStepPath(productId, applicationId, step - 1)}
            className="font-body text-sm font-medium text-midnight underline underline-offset-2 hover:text-daybreak transition-colors"
          >
            Back
          </Link>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-5">
          {step === 1 && onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={loading}
              className="font-body text-sm font-medium text-midnight underline underline-offset-2 hover:text-daybreak transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || submitDisabled}
            className="bg-daybreak text-midnight font-body font-bold text-sm px-8 py-3 rounded-lg hover:bg-[#D4921A] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
