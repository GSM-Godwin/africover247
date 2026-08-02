"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { NumberInput } from "@/components/shared/number-input";
import type { Product } from "@/types/product";
import type { AssetField } from "@/types/asset-field";

function NewQuoteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("productId");

  const [product, setProduct] = useState<Product | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!productId) {
      router.push("/products");
      return;
    }
    api
      .get<Product>(`/products/${productId}`)
      .then((res) => setProduct(res.data))
      .catch(() => {
        toast.error("Product not found");
        router.push("/products");
      })
      .finally(() => setFetching(false));
  }, [productId, router]);

  const fields: AssetField[] = (() => {
    if (!product?.assetFields) return [];
    if (Array.isArray(product.assetFields))
      return product.assetFields as AssetField[];
    if (typeof product.assetFields === "string") {
      try {
        return JSON.parse(product.assetFields) as AssetField[];
      } catch {
        return [];
      }
    }
    return [];
  })();

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const missing = fields
      .filter((f) => f.required && !values[f.key])
      .map((f) => f.label);

    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      await api.post("/quotes", {
        productId,
        customerDetails: values,
      });
      setLoading(false);
      toast.success("Quote request submitted successfully");
      router.push("/dashboard?tab=quotes");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(message || "Could not submit quote request.");
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-daybreak border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="font-body text-sm text-daybreak font-semibold uppercase tracking-widest mb-2">
            Request a Quote
          </p>
          <h1 className="font-display font-bold text-midnight text-3xl mb-2">
            {product.name}
          </h1>
          <p className="font-body text-slate text-base">
            Fill in the details below and AfriGlobal will respond with a
            tailored premium within 3 business days.
          </p>
        </div>

        <div className="bg-white border border-slate/20 rounded-xl p-6 sm:p-8 space-y-6">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                {field.label}
                {field.required && (
                  <span className="text-alert-coral ml-1">*</span>
                )}
              </label>

              {field.type === "select" ? (
                <select
                  value={values[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full bg-transparent border-b border-slate/40 pb-2 font-body text-base text-midnight focus:border-daybreak focus:outline-none transition-colors"
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  value={values[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  rows={3}
                  placeholder={field.hint}
                  className="w-full bg-transparent border-b border-slate/40 pb-2 font-body text-base text-midnight focus:border-daybreak focus:outline-none transition-colors resize-none"
                />
              ) : field.type === "number" ? (
                <NumberInput
                  value={values[field.key] || ""}
                  onChange={(raw) => handleChange(field.key, raw)}
                  placeholder={field.hint || `Enter ${field.label.toLowerCase()}`}
                  prefix="₦"
                  className="w-full bg-transparent border-b border-slate/40 pb-2 font-body text-base text-midnight focus:border-daybreak focus:outline-none"
                />
              ) : (
                <input
                  type={field.type}
                  value={values[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.hint}
                  className="w-full bg-transparent border-b border-slate/40 pb-2 font-body text-base text-midnight focus:border-daybreak focus:outline-none transition-colors"
                />
              )}

              {field.hint && field.type !== "textarea" && (
                <p className="font-body text-xs text-slate/60 mt-1">
                  {field.hint}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 bg-midnight/5 border border-midnight/10 rounded-lg p-4">
          <p className="font-body text-sm text-slate">
            <span className="font-semibold text-midnight">What happens next?</span>{" "}
            AfriGlobal will review your details and respond with a quote within
            3 business days. You will be notified by email, SMS, and in-app
            notification when your quote is ready.
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-slate/30 text-midnight font-body font-medium text-sm py-3 rounded-lg hover:border-midnight transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-daybreak text-midnight font-body font-bold text-sm py-3 rounded-lg hover:bg-[#C4700E] disabled:opacity-60 transition-colors"
          >
            {loading ? "Submitting..." : "Submit Quote Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-daybreak border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NewQuoteForm />
    </Suspense>
  );
}
