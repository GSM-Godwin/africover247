"use client";

import type { UseFormRegisterReturn } from "react-hook-form";

interface WizardSelectProps {
  label: string;
  registration: UseFormRegisterReturn;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function WizardSelect({
  label,
  registration,
  options,
  error,
  placeholder,
  disabled,
}: WizardSelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="block font-body text-sm font-medium text-midnight">
        {label}
      </label>

      <select
        {...registration}
        disabled={disabled}
        className={`
          w-full bg-transparent font-body text-base text-midnight
          border-b pb-2 outline-none transition-colors duration-200
          focus:border-daybreak
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? "border-alert-coral" : "border-slate/40"}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="font-body text-xs text-alert-coral">{error}</p>
      )}
    </div>
  );
}
