"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import type { ClaimRecord } from "@/types/claim";

interface ClaimListCardProps {
  claim: ClaimRecord;
}

export function ClaimListCard({ claim }: ClaimListCardProps) {
  const router = useRouter();

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/claims/${claim.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/claims/${claim.id}`);
        }
      }}
      className="w-full bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-5 sm:p-6 hover:shadow-[0_4px_24px_rgba(16,26,52,0.08)] transition-shadow duration-200 cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="font-body text-slate text-sm flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <span className="font-mono text-xs bg-slate-100 text-midnight px-2 py-0.5 rounded">
            {claim.claimReference}
          </span>
          <span>
            · {claim.claimType} · {formatDate(claim.createdAt)}
          </span>
        </p>
        <StatusBadge status={claim.status} kind="claim" className="shrink-0" />
      </div>
    </div>
  );
}

export function ClaimListCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-5 sm:p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="h-4 bg-slate-100 rounded w-72 max-w-full" />
        <div className="h-6 bg-slate-100 rounded-full w-20" />
      </div>
    </div>
  );
}
