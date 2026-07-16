"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";

interface AuthInputProps {
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  registration: UseFormRegisterReturn;
  disabled?: boolean;
}

export function AuthInput({
  label,
  type = "text",
  placeholder,
  error,
  registration,
  disabled,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <label className="block font-body text-sm font-medium text-midnight">
        {label}
      </label>

      <div className="relative">
        <input
          {...registration}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full bg-transparent font-body text-base text-midnight placeholder:text-slate/50
            border-b pb-2 outline-none transition-colors duration-200
            focus:border-daybreak
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-alert-coral" : "border-slate/40"}
            ${isPassword ? "pr-8" : ""}
          `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 bottom-2.5 text-slate hover:text-midnight transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <p className="font-body text-xs text-alert-coral">{error}</p>
      )}
    </div>
  );
}
