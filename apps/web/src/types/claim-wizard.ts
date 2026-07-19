export const CLAIM_WIZARD_STEPS = [
  { num: 1, label: "Claim Details" },
  { num: 2, label: "Documents" },
  { num: 3, label: "Review" },
] as const;

export const CLAIM_TYPE_PRESETS = [
  "Motor Accident",
  "Theft",
  "Fire Damage",
  "Third-Party Liability",
  "Medical Expense",
  "Hospitalization",
  "Death Benefit",
  "Other",
] as const;

export interface ClaimFormData {
  policyId: string;
  claimTypePreset: string;
  customClaimType: string;
  incidentDate: string;
  incidentLocation: string;
  estimatedAmount: string;
  description: string;
  policeReportFiled: boolean;
  policeReportNumber: string;
}

export interface ClaimUploadedDocument {
  id: string;
  fileName: string;
}

export const EMPTY_CLAIM_FORM: ClaimFormData = {
  policyId: "",
  claimTypePreset: "",
  customClaimType: "",
  incidentDate: "",
  incidentLocation: "",
  estimatedAmount: "",
  description: "",
  policeReportFiled: false,
  policeReportNumber: "",
};

export function claimStepPath(step: number): string {
  return `/claims/new/step-${step}`;
}

export function resolveClaimType(
  preset: string,
  customClaimType: string,
): string {
  if (preset === "Other") return customClaimType.trim();
  return preset;
}

export function toApiClaimType(preset: string, customClaimType: string): string {
  const resolved = resolveClaimType(preset, customClaimType);
  if (resolved === "Motor Accident" || resolved === "Theft") return resolved;
  if (resolved === "Fire Damage") return "Fire";
  if (
    resolved === "Medical Expense" ||
    resolved === "Hospitalization" ||
    resolved === "Death Benefit"
  ) {
    return "Medical";
  }
  return "Other";
}
