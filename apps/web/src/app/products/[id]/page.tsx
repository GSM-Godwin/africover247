import { Suspense } from "react";
import { ProductDetailContent } from "./product-detail-content";

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div className="pt-16 min-h-screen bg-[#F5F6F8] animate-pulse" />}>
      <ProductDetailContent />
    </Suspense>
  );
}
