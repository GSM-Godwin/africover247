import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Products } from "@/components/landing/products";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonial } from "@/components/landing/testimonial";
import { CtaBand } from "@/components/landing/cta-band";
import { Footer } from "@/components/layout/footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Products />
        <HowItWorks />
        <Testimonial />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
