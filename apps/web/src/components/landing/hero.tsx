"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PolicyCardStack } from "@/components/shared/policy-card-stack";

function StatItem({
  value,
  label,
  delay,
}: {
  value: string;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="text-center"
    >
      <p className="font-display font-bold text-paper text-2xl sm:text-3xl">
        {value}
      </p>
      <p className="font-body text-paper/60 text-sm mt-0.5">{label}</p>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative bg-midnight min-h-screen flex flex-col justify-center pt-[50px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-midnight via-midnight to-[#1a2d5a] pointer-events-none" />

      <div className="relative max-w-[1140px] mx-auto px-6 sm:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-16 lg:py-24">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
              className="font-body text-daybreak text-xs font-semibold uppercase tracking-widest mb-4"
            >
              Digital-First Insurance
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="font-display font-bold text-paper text-[40px] sm:text-5xl lg:text-[56px] leading-[1.1] mb-6"
            >
              Protection,{" "}
              <br />
              without the{" "}
              <br />
              paperwork.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
              className="font-body text-sm text-paper/60 mt-2 mb-6"
            >
              Powered by{" "}
              <span className="font-semibold text-paper">
                AfriGlobal Insurance Brokers Limited
              </span>{" "}
              · NAICOM Licensed
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
              className="font-body text-paper/70 text-base sm:text-lg leading-relaxed mb-8 max-w-md"
            >
              Apply, pay, and manage your policy entirely on your phone. No
              office visits, no waiting rooms; just cover, the moment you need
              it.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.55, ease: "easeOut" }}
              className="flex flex-wrap gap-3"
            >
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-daybreak text-midnight font-body font-semibold text-sm px-5 py-3 rounded-md hover:bg-[#D4921A] transition-colors duration-200"
              >
                <ArrowRight size={16} />
                Get Started
              </Link>

              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 border border-paper/30 text-paper font-body font-medium text-sm px-5 py-3 rounded-md hover:border-paper/60 hover:bg-paper/5 transition-all duration-200"
              >
                See how it works
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>

          <div className="hidden lg:flex justify-center items-center">
            <PolicyCardStack />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="border-t border-paper/10 py-8"
        >
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <StatItem value="50K+" label="Policies Issued" delay={0.75} />
            <StatItem value="24/7" label="Claim Tracking" delay={0.85} />
            <StatItem value="4.8★" label="Customer Rating" delay={0.95} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
