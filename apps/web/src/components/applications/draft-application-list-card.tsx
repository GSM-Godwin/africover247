"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { applicationStep, formatRelativeTime } from "@/lib/utils";
import {
  applyStepPath,
  type ApplicationRecord,
} from "@/types/application";

interface DraftApplicationListCardProps {
  application: ApplicationRecord;
  onDelete: (application: ApplicationRecord) => void;
}

function applicationStatusLabel(status: ApplicationRecord["status"]): string {
  if (status === "pending_payment") return "Awaiting Payment";
  return "Draft";
}

function applicationStatusClass(status: ApplicationRecord["status"]): string {
  if (status === "pending_payment") {
    return "bg-daybreak/15 text-midnight";
  }
  return "bg-slate-100 text-midnight";
}

export function DraftApplicationListCard({
  application,
  onDelete,
}: DraftApplicationListCardProps) {
  return (
    <div className="w-full bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="font-body font-semibold text-midnight text-base sm:text-lg">
              {application.product.name}
            </p>
            <span
              className={`font-body text-xs font-medium px-2.5 py-1 rounded-full ${applicationStatusClass(application.status)}`}
            >
              {applicationStatusLabel(application.status)}
            </span>
          </div>
          <p className="font-body text-slate text-sm mb-1">
            Step {application.stepCompleted} of 4 completed
          </p>
          <p className="font-body text-slate text-sm">
            Last updated {formatRelativeTime(application.updatedAt)}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={applyStepPath(
              application.productId,
              application.id,
              applicationStep(application.stepCompleted),
            )}
            className="bg-daybreak text-midnight font-body font-bold text-sm px-5 py-3 rounded-lg hover:bg-[#C4700E] transition-colors duration-200 text-center"
          >
            Continue
          </Link>
          <button
            type="button"
            aria-label={`Delete ${application.product.name} application`}
            onClick={() => onDelete(application)}
            className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate/25 text-slate hover:text-alert-coral hover:border-alert-coral/40 transition-colors duration-200"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function DraftApplicationListCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-5 sm:p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-slate-100 rounded w-48 max-w-full" />
          <div className="h-4 bg-slate-100 rounded w-40 max-w-full" />
          <div className="h-4 bg-slate-100 rounded w-36 max-w-full" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-11 bg-slate-100 rounded-lg w-28" />
          <div className="h-11 bg-slate-100 rounded-lg w-11" />
        </div>
      </div>
    </div>
  );
}
