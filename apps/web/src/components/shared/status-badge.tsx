type StatusBadgeKind = "policy" | "claim";

const POLICY_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-cover-green/15 text-cover-green",
  },
  expired: {
    label: "Expired",
    className: "bg-slate/15 text-slate",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-alert-coral/15 text-alert-coral",
  },
};

const CLAIM_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  submitted: {
    label: "Submitted",
    className: "bg-info/15 text-info",
  },
  in_review: {
    label: "In Review",
    className: "bg-daybreak/20 text-[#B8741A]",
  },
  approved: {
    label: "Approved",
    className: "bg-cover-green/15 text-cover-green",
  },
  rejected: {
    label: "Rejected",
    className: "bg-alert-coral/15 text-alert-coral",
  },
};

function formatStatusLabel(status: string, kind: StatusBadgeKind): string {
  if (kind === "policy") {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const CLAIM_DOT_COLORS: Record<string, string> = {
  submitted: "bg-info",
  in_review: "bg-daybreak",
  approved: "bg-cover-green",
  rejected: "bg-alert-coral",
};

export function formatClaimStatusLabel(status: string): string {
  return formatStatusLabel(status, "claim");
}

export function getClaimStatusDotClass(status: string): string {
  return CLAIM_DOT_COLORS[status] ?? "bg-slate";
}

interface StatusBadgeProps {
  status: string;
  kind: StatusBadgeKind;
  className?: string;
}

export function StatusBadge({ status, kind, className = "" }: StatusBadgeProps) {
  const styles = kind === "policy" ? POLICY_STYLES : CLAIM_STYLES;
  const config = styles[status] ?? {
    label: formatStatusLabel(status, kind),
    className: "bg-slate/15 text-slate",
  };

  return (
    <span
      className={`inline-flex items-center font-body text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
