"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import api from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { StatusBadge } from "@/components/admin/status-badge";

interface Application {
  id: string;
  status: string;
  stepCompleted: number;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  product: { name: string; category: string };
}

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Pending Payment", value: "pending_payment" },
  { label: "Paid", value: "paid" },
  { label: "Issued", value: "issued" },
];

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/applications")
      .then((res) => setApplications(res.data))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = applications.filter((a) => {
    const matchesStatus = !activeFilter || a.status === activeFilter;
    const matchesSearch =
      !search ||
      `${a.user.firstName} ${a.user.lastName} ${a.user.email} ${a.product.name}`
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      <AdminPageHeader
        title="Applications"
        subtitle={`${applications.length} total applications`}
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
            placeholder="Search by name, email, or product..."
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
        keyExtractor={(a) => a.id}
        emptyMessage="No applications found."
        columns={[
          {
            key: "customer",
            label: "Customer",
            render: (a) => (
              <div>
                <p className="font-body text-sm font-semibold text-midnight">
                  {a.user.firstName} {a.user.lastName}
                </p>
                <p className="font-body text-xs text-slate">{a.user.email}</p>
              </div>
            ),
          },
          {
            key: "product",
            label: "Product",
            render: (a) => (
              <div>
                <p className="font-body text-sm text-midnight">
                  {a.product.name}
                </p>
                <p className="font-body text-xs text-slate">
                  {a.product.category}
                </p>
              </div>
            ),
          },
          {
            key: "step",
            label: "Progress",
            className: "hidden sm:table-cell",
            render: (a) => (
              <p className="font-body text-sm text-slate">
                Step {a.stepCompleted} of 4
              </p>
            ),
          },
          {
            key: "date",
            label: "Date",
            className: "hidden md:table-cell",
            render: (a) => (
              <p className="font-body text-sm text-slate">
                {new Date(a.createdAt).toLocaleDateString("en-NG")}
              </p>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (a) => <StatusBadge status={a.status} />,
          },
          {
            key: "action",
            label: "",
            render: (a) => (
              <Link
                href={`/admin/applications/${a.id}`}
                className="font-body text-sm text-midnight hover:text-daybreak font-medium transition-colors"
              >
                View →
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
