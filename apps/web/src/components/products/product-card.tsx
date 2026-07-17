"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import type { Product } from "@/types/product";
import {
  formatNaira,
  premiumSuffix,
  splitLines,
} from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const highlights = splitLines(product.coverageHighlights);
  const highlightLine = highlights.slice(0, 2).join(" + ");
  const bullets = highlights.slice(0, 2);
  const priceLabel = `From ${formatNaira(product.premiumAmount)}${premiumSuffix(product.premiumFrequency)}`;

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-7 h-full flex flex-col">
      <div className="w-11 h-11 bg-[#FDF0E0] rounded-xl flex items-center justify-center mb-5">
        <Zap size={20} className="text-midnight" strokeWidth={1.5} />
      </div>

      <h3 className="font-display font-bold text-midnight text-lg mb-1.5">
        {product.name}
      </h3>

      {highlightLine && (
        <p className="font-body text-slate text-sm mb-4">{highlightLine}</p>
      )}

      <ul className="space-y-2 mb-6 flex-1">
        {bullets.map((item) => (
          <li
            key={item}
            className="font-body text-slate text-sm flex items-start gap-2.5"
          >
            <span className="text-slate/50 mt-1.5 text-[6px] leading-none">●</span>
            {item}
          </li>
        ))}
      </ul>

      <p className="font-body font-bold text-midnight text-base mb-5">
        {priceLabel}
      </p>

      <div className="flex items-center gap-4 mt-auto">
        <Link
          href={`/products/${product.id}`}
          className="font-body text-midnight text-sm font-medium underline underline-offset-2 hover:text-daybreak transition-colors duration-150"
        >
          Learn more
        </Link>
        <Link
          href={`/products/${product.id}`}
          className="flex-1 text-center bg-daybreak text-midnight font-body font-bold text-sm px-4 py-3 rounded-lg hover:bg-[#D4921A] transition-colors duration-200"
        >
          Get Covered
        </Link>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-7 h-full animate-pulse">
      <div className="w-11 h-11 bg-slate-100 rounded-xl mb-5" />
      <div className="h-5 bg-slate-100 rounded w-3/4 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-full mb-4" />
      <div className="space-y-2 mb-6">
        <div className="h-4 bg-slate-100 rounded w-5/6" />
        <div className="h-4 bg-slate-100 rounded w-2/3" />
      </div>
      <div className="h-5 bg-slate-100 rounded w-1/2 mb-5" />
      <div className="flex gap-4">
        <div className="h-4 bg-slate-100 rounded w-20" />
        <div className="h-10 bg-slate-100 rounded-lg flex-1" />
      </div>
    </div>
  );
}
