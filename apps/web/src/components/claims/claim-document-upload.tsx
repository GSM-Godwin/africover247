"use client";

import { useRef } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { validateKycFile } from "@/components/application/document-upload-slot";

interface ClaimDocumentUploadSlotProps {
  uploading: boolean;
  progress?: number;
  error?: string;
  onSelectFile: (file: File) => void;
}

export function ClaimDocumentUploadSlot({
  uploading,
  progress,
  error,
  onSelectFile,
}: ClaimDocumentUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    if (uploading) return;
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onSelectFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onSelectFile(file);
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openPicker();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed px-4 py-10 text-center cursor-pointer transition-colors ${
          uploading
            ? "border-daybreak/50 bg-daybreak/[0.03] cursor-wait"
            : "border-daybreak hover:bg-daybreak/[0.03]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="text-daybreak animate-spin" />
            <p className="font-body text-sm text-midnight">
              Uploading… {progress ?? 0}%
            </p>
            <div className="w-full max-w-xs h-1 bg-slate/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-daybreak transition-all duration-200"
                style={{ width: `${progress ?? 0}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={28} className="text-slate/60" />
            <p className="font-body text-sm text-slate">
              Click to upload or drag and drop
            </p>
            <p className="font-body text-xs text-slate/60">
              JPG, PNG, PDF · Max 5MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="font-body text-xs text-alert-coral">{error}</p>
      )}
    </div>
  );
}

export function ClaimUploadedRow({ fileName }: { fileName: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate/20 bg-slate-100/40 px-4 py-4">
      <div className="flex items-center gap-3 min-w-0">
        <FileText size={20} className="text-slate shrink-0" />
        <span className="font-mono text-sm text-midnight truncate">
          {fileName}
        </span>
      </div>
      <span className="font-body text-sm font-medium text-cover-green shrink-0">
        Uploaded
      </span>
    </div>
  );
}

export { validateKycFile };
