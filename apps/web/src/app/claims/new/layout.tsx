import { Suspense } from "react";
import { ClaimWizardProvider } from "@/contexts/claim-wizard-context";

export default function ClaimWizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="pt-16 min-h-screen bg-[#F5F6F8] flex items-center justify-center">
          <div className="animate-pulse h-8 w-48 bg-slate-100 rounded" />
        </div>
      }
    >
      <ClaimWizardProvider>{children}</ClaimWizardProvider>
    </Suspense>
  );
}
