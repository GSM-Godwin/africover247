"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthInput } from "@/components/auth/auth-input";
import { WizardSelect } from "@/components/application/wizard-select";
import { ClaimWizardActions } from "@/components/claims/claim-wizard-actions";
import { useClaimWizard } from "@/contexts/claim-wizard-context";
import api from "@/lib/api";
import {
  CLAIM_TYPE_PRESETS,
  claimStepPath,
  toApiClaimType,
  type ClaimFormData,
} from "@/types/claim-wizard";

function isNotFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
}

const step1Schema = z
  .object({
    policyId: z.string().min(1, "Please select a policy"),
    claimTypePreset: z.string().min(1, "Claim type is required"),
    customClaimType: z.string().optional(),
    incidentDate: z
      .string()
      .min(1, "Date of incident is required")
      .refine(isNotFutureDate, "Incident date cannot be in the future"),
    incidentLocation: z.string().min(1, "Location is required"),
    estimatedAmount: z.string().optional(),
    description: z
      .string()
      .min(50, "Please provide at least 50 characters describing the incident"),
    policeReportFiled: z.boolean(),
    policeReportNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.claimTypePreset === "Other" && !data.customClaimType?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Please enter your claim type",
        path: ["customClaimType"],
      });
    }
    if (data.policeReportFiled && !data.policeReportNumber?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Police report number is required",
        path: ["policeReportNumber"],
      });
    }
  });

type Step1FormData = z.infer<typeof step1Schema>;

interface CreateClaimResponse {
  id: string;
  claimReference: string;
}

export default function ClaimStep1Page() {
  const router = useRouter();
  const {
    formData,
    claimId,
    activePolicies,
    loadingPolicies,
    updateFormData,
    setClaimCreated,
  } = useClaimWizard();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: formData,
  });

  const claimTypePreset = watch("claimTypePreset");
  const policeReportFiled = watch("policeReportFiled");

  useEffect(() => {
    reset(formData);
  }, [formData, reset]);

  const policyOptions = activePolicies.map((policy) => ({
    value: policy.id,
    label: `${policy.product.name} · ${policy.policyNumber}`,
  }));

  const claimTypeOptions = CLAIM_TYPE_PRESETS.map((type) => ({
    value: type,
    label: type,
  }));

  async function onSaveContinue(data: Step1FormData) {
    setSaving(true);
    setError("");
    updateFormData(data as ClaimFormData);

    try {
      if (!claimId) {
        const payload = {
          policyId: data.policyId,
          claimType: toApiClaimType(
            data.claimTypePreset,
            data.customClaimType ?? "",
          ),
          incidentDate: data.incidentDate,
          incidentLocation: data.incidentLocation,
          description: data.description,
          estimatedAmount: data.estimatedAmount
            ? parseFloat(data.estimatedAmount)
            : undefined,
          policeReportFiled: data.policeReportFiled,
          policeReportNumber: data.policeReportFiled
            ? data.policeReportNumber
            : undefined,
        };

        const res = await api.post<CreateClaimResponse>("/claims", payload);
        setClaimCreated(res.data.id, res.data.claimReference);
      }

      router.push(claimStepPath(2));
    } catch {
      setError("Something went wrong, please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingPolicies) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-slate-100 rounded" />
        <div className="h-10 bg-slate-100 rounded" />
        <div className="h-10 bg-slate-100 rounded" />
      </div>
    );
  }

  if (activePolicies.length === 0) {
    return (
      <p className="font-body text-slate text-center py-6">
        You need an active policy before filing a claim.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSaveContinue)} className="space-y-5">
      <WizardSelect
        label="Which policy is this claim for?"
        registration={register("policyId")}
        options={policyOptions}
        placeholder="Select a policy"
        error={errors.policyId?.message}
      />

      <WizardSelect
        label="Claim type"
        registration={register("claimTypePreset")}
        options={claimTypeOptions}
        placeholder="Select claim type"
        error={errors.claimTypePreset?.message}
      />

      {claimTypePreset === "Other" && (
        <AuthInput
          label="Enter your claim type"
          registration={register("customClaimType")}
          error={errors.customClaimType?.message}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <AuthInput
          label="Date of incident"
          type="date"
          registration={register("incidentDate")}
          error={errors.incidentDate?.message}
        />
        <AuthInput
          label="Location"
          placeholder="Location"
          registration={register("incidentLocation")}
          error={errors.incidentLocation?.message}
        />
      </div>

      <AuthInput
        label="Estimated amount (₦)"
        placeholder="Amount"
        type="number"
        registration={register("estimatedAmount")}
        error={errors.estimatedAmount?.message}
      />

      <div className="space-y-1.5">
        <label className="block font-body text-sm font-medium text-midnight">
          Describe what happened
        </label>
        <textarea
          {...register("description")}
          rows={4}
          className={`w-full bg-transparent font-body text-base text-midnight border-b pb-2 outline-none transition-colors duration-200 focus:border-daybreak resize-y min-h-[100px] ${
            errors.description ? "border-alert-coral" : "border-slate/40"
          }`}
        />
        {errors.description && (
          <p className="font-body text-xs text-alert-coral">
            {errors.description.message}
          </p>
        )}
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          {...register("policeReportFiled")}
          className="mt-1 h-4 w-4 rounded border-slate/40 text-daybreak focus:ring-daybreak"
        />
        <span className="font-body text-sm text-midnight">
          Was a police report filed?
        </span>
      </label>

      {policeReportFiled && (
        <AuthInput
          label="Police report number"
          registration={register("policeReportNumber")}
          error={errors.policeReportNumber?.message}
        />
      )}

      <ClaimWizardActions
        step={1}
        loading={saving}
        error={error}
        onSubmit={handleSubmit(onSaveContinue)}
      />
    </form>
  );
}
