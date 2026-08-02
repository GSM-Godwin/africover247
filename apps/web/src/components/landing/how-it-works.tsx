"use client";

import { Reveal } from "@/components/shared/reveal";
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-container";

const steps = [
  {
    number: "01",
    title: "Browse Plans",
    description: "Compare motor, property, health, and specialty cover side by side.",
  },
  {
    number: "02",
    title: "Apply & Verify",
    description: "KYC and documents, in under ten minutes.",
  },
  {
    number: "03",
    title: "Pay Securely",
    description: "Hosted checkout; your card never touches our servers.",
  },
  {
    number: "04",
    title: "Get Covered",
    description: "Your e-policy arrives instantly, ready to download.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-paper py-20 sm:py-24">
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8">
        <div className="mb-14">
          <Reveal>
            <p className="font-body text-daybreak text-xs font-semibold uppercase tracking-widest mb-3">
              How It Works
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display font-bold text-midnight text-3xl sm:text-4xl">
              From browsing to covered in four steps
            </h2>
          </Reveal>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-8 left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] h-px bg-slate/20 origin-left" />

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step) => (
              <StaggerItem key={step.number}>
                <div className="group flex flex-col items-start lg:items-center lg:text-center">
                  <div className="relative z-10 w-12 h-12 rounded-full border-2 border-daybreak/40 flex items-center justify-center mb-4 bg-paper group-hover:bg-daybreak group-hover:border-daybreak transition-all duration-200">
                    <span className="font-mono font-medium text-daybreak text-sm group-hover:text-midnight transition-colors duration-200">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="font-body font-semibold text-midnight text-base mb-2 group-hover:text-daybreak transition-colors duration-200">
                    {step.title}
                  </h3>
                  <p className="font-body text-slate text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
