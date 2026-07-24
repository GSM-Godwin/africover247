"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import {
  FilterPills,
  matchesCategoryFilter,
} from "@/components/products/filter-pills";
import {
  ProductCard,
  ProductCardSkeleton,
} from "@/components/products/product-card";
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-container";
import api from "@/lib/api";
import type { Product } from "@/types/product";

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get<Product[]>("/products");
      setAllProducts(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(
    () =>
      allProducts.filter((product) =>
        matchesCategoryFilter(product.category, activeFilter),
      ),
    [allProducts, activeFilter],
  );

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F5F6F8]">
        <div className="max-w-[1140px] mx-auto px-6 sm:px-8 py-10 sm:py-12">
          <div className="mb-8">
            <h1 className="font-display font-bold text-midnight text-3xl sm:text-4xl mb-2">
              Insurance Products
            </h1>
            <p className="font-body text-slate text-base">
              Choose the coverage that is right for you.
            </p>
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
                className="bg-daybreak text-midnight font-body font-bold text-sm px-6 py-3 rounded-lg hover:bg-[#C4700E] transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredProducts.length === 0 && (
            <p className="font-body text-slate text-base text-center py-16">
              No products available in this category right now.
            </p>
          )}

          {!loading && !error && filteredProducts.length > 0 && (
            <StaggerContainer
              key={activeFilter ?? "all"}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {filteredProducts.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </main>
    </>
  );
}
