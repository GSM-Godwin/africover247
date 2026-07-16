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
import { setToken, setUser } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", data);
      setToken(res.data.accessToken);
      setUser(res.data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response
        ?.status;
      if (status === 401) toast.error("Incorrect email or password.");
      else if (status === 429)
        toast.error("Too many attempts. Please wait a minute.");
      else toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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

      <p className="font-body text-slate text-sm text-center mt-6">
        New to AfriCover247?{" "}
        <Link href="/register" className="text-midnight font-semibold underline">
          Create an account
        </Link>
      </p>

      <p className="font-body text-slate/60 text-xs text-center mt-8">
        Admin?{" "}
        <a
          href={process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002"}
          className="hover:text-slate transition-colors"
        >
          Log in to the Admin panel →
        </a>
      </p>
    </div>
  );
}
