"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthInput } from "@/components/auth/auth-input";
import { WizardSelect } from "@/components/application/wizard-select";
import { WizardActions } from "@/components/application/wizard-actions";
import { useApplicationWizard } from "@/contexts/application-wizard-context";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";
import { applyStepPath } from "@/types/application";

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

function isAtLeast18(dateStr: string): boolean {
  const dob = new Date(dateStr);
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 18;
}

const step1Schema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine(isAtLeast18, "You must be at least 18 years old"),
  gender: z.string().min(1, "Gender is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .regex(/^(\+234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number"),
});

type Step1FormData = z.infer<typeof step1Schema>;

function buildDefaults(formData: Record<string, unknown>): Step1FormData {
  const user = getUser();
  return {
    firstName: String(formData.firstName ?? user?.firstName ?? ""),
    lastName: String(formData.lastName ?? user?.lastName ?? ""),
    dateOfBirth: String(formData.dateOfBirth ?? ""),
    gender: String(formData.gender ?? ""),
    email: String(formData.email ?? user?.email ?? ""),
    phone: String(formData.phone ?? user?.phone ?? ""),
  };
}

function toStep1Payload(data: Step1FormData) {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    nationality: "Nigerian",
    email: data.email,
    phone: data.phone,
    alternativePhone: undefined,
  };
}

export default function Step1Page() {
  const router = useRouter();
  const {
    productId,
    applicationId,
    formData,
    loading,
    updateFormData,
    refreshApplication,
  } = useApplicationWizard();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: buildDefaults({}),
  });

  useEffect(() => {
    if (!loading) {
      reset(buildDefaults(formData));
    }
  }, [loading, formData, reset]);

  async function persist(data: Step1FormData, stepCompleted: number) {
    const payload = toStep1Payload(data);
    await api.put(`/applications/${applicationId}`, {
      formData: payload,
      stepCompleted,
    });
    updateFormData(payload);
  }

  async function onSaveContinue(data: Step1FormData) {
    setSaving(true);
    setError("");
    setDraftSaved(false);
    try {
      await persist(data, 1);
      setSaving(false);
      router.push(applyStepPath(productId, applicationId, 2));
    } catch {
      setError("Something went wrong, please try again.");
      setSaving(false);
    }
  }

  async function onSaveDraft() {
    await handleSubmit(async (data) => {
      setSaving(true);
      setError("");
      setDraftSaved(false);
      try {
        await persist(data, 1);
        await refreshApplication();
        setDraftSaved(true);
        setSaving(false);
      } catch {
        setError("Something went wrong, please try again.");
        setSaving(false);
      }
    })();
  }

  return (
    <form
      onSubmit={handleSubmit(onSaveContinue)}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <AuthInput
          label="Date of birth"
          type="date"
          placeholder="MM/DD/YYYY"
          registration={register("dateOfBirth")}
          error={errors.dateOfBirth?.message}
        />
        <WizardSelect
          label="Gender"
          placeholder="Gender"
          registration={register("gender")}
          options={GENDER_OPTIONS}
          error={errors.gender?.message}
        />
      </div>

      <AuthInput
        label="Email"
        type="email"
        placeholder="Enter your email address"
        registration={register("email")}
        error={errors.email?.message}
        disabled
      />

      <AuthInput
        label="Phone (+234)"
        type="tel"
        placeholder="Enter your phone number"
        registration={register("phone")}
        error={errors.phone?.message}
      />

      <WizardActions
        step={1}
        productId={productId}
        applicationId={applicationId}
        loading={saving}
        error={error}
        onSubmit={handleSubmit(onSaveContinue)}
        onSaveDraft={onSaveDraft}
        draftSaved={draftSaved}
      />
    </form>
  );
}
