"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { PasswordStrengthIndicator } from "@/components/shared/password-strength-indicator";
import api from "@/lib/api";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*\d).+$/,
        "Must contain at least one uppercase letter and one number",
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const watchedPassword = watch("newPassword", "");

  useEffect(() => {
    const email = sessionStorage.getItem("reset_email");
    const otp = sessionStorage.getItem("reset_otp");
    if (!email || !otp) router.replace("/forgot-password");
  }, [router]);

  async function onSubmit(data: FormData) {
    const email = sessionStorage.getItem("reset_email");
    const otp = sessionStorage.getItem("reset_otp");
    const { confirmPassword, newPassword } = data;
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, otp, newPassword });
      setLoading(false);
      sessionStorage.removeItem("reset_email");
      sessionStorage.removeItem("reset_otp");
      toast.success("Password reset successfully.");
      router.push("/login");
    } catch (err: unknown) {
      setLoading(false);
      const message = (
        err as { response?: { data?: { message?: unknown } } }
      ).response?.data?.message;
      if (Array.isArray(message)) {
        toast.error(String(message[0]));
      } else {
        toast.error(
          typeof message === "string"
            ? message
            : "Reset failed. Please try again.",
        );
      }
    }
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="font-display font-bold text-midnight text-4xl mb-2">
        Set a new password
      </h1>
      <p className="font-body text-slate text-base mb-10">
        Update your password
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <AuthInput
          label="New password"
          type="password"
          placeholder="••••••••••"
          registration={register("newPassword")}
          error={errors.newPassword?.message}
        />

        <PasswordStrengthIndicator password={watchedPassword} />

        <AuthInput
          label="Confirm password"
          type="password"
          placeholder="••••••••••"
          registration={register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />

        <AuthButton loading={loading}>Reset password</AuthButton>
      </form>
    </div>
  );
}
