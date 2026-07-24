"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";

export function CtaBand() {
  return (
    <section className="bg-paper py-20 sm:py-24">
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8 text-center">
        <Reveal>
          <h2 className="font-display font-bold text-midnight text-3xl sm:text-4xl mb-3">
            Ready when you are.
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="font-body text-slate text-base mb-8 max-w-sm mx-auto">
            Get a plan, apply in minutes, and carry your cover in your pocket.
          </p>
        </Reveal>

        <Reveal delay={0.22}>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-daybreak text-midnight font-body font-semibold text-sm px-6 py-3.5 rounded-md hover:bg-[#C4700E] group transition-colors duration-200"
          >
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform duration-200"
            />
            Get Started
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
