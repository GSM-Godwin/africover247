"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import api from "@/lib/api";

interface RenewalPolicy {
  id: string;
  policyNumber: string;
  expiryDate: string;
  renewalStatus: string;
  premiumPaid: string;
  lastReminderSentAt: string | null;
  lastReminderType: string | null;
  user: { firstName: string; lastName: string; email: string; phone: string | null };
  product: { name: string; category: string };
}

interface RenewalStats {
  dueSoon7: number;
  dueSoon14: number;
  dueSoon30: number;
  dueSoon60: number;
  dueSoon90: number;
  expired: number;
  totalActive: number;
}

const WINDOW_FILTERS = [
  { label: "Next 7 days", value: 7 },
  { label: "Next 14 days", value: 14 },
  { label: "Next 30 days", value: 30 },
  { label: "Next 60 days", value: 60 },
  { label: "Next 90 days", value: 90 },
  { label: "Expired", value: -1 },
];

export default function AdminRenewalsPage() {
  const [policies, setPolicies] = useState<RenewalPolicy[]>([]);
  const [stats, setStats] = useState<RenewalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState(30);

  async function fetchData() {
    setLoading(true);
    try {
      const [policiesRes, statsRes] = await Promise.all([
        api.get("/admin/policies/renewals", { params: { days: window } }),
        api.get("/admin/policies/renewal-stats"),
      ]);
      setPolicies(policiesRes.data);
      setStats(statsRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [window]);

  function daysUntilExpiry(expiryDate: string): number {
    return Math.round((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl space-y-6">
      <AdminPageHeader
        title="Renewal Dashboard"
        subtitle="Monitor upcoming policy renewals and expired policies."
      />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Next 7d", value: stats.dueSoon7, color: "text-alert-coral" },
            { label: "Next 14d", value: stats.dueSoon14, color: "text-alert-coral" },
            { label: "Next 30d", value: stats.dueSoon30, color: "text-daybreak" },
            { label: "Next 60d", value: stats.dueSoon60, color: "text-daybreak" },
            { label: "Next 90d", value: stats.dueSoon90, color: "text-midnight" },
            { label: "Expired", value: stats.expired, color: "text-alert-coral" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate/10 p-4 text-center">
              <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p>
              <p className="font-body text-xs text-slate mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {WINDOW_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setWindow(f.value)}
            className={`font-body text-sm px-4 py-1.5 rounded-full border transition-colors ${
              window === f.value
                ? "bg-midnight text-white border-midnight"
                : "border-slate/20 text-slate hover:border-midnight/20"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate/10 overflow-hidden">
        {loading ? (
          <div className="animate-pulse p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-slate/10 rounded" />
            ))}
          </div>
        ) : policies.length === 0 ? (
          <p className="font-body text-slate text-sm p-6">No policies found for this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate/5 border-b border-slate/10">
              <tr>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">Policy</th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">Customer</th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">Product</th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">Expiry</th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">Days Left</th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">Last Reminder</th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">Premium</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate/5">
              {policies.map((policy) => {
                const days = daysUntilExpiry(policy.expiryDate);
                return (
                  <tr key={policy.id} className="hover:bg-slate/2">
                    <td className="px-4 py-3 font-mono text-xs text-midnight">{policy.policyNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-body text-midnight text-sm">
                        {policy.user.firstName} {policy.user.lastName}
                      </p>
                      <p className="font-body text-slate text-xs">{policy.user.email}</p>
                    </td>
                    <td className="px-4 py-3 font-body text-midnight text-sm max-w-xs truncate">
                      {policy.product.name}
                    </td>
                    <td className="px-4 py-3 font-body text-slate text-xs">
                      {new Date(policy.expiryDate).toLocaleDateString("en-NG")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-body font-bold text-sm ${
                          days < 0
                            ? "text-alert-coral"
                            : days <= 7
                              ? "text-alert-coral"
                              : days <= 30
                                ? "text-daybreak"
                                : "text-midnight"
                        }`}
                      >
                        {days < 0 ? `${Math.abs(days)}d ago` : `${days}d`}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-slate text-xs">
                      {policy.lastReminderType
                        ? `${policy.lastReminderType.replace(/_/g, " ")} · ${new Date(policy.lastReminderSentAt!).toLocaleDateString("en-NG")}`
                        : "None sent"}
                    </td>
                    <td className="px-4 py-3 font-body text-midnight text-sm">
                      ₦{parseFloat(policy.premiumPaid).toLocaleString("en-NG")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/policies/${policy.id}`}
                        className="font-body text-sm text-midnight underline hover:text-daybreak"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
