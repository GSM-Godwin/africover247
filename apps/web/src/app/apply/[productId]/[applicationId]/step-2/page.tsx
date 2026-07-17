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
import { NIGERIAN_STATES } from "@/lib/constants/nigerian-states";
import { applyStepPath } from "@/types/application";

const EMPLOYMENT_OPTIONS = [
  { value: "Employed", label: "Employed" },
  { value: "Self-employed", label: "Self-employed" },
  { value: "Student", label: "Student" },
  { value: "Retired", label: "Retired" },
  { value: "Unemployed", label: "Unemployed" },
];

const INCOME_OPTIONS = [
  { value: "Below ₦50,000", label: "Below ₦50,000" },
  { value: "₦50,000–₦150,000", label: "₦50,000–₦150,000" },
  { value: "₦150,000–₦500,000", label: "₦150,000–₦500,000" },
  { value: "Above ₦500,000", label: "Above ₦500,000" },
];

const STATE_OPTIONS = NIGERIAN_STATES.map((state) => ({
  value: state,
  label: state,
}));

const step2Schema = z
  .object({
    streetAddress: z
      .string()
      .min(5, "Street address must be at least 5 characters"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    lga: z.string().min(1, "LGA is required"),
    employmentStatus: z.string().min(1, "Employment status is required"),
    employerName: z.string().optional(),
    jobTitle: z.string().optional(),
    monthlyIncomeRange: z.string().min(1, "Monthly income range is required"),
  })
  .superRefine((data, ctx) => {
    if (data.employmentStatus === "Employed") {
      if (!data.employerName?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Employer name is required",
          path: ["employerName"],
        });
      }
      if (!data.jobTitle?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Job title is required",
          path: ["jobTitle"],
        });
      }
    }
  });

type Step2FormData = z.infer<typeof step2Schema>;

function buildDefaults(formData: Record<string, unknown>): Step2FormData {
  return {
    streetAddress: String(formData.streetAddress ?? ""),
    city: String(formData.city ?? ""),
    state: String(formData.state ?? ""),
    lga: String(formData.lga ?? ""),
    employmentStatus: String(formData.employmentStatus ?? ""),
    employerName: String(formData.employerName ?? ""),
    jobTitle: String(formData.jobTitle ?? ""),
    monthlyIncomeRange: String(formData.monthlyIncomeRange ?? ""),
  };
}

export default function Step2Page() {
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

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: buildDefaults({}),
  });

  const employmentStatus = watch("employmentStatus");
  const isEmployed = employmentStatus === "Employed";

  useEffect(() => {
    if (!loading) {
      reset(buildDefaults(formData));
    }
  }, [loading, formData, reset]);

  async function onSaveContinue(data: Step2FormData) {
    setSaving(true);
    setError("");
    try {
      const payload = {
        streetAddress: data.streetAddress,
        city: data.city,
        state: data.state,
        lga: data.lga,
        employmentStatus: data.employmentStatus,
        employerName: isEmployed ? data.employerName : undefined,
        jobTitle: isEmployed ? data.jobTitle : undefined,
        monthlyIncomeRange: data.monthlyIncomeRange,
      };

      await api.put(`/applications/${applicationId}`, {
        formData: payload,
        stepCompleted: 2,
      });
      updateFormData(payload);
      await refreshApplication();
      router.push(applyStepPath(productId, applicationId, 3));
    } catch {
      setError("Something went wrong, please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSaveContinue)} className="space-y-5">
      <AuthInput
        label="Street address"
        placeholder="Enter your address"
        registration={register("streetAddress")}
        error={errors.streetAddress?.message}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <AuthInput
          label="City"
          placeholder="City"
          registration={register("city")}
          error={errors.city?.message}
        />
        <WizardSelect
          label="State"
          placeholder="State"
          registration={register("state")}
          options={STATE_OPTIONS}
          error={errors.state?.message}
        />
      </div>

      <AuthInput
        label="LGA"
        placeholder="LGA"
        registration={register("lga")}
        error={errors.lga?.message}
      />

      <WizardSelect
        label="Employment status"
        placeholder="Status"
        registration={register("employmentStatus")}
        options={EMPLOYMENT_OPTIONS}
        error={errors.employmentStatus?.message}
      />

      {isEmployed && (
        <>
          <AuthInput
            label="Employer name"
            placeholder="Employer name"
            registration={register("employerName")}
            error={errors.employerName?.message}
          />
          <AuthInput
            label="Job title"
            placeholder="Job title"
            registration={register("jobTitle")}
            error={errors.jobTitle?.message}
          />
        </>
      )}

      <WizardSelect
        label="Monthly income range"
        placeholder="Select income range"
        registration={register("monthlyIncomeRange")}
        options={INCOME_OPTIONS}
        error={errors.monthlyIncomeRange?.message}
      />

      <WizardActions
        step={2}
        productId={productId}
        applicationId={applicationId}
        loading={saving}
        error={error}
        onSubmit={handleSubmit(onSaveContinue)}
      />
    </form>
  );
}
