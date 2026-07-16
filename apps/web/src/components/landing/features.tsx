"use client";

import { Zap, Shield, Smartphone, MessageCircle } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-container";
import { Reveal } from "@/components/shared/reveal";

const features = [
  {
    icon: Zap,
    title: "Instant e-Policy",
    description:
      "Your digital policy lands the moment payment clears. No office visit.",
  },
  {
    icon: Shield,
    title: "Verified & Secure",
    description:
      "Payments secured by Paystack. Your data stays yours.",
  },
  {
    icon: Smartphone,
    title: "Built for Mobile",
    description:
      "Apply, track claims, and manage cover entirely from your phone.",
  },
  {
    icon: MessageCircle,
    title: "Real Support",
    description:
      "Reach our team by chat or WhatsApp — real people, not just a bot.",
  },
];

export function Features() {
  return (
    <section className="bg-paper py-20 sm:py-24">
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8">
        <div className="mb-12">
          <Reveal>
            <p className="font-body text-daybreak text-xs font-semibold uppercase tracking-widest mb-3">
              Why AfriCover247
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display font-bold text-midnight text-3xl sm:text-4xl">
              Insurance, without the wait
            </h2>
          </Reveal>
        </div>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <StaggerItem key={feature.title}>
                <div className="group bg-white border border-slate/20 rounded-lg p-6 hover:border-daybreak hover:bg-daybreak/[0.04] transition-all duration-200 cursor-default h-full">
                  <div className="w-10 h-10 bg-daybreak/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-daybreak/20 transition-colors duration-200">
                    <Icon
                      size={20}
                      className="text-daybreak group-hover:scale-110 transition-transform duration-200"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="font-body font-semibold text-midnight text-base mb-2">
                    {feature.title}
                  </h3>
                  <p className="font-body text-slate text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
