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

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
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
      await api.post("/auth/forgot-password", data);
      sessionStorage.setItem("reset_email", data.email);
      router.push("/forgot-password/verify");
      toast.success("If an account exists, a reset code has been sent.");
    } catch (err: unknown) {
      const message = (
        err as { response?: { data?: { message?: unknown } } }
      ).response?.data?.message;
      if (Array.isArray(message)) {
        toast.error(String(message[0]));
      } else {
        toast.error(
          typeof message === "string"
            ? message
            : "Something went wrong. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="font-display font-bold text-midnight text-4xl mb-2">
        Forgot your password?
      </h1>
      <p className="font-body text-slate text-base mb-10">
        Enter your registered email
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1">
          <AuthInput
            label="Email address"
            type="email"
            placeholder="Enter your email address"
            registration={register("email")}
            error={errors.email?.message}
          />
          <div className="flex justify-end">
            <Link
              href="/login"
              className="font-body text-sm text-info hover:underline"
            >
              Back to login
            </Link>
          </div>
        </div>

        <AuthButton loading={loading}>Send Reset Link</AuthButton>
      </form>
    </div>
  );
}
