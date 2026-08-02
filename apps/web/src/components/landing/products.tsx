"use client";

import Link from "next/link";
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-container";
import { Reveal } from "@/components/shared/reveal";

const PRODUCT_CATEGORIES = [
  {
    label: "Motor Insurance",
    href: "/products?category=Motor",
    description:
      "Comprehensive and third-party motor vehicle coverage for individuals and fleets.",
    icon: "🚗",
  },
  {
    label: "Property Insurance",
    href: "/products?category=Property",
    description:
      "Protect your home, office, and assets against fire, theft, and natural disasters.",
    icon: "🏠",
  },
  {
    label: "Health Insurance",
    href: "/products?category=Health",
    description:
      "Medical coverage for individuals, families, and corporate groups.",
    icon: "❤️",
  },
  {
    label: "All Products",
    href: "/products",
    description:
      "Explore our full range of insurance products — Marine, Engineering, Life, Travel and more.",
    icon: "🛡️",
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

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCT_CATEGORIES.map((category) => (
            <StaggerItem key={category.label}>
              <Link
                href={category.href}
                className="group bg-white border border-slate/20 rounded-lg p-6 hover:border-daybreak hover:bg-daybreak/[0.04] transition-all duration-200 h-full flex flex-col"
              >
                <div className="w-10 h-10 bg-daybreak/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-daybreak/20 transition-colors duration-200 text-xl">
                  {category.icon}
                </div>

                <h3 className="font-body font-semibold text-midnight text-lg mb-3 group-hover:text-daybreak transition-colors duration-200">
                  {category.label}
                </h3>

                <p className="font-body text-slate text-sm leading-relaxed mb-6 flex-1">
                  {category.description}
                </p>

                <span className="font-body text-midnight text-sm font-medium group-hover:text-daybreak transition-colors duration-150 mt-auto">
                  Explore products →
                </span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
