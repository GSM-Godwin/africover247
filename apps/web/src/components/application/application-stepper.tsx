"use client";

import { Check } from "lucide-react";

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
  return (
    <div className="mb-10 overflow-x-auto">
      <div className="flex items-start min-w-[560px] max-w-3xl mx-auto px-2">
        {STEPS.map((step, index) => {
          const isCompleted = step.num < currentStep;
          const isCurrent = step.num === currentStep;
          const isUpcoming = step.num > currentStep;

          return (
            <div key={step.num} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-body font-semibold
                    ${
                      isCompleted
                        ? "bg-cover-green text-white"
                        : isCurrent
                          ? "bg-daybreak text-midnight"
                          : "bg-white border-2 border-slate/30 text-slate"
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check size={18} strokeWidth={2.5} />
                  ) : (
                    String(step.num).padStart(2, "0")
                  )}
                </div>

                <p
                  className={`
                    mt-3 text-xs sm:text-sm font-body text-center w-24 sm:w-28 leading-snug
                    ${
                      isCurrent
                        ? "font-semibold text-midnight"
                        : isUpcoming
                          ? "text-slate/60"
                          : "text-midnight"
                    }
                  `}
                >
                  {step.label}
                </p>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mt-5 mx-1 sm:mx-2 min-w-[24px] ${
                    step.num < currentStep ? "bg-cover-green" : "bg-slate/25"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
