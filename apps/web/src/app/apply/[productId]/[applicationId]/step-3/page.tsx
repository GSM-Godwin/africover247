"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
