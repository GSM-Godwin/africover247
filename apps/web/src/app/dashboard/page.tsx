import { Suspense } from "react";
import { DashboardContent } from "./dashboard-content";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="pt-16 min-h-screen bg-[#F5F6F8] animate-pulse" />}>
      <DashboardContent />
    </Suspense>
  );
}
