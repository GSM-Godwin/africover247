"use client";

import {
  useRef,
  KeyboardEvent,
  ClipboardEvent,
  ChangeEvent,
} from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function OtpInput({ value, onChange, disabled, error }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, i) => (i === index ? char : d));
    onChange(next.join(""));
    if (char && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6));
    const nextIndex = Math.min(pasted.length, 5);
    inputs.current[nextIndex]?.focus();
  }

  return (
    <div className="flex gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`
            w-12 h-14 text-center font-mono text-xl text-midnight
            border rounded-lg outline-none transition-all duration-200
            focus:border-daybreak focus:ring-2 focus:ring-daybreak/20
            disabled:opacity-50
            ${error ? "border-alert-coral" : "border-slate/30"}
            ${digit ? "border-midnight bg-white" : "bg-white"}
          `}
        />
      ))}
    </div>
  );
}
