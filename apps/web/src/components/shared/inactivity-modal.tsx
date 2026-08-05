"use client";

import { LogOut, Clock } from "lucide-react";

interface InactivityModalProps {
  open: boolean;
  onStay: () => void;
  onLogout: () => void;
  countdownSeconds: number;
}

export function InactivityModal({
  open,
  onStay,
  onLogout,
  countdownSeconds,
}: InactivityModalProps) {
  if (!open) return null;

  const urgent = countdownSeconds <= 10;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onStay}
    >
      <div className="absolute inset-0 bg-midnight/60 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
          urgent ? "bg-alert-coral/10" : "bg-daybreak/10"
        }`}>
          <Clock size={28} className={urgent ? "text-alert-coral" : "text-daybreak"} />
        </div>

        <div className={`text-5xl font-mono font-bold mb-2 ${
          urgent ? "text-alert-coral" : "text-midnight"
        }`}>
          {countdownSeconds}
        </div>

        <h2 className="font-display font-bold text-midnight text-xl mb-2">
          Still there?
        </h2>
        <p className="font-body text-slate text-sm mb-6 leading-relaxed">
          You&apos;ve been inactive for a while. You&apos;ll be signed out in{" "}
          <span className={`font-bold ${urgent ? "text-alert-coral" : "text-midnight"}`}>
            {countdownSeconds} second{countdownSeconds !== 1 ? "s" : ""}
          </span>{" "}
          unless you interact with the page.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-2 border border-slate/20 text-slate font-body font-medium text-sm py-3 rounded-xl hover:bg-slate/5 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
          <button
            onClick={onStay}
            className="flex-1 bg-daybreak text-midnight font-body font-bold text-sm py-3 rounded-xl hover:bg-[#D4921A] transition-colors"
          >
            Stay signed in
          </button>
        </div>

        <p className="font-body text-xs text-slate/50 mt-4">
          Click anywhere on the page to dismiss
        </p>
      </div>
    </div>
  );
}
