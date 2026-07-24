"use client";

import Image from "next/image";

interface PolicyCardProps {
  cardholderName: string;
  policyNumber: string;
  coverage: string;
  status?: "active" | "pending" | "expired";
  className?: string;
}

const statusConfig = {
  active: {
    label: "Active",
    color: "text-cover-green",
    bg: "bg-cover-green/20",
    border: "border-cover-green/30",
    dot: "bg-cover-green",
  },
  pending: {
    label: "Pending",
    color: "text-daybreak",
    bg: "bg-daybreak/20",
    border: "border-daybreak/30",
    dot: "bg-daybreak",
  },
  expired: {
    label: "Expired",
    color: "text-slate",
    bg: "bg-slate/20",
    border: "border-slate/30",
    dot: "bg-slate",
  },
};

export function PolicyCard({
  cardholderName,
  policyNumber,
  coverage,
  status = "active",
  className = "",
}: PolicyCardProps) {
  const config = statusConfig[status];

  return (
    <div
      className={`
        bg-midnight border border-white/10 rounded-xl p-5 w-[260px] sm:w-[290px]
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="w-8 h-5 bg-daybreak rounded-sm" />
        <Image
          src="/afriglobal_logo.png"
          alt="AfriGlobal"
          width={80}
          height={24}
          className="h-5 w-auto object-contain brightness-0 invert"
        />
      </div>

      <p className="font-body text-paper/40 text-[10px] uppercase tracking-widest mb-0.5">
        {cardholderName}
      </p>

      <p className="font-mono text-paper text-xl font-medium tracking-widest mb-5">
        {policyNumber}
      </p>

      <div className="flex items-end justify-between">
        <div>
          <p className="font-body text-paper/40 text-[10px] uppercase tracking-widest mb-0.5">
            Coverage
          </p>
          <p className="font-body text-paper text-sm font-medium">{coverage}</p>
        </div>

        <span
          className={`
            flex items-center gap-1.5 text-xs font-body font-medium
            px-2.5 py-1 rounded-full border
            ${config.color} ${config.bg} ${config.border}
          `}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          {config.label}
        </span>
      </div>
    </div>
  );
}
