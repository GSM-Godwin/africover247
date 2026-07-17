"use client";

import { useRef } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export type SlotStatus = "empty" | "uploading" | "uploaded";

export interface SlotState {
  status: SlotStatus;
  progress?: number;
  docId?: string;
  fileName?: string;
  error?: string;
}

export function validateKycFile(file: File): string | null {
  const isAllowedType =
    ALLOWED_MIME_TYPES.includes(file.type) ||
    /\.(jpe?g|png|pdf)$/i.test(file.name);
  if (!isAllowedType) {
    return "Only JPG, PNG, and PDF files are allowed.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File must not exceed 5MB.";
  }
  return null;
}

interface DocumentUploadSlotProps {
  label: string;
  state: SlotState;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
  removing?: boolean;
}

export function DocumentUploadSlot({
  label,
  state,
  onSelectFile,
  onRemove,
  removing,
}: DocumentUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    if (state.status === "uploaded" || state.status === "uploading") return;
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onSelectFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (state.status === "uploaded" || state.status === "uploading") return;
    const file = e.dataTransfer.files?.[0];
    if (file) onSelectFile(file);
  }

  return (
    <div className="space-y-2">
      <p className="font-body text-sm font-medium text-midnight">{label}</p>

      {state.status === "uploaded" && state.fileName && state.docId ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate/20 bg-slate-100/40 px-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <FileText size={20} className="text-slate shrink-0" />
            <span className="font-mono text-sm text-midnight truncate">
              {state.fileName}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-body text-sm font-medium text-cover-green">
              Uploaded
            </span>
            <button
              type="button"
              onClick={onRemove}
              disabled={removing}
              aria-label={`Remove ${label}`}
              className="text-slate hover:text-alert-coral transition-colors disabled:opacity-50"
            >
              {removing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <X size={16} />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openPicker();
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`
            rounded-xl border-2 border-dashed px-4 py-10 text-center cursor-pointer transition-colors
            ${
              state.status === "uploading"
                ? "border-daybreak/50 bg-daybreak/[0.03] cursor-wait"
                : "border-daybreak hover:bg-daybreak/[0.03]"
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={state.status === "uploading"}
          />

          {state.status === "uploading" ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="text-daybreak animate-spin" />
              <p className="font-body text-sm text-midnight">
                Uploading… {state.progress ?? 0}%
              </p>
              <div className="w-full max-w-xs h-1 bg-slate/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-daybreak transition-all duration-200"
                  style={{ width: `${state.progress ?? 0}%` }}
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
      )}

      {state.error && (
        <p className="font-body text-xs text-alert-coral">{state.error}</p>
      )}
    </div>
  );
}
