"use client";

const FILTERS = [
  { label: "All", value: null },
  { label: "Unread", value: "unread" },
] as const;

interface NotificationFilterPillsProps {
  active: string | null;
  onChange: (value: string | null) => void;
}

export function NotificationFilterPills({
  active,
  onChange,
}: NotificationFilterPillsProps) {
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

export function notificationEmptyLabel(filter: string | null): string {
  if (filter === "unread") return "No unread notifications";
  return "No notifications yet";
}
