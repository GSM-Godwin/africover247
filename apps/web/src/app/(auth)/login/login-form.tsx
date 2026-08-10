"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import api from "@/lib/api";
import { setToken, setUser, setRole } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function handleGoogleSignIn() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error("Google Sign-In is not configured yet.");
      return;
    }
    // TODO: implement Google OAuth flow when credentials available
    toast.info("Google Sign-In coming soon.");
  }

  async function handleAppleSignIn() {
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    if (!clientId) {
      toast.error("Apple Sign-In is not configured yet.");
      return;
    }
    // TODO: implement Apple OAuth flow when credentials available
    toast.info("Apple Sign-In coming soon.");
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", data);
      setToken(res.data.accessToken);
      setUser(res.data.user);
      setRole(res.data.user.role);

      const role = res.data.user.role;
      const redirect = searchParams.get("redirect");
      const action = searchParams.get("action");

      setLoading(false);

      if (redirect) {
        const destination = action
          ? `${redirect}?action=${encodeURIComponent(action)}`
          : redirect;
        router.push(destination);
        return;
      }

      router.push(role === "admin" ? "/admin" : "/dashboard");
    } catch (err: unknown) {
      setLoading(false);
      const response = (
        err as { response?: { status?: number; data?: { message?: unknown } } }
      ).response;
      const status = response?.status;
      const message = response?.data?.message;
      if (status === 401) {
        toast.error("Incorrect email or password.");
      } else if (status === 429) {
        toast.error("Too many attempts. Please wait a minute.");
      } else if (Array.isArray(message)) {
        toast.error(String(message[0]));
      } else {
        toast.error(
          typeof message === "string"
            ? message
            : "Something went wrong. Please try again.",
        );
      }
    }
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="font-display font-bold text-midnight text-4xl mb-2">
        Welcome back
      </h1>
      <p className="font-body text-slate text-base mb-10">
        Log in to manage your policies and claims.
      </p>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 border border-slate/20 text-midnight font-body font-bold text-sm py-3.5 rounded-xl hover:bg-slate/5 transition-colors mb-4"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {process.env.NEXT_PUBLIC_APPLE_CLIENT_ID && (
        <button
          type="button"
          onClick={handleAppleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-black text-white font-body font-bold text-sm py-3.5 rounded-xl hover:bg-gray-900 transition-colors mt-3"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Continue with Apple
        </button>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-slate/20" />
        <span className="font-body text-xs text-slate">or</span>
        <div className="flex-1 h-px bg-slate/20" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <AuthInput
          label="Email address"
          type="email"
          placeholder="Enter your email address"
          registration={register("email")}
          error={errors.email?.message}
        />

        <div className="space-y-1">
          <AuthInput
            label="Password"
            type="password"
            placeholder="••••••••••"
            registration={register("password")}
            error={errors.password?.message}
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="font-body text-sm text-info hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <AuthButton loading={loading}>Log In</AuthButton>
      </form>

      <p className="font-body text-sm text-slate text-center mt-4">
        Prefer to use your phone?{" "}
        <Link href="/login/phone" className="font-semibold text-midnight hover:text-daybreak transition-colors">
          Sign in with phone number
        </Link>
      </p>

      <p className="font-body text-slate text-sm text-center mt-6">
        New to AfriCover247?{" "}
        <Link href="/register" className="text-midnight font-semibold underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
