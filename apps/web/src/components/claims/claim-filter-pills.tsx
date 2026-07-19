"use client";

const FILTERS = [
  { label: "All", value: null },
  { label: "Submitted", value: "submitted" },
  { label: "In Review", value: "in_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
] as const;

interface ClaimFilterPillsProps {
  active: string | null;
  onChange: (value: string | null) => void;
}

export function ClaimFilterPills({ active, onChange }: ClaimFilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {FILTERS.map((filter) => {
        const isActive = active === filter.value;
        return (
          <button
            key={filter.label}
            type="button"
            onClick={() => onChange(filter.value)}
            className={`font-body text-sm font-medium px-5 py-2 rounded-full transition-colors duration-200 ${
              isActive
                ? "bg-midnight text-paper"
                : "bg-white text-midnight border border-slate/25 hover:border-slate/40"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

export function matchesClaimStatusFilter(
  status: string,
  filter: string | null,
): boolean {
  if (!filter) return true;
  return status === filter;
}

const FILTER_EMPTY_LABELS: Record<string, string> = {
  submitted: "No submitted claims",
  in_review: "No in review claims",
  approved: "No approved claims",
  rejected: "No rejected claims",
};

export function claimFilterEmptyLabel(filter: string | null): string {
  if (!filter) return "No claims filed yet";
  return FILTER_EMPTY_LABELS[filter] ?? "No claims match this filter";
}
