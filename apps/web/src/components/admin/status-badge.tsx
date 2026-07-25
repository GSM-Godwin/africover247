const STATUS_MAP: Record<string, string> = {
  draft: "bg-slate/10 text-slate",
  pending_payment: "bg-daybreak/10 text-daybreak",
  paid: "bg-cover-green/10 text-cover-green",
  issued: "bg-cover-green/10 text-cover-green",
  submitted: "bg-daybreak/10 text-daybreak",
  in_review: "bg-info/10 text-info",
  approved: "bg-cover-green/10 text-cover-green",
  rejected: "bg-alert-coral/10 text-alert-coral",
  active: "bg-cover-green/10 text-cover-green",
  expired: "bg-slate/10 text-slate",
  cancelled: "bg-alert-coral/10 text-alert-coral",
  pending_review: "bg-slate/10 text-slate",
  quote_sent: "bg-daybreak/10 text-daybreak",
  countered_by_customer: "bg-info/10 text-info",
  countered_by_admin: "bg-daybreak/10 text-daybreak",
  accepted: "bg-cover-green/10 text-cover-green",
  pending: "bg-daybreak/10 text-daybreak",
  successful: "bg-cover-green/10 text-cover-green",
  failed: "bg-alert-coral/10 text-alert-coral",
  inactive: "bg-slate/10 text-slate",
};

export function StatusBadge({ status }: { status: string }) {
  const classes = STATUS_MAP[status] || "bg-slate/10 text-slate";
  return (
    <span
      className={`font-body text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${classes}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
