"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import type { QuoteRecord } from "@/types/quote";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending Review", value: "pending_review" },
  { label: "Quote Sent", value: "quote_sent" },
  { label: "Countered", value: "countered_by_customer" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
];

const statusColor: Record<string, string> = {
  pending_review: "bg-slate/10 text-slate",
  quote_sent: "bg-daybreak/10 text-daybreak",
  countered_by_customer: "bg-info/10 text-info",
  countered_by_admin: "bg-daybreak/10 text-daybreak",
  accepted: "bg-cover-green/10 text-cover-green",
  rejected: "bg-alert-coral/10 text-alert-coral",
  expired: "bg-slate/10 text-slate",
};

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = activeFilter ? `?status=${activeFilter}` : "";
    api
      .get<QuoteRecord[]>(`/admin/quotes${params}`)
      .then((res) => setQuotes(res.data))
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false));
  }, [activeFilter]);

  const pendingCount = quotes.filter(
    (q) =>
      q.status === "pending_review" || q.status === "countered_by_customer",
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-midnight text-2xl">
            Quote Requests
          </h1>
          {pendingCount > 0 && (
            <p className="font-body text-sm text-daybreak font-semibold mt-0.5">
              {pendingCount} requiring your response
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setActiveFilter(f.value)}
            className={`font-body text-sm px-4 py-1.5 rounded-full border transition-colors ${
              activeFilter === f.value
                ? "bg-midnight text-white border-midnight"
                : "border-slate/30 text-slate hover:border-midnight hover:text-midnight"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate/10 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-body text-slate">No quote requests found.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate/20 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate/5 border-b border-slate/10">
                <th className="text-left font-body text-xs font-semibold text-slate uppercase tracking-wide px-4 py-3">
                  Customer
                </th>
                <th className="text-left font-body text-xs font-semibold text-slate uppercase tracking-wide px-4 py-3">
                  Product
                </th>
                <th className="text-left font-body text-xs font-semibold text-slate uppercase tracking-wide px-4 py-3 hidden sm:table-cell">
                  Amount
                </th>
                <th className="text-left font-body text-xs font-semibold text-slate uppercase tracking-wide px-4 py-3 hidden md:table-cell">
                  Date
                </th>
                <th className="text-left font-body text-xs font-semibold text-slate uppercase tracking-wide px-4 py-3">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate/10">
              {quotes.map((quote) => {
                const amount =
                  quote.adminQuoteAmount || quote.customerCounterAmount;
                const needsAction =
                  quote.status === "pending_review" ||
                  quote.status === "countered_by_customer";

                return (
                  <tr
                    key={quote.id}
                    className={`hover:bg-slate/5 transition-colors ${
                      needsAction ? "bg-daybreak/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-body text-sm font-semibold text-midnight">
                        {quote.customer?.firstName} {quote.customer?.lastName}
                      </p>
                      <p className="font-body text-xs text-slate">
                        {quote.customer?.email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-body text-sm text-midnight">
                        {quote.product.name}
                      </p>
                      <p className="font-body text-xs text-slate">
                        {quote.product.category}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {amount ? (
                        <p className="font-mono text-sm text-midnight">
                          ₦{parseFloat(amount).toLocaleString("en-NG")}
                        </p>
                      ) : (
                        <p className="font-body text-xs text-slate">—</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="font-body text-sm text-slate">
                        {new Date(quote.createdAt).toLocaleDateString("en-NG")}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-body text-xs font-medium px-2.5 py-1 rounded-full ${
                          statusColor[quote.status] || "bg-slate/10 text-slate"
                        }`}
                      >
                        {quote.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/quotes/${quote.id}`}
                        className="font-body text-sm text-midnight hover:text-daybreak font-medium transition-colors"
                      >
                        {needsAction ? "Respond →" : "View →"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
