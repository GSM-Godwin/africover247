"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, Mail } from "lucide-react";
import { AuthInput } from "@/components/auth/auth-input";
import { OtpInput } from "@/components/auth/otp-input";
import api from "@/lib/api";

interface ReauthModalProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  reason?: string;
  allowEmailCode?: boolean;
}

type ReauthMode = "loading" | "password" | "code";

interface SendCodeResponse {
  message: string;
  maskedEmail: string;
  resendAvailableInSeconds: number;
}

function serverMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  if (Array.isArray(message)) return String(message[0] ?? fallback);
  return typeof message === "string" && message ? message : fallback;
}

export function ReauthModal({
  open,
  onSuccess,
  onCancel,
  reason,
  allowEmailCode = false,
}: ReauthModalProps) {
  const [mode, setMode] = useState<ReauthMode>("loading");
  const [isSocialAccount, setIsSocialAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendCode = useCallback(async () => {
    setSending(true);
    setError("");
    try {
      const res = await api.post<SendCodeResponse>("/auth/step-up/email/send");
      setCodeSent(true);
      setSentTo(res.data.maskedEmail);
      setResendIn(res.data.resendAvailableInSeconds);
    } catch (err) {
      setError(serverMessage(err, "We could not send a code. Please try again."));
    } finally {
      setSending(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setMode("loading");
      setPassword("");
      setCode("");
      setCodeSent(false);
      setSentTo("");
      setResendIn(0);
      setError("");
      return;
    }
    if (!allowEmailCode) {
      setIsSocialAccount(false);
      setMode("password");
      return;
    }
    let cancelled = false;
    api
      .get<{ googleId?: string | null; appleId?: string | null }>("/auth/me")
      .then((res) => {
        if (cancelled) return;
        const social = Boolean(res.data.googleId || res.data.appleId);
        setIsSocialAccount(social);
        setMode(social ? "code" : "password");
        if (social) void sendCode();
      })
      .catch(() => {
        if (!cancelled) setMode("password");
      });
    return () => {
      cancelled = true;
    };
  }, [open, allowEmailCode, sendCode]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  if (!open) return null;

  async function handleVerifyPassword() {
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

  async function handleVerifyCode() {
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/step-up/email/verify", { code });
      setCode("");
      setLoading(false);
      onSuccess();
    } catch (err) {
      setError(serverMessage(err, "We could not verify that code. Please try again."));
      setCode("");
      setLoading(false);
    }
  }

  function switchMode(next: "password" | "code") {
    setError("");
    setMode(next);
    if (next === "code" && !codeSent && !sending) void sendCode();
  }

  const handleConfirm = mode === "code" ? handleVerifyCode : handleVerifyPassword;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-midnight/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8">
        <div className="w-14 h-14 bg-midnight/5 rounded-full flex items-center justify-center mx-auto mb-5">
          {mode === "code" ? (
            <Mail size={24} className="text-midnight" />
          ) : (
            <Lock size={24} className="text-midnight" />
          )}
        </div>
        <h2 className="font-display font-bold text-midnight text-xl text-center mb-2">
          Confirm your identity
        </h2>
        <p className="font-body text-slate text-sm text-center mb-6">
          {mode === "code"
            ? codeSent
              ? `We sent a code to your email${sentTo ? ` (${sentTo})` : ""}. Enter it below to continue.`
              : sending
                ? "Sending a code to your email..."
                : "We will send a code to your email to confirm it's you."
            : reason || "Please enter your password to continue with this action."}
        </p>

        {error && (
          <div className="bg-alert-coral/10 border border-alert-coral/20 rounded-xl px-4 py-3 mb-4">
            <p className="font-body text-sm text-alert-coral">{error}</p>
          </div>
        )}

        {mode === "loading" && (
          <p className="font-body text-sm text-slate text-center mb-4">Loading...</p>
        )}

        {mode === "password" && (
          <div className="mb-4">
            <AuthInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
            />
          </div>
        )}

        {mode === "code" && (
          <div className="mb-4">
            <OtpInput value={code} onChange={setCode} disabled={loading} error={!!error} />
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={sending || resendIn > 0}
                className="font-body text-sm font-medium text-info hover:underline disabled:text-slate disabled:no-underline disabled:cursor-not-allowed"
              >
                {sending
                  ? "Sending..."
                  : resendIn > 0
                    ? `Resend code in ${resendIn}s`
                    : codeSent
                      ? "Resend code"
                      : "Send code"}
              </button>
            </div>
          </div>
        )}

        {isSocialAccount && mode !== "loading" && (
          <div className="flex justify-center mb-4">
            <button
              type="button"
              onClick={() => switchMode(mode === "code" ? "password" : "code")}
              className="font-body text-xs text-slate hover:text-midnight hover:underline"
            >
              {mode === "code" ? "Use password instead" : "Email me a code instead"}
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-slate/20 text-slate font-body font-medium text-sm py-3 rounded-xl hover:bg-slate/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || mode === "loading"}
            className="flex-1 bg-daybreak text-midnight font-body font-bold text-sm py-3 rounded-xl hover:bg-[#D4921A] disabled:opacity-60 transition-colors"
          >
            {loading ? "Verifying..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
