"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  return (
    <div className="lg:hidden flex items-center justify-between bg-midnight px-4 py-3 sticky top-0 z-30">
      <Link href="/admin">
        <Image
          src="/afriglobal_logo.png"
          alt="AfriGlobal"
          width={120}
          height={36}
          className="h-7 w-auto object-contain brightness-0 invert"
          priority
        />
      </Link>
      <button
        type="button"
        onClick={onMenuClick}
        className="text-white/70 hover:text-white transition-colors p-1"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>
    </div>
  );
}
