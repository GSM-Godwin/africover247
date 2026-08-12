import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GLOSSARY_TERMS } from "@/lib/insurance-terms";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insurance Glossary — AfriCover247",
  description:
    "Plain English definitions of insurance terms for Nigerian customers. Understand what you are buying before you buy it.",
};

const PRIORITY_TERMS = [
  "Insurance",
  "Policy",
  "Premium",
  "Cover",
  "Claim",
  "Excess",
  "Exclusion",
  "Sum Insured",
  "Beneficiary",
  "Nominee",
  "Third Party",
  "Liability",
  "Indemnity",
  "Compensation",
  "Underwriting",
  "Risk",
  "Renewal",
  "Expiry Date",
  "Effective Date",
  "Cancellation",
  "Lapse",
  "Reinstatement",
  "Material Fact",
  "Non-disclosure",
  "Fraud",
  "Deductible",
  "Subrogation",
  "Insurable Interest",
];

const CATEGORIES = {
  "Understanding Insurance": [
    "Insurance",
    "Policy",
    "Premium",
    "Cover",
    "Sum Insured",
    "Risk",
    "Beneficiary",
    "Nominee",
  ],
  "Buying Insurance": [
    "Underwriting",
    "Insurable Interest",
    "Effective Date",
    "Renewal",
    "Cancellation",
  ],
  "Making a Claim": [
    "Claim",
    "Excess",
    "Deductible",
    "Indemnity",
    "Compensation",
    "Subrogation",
  ],
  "Policy Terms": [
    "Exclusion",
    "Third Party",
    "Liability",
    "Material Fact",
    "Non-disclosure",
    "Fraud",
    "Lapse",
    "Reinstatement",
    "Expiry Date",
  ],
};

function termToSlug(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function GlossaryIndexPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-paper">
        <section className="bg-midnight text-white py-16 px-6 pt-[130px]">
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-body text-daybreak text-sm font-semibold uppercase tracking-widest mb-3">
              Insurance Dictionary
            </p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl mb-4">
              Insurance, in Plain English
            </h1>
            <p className="font-body text-white/70 text-base max-w-xl mx-auto">
              You shouldn&apos;t have to learn insurance before you can buy
              insurance. Here&apos;s what every term actually means.
            </p>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-[1140px] mx-auto">
            <div className="bg-white rounded-2xl border border-slate/10 p-6 mb-10">
              <p className="font-body text-sm font-semibold text-slate uppercase tracking-wide mb-4">
                Quick navigation
              </p>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_TERMS.sort().map((term) => (
                  <Link
                    key={term}
                    href={`/insurance-glossary/${termToSlug(term)}`}
                    className="font-body text-sm text-midnight hover:text-daybreak font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-daybreak/5"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>

            {Object.entries(CATEGORIES).map(([category, terms]) => (
              <div key={category} className="mb-12">
                <h2 className="font-display font-bold text-midnight text-2xl mb-6">
                  {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {terms.map((term) => {
                    const entry = GLOSSARY_TERMS[term];
                    if (!entry) return null;
                    return (
                      <Link
                        key={term}
                        href={`/insurance-glossary/${termToSlug(term)}`}
                        className="block bg-white rounded-xl border border-slate/10 p-5 hover:border-daybreak/30 hover:shadow-md transition-all group"
                      >
                        <h3 className="font-body font-bold text-midnight text-base mb-2 group-hover:text-daybreak transition-colors">
                          {term}
                        </h3>
                        <p className="font-body text-slate text-sm leading-relaxed line-clamp-2">
                          {entry.definition}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="bg-midnight rounded-2xl p-8 text-center mt-8">
              <h2 className="font-display font-bold text-white text-2xl mb-3">
                Ready to get covered?
              </h2>
              <p className="font-body text-white/70 text-base mb-6">
                Now that you understand the terms, explore our insurance
                products.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-daybreak text-midnight font-body font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#D4921A] transition-colors"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
