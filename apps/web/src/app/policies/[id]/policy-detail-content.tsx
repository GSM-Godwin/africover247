"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { StatusBadge } from "@/components/shared/status-badge";
import api from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/utils";
import type { PolicyDetailRecord } from "@/types/policy";

function DetailRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-slate/10 last:border-b-0">
      <div>
        <span className="font-body text-sm text-slate">{label}</span>
        {hint && (
          <p className="font-body text-xs text-slate">{hint}</p>
        )}
      </div>
      <span className="font-body text-sm font-semibold text-midnight text-right">
        {value}
      </span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8 h-80" />
      <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8 h-56" />
    </div>
  );
}

export function PolicyDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const policyId = params.id;

  const [policy, setPolicy] = useState<PolicyDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchPolicy = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await api.get<PolicyDetailRecord>(`/policies/${policyId}`);
      setPolicy(res.data);
      api.patch('/notifications/read-by-reference', {
        referenceType: 'policy',
        referenceId: policyId,
      }).catch(() => {});
    } catch {
      setNotFound(true);
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  }, [policyId]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  function handleDownload() {
    if (policy?.policyPdfUrl) {
      window.open(policy.policyPdfUrl, "_blank");
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F5F6F8]">
        <div className="max-w-[1140px] mx-auto px-6 sm:px-8 py-10 sm:py-12">
          {loading && <DetailSkeleton />}

          {!loading && notFound && (
            <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-8 sm:p-10 text-center max-w-lg mx-auto">
              <p className="font-body text-slate text-base mb-6">
                This policy isn&apos;t available.
              </p>
              <Link
                href="/policies"
                className="font-body text-sm font-semibold text-midnight underline underline-offset-2 hover:text-daybreak transition-colors"
              >
                Back to My Policies
              </Link>
            </div>
          )}

          {!loading && policy && (
            <>
              <div className="mb-8">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <nav className="font-body text-sm text-slate">
                    <Link
                      href="/dashboard"
                      className="hover:text-midnight transition-colors"
                    >
                      Home
                    </Link>
                    <span className="mx-2">&gt;</span>
                    <Link
                      href="/policies"
                      className="hover:text-midnight transition-colors"
                    >
                      My Policies
                    </Link>
                    <span className="mx-2">&gt;</span>
                    <span className="text-midnight">{policy.policyNumber}</span>
                  </nav>
                  <StatusBadge status={policy.status} kind="policy" />
                </div>
                <h1 className="font-display font-bold text-midnight text-3xl sm:text-4xl">
                  {policy.product.name}
                </h1>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <section className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8">
                  <h2 className="font-display font-bold text-midnight text-lg mb-2">
                    Policy Details
                  </h2>
                  <DetailRow label="Policy number" value={policy.policyNumber} />
                  <DetailRow
                    label="Issue date"
                    value={formatDate(policy.issueDate)}
                  />
                  <DetailRow
                    label="Start date"
                    value={formatDate(policy.startDate)}
                    hint="When your cover started"
                  />
                  <DetailRow
                    label="Expiry date"
                    value={formatDate(policy.expiryDate)}
                    hint="When your cover ends"
                  />
                  <DetailRow
                    label="Premium paid"
                    value={formatNaira(parseFloat(policy.premiumPaid))}
                    hint="What you paid"
                  />
                </section>

                <section className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8">
                  <h2 className="font-display font-bold text-midnight text-lg mb-5">
                    Actions
                  </h2>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={!policy.policyPdfUrl}
                      className="w-full bg-daybreak text-midnight font-body font-bold text-sm py-3.5 rounded-lg hover:bg-[#D4921A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Download Policy PDF
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/claims/new?policyId=${policy.id}`)
                      }
                      className="w-full font-body font-medium text-midnight text-sm border border-slate/25 rounded-lg py-3.5 hover:bg-slate-100 transition-colors duration-200"
                    >
                      File a Claim
                    </button>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
