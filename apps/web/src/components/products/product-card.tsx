"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import type { Product } from "@/types/product"
import { splitLines } from "@/lib/utils"
import { getCategoryIcon, getCategoryColors } from "@/lib/category-icons"

interface ProductCardProps {
  product: Product
}

export function getPriceDisplay(product: Product): string {
  if (product.pricingType === "fixed" && product.premiumAmount) {
    return `₦${parseFloat(product.premiumAmount).toLocaleString("en-NG")}/year`
  }
  if (product.pricingType === "calculable" && product.rate && product.calculationBasis) {
    return `${parseFloat(product.rate) * 100}% of ${product.calculationBasis}`
  }
  return "Request a Quote"
}

export function getCtaLabel(pricingType: string): string {
  if (pricingType === "quote_based") return "Get a Quote"
  return "Get Covered"
}

export function ProductCard({ product }: ProductCardProps) {
  const highlights = splitLines(product.coverageHighlights)
  const bullets = highlights.slice(0, 2)
  const priceLabel = getPriceDisplay(product)
  const ctaLabel = getCtaLabel(product.pricingType)
  const isQuoteBased = product.pricingType === "quote_based"
  const CategoryIcon = getCategoryIcon(product.category)
  const colors = getCategoryColors(product.category)

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(16,26,52,0.12)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-2xl"
    >
      <Link
        href={`/products/${product.id}`}
        className="block bg-white border border-slate/10 rounded-2xl p-6 h-full hover:border-midnight/20 transition-colors"
      >
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
          <CategoryIcon size={22} className={colors.icon} />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="font-body text-xs font-semibold text-slate uppercase tracking-wide">
            {product.category}
          </span>
          {isQuoteBased && (
            <span className="font-body text-xs font-semibold text-daybreak bg-daybreak/10 px-2 py-0.5 rounded-full">
              Quote Only
            </span>
          )}
        </div>

        <h3 className="font-display font-bold text-midnight text-lg mb-2 leading-snug">
          {product.name}
        </h3>

        {bullets.length > 0 && (
          <ul className="space-y-1 mb-4">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-cover-green mt-0.5 shrink-0">✓</span>
                <span className="font-body text-sm text-slate leading-snug">{b}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate/10">
          <span className="font-display font-bold text-midnight text-base">
            {priceLabel}
          </span>
          <span className={`inline-flex items-center gap-1.5 font-body font-bold text-sm px-4 py-2 rounded-xl transition-colors ${
            isQuoteBased
              ? "bg-midnight text-white"
              : "bg-daybreak text-midnight"
          }`}>
            {ctaLabel}
            <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-slate/10 rounded-2xl p-6 animate-pulse">
      <div className="w-12 h-12 bg-slate/10 rounded-xl mb-4" />
      <div className="h-3 bg-slate/10 rounded w-20 mb-3" />
      <div className="h-5 bg-slate/10 rounded w-3/4 mb-2" />
      <div className="h-4 bg-slate/10 rounded w-full mb-1" />
      <div className="h-4 bg-slate/10 rounded w-2/3 mb-4" />
      <div className="flex justify-between pt-4 border-t border-slate/10">
        <div className="h-5 bg-slate/10 rounded w-24" />
        <div className="h-8 bg-slate/10 rounded w-28" />
      </div>
    </div>
  )
}
