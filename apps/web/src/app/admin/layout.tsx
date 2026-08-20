"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { getUser } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user || (user as { role?: string }).role !== "admin") {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-[#F0F4F8]">
      <AdminSidebar />

      <AdminDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar onMenuClick={() => setDrawerOpen(true)} />

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
