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
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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
        setError("An account with this email already exists.");
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
