"use client";

import { useCallback, useEffect, useState } from "react";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import Link from "next/link";
import {
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import api from "@/lib/api";
import type { QuoteRecord } from "@/types/quote";

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    icon: LucideIcon;
    actionNeeded: boolean;
  }
> = {
  pending_review: {
    label: "Pending Review",
    color: "text-slate",
    bg: "bg-slate/10",
    icon: Clock,
    actionNeeded: false,
  },
  quote_sent: {
    label: "Quote Ready",
    color: "text-daybreak",
    bg: "bg-daybreak/10",
    icon: AlertCircle,
    actionNeeded: true,
  },
  countered_by_customer: {
    label: "Counter Sent",
    color: "text-info",
    bg: "bg-info/10",
    icon: MessageCircle,
    actionNeeded: false,
  },
  countered_by_admin: {
    label: "Counter Received",
    color: "text-daybreak",
    bg: "bg-daybreak/10",
    icon: AlertCircle,
    actionNeeded: true,
  },
  accepted: {
    label: "Accepted",
    color: "text-cover-green",
    bg: "bg-cover-green/10",
    icon: CheckCircle,
    actionNeeded: false,
  },
  rejected: {
    label: "Rejected",
    color: "text-alert-coral",
    bg: "bg-alert-coral/10",
    icon: XCircle,
    actionNeeded: false,
  },
  expired: {
    label: "Expired",
    color: "text-slate",
    bg: "bg-slate/10",
    icon: Clock,
    actionNeeded: false,
  },
};

export function QuotesSection() {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(() => {
    return api
      .get<QuoteRecord[]>("/quotes/my")
      .then((res) => setQuotes(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchQuotes().finally(() => setLoading(false));
  }, [fetchQuotes]);

  useAutoRefresh(fetchQuotes, { intervalMs: 15000 });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-slate/10 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="font-body text-slate text-base">No quote requests yet.</p>
        <p className="font-body text-slate/60 text-sm mt-1">
          Browse our products to request a quote.
        </p>
        <Link
          href="/products"
          className="inline-block mt-4 bg-daybreak text-midnight font-body font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#C4700E] transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const actionNeeded = quotes.filter((q) => statusConfig[q.status]?.actionNeeded);
  const others = quotes.filter((q) => !statusConfig[q.status]?.actionNeeded);
  const sorted = [...actionNeeded, ...others];

  return (
    <div className="space-y-3">
      {sorted.map((quote) => {
        const config = statusConfig[quote.status] || statusConfig.pending_review;
        const Icon = config.icon;
        const amount = quote.finalAmount || quote.adminQuoteAmount;

        return (
          <Link
            key={quote.id}
            href={`/quotes/${quote.id}`}
            className="block bg-white border border-slate/20 rounded-lg p-4 hover:border-daybreak transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-midnight text-sm truncate">
                  {quote.product.name}
                </p>
                <p className="font-body text-slate text-xs mt-0.5">
                  {quote.product.category} ·{" "}
                  {new Date(quote.createdAt).toLocaleDateString("en-NG")}
                </p>
                {amount && (
                  <p className="font-mono text-midnight text-sm font-medium mt-1">
                    ₦{parseFloat(amount).toLocaleString("en-NG")}/year
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-body font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}
                >
                  <Icon size={12} />
                  {config.label}
                </span>
                {config.actionNeeded && (
                  <span className="font-body text-xs text-daybreak font-semibold">
                    Action needed →
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
