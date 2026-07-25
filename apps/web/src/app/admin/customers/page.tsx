"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import api from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/users")
      .then((res) =>
        setCustomers(
          res.data.filter(
            (u: Customer & { role?: string }) => u.role === "customer",
          ),
        ),
      )
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(
    (c) =>
      !search ||
      `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      <AdminPageHeader
        title="Customers"
        subtitle={`${customers.length} registered customers`}
      />

      <div className="relative mb-6 max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full pl-9 pr-4 py-2.5 border border-slate/20 rounded-lg font-body text-sm text-midnight placeholder:text-slate/50 focus:outline-none focus:border-daybreak bg-white"
        />
      </div>

      <AdminTable
        loading={loading}
        rows={filtered}
        keyExtractor={(c) => c.id}
        emptyMessage="No customers found."
        columns={[
          {
            key: "name",
            label: "Customer",
            render: (c) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-midnight/10 flex items-center justify-center shrink-0">
                  <span className="font-body text-xs font-semibold text-midnight">
                    {c.firstName[0]}
                    {c.lastName[0]}
                  </span>
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-midnight">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="font-body text-xs text-slate">{c.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: "phone",
            label: "Phone",
            className: "hidden sm:table-cell",
            render: (c) => (
              <p className="font-mono text-sm text-slate">{c.phone || "—"}</p>
            ),
          },
          {
            key: "verified",
            label: "Verified",
            className: "hidden md:table-cell",
            render: (c) => (
              <span
                className={`font-body text-xs font-medium px-2.5 py-1 rounded-full ${
                  c.emailVerified
                    ? "bg-cover-green/10 text-cover-green"
                    : "bg-slate/10 text-slate"
                }`}
              >
                {c.emailVerified ? "Verified" : "Unverified"}
              </span>
            ),
          },
          {
            key: "joined",
            label: "Joined",
            className: "hidden lg:table-cell",
            render: (c) => (
              <p className="font-body text-sm text-slate">
                {new Date(c.createdAt).toLocaleDateString("en-NG")}
              </p>
            ),
          },
        ]}
      />
    </div>
  );
}
