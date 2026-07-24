"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-container";
import { Reveal } from "@/components/shared/reveal";

const products = [
  {
    icon: Zap,
    name: "Motor Comprehensive",
    highlights: [
      "Own damage + third-party",
      "Own damage",
      "Third-party liability",
    ],
    price: "₦45,000",
    href: "/products/motor",
  },
  {
    icon: Zap,
    name: "Health Essentials",
    highlights: [
      "Outpatient × hospital cover",
      "Outpatient care",
      "Hospital admission",
    ],
    price: "₦72,000",
    href: "/products/health",
  },
  {
    icon: Zap,
    name: "SSLAG / SSPP",
    highlights: [
      "Lagos State scheme",
      "State-backed cover",
      "Family add-ons",
    ],
    price: "₦18,000",
    href: "/products/sslag",
  },
];

export function Products() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8">
        <div className="mb-12">
          <Reveal>
            <p className="font-body text-daybreak text-xs font-semibold uppercase tracking-widest mb-3">
              Our Products
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display font-bold text-midnight text-3xl sm:text-4xl">
              Choose your cover
            </h2>
          </Reveal>
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => {
            const Icon = product.icon;
            return (
              <StaggerItem key={product.name}>
                <div className="group bg-white border border-slate/20 rounded-lg p-6 hover:border-daybreak hover:bg-daybreak/[0.04] transition-all duration-200 h-full flex flex-col">
                  <div className="w-10 h-10 bg-daybreak/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-daybreak/20 transition-colors duration-200">
                    <Icon
                      size={20}
                      className="text-daybreak group-hover:scale-[1.08] transition-transform duration-200"
                      strokeWidth={1.5}
                    />
                  </div>

                  <h3 className="font-body font-semibold text-midnight text-lg mb-3">
                    {product.name}
                  </h3>

                  <ul className="space-y-1.5 mb-6 flex-1">
                    {product.highlights.map((item) => (
                      <li
                        key={item}
                        className="font-body text-slate text-sm flex items-start gap-2"
                      >
                        <span className="text-daybreak mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <p className="font-mono text-midnight font-medium text-lg mb-1 group-hover:text-daybreak transition-colors duration-200">
                    {product.price}
                    <span className="font-body text-slate text-sm font-normal">
                      /year
                    </span>
                  </p>
                  <p className="font-body text-slate text-xs mb-5">
                    From {product.price}/year
                  </p>

                  <div className="flex items-center gap-3 mt-auto">
                    <Link
                      href={product.href}
                      className="font-body text-midnight text-sm font-medium hover:text-daybreak transition-colors duration-150 underline-offset-2 hover:underline"
                    >
                      Learn more
                    </Link>
                    <Link
                      href="/register"
                      className="flex-1 text-center bg-daybreak text-midnight font-body font-semibold text-sm px-4 py-2.5 rounded-md hover:bg-[#C4700E] transition-colors duration-200"
                    >
                      Get Covered
                    </Link>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
