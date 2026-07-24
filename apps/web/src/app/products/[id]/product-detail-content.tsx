"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import api from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import {
  getCtaLabel,
  getPriceDisplay,
} from "@/components/products/product-card";
import {
  applicationStep,
  productDisplayTitle,
  splitLines,
} from "@/lib/utils";
import { applyStepPath } from "@/types/application";
import type { Product } from "@/types/product";

interface ApplicationDraft {
  id: string;
  stepCompleted: number;
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 rounded w-64" />
        <div className="h-10 bg-slate-200 rounded w-96 max-w-full" />
        <div className="h-7 bg-slate-200 rounded-full w-32" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8 h-64"
          />
        ))}
      </div>
    </div>
  );
}

export function ProductDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState("");
  const autoCoverRan = useRef(false);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await api.get<Product>(`/products/${productId}`);
      setProduct(res.data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleGetCovered = useCallback(async () => {
    if (!product) return;

    if (!isAuthenticated()) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/products/${product.id}`)}&action=get-covered`,
      );
      return;
    }

    setCoverLoading(true);
    setCoverError("");

    try {
      const draftRes = await api.get<ApplicationDraft | null>(
        `/applications/my/draft/${product.id}`,
      );

      if (draftRes.data?.id) {
        const step = applicationStep(draftRes.data.stepCompleted);
        router.push(
          applyStepPath(product.id, draftRes.data.id, step),
        );
        return;
      }

      const created = await api.post<{ id: string }>("/applications", {
        productId: product.id,
      });
      router.push(applyStepPath(product.id, created.data.id, 1));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;

      if (status === 404) {
        try {
          const created = await api.post<{ id: string }>("/applications", {
            productId: product.id,
          });
          router.push(applyStepPath(product.id, created.data.id, 1));
          return;
        } catch {
          setCoverError("Something went wrong, please try again.");
        }
      } else {
        setCoverError("Something went wrong, please try again.");
      }
    } finally {
      setCoverLoading(false);
    }
  }, [product, router]);

  useEffect(() => {
    if (!product || autoCoverRan.current) return;
    if (searchParams.get("action") !== "get-covered") return;
    if (!isAuthenticated()) return;

    autoCoverRan.current = true;
    router.replace(`/products/${productId}`, { scroll: false });
    handleGetCovered();
  }, [product, productId, searchParams, router, handleGetCovered]);

  const covered = product ? splitLines(product.coverageHighlights) : [];
  const excluded = product ? splitLines(product.exclusions ?? "") : [];

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F5F6F8]">
        <div className="max-w-[1140px] mx-auto px-6 sm:px-8 py-10 sm:py-12">
          {loading && <DetailSkeleton />}

          {!loading && notFound && (
            <div className="text-center py-16">
              <p className="font-body text-slate text-lg mb-4">
                This product isn&apos;t available.
              </p>
              <Link
                href="/products"
                className="font-body text-midnight font-semibold underline underline-offset-2 hover:text-daybreak transition-colors"
              >
                Back to products
              </Link>
            </div>
          )}

          {!loading && product && (
            <>
              <nav className="font-body text-slate text-sm mb-4">
                <Link href="/" className="hover:text-midnight transition-colors">
                  Home
                </Link>
                <span className="mx-2">&gt;</span>
                <Link
                  href="/products"
                  className="hover:text-midnight transition-colors"
                >
                  Products
                </Link>
                <span className="mx-2">&gt;</span>
                <span className="text-midnight">{product.name}</span>
              </nav>

              <h1 className="font-display font-bold text-midnight text-3xl sm:text-4xl mb-4">
                {productDisplayTitle(product.name)}
              </h1>

              <span className="inline-block font-body text-sm font-medium text-paper bg-midnight px-4 py-1.5 rounded-full mb-10">
                {product.category}
              </span>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8">
                  <h2 className="font-display font-bold text-cover-green text-lg mb-5">
                    What&apos;s covered
                  </h2>
                  <ul className="space-y-3">
                    {covered.map((item) => (
                      <li
                        key={item}
                        className="font-body text-slate text-sm flex items-start gap-2.5"
                      >
                        <span className="text-slate/50 mt-1.5 text-[6px] leading-none">
                          ●
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8">
                  <h2 className="font-display font-bold text-alert-coral text-lg mb-5">
                    What&apos;s not covered
                  </h2>
                  <ul className="space-y-3">
                    {excluded.map((item) => (
                      <li
                        key={item}
                        className="font-body text-slate text-sm flex items-start gap-2.5"
                      >
                        <span className="text-slate/50 mt-1.5 text-[6px] leading-none">
                          ●
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8 flex flex-col">
                  <p className="font-mono font-bold text-midnight text-4xl mb-2">
                    {getPriceDisplay(product)}
                  </p>
                  <p className="font-body text-slate text-sm mb-8">
                    {product.pricingType === "fixed"
                      ? `per year · ${product.durationMonths}-month policy`
                      : `${product.durationMonths}-month policy`}
                  </p>

                  <button
                    type="button"
                    onClick={handleGetCovered}
                    disabled={coverLoading}
                    className={`w-full font-body font-bold text-base py-4 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 mb-4 ${
                      product.pricingType === "quote_based"
                        ? "border border-midnight text-midnight hover:bg-midnight/5"
                        : "bg-daybreak text-midnight hover:bg-[#D4921A]"
                    }`}
                  >
                    {coverLoading && (
                      <Loader2 size={18} className="animate-spin" />
                    )}
                    {coverLoading
                      ? "Please wait..."
                      : getCtaLabel(product.pricingType)}
                  </button>

                  {coverError && (
                    <p className="font-body text-xs text-alert-coral text-center mb-4">
                      {coverError}
                    </p>
                  )}

                  <p className="font-body text-slate/70 text-xs text-center bg-slate-100 rounded-full px-4 py-2 mt-auto">
                    Secured by Monnify
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
