"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { WizardActions } from "@/components/application/wizard-actions";
import { useApplicationWizard } from "@/contexts/application-wizard-context";
import { formatNaira } from "@/lib/utils";
import { applyStepPath } from "@/types/application";

const SUMMARY_SECTIONS = [
  { label: "Personal Information", step: 1 },
  { label: "Address & Employment", step: 2 },
  { label: "KYC Documents", step: 3 },
] as const;

export default function Step4Page() {
  const router = useRouter();
  const { productId, applicationId, application } = useApplicationWizard();

  function handleProceedToPayment() {
    router.push(`/apply/${productId}/${applicationId}/payment`);
  }

  const premium = application?.product?.premiumAmount ?? 0;

  return (
    <div>
      <div className="divide-y divide-slate/15">
        {SUMMARY_SECTIONS.map((section) => (
          <div
            key={section.step}
            className="flex items-center justify-between py-5 first:pt-0"
          >
            <span className="font-body font-semibold text-midnight text-base">
              {section.label}
            </span>
            <Link
              href={applyStepPath(productId, applicationId, section.step)}
              className="font-body text-sm font-medium text-info hover:underline transition-colors"
            >
              Edit
            </Link>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between py-5 border-t border-slate/15">
        <span className="font-body font-semibold text-midnight text-base">
          Total Premium
        </span>
        <span className="font-body font-bold text-midnight text-base">
          {formatNaira(premium)}
        </span>
      </div>

      <WizardActions
        step={4}
        productId={productId}
        applicationId={applicationId}
        onSubmit={handleProceedToPayment}
        submitLabel="Proceed to Payment"
      />
    </div>
  );
}
