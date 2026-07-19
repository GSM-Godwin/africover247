import { Suspense } from "react";
import { PaymentCallbackContent } from "./payment-callback-content";

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-16 min-h-screen bg-[#F5F6F8] flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-lg px-6">
            <div className="h-16 w-16 mx-auto rounded-full bg-slate-100" />
            <div className="h-8 bg-slate-100 rounded w-2/3 mx-auto" />
            <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto" />
          </div>
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
