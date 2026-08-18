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
  const { productId, applicationId, application, formData } =
    useApplicationWizard();

  function handleProceedToPayment() {
    router.push(`/apply/${productId}/${applicationId}/payment`);
  }

  const isQuoteBased = application?.product?.pricingType === "quote_based";
  const hasCalculatedPremium = !!(
    formData?.calculatedPremium || application?.product?.premiumAmount
  );
  const needsQuote = isQuoteBased && !hasCalculatedPremium;
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

      {needsQuote ? (
        <div className="text-center p-6 bg-daybreak/5 border border-daybreak/20 rounded-2xl mt-10">
          <p className="font-body text-sm text-midnight mb-2 font-semibold">
            This product requires a quote before payment
          </p>
          <p className="font-body text-xs text-slate mb-4">
            Your application details have been saved. Request a quote and
            AfriGlobal will respond within 3 business days.
          </p>
          <Link
            href={`/quotes/new?productId=${application?.product?.id}&applicationId=${applicationId}`}
            className="inline-flex items-center gap-2 bg-daybreak text-midnight font-body font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#D4921A] transition-colors"
          >
            Request a Quote
          </Link>
        </div>
      ) : (
        <WizardActions
          step={4}
          productId={productId}
          applicationId={applicationId}
          onSubmit={handleProceedToPayment}
          submitLabel="Proceed to Payment"
        />
      )}
    </div>
  );
}
