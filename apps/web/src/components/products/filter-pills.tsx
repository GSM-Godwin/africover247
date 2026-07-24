"use client";

const FILTERS = [
  { label: "All", value: null },
  { label: "Motor", value: "motor" },
  { label: "Property", value: "property" },
  { label: "Engineering", value: "engineering" },
  { label: "Life", value: "life" },
  { label: "Financial", value: "financial" },
  { label: "Liability", value: "liability" },
  { label: "Marine", value: "marine" },
  { label: "Agriculture", value: "agriculture" },
  { label: "Travel", value: "travel" },
  { label: "Health", value: "health" },
] as const;

interface FilterPillsProps {
  active: string | null;
  onChange: (value: string | null) => void;
}

export function FilterPills({ active, onChange }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {FILTERS.map((filter) => {
        const isActive = active === filter.value;
        return (
          <button
            key={filter.label}
            type="button"
            onClick={() => onChange(filter.value)}
            className={`
              font-body text-sm font-medium px-5 py-2 rounded-full transition-colors duration-200
              ${
                isActive
                  ? "bg-midnight text-paper"
                  : "bg-white text-midnight border border-slate/25 hover:border-slate/40"
              }
            `}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

export function matchesCategoryFilter(
  category: string,
  filter: string | null,
): boolean {
  if (!filter) return true;
  return category.toLowerCase().includes(filter);
}
