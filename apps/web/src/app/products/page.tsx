"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FilterPills } from "@/components/products/filter-pills";
import {
  ProductCard,
  ProductCardSkeleton,
} from "@/components/products/product-card";
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-container";
import api from "@/lib/api";
import type { Product } from "@/types/product";

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(
    categoryParam ? categoryParam.toLowerCase() : null,
  );

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (activeFilter) params.category = activeFilter;
      const res = await api.get<Product[]>("/products", { params });
      setAllProducts(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, activeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, activeFilter, fetchProducts]);

  useEffect(() => {
    setActiveFilter(categoryParam ? categoryParam.toLowerCase() : null);
  }, [categoryParam]);

  return (
    <>
      <Navbar />
      <main className="pt-[50px] min-h-screen bg-[#F5F6F8]">
        <div className="max-w-[1140px] mx-auto px-6 sm:px-8 py-10 sm:py-12">
          <div className="mb-8">
            <h1 className="font-display font-bold text-midnight text-3xl sm:text-4xl mb-2">
              Insurance Products
            </h1>
            <p className="font-body text-slate text-base">
              Choose the coverage that is right for you.
            </p>
          </div>

          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search products e.g. "holiday cover", "car insurance"...'
              className="w-full pl-9 pr-4 py-3 border border-slate/20 rounded-xl font-body text-sm text-midnight placeholder:text-slate focus:outline-none focus:border-daybreak bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-midnight"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="mb-8">
            <FilterPills active={activeFilter} onChange={setActiveFilter} />
          </div>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-8 text-center max-w-md mx-auto">
              <p className="font-body text-slate text-base mb-4">
                Could not load products. Please try again.
              </p>
              <button
                type="button"
                onClick={fetchProducts}
                className="bg-daybreak text-midnight font-body font-bold text-sm px-6 py-3 rounded-lg hover:bg-[#D4921A] transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && allProducts.length === 0 && (
            <p className="font-body text-slate text-base text-center py-16">
              No products available in this category right now.
            </p>
          )}

          {!loading && !error && allProducts.length > 0 && (
            <StaggerContainer
              key={`${activeFilter ?? "all"}-${search}`}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {allProducts.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-daybreak border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
