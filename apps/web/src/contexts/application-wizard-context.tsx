"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { ApplicationStepper } from "@/components/application/application-stepper";
import api from "@/lib/api";
import type { ApplicationRecord } from "@/types/application";

interface ApplicationWizardContextValue {
  productId: string;
  applicationId: string;
  application: ApplicationRecord | null;
  formData: Record<string, unknown>;
  currentStep: number;
  loading: boolean;
  updateFormData: (data: Record<string, unknown>) => void;
  refreshApplication: () => Promise<void>;
}

const ApplicationWizardContext =
  createContext<ApplicationWizardContextValue | null>(null);

export function useApplicationWizard() {
  const context = useContext(ApplicationWizardContext);
  if (!context) {
    throw new Error("useApplicationWizard must be used within ApplicationWizardProvider");
  }
  return context;
}

function parseCurrentStep(pathname: string): number {
  const match = pathname.match(/step-(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

export function ApplicationWizardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ productId: string; applicationId: string }>();
  const pathname = usePathname();
  const productId = params.productId;
  const applicationId = params.applicationId;
  const currentStep = parseCurrentStep(pathname);

  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  const refreshApplication = useCallback(async () => {
    const res = await api.get<ApplicationRecord>(`/applications/${applicationId}`);
    if (res.data.productId !== productId) {
      throw new Error("Application does not match product");
    }
    setApplication(res.data);
    setFormData((res.data.formData as Record<string, unknown>) || {});
  }, [applicationId, productId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get<ApplicationRecord>(
          `/applications/${applicationId}`,
        );
        if (cancelled) return;
        if (res.data.productId !== productId) return;
        setApplication(res.data);
        setFormData((res.data.formData as Record<string, unknown>) || {});
      } catch {
        if (!cancelled) setApplication(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [applicationId, productId]);

  const updateFormData = useCallback((data: Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const value = useMemo(
    () => ({
      productId,
      applicationId,
      application,
      formData,
      currentStep,
      loading,
      updateFormData,
      refreshApplication,
    }),
    [
      productId,
      applicationId,
      application,
      formData,
      currentStep,
      loading,
      updateFormData,
      refreshApplication,
    ],
  );

  const productName = application?.product?.name ?? "Insurance";

  return (
    <ApplicationWizardContext.Provider value={value}>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F5F6F8]">
        <div className="max-w-[800px] mx-auto px-6 sm:px-8 py-10 sm:py-12">
          <h1 className="font-display font-bold text-midnight text-3xl sm:text-4xl mb-8">
            Apply for {productName}
          </h1>

          <ApplicationStepper currentStep={currentStep} />

          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-10">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-10 bg-slate-100 rounded" />
                <div className="h-10 bg-slate-100 rounded" />
                <div className="h-10 bg-slate-100 rounded w-2/3" />
              </div>
            ) : application ? (
              children
            ) : (
              <p className="font-body text-slate text-center py-8">
                Application not found.
              </p>
            )}
          </div>
        </div>
      </main>
    </ApplicationWizardContext.Provider>
  );
}
