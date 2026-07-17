"use client";

import type { UseFormRegisterReturn } from "react-hook-form";

interface WizardFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function WizardField({
  label,
  error,
  children,
  className,
}: WizardFieldProps) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label className="block font-body text-sm font-medium text-midnight">
        {label}
      </label>
      {children}
      {error && (
        <p className="font-body text-xs text-alert-coral">{error}</p>
      )}
    </div>
  );
}

const inputClass =
  "w-full font-body text-base text-midnight placeholder:text-slate/50 border border-slate/30 rounded-lg px-4 py-3 outline-none transition-colors duration-200 focus:border-daybreak focus:ring-2 focus:ring-daybreak/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100";

interface WizardInputProps {
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  registration: UseFormRegisterReturn;
  disabled?: boolean;
  className?: string;
}

export function WizardInput({
  label,
  type = "text",
  placeholder,
  error,
  registration,
  disabled,
  className,
}: WizardInputProps) {
  return (
    <WizardField label={label} error={error} className={className}>
      <input
        {...registration}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={`${inputClass} ${error ? "border-alert-coral" : ""}`}
      />
    </WizardField>
  );
}

interface WizardSelectProps {
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export function WizardSelect({
  label,
  error,
  registration,
  options,
  placeholder,
  className,
}: WizardSelectProps) {
  return (
    <WizardField label={label} error={error} className={className}>
      <select
        {...registration}
        className={`${inputClass} ${error ? "border-alert-coral" : ""}`}
        defaultValue=""
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </WizardField>
  );
}
