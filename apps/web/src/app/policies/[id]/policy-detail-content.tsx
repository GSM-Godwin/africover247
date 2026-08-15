"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";
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
  const [showSnooze, setShowSnooze] = useState(false);
  const [snoozing, setSnoozing] = useState(false);
  const [snoozed, setSnoozed] = useState(false);

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

  async function handleSnooze(days: number | null, customDate?: string) {
    if (!policy) return;
    setSnoozing(true);
    try {
      const until = customDate
        ? new Date(customDate)
        : new Date(Date.now() + (days || 1) * 24 * 60 * 60 * 1000);
      await api.post(`/policies/${policy.id}/snooze-reminder`, {
        until: until.toISOString(),
      });
      setSnoozed(true);
      setShowSnooze(false);
    } catch {
      toast.error("Could not snooze reminder.");
    } finally {
      setSnoozing(false);
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

              {(() => {
                const days = Math.round(
                  (new Date(policy.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                );
                const isExpired = days < 0 || policy.status === "expired";
                const isUrgent = days <= 14 && days >= 0;
                const isDueSoon = days > 14 && days <= 60;

                if (!isExpired && !isUrgent && !isDueSoon) return null;

                return (
                  <div className={`rounded-2xl p-6 border mt-8 ${
                    isExpired ? "bg-alert-coral/5 border-alert-coral/20" :
                    isUrgent ? "bg-alert-coral/5 border-alert-coral/20" :
                    "bg-daybreak/5 border-daybreak/20"
                  }`}>
                    <h3 className={`font-display font-bold text-lg mb-2 ${
                      isExpired || isUrgent ? "text-alert-coral" : "text-midnight"
                    }`}>
                      {isExpired ? "Your policy has expired" :
                       isUrgent ? `Your policy expires in ${days} day${days !== 1 ? "s" : ""}` :
                       `Your policy expires in ${days} days`}
                    </h3>
                    <p className="font-body text-slate text-sm mb-4">
                      {isExpired
                        ? "You may need to complete a new application to reinstate cover. Contact our team for help."
                        : "Renew your policy to avoid any gap in your insurance cover."}
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      <Link
                        href={`/products/${policy.productId}`}
                        className="inline-flex items-center gap-2 bg-daybreak text-midnight font-body font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#D4921A] transition-colors"
                      >
                        {isExpired ? "Check Renewal Options" : "Renew Now"}
                      </Link>
                      <Link
                        href="/help"
                        className="inline-flex items-center gap-2 border border-slate/20 text-slate font-body font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-slate/5 transition-colors"
                      >
                        Speak to an Expert
                      </Link>
                    </div>
                    {!snoozed && (
                      <button
                        type="button"
                        onClick={() => setShowSnooze(true)}
                        className="font-body text-sm text-slate hover:text-midnight transition-colors mt-2"
                      >
                        Remind me later
                      </button>
                    )}
                    {snoozed && (
                      <p className="font-body text-xs text-slate mt-2">
                        ✓ Reminder snoozed. We&apos;ll remind you again later.
                      </p>
                    )}
                  </div>
                );
              })()}

              {showSnooze && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl w-full max-w-sm p-6">
                    <h3 className="font-display font-bold text-midnight text-lg mb-4">
                      When should we remind you?
                    </h3>
                    <div className="space-y-2 mb-4">
                      {[
                        { label: "Tomorrow", days: 1 },
                        { label: "In 3 days", days: 3 },
                        { label: "In 7 days", days: 7 },
                      ].map((opt) => (
                        <button
                          key={opt.days}
                          type="button"
                          onClick={() => handleSnooze(opt.days)}
                          disabled={snoozing}
                          className="w-full text-left px-4 py-3 rounded-xl border border-slate/20 font-body text-sm text-midnight hover:bg-slate/5 transition-colors disabled:opacity-60"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="mb-4">
                      <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                        Choose a date
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => e.target.value && handleSnooze(null, e.target.value)}
                        className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm focus:outline-none focus:border-daybreak"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSnooze(false)}
                      className="w-full border border-slate/20 text-slate font-body font-medium text-sm py-2.5 rounded-xl hover:bg-slate/5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
