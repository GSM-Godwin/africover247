"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
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

function getStrength(password: string): {
  label: string;
  color: string;
  width: string;
} {
  if (!password) return { label: "", color: "", width: "w-0" };
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [password.length >= 8, hasUpper, hasNumber, hasSpecial].filter(
    Boolean,
  ).length;
  if (score <= 2)
    return { label: "Weak", color: "bg-alert-coral", width: "w-1/3" };
  if (score === 3)
    return { label: "Fair", color: "bg-daybreak", width: "w-2/3" };
  return { label: "Strong", color: "bg-cover-green", width: "w-full" };
}

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
  const strength = getStrength(watchedPassword);

  useEffect(() => {
    const email = sessionStorage.getItem("reset_email");
    const otp = sessionStorage.getItem("reset_otp");
    if (!email || !otp) router.replace("/forgot-password");
  }, [router]);

  async function onSubmit(data: FormData) {
    const email = sessionStorage.getItem("reset_email");
    const otp = sessionStorage.getItem("reset_otp");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword: data.newPassword,
      });
      sessionStorage.removeItem("reset_email");
      sessionStorage.removeItem("reset_otp");
      toast.success("Password reset successfully.");
      router.push("/login");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(msg || "Reset failed. Please try again.");
    } finally {
      setLoading(false);
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

        {watchedPassword && (
          <div className="space-y-1.5">
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
              />
            </div>
            <p className="font-body text-xs text-info">
              Password strength: {strength.label}
            </p>
          </div>
        )}

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
