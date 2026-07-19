"use client";

import { WizardStepper } from "@/components/shared/wizard-stepper";

const STEPS = [
  { num: 1, label: "Personal Details" },
  { num: 2, label: "Address & Employment" },
  { num: 3, label: "KYC Documents" },
  { num: 4, label: "Review & Pay" },
] as const;

interface ApplicationStepperProps {
  currentStep: number;
}

export function ApplicationStepper({ currentStep }: ApplicationStepperProps) {
  return <WizardStepper steps={[...STEPS]} currentStep={currentStep} />;
}
