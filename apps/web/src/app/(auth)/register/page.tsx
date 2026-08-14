"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import api from "@/lib/api";
import { setToken, setUser, setRole } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/firebase";

const schema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .regex(/^(\+234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[A-Z])(?=.*\d).+$/,
      "Password must contain at least one uppercase letter and one number",
    ),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      const res = await api.post("/auth/google", googleUser);
      setToken(res.data.accessToken);
      setUser(res.data.user);
      setRole(res.data.user.role);
      router.push("/dashboard");
    } catch (err: unknown) {
      const response = (
        err as { response?: { data?: { message?: unknown } } }
      ).response;
      const message = response?.data?.message;
      toast.error(
        Array.isArray(message)
          ? String(message[0])
          : typeof message === "string"
            ? message
            : "Google Sign-Up failed.",
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  async function onSubmit(data: FormData) {
    if (!agreed) {
      toast.error("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
    const { confirmPassword, ...payload } = data as FormData & {
      confirmPassword?: string;
    };
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/register", payload);
      sessionStorage.setItem("pending_verification_email", data.email);
      sessionStorage.setItem("pending_registration", JSON.stringify(payload));
      router.push(
        `/register/verify?email=${encodeURIComponent(data.email)}`,
      );
    } catch (err: unknown) {
      const response = (
        err as { response?: { status?: number; data?: { message?: unknown } } }
      ).response;
      const status = response?.status;
      const message = response?.data?.message;
      if (status === 409) {
        setError(
          typeof message === "string"
            ? message
            : "An account with this email already exists.",
        );
      } else if (Array.isArray(message)) {
        setError(String(message[0]));
      } else {
        setError(
          typeof message === "string"
            ? message
            : "Could not create account. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="font-display font-bold text-midnight text-4xl mb-2">
        Create your account
      </h1>
      <p className="font-body text-slate text-base mb-10">
        Step 1 of 2 — takes about a minute.
      </p>

      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 border border-slate/20 text-midnight font-body font-bold text-sm py-3.5 rounded-xl hover:bg-slate/5 disabled:opacity-60 transition-colors mb-4"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {googleLoading ? "Signing up..." : "Sign up with Google"}
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-slate/20" />
        <span className="font-body text-xs text-slate">or register with email</span>
        <div className="flex-1 h-px bg-slate/20" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <AuthInput
            label="First name"
            placeholder="First name"
            registration={register("firstName")}
            error={errors.firstName?.message}
          />
          <AuthInput
            label="Last name"
            placeholder="Last name"
            registration={register("lastName")}
            error={errors.lastName?.message}
          />
        </div>

        <AuthInput
          label="Email"
          type="email"
          placeholder="Enter your email address"
          registration={register("email")}
          error={errors.email?.message}
        />

        <AuthInput
          label="Phone (+234)"
          type="tel"
          placeholder="Enter your phone number"
          registration={register("phone")}
          error={errors.phone?.message}
        />

        <AuthInput
          label="Password"
          type="password"
          placeholder="••••••••••"
          registration={register("password")}
          error={errors.password?.message}
        />

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-daybreak cursor-pointer"
          />
          <span className="font-body text-sm text-slate leading-snug">
            I agree to{" "}
            <Link href="/terms-of-service" className="text-midnight underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="text-midnight underline">
              Privacy Policy
            </Link>
          </span>
        </label>

        {error ? (
          <p className="font-body text-sm text-red-600">{error}</p>
        ) : null}

        <AuthButton loading={loading}>Create an account</AuthButton>
      </form>

      <p className="font-body text-slate text-sm text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-midnight font-semibold underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
