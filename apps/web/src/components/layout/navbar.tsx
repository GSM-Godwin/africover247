"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Bell, ChevronDown } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
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
          <span className="font-mono font-medium text-paper text-xl leading-none">
            247
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: "Home", href: "/" },
            { label: "Products", href: "/products" },
            { label: "Claims", href: "/claims" },
            { label: "About", href: "/about" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-paper/80 hover:text-paper text-sm font-body font-medium transition-colors duration-150 group"
            >
              {link.label}
              <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-daybreak group-hover:w-full transition-all duration-200 origin-left" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            aria-label="Notifications"
            className="relative text-paper/70 hover:text-paper transition-colors duration-150"
          >
            <Bell size={20} />
          </button>

          <button className="flex items-center gap-2 text-paper/80 hover:text-paper transition-colors duration-150">
            <div className="w-8 h-8 rounded-full bg-daybreak flex items-center justify-center text-midnight text-xs font-body font-semibold">
              AJ
            </div>
            <span className="hidden md:block text-sm font-body">Ada J.</span>
            <ChevronDown size={14} className="text-paper/60" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
