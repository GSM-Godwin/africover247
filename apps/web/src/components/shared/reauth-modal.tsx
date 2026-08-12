"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { AuthInput } from "@/components/auth/auth-input";
import api from "@/lib/api";

interface ReauthModalProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  reason?: string;
}

export function ReauthModal({ open, onSuccess, onCancel, reason }: ReauthModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleVerify() {
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/verify-password", { password });
      setPassword("");
      setLoading(false);
      onSuccess();
    } catch {
      setError("Incorrect password. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-midnight/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8">
        <div className="w-14 h-14 bg-midnight/5 rounded-full flex items-center justify-center mx-auto mb-5">
          <Lock size={24} className="text-midnight" />
        </div>
        <h2 className="font-display font-bold text-midnight text-xl text-center mb-2">
          Confirm your identity
        </h2>
        <p className="font-body text-slate text-sm text-center mb-6">
          {reason || "Please enter your password to continue with this action."}
        </p>

        {error && (
          <div className="bg-alert-coral/10 border border-alert-coral/20 rounded-xl px-4 py-3 mb-4">
            <p className="font-body text-sm text-alert-coral">{error}</p>
          </div>
        )}

        <div className="mb-4">
          <AuthInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-slate/20 text-slate font-body font-medium text-sm py-3 rounded-xl hover:bg-slate/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={loading}
            className="flex-1 bg-daybreak text-midnight font-body font-bold text-sm py-3 rounded-xl hover:bg-[#D4921A] disabled:opacity-60 transition-colors"
          >
            {loading ? "Verifying..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
