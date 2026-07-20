"use client";

import { useEffect, useState } from "react";

interface DeleteApplicationConfirmModalProps {
  open: boolean;
  productName: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteApplicationConfirmModal({
  open,
  productName,
  loading = false,
  error = null,
  onClose,
  onConfirm,
}: DeleteApplicationConfirmModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onClose();
    }

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-application-modal-title"
    >
      <button
        type="button"
        aria-label="Close delete application dialog"
        onClick={onClose}
        disabled={loading}
        className="absolute inset-0 bg-midnight/60 disabled:cursor-not-allowed"
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-[0_8px_40px_rgba(16,26,52,0.18)] p-6 sm:p-8">
        <h2
          id="delete-application-modal-title"
          className="font-display font-bold text-midnight text-xl sm:text-2xl mb-4"
        >
          Delete this application?
        </h2>
        <p className="font-body text-slate text-sm sm:text-base leading-relaxed mb-4">
          This will permanently delete your progress on {productName}. This
          cannot be undone.
        </p>
        {error && (
          <p className="font-body text-sm text-alert-coral mb-4">{error}</p>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="font-body font-medium text-midnight text-sm border border-slate/25 rounded-lg px-5 py-2.5 hover:bg-slate-100 disabled:opacity-60 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="font-body font-bold text-white text-sm bg-alert-coral rounded-lg px-5 py-2.5 hover:bg-[#C0392B] disabled:opacity-60 transition-colors duration-200"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
