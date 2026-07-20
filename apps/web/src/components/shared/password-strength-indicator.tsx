"use client";

export function getPasswordStrength(password: string): {
  label: string;
  color: string;
  width: string;
} {
  if (!password) return { label: "", color: "", width: "w-0" };
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [password.length >= 8, hasUpper, hasNumber, hasSpecial].filter(
    Boolean,
  ).length;
  if (score <= 2)
    return { label: "Weak", color: "bg-alert-coral", width: "w-1/3" };
  if (score === 3)
    return { label: "Fair", color: "bg-daybreak", width: "w-2/3" };
  return { label: "Strong", color: "bg-cover-green", width: "w-full" };
}

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const strength = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
        />
      </div>
      <p className="font-body text-xs text-info">
        Password strength: {strength.label}
      </p>
    </div>
  );
}
