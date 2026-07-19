"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClaimDocumentUploadSlot,
  ClaimUploadedRow,
  validateKycFile,
} from "@/components/claims/claim-document-upload";
import { ClaimWizardActions } from "@/components/claims/claim-wizard-actions";
import { useClaimWizard } from "@/contexts/claim-wizard-context";
import api from "@/lib/api";
import { claimStepPath } from "@/types/claim-wizard";

const MAX_FILES = 5;
const DOCUMENT_TYPE = "incident-photo";

interface UploadedDocumentResponse {
  id: string;
  fileName: string;
}

export default function ClaimStep2Page() {
  const router = useRouter();
  const { claimId, documents, addDocument } = useClaimWizard();

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!claimId) {
      router.replace(claimStepPath(1));
    }
  }, [claimId, router]);

  async function handleFileSelect(file: File) {
    if (!claimId || documents.length >= MAX_FILES) return;

    const validationError = validateKycFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError("");
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", DOCUMENT_TYPE);

    try {
      const res = await api.post<UploadedDocumentResponse>(
        `/claims/${claimId}/documents`,
        formData,
        {
          onUploadProgress: (event) => {
            if (!event.total) return;
            setProgress(Math.round((event.loaded * 100) / event.total));
          },
        },
      );
      addDocument({ id: res.data.id, fileName: res.data.fileName });
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  function onSaveContinue() {
    if (documents.length < 1) {
      setError("Please upload at least one incident photo.");
      return;
    }
    setError("");
    router.push(claimStepPath(3));
  }

  if (!claimId) return null;

  return (
    <div>
      <p className="font-body text-sm font-medium text-slate mb-4">
        Incident photos (up to 5)
      </p>

      <div className="space-y-4">
        {documents.map((doc) => (
          <ClaimUploadedRow key={doc.id} fileName={doc.fileName} />
        ))}

        {documents.length < MAX_FILES && (
          <ClaimDocumentUploadSlot
            uploading={uploading}
            progress={progress}
            error={uploadError}
            onSelectFile={handleFileSelect}
          />
        )}
      </div>

      <ClaimWizardActions
        step={2}
        submitDisabled={documents.length < 1 || uploading}
        error={error}
        onSubmit={onSaveContinue}
      />
    </div>
  );
}
