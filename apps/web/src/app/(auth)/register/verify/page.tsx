"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OtpInput } from "@/components/auth/otp-input";
import { AuthButton } from "@/components/auth/auth-button";
import api from "@/lib/api";
import { setToken, setUser, setRole } from "@/lib/auth";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("pending_verification_email");
    if (!stored) {
      router.replace("/register");
      return;
    }
    setEmail(stored);
  }, [router]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  async function handleVerify() {
    if (otp.length !== 6) {
      toast.error("Enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-email", { email, otp });
      setToken(res.data.accessToken);
      setUser(res.data.user);
      setRole(res.data.user.role);
      sessionStorage.removeItem("pending_verification_email");
      sessionStorage.removeItem("pending_registration");
      const role = res.data.user?.role;
      router.push(role === "admin" ? "/admin" : "/dashboard");
    } catch {
      toast.error("Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendSeconds > 0) return;
    try {
      const raw = sessionStorage.getItem("pending_registration");
      if (raw) {
        await api.post("/auth/register", JSON.parse(raw));
      } else {
        await api.post("/auth/forgot-password", { email });
      }
      setResendSeconds(60);
      toast.success("A new code has been sent to your email.");
    } catch {
      toast.error("Could not resend code. Please try again.");
    }
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="font-display font-bold text-midnight text-4xl mb-2">
        Verify your email
      </h1>
      <p className="font-body text-slate text-base mb-10">
        We sent a 6-digit code to{" "}
        <span className="text-midnight font-medium">{email}</span>
      </p>

      <div className="mb-8">
        <OtpInput value={otp} onChange={setOtp} disabled={loading} />
      </div>

      <AuthButton loading={loading} onClick={handleVerify} type="button">
        Verify Email
      </AuthButton>

      <p className="font-body text-slate text-sm text-center mt-6">
        Didn&apos;t receive a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendSeconds > 0}
          className="text-midnight font-medium disabled:text-slate/50 hover:underline transition-colors"
        >
          {resendSeconds > 0 ? `Resend (${resendSeconds}s)` : "Resend"}
        </button>
      </p>
    </div>
  );
}
