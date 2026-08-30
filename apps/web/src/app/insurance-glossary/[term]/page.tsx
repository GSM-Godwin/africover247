import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, MessageCircle, Shield } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  GLOSSARY_BY_LABEL,
  GLOSSARY_BY_SLUG,
  GLOSSARY_TERMS,
} from "@/lib/insurance-terms";
import type { Metadata } from "next";

const PRODUCT_LINKS: Record<string, { label: string; href: string }[]> = {
  Insurance: [{ label: "Browse all products", href: "/products" }],
  Premium: [{ label: "Compare products", href: "/products" }],
  Policy: [{ label: "My policies", href: "/policies" }],
  Claim: [{ label: "File a claim", href: "/claims/new" }],
  Excess: [{ label: "View products", href: "/products" }],
  Exclusion: [{ label: "View products", href: "/products" }],
  Exclusions: [{ label: "View products", href: "/products" }],
  Quote: [{ label: "Get a quote", href: "/products" }],
  Application: [{ label: "Browse products", href: "/products" }],
  "Sum Insured": [{ label: "Get a quote", href: "/products" }],
  Beneficiary: [
    { label: "Life insurance products", href: "/products?category=Life" },
  ],
  Nominee: [
    { label: "Life insurance products", href: "/products?category=Life" },
  ],
  Liability: [
    { label: "Liability products", href: "/products?category=Liability" },
  ],
  "Third Party": [
    { label: "Motor insurance", href: "/products?category=Motor" },
  ],
  Renewal: [{ label: "My policies", href: "/policies" }],
};

export function generateStaticParams() {
  return GLOSSARY_TERMS.map((entry) => ({ term: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ term: string }>;
}): Promise<Metadata> {
  const { term } = await params;
  const entry = GLOSSARY_BY_SLUG[term];
  if (!entry) return { title: "Not Found" };
  return {
    title: `What is ${entry.label}? — AfriCover247 Insurance Glossary`,
    description: entry.plainEnglish || entry.definition,
  };
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ term: string }>;
}) {
  const { term } = await params;
  const entry = GLOSSARY_BY_SLUG[term];
  if (!entry) notFound();

  const relatedLinks = PRODUCT_LINKS[entry.label] || [
    { label: "Browse products", href: "/products" },
  ];
  const allTerms = [...GLOSSARY_TERMS].sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  const currentIndex = allTerms.findIndex((t) => t.slug === entry.slug);
  const prevTerm = currentIndex > 0 ? allTerms[currentIndex - 1] : null;
  const nextTerm =
    currentIndex < allTerms.length - 1 ? allTerms[currentIndex + 1] : null;

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-paper">
        <section className="bg-midnight text-white py-12 px-6 pt-[130px]">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/insurance-glossary"
              className="inline-flex items-center gap-2 font-body text-white/60 hover:text-white text-sm mb-6 transition-colors"
            >
              <ArrowLeft size={14} />
              Insurance Glossary
            </Link>
            <p className="font-body text-daybreak text-xs font-semibold uppercase tracking-widest mb-2">
              {entry.category}
            </p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl mb-4">
              {entry.label}
            </h1>
          </div>
        </section>

        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl border border-slate/10 p-8">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={18} className="text-daybreak" />
                <h2 className="font-body font-semibold text-midnight text-base">
                  Official definition
                </h2>
              </div>
              <p className="font-body text-midnight text-lg leading-relaxed">
                {entry.definition}
              </p>
            </div>

            {entry.plainEnglish && (
              <div className="bg-daybreak/5 border border-daybreak/20 rounded-2xl p-8">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle size={18} className="text-daybreak" />
                  <h2 className="font-body font-semibold text-midnight text-base">
                    In plain English
                  </h2>
                </div>
                <p className="font-body text-midnight text-base leading-relaxed">
                  {entry.plainEnglish}
                </p>
              </div>
            )}

            {entry.example && (
              <div className="bg-white rounded-2xl border border-slate/10 p-8">
                <h2 className="font-body font-semibold text-midnight text-base mb-3">
                  Example
                </h2>
                <p className="font-body text-midnight text-base leading-relaxed italic">
                  &quot;{entry.example}&quot;
                </p>
              </div>
            )}

            {entry.relatedTerms.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate/10 p-8">
                <h2 className="font-body font-semibold text-midnight text-base mb-4">
                  Related terms
                </h2>
                <div className="flex flex-wrap gap-2">
                  {entry.relatedTerms.map((related) => {
                    const relatedEntry = GLOSSARY_BY_LABEL[related];
                    if (!relatedEntry) {
                      return (
                        <span
                          key={related}
                          className="font-body text-sm text-slate font-medium px-3 py-1.5 rounded-lg bg-slate/5"
                        >
                          {related}
                        </span>
                      );
                    }
                    return (
                      <Link
                        key={related}
                        href={`/insurance-glossary/${relatedEntry.slug}`}
                        className="font-body text-sm text-midnight font-medium px-3 py-1.5 rounded-lg bg-slate/5 hover:bg-daybreak/10 hover:text-daybreak transition-colors"
                      >
                        {related}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-midnight rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} className="text-daybreak" />
                <h2 className="font-body font-semibold text-white text-base">
                  Related products
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-2 bg-daybreak text-midnight font-body font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#D4921A] transition-colors"
                  >
                    {link.label}
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
              <p className="font-body text-white/50 text-xs mt-4">
                Still confused?{" "}
                <Link
                  href="/contact"
                  className="text-white/70 hover:text-white underline transition-colors"
                >
                  Contact our team
                </Link>{" "}
                for help.
              </p>
            </div>

            <div className="flex justify-between gap-4">
              {prevTerm ? (
                <Link
                  href={`/insurance-glossary/${prevTerm.slug}`}
                  className="flex items-center gap-2 font-body text-sm text-slate hover:text-midnight transition-colors"
                >
                  <ArrowLeft size={14} />
                  {prevTerm.label}
                </Link>
              ) : (
                <div />
              )}
              {nextTerm ? (
                <Link
                  href={`/insurance-glossary/${nextTerm.slug}`}
                  className="flex items-center gap-2 font-body text-sm text-slate hover:text-midnight transition-colors"
                >
                  {nextTerm.label}
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
