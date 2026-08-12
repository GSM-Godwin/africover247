"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { PLAIN_ENGLISH_LABELS } from "@/lib/insurance-terms";

interface InsuranceTooltipProps {
  term: string;
  className?: string;
}

export function InsuranceTooltip({ term, className }: InsuranceTooltipProps) {
  const [show, setShow] = useState(false);
  const plainLabel = PLAIN_ENGLISH_LABELS[term];
  if (!plainLabel) return null;

  return (
    <span className={`relative inline-flex items-center gap-1 ${className}`}>
      <span className="font-body text-sm text-slate">{term}</span>
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-slate/60 hover:text-midnight transition-colors"
        aria-label={`What is ${term}?`}
      >
        <HelpCircle size={14} />
      </button>
      {show && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-56 bg-midnight text-white text-xs font-body rounded-lg px-3 py-2 shadow-xl">
          <p className="font-semibold mb-0.5">{term}</p>
          <p className="text-white/80">{plainLabel}</p>
          <div className="absolute top-full left-3 border-4 border-transparent border-t-midnight" />
        </div>
      )}
    </span>
  );
}
