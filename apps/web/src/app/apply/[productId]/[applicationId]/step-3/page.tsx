"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DocumentUploadSlot,
  validateKycFile,
  type SlotState,
} from "@/components/application/document-upload-slot";
import { WizardActions } from "@/components/application/wizard-actions";
import { useApplicationWizard } from "@/contexts/application-wizard-context";
import api from "@/lib/api";
import { splitLines, toKebabCase } from "@/lib/utils";
import { applyStepPath } from "@/types/application";

interface DocumentSlotDefinition {
  label: string;
  documentType: string;
}

interface UploadedDocumentResponse {
  id: string;
  documentType: string;
  fileName: string;
}

function buildSlotDefinitions(requiredDocuments: string): DocumentSlotDefinition[] {
  return splitLines(requiredDocuments).map((label) => ({
    label,
    documentType: toKebabCase(label),
  }));
}

function buildInitialSlotStates(
  slots: DocumentSlotDefinition[],
  documents: { id: string; documentType: string; fileName: string }[],
): SlotState[] {
  return slots.map((slot) => {
    const existing = documents.find(
      (doc) => doc.documentType === slot.documentType,
    );
    if (existing) {
      return {
        status: "uploaded",
        docId: existing.id,
        fileName: existing.fileName,
      };
    }
    return { status: "empty" };
  });
}

export default function Step3Page() {
  const router = useRouter();
  const {
    productId,
    applicationId,
    application,
    loading,
    refreshApplication,
  } = useApplicationWizard();

  const [slotStates, setSlotStates] = useState<SlotState[]>([]);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [idType, setIdType] = useState<
    "bvn" | "nin" | "drivers_licence" | "passport"
  >("bvn");
  const [idValue, setIdValue] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [lastName, setLastName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    message?: string;
  } | null>(null);

  const slots = useMemo(
    () =>
      application?.product?.requiredDocuments
        ? buildSlotDefinitions(application.product.requiredDocuments)
        : [],
    [application?.product?.requiredDocuments],
  );

  useEffect(() => {
    if (!application || slots.length === 0) {
      setSlotStates([]);
      return;
    }
    setSlotStates(
      buildInitialSlotStates(slots, application.kycDocuments ?? []),
    );
  }, [application, slots]);

  useEffect(() => {
    async function checkKycStatus() {
      try {
        const res = await api.get(`/applications/${applicationId}`);
        if (res.data.kycVerified) {
          setVerificationResult({
            verified: true,
            message: "Previously verified",
          });
        }
      } catch {}
    }
    checkKycStatus();
  }, [applicationId]);

  const uploadedCount = slotStates.filter((slot) => slot.status === "uploaded").length;

  const updateSlot = useCallback((index: number, next: SlotState) => {
    setSlotStates((prev) => prev.map((slot, i) => (i === index ? next : slot)));
  }, []);

  async function handleFileSelect(index: number, file: File) {
    const validationError = validateKycFile(file);
    if (validationError) {
      updateSlot(index, { status: "empty", error: validationError });
      return;
    }

    const slot = slots[index];
    updateSlot(index, { status: "uploading", progress: 0, error: undefined });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", slot.documentType);

    try {
      const res = await api.post<UploadedDocumentResponse>(
        `/applications/${applicationId}/documents`,
        formData,
        {
          onUploadProgress: (event) => {
            if (!event.total) return;
            const progress = Math.round((event.loaded * 100) / event.total);
            updateSlot(index, { status: "uploading", progress });
          },
        },
      );

      updateSlot(index, {
        status: "uploaded",
        docId: res.data.id,
        fileName: res.data.fileName,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Upload failed. Please try again.";
      updateSlot(index, { status: "empty", error: message });
    }
  }

  async function handleRemove(index: number) {
    const slotState = slotStates[index];
    if (slotState.status !== "uploaded" || !slotState.docId) return;

    setRemovingIndex(index);
    try {
      await api.delete(
        `/applications/${applicationId}/documents/${slotState.docId}`,
      );
      updateSlot(index, { status: "empty", error: undefined });
      await refreshApplication();
    } catch {
      updateSlot(index, {
        ...slotState,
        error: "Could not remove document. Please try again.",
      });
    } finally {
      setRemovingIndex(null);
    }
  }

  async function handleVerifyIdentity() {
    if (!idValue.trim()) {
      toast.error("Please enter your ID number.");
      return;
    }
    setVerifying(true);
    setVerificationResult(null);
    try {
      const payload: Record<string, string> = {
        verificationType: idType,
        value: idValue.trim(),
      };
      if (idType === "drivers_licence" || idType === "passport") {
        payload.dateOfBirth = dateOfBirth;
      }
      if (idType === "passport") {
        payload.lastName = lastName;
      }
      const res = await api.post(
        `/applications/${applicationId}/verify-identity`,
        payload,
      );
      setVerificationResult({
        verified: res.data.verified,
        message: res.data.message,
      });
      if (res.data.verified) {
        toast.success("Identity verified successfully.");
      } else {
        toast.error(
          "Verification failed. Please check your details and try again.",
        );
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Verification failed. Please try again.";
      toast.error(message);
      setVerificationResult({ verified: false });
    } finally {
      setVerifying(false);
    }
  }

  async function handleContinue() {
    if (uploadedCount === 0) {
      toast.error("Please upload at least one document to proceed.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.put(`/applications/${applicationId}`, { stepCompleted: 3 });
      setSaving(false);
      router.push(applyStepPath(productId, applicationId, 4));
    } catch {
      toast.error("Something went wrong, please try again.");
      setSaving(false);
    }
  }

  if (!loading && slots.length === 0) {
    return (
      <p className="font-body text-slate text-center py-8">
        No documents required for this product.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate/10 p-6 mb-6">
        <h2 className="font-body font-semibold text-midnight text-base mb-1">
          Identity Verification
        </h2>
        <p className="font-body text-slate text-sm mb-5">
          Verify your identity using your BVN, NIN, Driver&apos;s Licence, or
          Passport.
        </p>

        {verificationResult?.verified ? (
          <div className="flex items-center gap-3 bg-cover-green/10 border border-cover-green/20 rounded-xl px-4 py-3">
            <CheckCircle size={18} className="text-cover-green shrink-0" />
            <div>
              <p className="font-body text-sm text-cover-green font-semibold">
                Identity verified
              </p>
              {verificationResult.message === "Previously verified" && (
                <p className="font-body text-xs text-cover-green/70 mt-0.5">
                  Your identity was verified in a previous session
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                ID Type
              </label>
              <select
                value={idType}
                onChange={(e) => {
                  setIdType(
                    e.target.value as
                      | "bvn"
                      | "nin"
                      | "drivers_licence"
                      | "passport",
                  );
                  setIdValue("");
                  setVerificationResult(null);
                }}
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
              >
                <option value="bvn">BVN (Bank Verification Number)</option>
                <option value="nin">NIN (National Identification Number)</option>
                <option value="drivers_licence">Driver&apos;s Licence</option>
                <option value="passport">International Passport</option>
              </select>
            </div>

            <div>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                {idType === "bvn"
                  ? "BVN"
                  : idType === "nin"
                    ? "NIN"
                    : idType === "drivers_licence"
                      ? "Licence Number"
                      : "Passport Number"}
              </label>
              <input
                type="text"
                value={idValue}
                onChange={(e) => setIdValue(e.target.value)}
                placeholder={
                  idType === "bvn"
                    ? "Enter your 11-digit BVN"
                    : idType === "nin"
                      ? "Enter your 11-digit NIN"
                      : idType === "drivers_licence"
                        ? "Enter your licence number"
                        : "Enter your passport number"
                }
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
              />
            </div>

            {(idType === "drivers_licence" || idType === "passport") && (
              <div>
                <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
                />
              </div>
            )}

            {idType === "passport" && (
              <div>
                <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="As on passport"
                  className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
                />
              </div>
            )}

            {verificationResult && !verificationResult.verified && (
              <div className="flex items-center gap-3 bg-alert-coral/10 border border-alert-coral/20 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-alert-coral shrink-0" />
                <p className="font-body text-sm text-alert-coral">
                  Verification failed. Please check your details and try again.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleVerifyIdentity}
              disabled={verifying || !idValue.trim()}
              className="w-full flex items-center justify-center gap-2 bg-midnight text-white font-body font-bold text-sm py-3 rounded-xl hover:bg-midnight/90 disabled:opacity-60 transition-colors"
            >
              {verifying ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Identity"
              )}
            </button>

            <p className="font-body text-xs text-slate text-center">
              Your information is encrypted and only used for KYC verification.
              You can still proceed without verification but may be required to
              verify before your policy is issued.
            </p>
          </div>
        )}
      </div>

      {slots.map((slot, index) => (
        <DocumentUploadSlot
          key={slot.documentType}
          label={slot.label}
          state={slotStates[index] ?? { status: "empty" }}
          onSelectFile={(file) => handleFileSelect(index, file)}
          onRemove={() => handleRemove(index)}
          removing={removingIndex === index}
        />
      ))}

      <WizardActions
        step={3}
        productId={productId}
        applicationId={applicationId}
        loading={saving}
        submitDisabled={uploadedCount === 0}
        error={error}
        onSubmit={handleContinue}
      />
    </div>
  );
}
