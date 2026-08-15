"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Shield,
  ClipboardList,
  Package,
  Users,
  ScrollText,
  LogOut,
  MessageSquare,
  MessageCircle,
  Car,
  Mail,
  Search,
  RefreshCw,
} from "lucide-react";
import { logout } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/quotes", label: "Quotes", icon: MessageSquare },
  { href: "/admin/applications", label: "Applications", icon: FileText },
  { href: "/admin/policies", label: "Policies", icon: Shield },
  { href: "/admin/renewals", label: "Renewals", icon: RefreshCw },
  { href: "/admin/claims", label: "Claims", icon: ClipboardList },
  { href: "/admin/support", label: "Support Tickets", icon: MessageCircle },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/search", label: "Search Analytics", icon: Search },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/vehicle-lookup", label: "Vehicle Lookup", icon: Car },
  { href: "/admin/contact", label: "Contact Messages", icon: Mail },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
];

interface AdminSidebarContentProps {
  onNavigate?: () => void;
}

export function AdminSidebarContent({ onNavigate }: AdminSidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <>
      <div className="hidden lg:block px-5 py-5 border-b border-white/10">
        <Link href="/admin" onClick={onNavigate}>
          <div className="bg-white rounded-xl px-4 py-3 inline-flex">
            <Image
              src="/afriglobal_logo.png"
              alt="AfriGlobal Insurance Brokers"
              width={160}
              height={52}
              className="h-11 w-auto object-contain"
              priority
            />
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 font-body text-sm px-3 py-2.5 rounded-lg transition-all duration-150 ${
                active
                  ? "bg-daybreak text-midnight font-semibold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5 space-y-0.5 border-t border-white/10 pt-3">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 font-body text-sm px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LayoutDashboard size={16} />
          Customer View
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 font-body text-sm px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors text-left"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </>
  );
}
