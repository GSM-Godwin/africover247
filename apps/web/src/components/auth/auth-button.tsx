"use client";

import { Loader2 } from "lucide-react";

interface AuthButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}

export function AuthButton({
  children,
  loading,
  disabled,
  type = "submit",
  onClick,
}: AuthButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full bg-daybreak text-midnight font-body font-bold text-base py-4 rounded-lg hover:bg-[#C4700E] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {loading ? "Please wait..." : children}
    </button>
  );
}
