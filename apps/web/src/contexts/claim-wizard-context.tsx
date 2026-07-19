"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { WizardStepper } from "@/components/shared/wizard-stepper";
import api from "@/lib/api";
import {
  CLAIM_WIZARD_STEPS,
  EMPTY_CLAIM_FORM,
  type ClaimFormData,
  type ClaimUploadedDocument,
} from "@/types/claim-wizard";
import type { PolicyRecord } from "@/types/policy";

interface ClaimWizardContextValue {
  formData: ClaimFormData;
  claimId: string | null;
  claimReference: string | null;
  documents: ClaimUploadedDocument[];
  activePolicies: PolicyRecord[];
  currentStep: number;
  loadingPolicies: boolean;
  updateFormData: (data: Partial<ClaimFormData>) => void;
  setClaimCreated: (id: string, reference: string) => void;
  addDocument: (doc: ClaimUploadedDocument) => void;
}

const ClaimWizardContext = createContext<ClaimWizardContextValue | null>(null);

export function useClaimWizard() {
  const context = useContext(ClaimWizardContext);
  if (!context) {
    throw new Error("useClaimWizard must be used within ClaimWizardProvider");
  }
  return context;
}

function parseCurrentStep(pathname: string): number {
  const match = pathname.match(/step-(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function ClaimWizardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStep = parseCurrentStep(pathname);
  const isSuccess = pathname.includes("/success");

  const [formData, setFormData] = useState<ClaimFormData>(EMPTY_CLAIM_FORM);
  const [claimId, setClaimId] = useState<string | null>(null);
  const [claimReference, setClaimReference] = useState<string | null>(null);
  const [documents, setDocuments] = useState<ClaimUploadedDocument[]>([]);
  const [activePolicies, setActivePolicies] = useState<PolicyRecord[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [preselectApplied, setPreselectApplied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadPolicies() {
      setLoadingPolicies(true);
      try {
        const res = await api.get<PolicyRecord[]>("/policies/my");
        if (cancelled) return;
        setActivePolicies(res.data.filter((p) => p.status === "active"));
      } catch {
        if (!cancelled) setActivePolicies([]);
      } finally {
        if (!cancelled) setLoadingPolicies(false);
      }
    }
    loadPolicies();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (preselectApplied || loadingPolicies) return;
    const policyIdParam = searchParams.get("policyId");
    if (!policyIdParam) {
      setPreselectApplied(true);
      return;
    }
    const match = activePolicies.some((p) => p.id === policyIdParam);
    if (match) {
      setFormData((prev) => ({ ...prev, policyId: policyIdParam }));
    }
    setPreselectApplied(true);
  }, [searchParams, activePolicies, loadingPolicies, preselectApplied]);

  const updateFormData = useCallback((data: Partial<ClaimFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const setClaimCreated = useCallback((id: string, reference: string) => {
    setClaimId(id);
    setClaimReference(reference);
  }, []);

  const addDocument = useCallback((doc: ClaimUploadedDocument) => {
    setDocuments((prev) => [...prev, doc]);
  }, []);

  const value = useMemo(
    () => ({
      formData,
      claimId,
      claimReference,
      documents,
      activePolicies,
      currentStep,
      loadingPolicies,
      updateFormData,
      setClaimCreated,
      addDocument,
    }),
    [
      formData,
      claimId,
      claimReference,
      documents,
      activePolicies,
      currentStep,
      loadingPolicies,
      updateFormData,
      setClaimCreated,
      addDocument,
    ],
  );

  return (
    <ClaimWizardContext.Provider value={value}>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F5F6F8]">
        <div className="max-w-[800px] mx-auto px-6 sm:px-8 py-10 sm:py-12">
          {!isSuccess && (
            <>
              <h1 className="font-display font-bold text-midnight text-3xl sm:text-4xl mb-8">
                File a Claim
              </h1>
              {currentStep > 0 && (
                <WizardStepper
                  steps={[...CLAIM_WIZARD_STEPS]}
                  currentStep={currentStep}
                />
              )}
            </>
          )}

          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-10">
            {children}
          </div>
        </div>
      </main>
    </ClaimWizardContext.Provider>
  );
}
