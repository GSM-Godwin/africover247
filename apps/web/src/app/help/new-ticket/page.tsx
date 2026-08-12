"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthInput } from "@/components/auth/auth-input";
import { getUser, isAuthenticated } from "@/lib/auth";
import api from "@/lib/api";

const CATEGORIES = [
  { value: "claim_support", label: "Claim Support" },
  { value: "payment_issue", label: "Payment Issue" },
  { value: "policy_query", label: "Policy Query" },
  { value: "product_enquiry", label: "Product Enquiry" },
  { value: "complaint", label: "Complaint" },
  { value: "other", label: "Other" },
];

function NewTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = getUser();
  const authenticated = isAuthenticated();
  const initialCategory = searchParams.get("category") || "";

  const [form, setForm] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : "",
    email: (user?.email as string) || "",
    phone: "",
    category: initialCategory,
    subject: "",
    message: "",
    referenceId: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketRef, setTicketRef] = useState("");
  const [error, setError] = useState("");

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (
      !form.name ||
      !form.email ||
      !form.category ||
      !form.subject ||
      !form.message
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/support/tickets", form);
      setTicketRef(res.data.id.slice(0, 8).toUpperCase());
      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Could not submit request. Please try again.";
      setError(typeof message === "string" ? message : "Could not submit request. Please try again.");
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
              Request Submitted
            </h2>
            <p className="font-body text-slate text-sm mb-2">
              Your support request has been received.
            </p>
            <p className="font-mono font-bold text-midnight text-lg mb-6">
              #{ticketRef}
            </p>
            <p className="font-body text-slate text-xs mb-6">
              We&apos;ll respond within 24 hours. Check your email for
              confirmation.
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
          <h1 className="font-display font-bold text-midnight text-3xl mb-2">
            Submit a Request
          </h1>
          <p className="font-body text-slate text-base mb-8">
            Tell us how we can help. We&apos;ll respond within 24 hours.
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
            />

            <div>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                Category <span className="text-alert-coral">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak bg-white"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <AuthInput
              label="Subject"
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              placeholder="Brief description of your issue"
              required
            />

            <AuthInput
              label="Policy / Claim Reference (optional)"
              value={form.referenceId}
              onChange={(e) => update("referenceId", e.target.value)}
              placeholder="e.g. POL-2024-001"
            />

            <div>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                Message <span className="text-alert-coral">*</span>
              </label>
              <textarea
                rows={5}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Describe your issue in detail..."
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-daybreak text-midnight font-body font-bold text-sm py-3.5 rounded-xl hover:bg-[#D4921A] disabled:opacity-60 transition-colors"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function NewTicketPage() {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />
          <main className="pt-16 min-h-screen bg-paper flex items-center justify-center">
            <div className="animate-pulse w-full max-w-2xl px-6 h-96 bg-slate/10 rounded-2xl" />
          </main>
          <Footer />
        </>
      }
    >
      <NewTicketForm />
    </Suspense>
  );
}
