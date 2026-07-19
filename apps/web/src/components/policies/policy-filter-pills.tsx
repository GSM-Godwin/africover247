"use client";

const FILTERS = [
  { label: "All", value: null },
  { label: "Active", value: "active" },
  { label: "Expired", value: "expired" },
  { label: "Cancelled", value: "cancelled" },
] as const;

interface PolicyFilterPillsProps {
  active: string | null;
  onChange: (value: string | null) => void;
}

export function PolicyFilterPills({ active, onChange }: PolicyFilterPillsProps) {
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

export function matchesPolicyStatusFilter(
  status: string,
  filter: string | null,
): boolean {
  if (!filter) return true;
  return status === filter;
}

export function policyFilterEmptyLabel(filter: string | null): string {
  if (!filter) return "No policies yet";
  return `No ${filter} policies`;
}
