"use client";

import { useEffect, useState } from "react";
import { Search, ToggleLeft, ToggleRight } from "lucide-react";
import api from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  category: string;
  pricingType: string;
  premiumAmount: string | null;
  rate: string | null;
  status: string;
  createdAt: string;
}

const PRICING_LABELS: Record<string, string> = {
  fixed: "Fixed price",
  calculable: "Rate-based",
  quote_based: "Quote only",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/admin/products")
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  async function toggleStatus(product: Product) {
    const newStatus = product.status === "active" ? "inactive" : "active";
    setToggling(product.id);
    try {
      await api.patch(`/admin/products/${product.id}/status`, {
        status: newStatus,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, status: newStatus } : p,
        ),
      );
      toast.success(
        `${product.name} ${newStatus === "active" ? "activated" : "deactivated"}`,
      );
    } catch {
      toast.error("Could not update product status.");
    } finally {
      setToggling(null);
    }
  }

  const filtered = products.filter((p) => {
    const matchesFilter =
      !activeFilter ||
      (activeFilter === "active"
        ? p.status === "active"
        : p.status !== "active");
    const matchesSearch =
      !search ||
      `${p.name} ${p.category} ${p.pricingType}`
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      <AdminPageHeader
        title="Products"
        subtitle={`${products.filter((p) => p.status === "active").length} active products`}
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
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate/20 rounded-lg font-body text-sm text-midnight placeholder:text-slate/50 focus:outline-none focus:border-daybreak bg-white"
          />
        </div>
        <div className="flex gap-2">
          {[
            { label: "All", value: "" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ].map((f) => (
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
        emptyMessage="No products found."
        columns={[
          {
            key: "name",
            label: "Product",
            render: (p) => (
              <div>
                <p className="font-body text-sm font-semibold text-midnight">
                  {p.name}
                </p>
                <p className="font-body text-xs text-slate">{p.category}</p>
              </div>
            ),
          },
          {
            key: "pricing",
            label: "Pricing Type",
            className: "hidden sm:table-cell",
            render: (p) => (
              <span className="font-body text-xs font-medium px-2.5 py-1 rounded-full bg-midnight/10 text-midnight">
                {PRICING_LABELS[p.pricingType] || p.pricingType}
              </span>
            ),
          },
          {
            key: "rate",
            label: "Rate / Price",
            className: "hidden md:table-cell",
            render: (p) => (
              <p className="font-mono text-sm text-midnight">
                {p.premiumAmount
                  ? `₦${parseFloat(p.premiumAmount).toLocaleString("en-NG")}`
                  : p.rate
                    ? `${parseFloat(p.rate) * 100}%`
                    : "By quote"}
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
              <button
                type="button"
                onClick={() => toggleStatus(p)}
                disabled={toggling === p.id}
                className="flex items-center gap-1.5 font-body text-sm text-slate hover:text-midnight transition-colors disabled:opacity-50"
                title={p.status === "active" ? "Deactivate" : "Activate"}
              >
                {p.status === "active" ? (
                  <ToggleRight size={20} className="text-cover-green" />
                ) : (
                  <ToggleLeft size={20} className="text-slate" />
                )}
                <span className="hidden sm:inline">
                  {p.status === "active" ? "Active" : "Inactive"}
                </span>
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}
