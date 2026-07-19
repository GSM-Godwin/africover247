"use client";

import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatPolicyDateRange } from "@/lib/utils";
import type { PolicyRecord } from "@/types/policy";

interface PolicyListCardProps {
  policy: PolicyRecord;
}

export function PolicyListCard({ policy }: PolicyListCardProps) {
  const router = useRouter();

  function handleDownload(event: React.MouseEvent) {
    event.stopPropagation();
    if (policy.policyPdfUrl) {
      window.open(policy.policyPdfUrl, "_blank");
    }
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/policies/${policy.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/policies/${policy.id}`);
        }
      }}
      className="w-full bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-5 sm:p-6 hover:shadow-[0_4px_24px_rgba(16,26,52,0.08)] transition-shadow duration-200 cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-body font-semibold text-midnight text-base sm:text-lg mb-1.5">
            {policy.product.name}
          </p>
          <p className="font-body text-slate text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-xs bg-slate-100 text-midnight px-2 py-0.5 rounded">
              {policy.policyNumber}
            </span>
            <span>
              · {formatPolicyDateRange(policy.startDate, policy.expiryDate)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <StatusBadge status={policy.status} kind="policy" />
          {policy.policyPdfUrl ? (
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-info hover:text-midnight transition-colors"
            >
              <Download size={15} />
              Download
            </button>
          ) : (
            <span className="font-body text-xs text-slate italic">
              PDF pending
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function PolicyListCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-5 sm:p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-slate-100 rounded w-48" />
          <div className="h-4 bg-slate-100 rounded w-64" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-6 bg-slate-100 rounded-full w-16" />
          <div className="h-4 bg-slate-100 rounded w-20" />
        </div>
      </div>
    </div>
  );
}
