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
        <div className="bg-white rounded-xl px-3 py-2 inline-flex">
          <Image
            src="/afriglobal_logo.png"
            alt="AfriGlobal"
            width={130}
            height={42}
            className="h-9 w-auto object-contain"
            priority
          />
        </div>
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
