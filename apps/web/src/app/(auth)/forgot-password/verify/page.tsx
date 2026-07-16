"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OtpInput } from "@/components/auth/otp-input";
import { AuthButton } from "@/components/auth/auth-button";
import api from "@/lib/api";

export default function ForgotPasswordVerifyPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("reset_email");
    if (!stored) {
      router.replace("/forgot-password");
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
      sessionStorage.setItem("reset_otp", otp);
      router.push("/reset-password");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendSeconds > 0) return;
    try {
      await api.post("/auth/forgot-password", { email });
      setResendSeconds(60);
      toast.success("A new code has been sent.");
    } catch {
      toast.error("Could not resend. Please try again.");
    }
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="font-display font-bold text-midnight text-4xl mb-2">
        Check your email
      </h1>
      <p className="font-body text-slate text-base mb-10">
        Enter the 6-digit code sent to your mail
      </p>

      <div className="mb-8">
        <OtpInput value={otp} onChange={setOtp} disabled={loading} />
      </div>

      <AuthButton loading={loading} onClick={handleVerify} type="button">
        Verify Code
      </AuthButton>

      <p className="font-body text-slate text-sm text-center mt-6">
        Resend code (
        {resendSeconds > 0 ? (
          `${resendSeconds}s`
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-midnight font-medium hover:underline"
          >
            Resend
          </button>
        )}
        ) ·{" "}
        <Link href="/login" className="text-midnight font-semibold underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
