"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { AdminSidebarContent } from "./admin-sidebar-content";

interface AdminDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AdminDrawer({ open, onClose }: AdminDrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-midnight/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute left-0 top-0 bottom-0 w-64 bg-midnight flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="font-body text-white/60 text-sm">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <AdminSidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}
