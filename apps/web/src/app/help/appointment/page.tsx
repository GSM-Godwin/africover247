"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthInput } from "@/components/auth/auth-input";
import { getUser, isAuthenticated } from "@/lib/auth";
import api from "@/lib/api";

const TOPICS = [
  "Product advice — which insurance is right for me",
  "Motor insurance",
  "Health insurance",
  "Life insurance",
  "Property insurance",
  "Travel insurance",
  "Business insurance",
  "Claim assistance",
  "Policy renewal",
  "General enquiry",
];

export default function AppointmentPage() {
  const router = useRouter();
  const user = getUser();
  const authenticated = isAuthenticated();

  const [form, setForm] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : "",
    email: (user?.email as string) || "",
    phone: "",
    preferredDate: "",
    alternateDate: "",
    topic: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.preferredDate ||
      !form.topic
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/support/appointments", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        preferredDate: new Date(form.preferredDate).toISOString(),
        alternateDate: form.alternateDate
          ? new Date(form.alternateDate).toISOString()
          : undefined,
        topic: form.topic,
        notes: form.notes,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Could not book appointment. Please try again.";
      setError(typeof message === "string" ? message : "Could not book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-paper flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl border border-slate/10 p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-cover-green/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-cover-green" />
            </div>
            <h2 className="font-display font-bold text-midnight text-2xl mb-2">
              Appointment Requested
            </h2>
            <p className="font-body text-slate text-sm mb-6">
              We&apos;ll confirm your appointment within 24 hours. Check your
              email for details.
            </p>
            <p className="font-body text-xs text-slate mb-6">
              Appointments available Mon–Fri 9am–5pm.
            </p>
            <button
              type="button"
              onClick={() => router.push("/help")}
              className="w-full bg-daybreak text-midnight font-body font-bold text-sm py-3 rounded-xl hover:bg-[#D4921A] transition-colors"
            >
              Back to Help Centre
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-paper">
        <div className="max-w-2xl mx-auto px-6 py-12 pt-[130px]">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={24} className="text-midnight" />
            <h1 className="font-display font-bold text-midnight text-3xl">
              Book an Appointment
            </h1>
          </div>
          <p className="font-body text-slate text-base mb-8">
            Speak with an insurance advisor. Available Mon–Fri 9am–5pm.
          </p>

          {error && (
            <div className="bg-alert-coral/10 border border-alert-coral/20 rounded-xl px-4 py-3 mb-6">
              <p className="font-body text-sm text-alert-coral">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate/10 p-8 space-y-5">
            {!authenticated && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  label="Full Name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
                <AuthInput
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
              </div>
            )}

            <AuthInput
              label="Phone Number"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="08012345678"
              required
            />

            <div>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                What would you like to discuss?{" "}
                <span className="text-alert-coral">*</span>
              </label>
              <select
                value={form.topic}
                onChange={(e) => update("topic", e.target.value)}
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak bg-white"
              >
                <option value="">Select topic</option>
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                  Preferred Date <span className="text-alert-coral">*</span>
                </label>
                <input
                  type="date"
                  value={form.preferredDate}
                  onChange={(e) => update("preferredDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                  Alternate Date
                </label>
                <input
                  type="date"
                  value={form.alternateDate}
                  onChange={(e) => update("alternateDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
                />
              </div>
            </div>

            <div>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                Additional notes
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Anything else we should know before your appointment..."
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-daybreak text-midnight font-body font-bold text-sm py-3.5 rounded-xl hover:bg-[#D4921A] disabled:opacity-60 transition-colors"
            >
              {loading ? "Booking..." : "Request Appointment"}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
