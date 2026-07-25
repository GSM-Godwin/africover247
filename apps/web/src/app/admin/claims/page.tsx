"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { StatusBadge } from "@/components/admin/status-badge";

interface Claim {
  id: string;
  claimReference: string;
  claimType: string;
  status: string;
  estimatedAmount: string | null;
  incidentDate: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  policy: { policyNumber: string; product?: { name: string } };
}

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Submitted", value: "submitted" },
  { label: "In Review", value: "in_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/claims")
      .then((res) => setClaims(res.data))
      .catch(() => setClaims([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = claims.filter((c) => {
    const matchesStatus = !activeFilter || c.status === activeFilter;
    const matchesSearch =
      !search ||
      `${c.user.firstName} ${c.user.lastName} ${c.claimReference} ${c.policy.product?.name ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = claims.filter(
    (c) => c.status === "submitted" || c.status === "in_review",
  ).length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      <AdminPageHeader
        title="Claims"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} claim${pendingCount > 1 ? "s" : ""} requiring review`
            : `${claims.length} total claims`
        }
      />

      {pendingCount > 0 && (
        <div className="flex items-center gap-3 bg-daybreak/10 border border-daybreak/30 rounded-xl px-4 py-3 mb-6">
          <AlertCircle size={18} className="text-daybreak shrink-0" />
          <p className="font-body text-sm text-midnight">
            <span className="font-semibold">
              {pendingCount} claim{pendingCount > 1 ? "s" : ""}
            </span>{" "}
            pending review. Customers are waiting for updates.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, claim reference, or product..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate/20 rounded-lg font-body text-sm text-midnight placeholder:text-slate/50 focus:outline-none focus:border-daybreak bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setActiveFilter(f.value)}
              className={`font-body text-sm px-3 py-2 rounded-lg border transition-colors ${
                activeFilter === f.value
                  ? "bg-midnight text-white border-midnight"
                  : "border-slate/20 text-slate hover:border-midnight hover:text-midnight bg-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <AdminTable
        loading={loading}
        rows={filtered}
        keyExtractor={(c) => c.id}
        emptyMessage="No claims found."
        columns={[
          {
            key: "reference",
            label: "Reference",
            render: (c) => (
              <p className="font-mono text-sm text-midnight font-medium">
                {c.claimReference}
              </p>
            ),
          },
          {
            key: "customer",
            label: "Customer",
            render: (c) => (
              <div>
                <p className="font-body text-sm font-semibold text-midnight">
                  {c.user.firstName} {c.user.lastName}
                </p>
                <p className="font-body text-xs text-slate">{c.user.email}</p>
              </div>
            ),
          },
          {
            key: "product",
            label: "Product",
            className: "hidden sm:table-cell",
            render: (c) => (
              <div>
                <p className="font-body text-sm text-midnight">
                  {c.policy.product?.name ?? c.policy.policyNumber}
                </p>
                <p className="font-body text-xs text-slate">{c.claimType}</p>
              </div>
            ),
          },
          {
            key: "amount",
            label: "Est. Amount",
            className: "hidden md:table-cell",
            render: (c) => (
              <p className="font-mono text-sm text-midnight">
                {c.estimatedAmount
                  ? `₦${parseFloat(c.estimatedAmount).toLocaleString("en-NG")}`
                  : "—"}
              </p>
            ),
          },
          {
            key: "date",
            label: "Filed",
            className: "hidden lg:table-cell",
            render: (c) => (
              <p className="font-body text-sm text-slate">
                {new Date(c.createdAt).toLocaleDateString("en-NG")}
              </p>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (c) => <StatusBadge status={c.status} />,
          },
          {
            key: "action",
            label: "",
            render: (c) => (
              <Link
                href={`/admin/claims/${c.id}`}
                className={`font-body text-sm font-medium transition-colors ${
                  c.status === "submitted" || c.status === "in_review"
                    ? "text-daybreak hover:text-daybreak/80"
                    : "text-midnight hover:text-daybreak"
                }`}
              >
                {c.status === "submitted" || c.status === "in_review"
                  ? "Review →"
                  : "View →"}
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
