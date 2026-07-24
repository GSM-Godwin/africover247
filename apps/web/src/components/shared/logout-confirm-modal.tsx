"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

interface LogoutConfirmModalProps {
  open: boolean;
  onClose: () => void;
}

export function LogoutConfirmModal({ open, onClose }: LogoutConfirmModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleConfirmLogout() {
    logout();
    onClose();
    router.push("/");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <button
        type="button"
        aria-label="Close logout dialog"
        onClick={onClose}
        className="absolute inset-0 bg-midnight/60"
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-[0_8px_40px_rgba(16,26,52,0.18)] p-6 sm:p-8">
        <h2
          id="logout-modal-title"
          className="font-display font-bold text-midnight text-xl sm:text-2xl mb-4"
        >
          Log out?
        </h2>
        <p className="font-body text-slate text-sm sm:text-base leading-relaxed mb-8">
          Are you sure you want to log out? Any unsaved application progress is
          already saved on this device.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="font-body font-medium text-midnight text-sm border border-slate/25 rounded-lg px-5 py-2.5 hover:bg-slate-100 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmLogout}
            className="font-body font-bold text-midnight text-sm bg-daybreak rounded-lg px-5 py-2.5 hover:bg-[#C4700E] transition-colors duration-200"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
