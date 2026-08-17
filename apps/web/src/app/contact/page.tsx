"use client";

import Link from "next/link";
import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const CONTACT_INFO = [
  {
    icon: MapPin,
    label: "Head Office (Lagos)",
    value: "141c Oshodi/Gbagada Expressway, Anthony, Lagos, Nigeria",
  },
  {
    icon: MapPin,
    label: "Abuja Office",
    value:
      "Polaris Bank Building, 3 Kaura Namoda Street Area, Garki FCT, Abuja, Nigeria",
  },
  {
    icon: MapPin,
    label: "Port Harcourt Office",
    value:
      "Polaris Bank Building, 204 Aba Road, Beside Mr. Biggs, Rumuola, Port Harcourt",
  },
  {
    icon: Phone,
    label: "Lagos",
    value: "08101315330 / 09063675032",
    href: "tel:+2348101315330",
  },
  {
    icon: Phone,
    label: "Abuja",
    value: "08033000728",
    href: "tel:+2348033000728",
  },
  {
    icon: Phone,
    label: "Port Harcourt",
    value: "08037605330",
    href: "tel:+2348037605330",
  },
  {
    icon: Mail,
    label: "Email",
    value: "info@afriglobal.com.ng",
    href: "mailto:info@afriglobal.com.ng",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) return;
    setLoading(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://africover247.onrender.com"}/contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      setSubmitted(true);
    } catch {
      alert("Could not send message. Please try again or email us directly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <section className="bg-midnight text-white py-16 px-6 pt-[130px]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-body text-daybreak text-sm font-semibold uppercase tracking-widest mb-3">
            Get in Touch
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl mb-4">
            Contact Us
          </h1>
          <p className="font-body text-white/70 text-base max-w-xl mx-auto">
            Have a question about a product, a claim, or just want to speak to
            someone? We are here to help.
          </p>
        </div>
      </section>

      <section className="py-20 px-6 bg-paper">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="font-display font-bold text-midnight text-2xl mb-8">
                AfriGlobal Insurance Brokers Limited
              </h2>

              <div className="space-y-6 mb-10">
                {CONTACT_INFO.map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <div className="w-11 h-11 rounded-xl bg-midnight/10 flex items-center justify-center shrink-0">
                      <item.icon size={18} className="text-midnight" />
                    </div>
                    <div>
                      <p className="font-body text-xs text-slate uppercase tracking-wide mb-0.5">
                        {item.label}
                      </p>
                      {"href" in item && item.href ? (
                        <a
                          href={item.href}
                          className="font-body text-base font-semibold text-midnight hover:text-daybreak transition-colors"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="font-body text-base font-semibold text-midnight">
                          {item.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-midnight/10 flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-midnight" />
                  </div>
                  <div>
                    <p className="font-body text-xs text-slate uppercase tracking-wide mb-0.5">
                      Working Hours
                    </p>
                    <p className="font-body text-base font-semibold text-midnight">
                      Monday – Friday
                    </p>
                    <p className="font-body text-sm text-slate">
                      8:00 AM – 6:00 PM WAT
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-daybreak/10 border border-daybreak/20 rounded-2xl p-6">
                <h3 className="font-body font-bold text-midnight text-base mb-4">
                  Quick Help
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Browse insurance products", href: "/products" },
                    {
                      label: "Help Centre & Support",
                      href: "/help",
                    },
                    {
                      label: "View NAICOM registered insurers",
                      href: "/insurers",
                    },
                    { label: "Learn about AfriGlobal", href: "/about" },
                  ].map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="flex items-center gap-2 font-body text-sm text-midnight hover:text-daybreak transition-colors"
                    >
                      <span className="text-daybreak">→</span>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate/10 p-8">
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-16 h-16 bg-cover-green/10 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-cover-green" />
                  </div>
                  <h3 className="font-display font-bold text-midnight text-xl mb-2">
                    Message Sent
                  </h3>
                  <p className="font-body text-slate text-sm">
                    Thank you for reaching out. Our team will get back to you
                    within 24 hours.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="font-display font-bold text-midnight text-xl mb-6">
                    Send us a message
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                          Full Name{" "}
                          <span className="text-alert-coral">*</span>
                        </label>
                        <input
                          required
                          value={form.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                          placeholder="Your full name"
                          className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
                        />
                      </div>
                      <div>
                        <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                          Phone Number
                        </label>
                        <input
                          value={form.phone}
                          onChange={(e) =>
                            handleChange("phone", e.target.value)
                          }
                          placeholder="08012345678"
                          className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                        Email Address{" "}
                        <span className="text-alert-coral">*</span>
                      </label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="your@email.com"
                        className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
                      />
                    </div>
                    <div>
                      <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                        Subject <span className="text-alert-coral">*</span>
                      </label>
                      <select
                        required
                        value={form.subject}
                        onChange={(e) =>
                          handleChange("subject", e.target.value)
                        }
                        className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak bg-white"
                      >
                        <option value="">Select a subject</option>
                        <option value="product-enquiry">Product Enquiry</option>
                        <option value="claim-support">Claim Support</option>
                        <option value="policy-renewal">Policy Renewal</option>
                        <option value="quote-request">Quote Request</option>
                        <option value="complaint">Complaint</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                        Message <span className="text-alert-coral">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={form.message}
                        onChange={(e) =>
                          handleChange("message", e.target.value)
                        }
                        placeholder="Tell us how we can help you..."
                        className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-daybreak text-midnight font-body font-bold text-sm py-3 rounded-xl hover:bg-[#C4700E] disabled:opacity-60 transition-colors"
                    >
                      {loading ? (
                        <span>Sending...</span>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Message
                        </>
                      )}
                    </button>
                    <p className="font-body text-xs text-slate text-center">
                      By submitting this form you agree to our{" "}
                      <Link
                        href="/privacy-policy"
                        className="text-midnight hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
