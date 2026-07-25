"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Download } from "lucide-react";
import api from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { StatusBadge } from "@/components/admin/status-badge";

interface Policy {
  id: string;
  policyNumber: string;
  status: string;
  premiumPaid: string;
  issueDate: string;
  expiryDate: string;
  policyPdfUrl: string | null;
  user: { firstName: string; lastName: string; email: string };
  product: { name: string; category: string };
}

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Expired", value: "expired" },
  { label: "Cancelled", value: "cancelled" },
];

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/policies")
      .then((res) => setPolicies(res.data))
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = policies.filter((p) => {
    const matchesStatus = !activeFilter || p.status === activeFilter;
    const matchesSearch =
      !search ||
      `${p.user.firstName} ${p.user.lastName} ${p.user.email} ${p.policyNumber} ${p.product.name}`
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalRevenue = policies
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + parseFloat(p.premiumPaid || "0"), 0);

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      <AdminPageHeader
        title="Policies"
        subtitle={`${policies.length} policies issued · ₦${totalRevenue.toLocaleString("en-NG")} total premiums`}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, policy number..."
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
        keyExtractor={(p) => p.id}
        emptyMessage="No policies found."
        columns={[
          {
            key: "number",
            label: "Policy Number",
            render: (p) => (
              <p className="font-mono text-sm text-midnight font-medium">
                {p.policyNumber}
              </p>
            ),
          },
          {
            key: "customer",
            label: "Customer",
            render: (p) => (
              <div>
                <p className="font-body text-sm font-semibold text-midnight">
                  {p.user.firstName} {p.user.lastName}
                </p>
                <p className="font-body text-xs text-slate">{p.user.email}</p>
              </div>
            ),
          },
          {
            key: "product",
            label: "Product",
            className: "hidden sm:table-cell",
            render: (p) => (
              <div>
                <p className="font-body text-sm text-midnight">
                  {p.product.name}
                </p>
                <p className="font-body text-xs text-slate">
                  {p.product.category}
                </p>
              </div>
            ),
          },
          {
            key: "premium",
            label: "Premium",
            className: "hidden md:table-cell",
            render: (p) => (
              <p className="font-mono text-sm text-midnight">
                ₦{parseFloat(p.premiumPaid).toLocaleString("en-NG")}
              </p>
            ),
          },
          {
            key: "expiry",
            label: "Expiry",
            className: "hidden lg:table-cell",
            render: (p) => (
              <p className="font-body text-sm text-slate">
                {new Date(p.expiryDate).toLocaleDateString("en-NG")}
              </p>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (p) => <StatusBadge status={p.status} />,
          },
          {
            key: "action",
            label: "",
            render: (p) => (
              <div className="flex items-center gap-3 justify-end">
                {p.policyPdfUrl && (
                  <a
                    href={p.policyPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate hover:text-daybreak transition-colors"
                    title="Download PDF"
                  >
                    <Download size={16} />
                  </a>
                )}
                <Link
                  href={`/admin/policies/${p.id}`}
                  className="font-body text-sm text-midnight hover:text-daybreak font-medium transition-colors"
                >
                  View →
                </Link>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
