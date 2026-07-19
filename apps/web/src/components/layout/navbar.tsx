"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown } from "lucide-react";
import { LogoutConfirmModal } from "@/components/shared/logout-confirm-modal";
import {
  getUser,
  getUserDisplayName,
  getUserInitials,
  isAuthenticated,
} from "@/lib/auth";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUserState] = useState<Record<string, unknown> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setUserState(getUser());
    setMenuOpen(false);
  }, [pathname]);

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

  function openLogoutModal() {
    setMenuOpen(false);
    setLogoutModalOpen(true);
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
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
        scrolled
          ? "bg-midnight/95 backdrop-blur-sm shadow-sm"
          : "bg-midnight"
      }`}
    >
      <div className="max-w-[1140px] mx-auto px-8 h-full flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-0 shrink-0">
          <span className="font-display font-bold text-paper text-xl leading-none">
            AfriCover
          </span>
          <span className="font-mono font-medium text-daybreak text-xl leading-none">
            247
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: "Home", href: "/" },
            { label: "Products", href: "/products" },
            { label: "Claims", href: "/claims" },
            { label: "About", href: "/about" },
          ].map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative group text-sm font-body font-medium transition-colors duration-150 ${
                  isActive
                    ? "text-paper"
                    : "text-paper/70 hover:text-paper"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-daybreak transition-all duration-200 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          {authenticated && user ? (
            <>
              <button
                aria-label="Notifications"
                className="relative text-paper/70 hover:text-paper transition-colors duration-150"
              >
                <Bell size={20} />
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex items-center gap-2 text-paper/80 hover:text-paper transition-colors duration-150"
                >
                  <div className="w-8 h-8 rounded-full bg-daybreak flex items-center justify-center text-midnight text-xs font-body font-semibold">
                    {getUserInitials(user)}
                  </div>
                  <span className="hidden md:block text-sm font-body">
                    {getUserDisplayName(user)}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-paper/60 transition-transform duration-150 ${
                      menuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-[0_4px_24px_rgba(16,26,52,0.12)] py-1.5 z-50">
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 font-body text-sm text-midnight hover:bg-slate-100 transition-colors"
                    >
                      My Account
                    </Link>
                    <Link
                      href="/policies"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 font-body text-sm text-midnight hover:bg-slate-100 transition-colors"
                    >
                      My Policies
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 font-body text-sm text-midnight hover:bg-slate-100 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <div className="my-1.5 border-t border-slate/15" />
                    <button
                      type="button"
                      onClick={openLogoutModal}
                      className="w-full text-left px-4 py-2.5 font-body text-sm text-midnight hover:bg-slate-100 transition-colors"
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
              className="bg-daybreak text-midnight font-body font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-[#D4921A] transition-colors duration-200"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </motion.header>
    </>
  );
}
