"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getUser } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user || (user as { role?: string }).role !== "admin") {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-[#F0F4F8]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
