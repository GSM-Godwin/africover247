"use client";

import { Reveal } from "@/components/shared/reveal";
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-container";

const trustBadges = [
  "Secured by Paystack",
  "Secured by Cloudflare",
  "NDPA-aware data handling",
];

export function Testimonial() {
  return (
    <section className="bg-midnight py-20 sm:py-24">
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8 text-center">
        <Reveal>
          <div className="w-10 h-10 mx-auto mb-8 opacity-30">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8 28C8 24.686 9.343 21.686 11.515 19.515L18 13H14L6 21C4.343 22.657 4 24.686 4 28C4 32.418 7.582 36 12 36C16.418 36 20 32.418 20 28C20 23.582 16.418 20 12 20C10.686 20 9.448 20.343 8.392 20.949C8.14 23.228 8 25.589 8 28ZM28 28C28 24.686 29.343 21.686 31.515 19.515L38 13H34L26 21C24.343 22.657 24 24.686 24 28C24 32.418 27.582 36 32 36C36.418 36 40 32.418 40 28C40 23.582 36.418 20 32 20C30.686 20 29.448 20.343 28.392 20.949C28.14 23.228 28 25.589 28 28Z"
                fill="#F4A73C"
              />
            </svg>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <blockquote className="font-display font-medium text-paper text-xl sm:text-2xl lg:text-3xl leading-snug max-w-3xl mx-auto mb-8">
            I filed a claim after a fender bender and had my payout approved in
            four days. No office visits, no waiting.
          </blockquote>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="flex flex-col items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-full bg-daybreak flex items-center justify-center font-body font-semibold text-midnight text-sm">
              AJ
            </div>
            <p className="font-body text-paper/60 text-sm">Ada J. — Lagos</p>
          </div>
        </Reveal>

        <StaggerContainer className="flex flex-wrap justify-center gap-3">
          {trustBadges.map((badge) => (
            <StaggerItem key={badge}>
              <span className="font-body text-paper/60 text-xs border border-paper/20 px-4 py-2 rounded-full">
                {badge}
              </span>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
