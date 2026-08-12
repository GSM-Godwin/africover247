"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, type LucideIcon } from "lucide-react";
import { LogoutConfirmModal } from "@/components/shared/logout-confirm-modal";
import { NotificationBellDropdown } from "@/components/layout/notification-bell-dropdown";
import {
  getUser,
  getUserDisplayName,
  getUserInitials,
  isAuthenticated,
} from "@/lib/auth";

function isAdminUser(user: Record<string, unknown> | null): boolean {
  return user?.role === "admin";
}

interface NavLinkItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

function isNavLinkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function DesktopNavLink({
  href,
  label,
  pathname,
  icon: Icon,
}: {
  href: string;
  label: string;
  pathname: string;
  icon?: LucideIcon;
}) {
  const isActive = isNavLinkActive(pathname, href);

  return (
    <Link
      href={href}
      className={`relative group inline-flex items-center gap-1.5 text-sm font-body font-medium transition-colors duration-150 ${
        isActive ? "text-daybreak" : "text-slate hover:text-midnight"
      }`}
    >
      {Icon && <Icon size={15} strokeWidth={2} aria-hidden />}
      {label}
      <span
        className={`absolute -bottom-1 left-0 h-0.5 bg-daybreak transition-all duration-200 ${
          isActive ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  pathname,
  onNavigate,
  icon: Icon,
}: {
  href: string;
  label: string;
  pathname: string;
  onNavigate: () => void;
  icon?: LucideIcon;
}) {
  const isActive = isNavLinkActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-2.5 py-3 font-body text-base font-medium transition-colors duration-150 ${
        isActive ? "text-daybreak" : "text-slate hover:text-midnight"
      }`}
    >
      {Icon && <Icon size={18} strokeWidth={2} aria-hidden />}
      {label}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUserState] = useState<Record<string, unknown> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navLinks = useMemo<NavLinkItem[]>(() => {
    const links: NavLinkItem[] = [
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
      { label: "Glossary", href: "/insurance-glossary" },
      { label: "Claims", href: "/claims" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ];

    if (authenticated) {
      links.splice(1, 0, { label: "Dashboard", href: "/dashboard" });
    }

    return links;
  }, [authenticated]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setUserState(getUser());
    setMenuOpen(false);
    setMobileNavOpen(false);
    setBellOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleAuthChange() {
      setAuthenticated(isAuthenticated());
      setUserState(getUser());
      setMenuOpen(false);
      setMobileNavOpen(false);
    }

    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  function openLogoutModal() {
    setMenuOpen(false);
    closeMobileNav();
    setLogoutModalOpen(true);
  }

  function toggleMobileNav() {
    setMobileNavOpen((current) => {
      if (!current) {
        setMenuOpen(false);
        setBellOpen(false);
      }
      return !current;
    });
  }

  return (
    <>
      <LogoutConfirmModal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
      />
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate/10 transition-all duration-300 py-4 ${
          scrolled ? "shadow-md" : "shadow-sm"
        }`}
      >
        <div className="max-w-[1140px] mx-auto px-4 sm:px-8 flex items-center justify-between relative">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/afriglobal_logo.png"
              alt="AfriGlobal Insurance Brokers"
              width={220}
              height={70}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <DesktopNavLink
                key={link.href}
                href={link.href}
                label={link.label}
                pathname={pathname}
                icon={link.icon}
              />
            ))}
            {authenticated && isAdminUser(user) && (
              <Link
                href="/admin"
                className={`font-body text-sm font-medium transition-colors ${
                  isNavLinkActive(pathname, "/admin")
                    ? "text-daybreak"
                    : "text-slate hover:text-midnight"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            {authenticated && user ? (
              <>
                <NotificationBellDropdown
                  open={bellOpen}
                  onOpenChange={(open) => {
                    setBellOpen(open);
                    if (open) {
                      setMenuOpen(false);
                      closeMobileNav();
                    }
                  }}
                />

                <div className="relative hidden md:block" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen((current) => {
                        if (!current) setBellOpen(false);
                        return !current;
                      });
                    }}
                    className="flex items-center gap-2 text-slate hover:text-midnight transition-colors duration-150"
                  >
                    <div className="w-8 h-8 rounded-full bg-daybreak flex items-center justify-center text-midnight text-xs font-body font-semibold">
                      {getUserInitials(user)}
                    </div>
                    <span className="text-sm font-body text-midnight">
                      {getUserDisplayName(user)}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-slate transition-transform duration-150 ${
                        menuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-[0_4px_24px_rgba(16,26,52,0.12)] py-1.5 z-50">
                      <Link
                        href="/account"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 font-body text-sm text-midnight hover:bg-slate/5 transition-colors"
                      >
                        My Account
                      </Link>
                      <Link
                        href="/policies"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 font-body text-sm text-midnight hover:bg-slate/5 transition-colors"
                      >
                        My Policies
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 font-body text-sm text-midnight hover:bg-slate/5 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <div className="my-1.5 border-t border-slate/15" />
                      <button
                        type="button"
                        onClick={openLogoutModal}
                        className="w-full text-left px-4 py-2.5 font-body text-sm text-midnight hover:bg-slate/5 transition-colors"
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex bg-daybreak text-midnight font-body font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-[#D4921A] transition-colors duration-200"
              >
                Login
              </Link>
            )}

            <button
              type="button"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
              onClick={toggleMobileNav}
              className="md:hidden text-midnight hover:text-daybreak transition-colors p-1"
            >
              {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu overlay"
              onClick={closeMobileNav}
              className="fixed inset-0 top-24 bg-midnight/40 md:hidden z-[55]"
            />
            <div className="absolute left-0 right-0 top-full bg-white border-t border-slate/10 shadow-lg md:hidden z-[56] max-h-[calc(100vh-4rem)] overflow-y-auto">
              <nav className="px-4 sm:px-8 py-4">
                {navLinks.map((link) => (
                  <MobileNavLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    pathname={pathname}
                    onNavigate={closeMobileNav}
                    icon={link.icon}
                  />
                ))}

                {authenticated && isAdminUser(user) && (
                  <Link
                    href="/admin"
                    onClick={closeMobileNav}
                    className="block py-3 font-body text-base text-slate hover:text-midnight transition-colors border-b border-slate/10 font-semibold"
                  >
                    Admin Dashboard →
                  </Link>
                )}

                <div className="border-t border-slate/10 mt-3 pt-3">
                  {authenticated && user ? (
                    <>
                      <div className="flex items-center gap-3 py-3">
                        <div className="w-9 h-9 rounded-full bg-daybreak flex items-center justify-center text-midnight text-xs font-body font-semibold">
                          {getUserInitials(user)}
                        </div>
                        <span className="font-body text-sm font-medium text-midnight">
                          {getUserDisplayName(user)}
                        </span>
                      </div>
                      <Link
                        href="/account"
                        onClick={closeMobileNav}
                        className="block py-3 font-body text-base text-slate hover:text-midnight transition-colors"
                      >
                        My Account
                      </Link>
                      <Link
                        href="/policies"
                        onClick={closeMobileNav}
                        className="block py-3 font-body text-base text-slate hover:text-midnight transition-colors"
                      >
                        My Policies
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={closeMobileNav}
                        className="block py-3 font-body text-base text-slate hover:text-midnight transition-colors"
                      >
                        Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={openLogoutModal}
                        className="w-full text-left py-3 font-body text-base text-slate hover:text-midnight transition-colors"
                      >
                        Log Out
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={closeMobileNav}
                      className="inline-flex mt-2 bg-daybreak text-midnight font-body font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-[#D4921A] transition-colors duration-200"
                    >
                      Login
                    </Link>
                  )}
                </div>
              </nav>
            </div>
          </>
        )}
      </motion.header>
    </>
  );
}
