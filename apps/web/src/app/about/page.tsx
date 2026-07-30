import Image from "next/image";
import Link from "next/link";
import {
  Shield,
  Users,
  Award,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "About Us",
  description:
    "Learn about AfriGlobal Insurance Brokers Limited and the AfriCover247 digital insurance portal.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <section className="bg-midnight text-white py-20 px-6 pt-[50px]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex bg-white rounded-2xl px-8 py-5 mb-8">
            <Image
              src="/afriglobal_logo.png"
              alt="AfriGlobal Insurance Brokers"
              width={220}
              height={70}
              className="h-16 w-auto object-contain"
            />
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl mb-6 leading-tight">
            Protecting What Matters Most to{" "}
            <span className="text-daybreak">Nigerians</span>
          </h1>
          <p className="font-body text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
            AfriGlobal Insurance Brokers Limited is a NAICOM-licensed insurance
            brokerage firm dedicated to making quality insurance accessible to
            every Nigerian — individuals, families, and businesses alike.
          </p>
        </div>
      </section>

      <section className="bg-daybreak py-14 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { value: "20+", label: "Insurance Products" },
            { value: "NAICOM", label: "Licensed & Regulated" },
            { value: "24/7", label: "Digital Access" },
            { value: "100%", label: "Secure Payments" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display font-bold text-midnight text-4xl mb-1">
                {stat.value}
              </p>
              <p className="font-body text-midnight/70 text-sm font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 bg-paper">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="font-body text-daybreak text-sm font-semibold uppercase tracking-widest mb-4">
                Who We Are
              </p>
              <h2 className="font-display font-bold text-midnight text-3xl sm:text-4xl mb-6 leading-tight">
                AfriGlobal Insurance Brokers Limited
              </h2>
              <p className="font-body text-slate text-base leading-relaxed mb-4">
                AfriGlobal Insurance Brokers Limited is a registered insurance
                brokerage firm licensed by the National Insurance Commission
                (NAICOM) of Nigeria. We act as intermediaries between our
                clients and leading underwriting companies, ensuring our clients
                get the best possible coverage at competitive rates.
              </p>
              <p className="font-body text-slate text-base leading-relaxed mb-6">
                Through our digital platform, AfriCover247, we have brought the
                insurance experience into the 21st century — making it possible
                for anyone to browse, apply for, and manage their insurance
                policies entirely online, without visiting an office.
              </p>
              <div className="space-y-3">
                {[
                  "NAICOM Licensed Insurance Broker",
                  "Access to 50+ underwriting partners",
                  "Digital-first insurance experience",
                  "Instant e-policy certificate delivery",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle
                      size={18}
                      className="text-cover-green shrink-0"
                    />
                    <p className="font-body text-slate text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: Shield,
                  title: "Licensed & Regulated",
                  desc: "Fully licensed by NAICOM and operating within Nigeria's regulatory framework.",
                  color: "bg-midnight/10",
                  iconColor: "text-midnight",
                },
                {
                  icon: Users,
                  title: "Customer First",
                  desc: "Every product, every process, every decision is made with our clients in mind.",
                  color: "bg-daybreak/10",
                  iconColor: "text-daybreak",
                },
                {
                  icon: Award,
                  title: "Quality Partners",
                  desc: "We work only with reputable, NAICOM-licensed underwriting companies.",
                  color: "bg-cover-green/10",
                  iconColor: "text-cover-green",
                },
                {
                  icon: TrendingUp,
                  title: "Digital Innovation",
                  desc: "AfriCover247 is our commitment to making insurance simple and accessible.",
                  color: "bg-info/10",
                  iconColor: "text-info",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white rounded-2xl p-5 shadow-sm"
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-4`}
                  >
                    <card.icon size={20} className={card.iconColor} />
                  </div>
                  <h3 className="font-body font-bold text-midnight text-sm mb-2">
                    {card.title}
                  </h3>
                  <p className="font-body text-slate text-xs leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="bg-midnight rounded-2xl p-8">
              <div className="w-12 h-12 bg-daybreak rounded-xl flex items-center justify-center mb-6">
                <Shield size={24} className="text-midnight" />
              </div>
              <h3 className="font-display font-bold text-white text-2xl mb-4">
                Our Mission
              </h3>
              <p className="font-body text-white/70 text-base leading-relaxed">
                To democratise access to quality insurance in Nigeria by
                providing a transparent, digital-first platform where every
                individual and business can protect what matters most — simply,
                quickly, and affordably.
              </p>
            </div>
            <div className="bg-daybreak rounded-2xl p-8">
              <div className="w-12 h-12 bg-midnight rounded-xl flex items-center justify-center mb-6">
                <TrendingUp size={24} className="text-white" />
              </div>
              <h3 className="font-display font-bold text-midnight text-2xl mb-4">
                Our Vision
              </h3>
              <p className="font-body text-midnight/70 text-base leading-relaxed">
                To become Nigeria&apos;s most trusted digital insurance platform
                — the first choice for Nigerians seeking reliable, affordable,
                and accessible insurance coverage for every stage of life and
                business.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-paper">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-body text-daybreak text-sm font-semibold uppercase tracking-widest mb-3">
              Why Choose Us
            </p>
            <h2 className="font-display font-bold text-midnight text-3xl sm:text-4xl">
              The AfriCover247 Difference
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "No Office Visits",
                desc: "Browse, apply, and receive your policy entirely online. No paperwork, no queues.",
              },
              {
                title: "Instant Policy Delivery",
                desc: "Your e-policy certificate is generated and emailed the moment your payment clears.",
              },
              {
                title: "Transparent Pricing",
                desc: "See exactly what you're paying and why. No hidden fees, no surprises.",
              },
              {
                title: "Secure Payments",
                desc: "All payments processed by Monnify. We never store your card details.",
              },
              {
                title: "Real-Time Claims Tracking",
                desc: "File a claim and track its status in real time from your dashboard.",
              },
              {
                title: "Expert Broker Support",
                desc: "AfriGlobal's team of licensed brokers is available to guide you at every step.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-6 border border-slate/10"
              >
                <h3 className="font-body font-bold text-midnight text-base mb-3">
                  {item.title}
                </h3>
                <p className="font-body text-slate text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-midnight">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-bold text-white text-2xl mb-4">
            Fully Licensed and Regulated
          </h2>
          <p className="font-body text-white/60 text-base leading-relaxed mb-8">
            AfriGlobal Insurance Brokers Limited operates under a valid license
            issued by the National Insurance Commission (NAICOM) — the apex
            regulatory authority for insurance in Nigeria. All our products and
            operations comply with Nigerian insurance law.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "NAICOM Licensed",
              "NDPA Compliant",
              "Secured by Monnify",
              "Protected by Cloudflare",
            ].map((badge) => (
              <div
                key={badge}
                className="bg-white/10 rounded-xl px-5 py-3"
              >
                <p className="font-body text-white text-sm font-semibold">
                  {badge}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-paper">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display font-bold text-midnight text-3xl mb-4">
            Ready to Get Covered?
          </h2>
          <p className="font-body text-slate text-base mb-8">
            Browse our full range of insurance products and get covered in
            minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="bg-daybreak text-midnight font-body font-bold text-base px-8 py-4 rounded-xl hover:bg-[#C4700E] transition-colors"
            >
              Browse Products
            </Link>
            <Link
              href="/contact"
              className="border border-midnight text-midnight font-body font-semibold text-base px-8 py-4 rounded-xl hover:bg-midnight hover:text-white transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
