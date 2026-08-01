"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageCircle,
} from "lucide-react";
import api from "@/lib/api";
import { QuoteCountdown } from "@/components/shared/quote-countdown";
import type { QuoteRecord } from "@/types/quote";
import type { ApplicationRecord } from "@/types/application";

const MAX_ROUNDS = 3;

function decodeHtml(html: string): string {
  return html
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/");
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterNote, setCounterNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCounterForm, setShowCounterForm] = useState(false);

  useEffect(() => {
    api
      .get<QuoteRecord>(`/quotes/${id}`)
      .then((res) => setQuote(res.data))
      .catch(() => {
        toast.error("Quote not found");
        router.push("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleAccept() {
    setSubmitting(true);
    try {
      const res = await api.post<{
        applicationId: string;
        amount: number;
      }>(`/quotes/${id}/accept`);
      setSubmitting(false);
      toast.success("Quote accepted! Proceeding to payment...");
      router.push(
        `/apply/${quote!.product.id}/${res.data.applicationId}/payment`,
      );
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(message || "Could not accept quote.");
      setSubmitting(false);
    }
  }

  async function handleReject() {
    setSubmitting(true);
    try {
      await api.post(`/quotes/${id}/reject`);
      setSubmitting(false);
      toast.success("Quote declined.");
      router.push("/dashboard?tab=quotes");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(message || "Could not reject quote.");
      setSubmitting(false);
    }
  }

  async function handleCounter() {
    if (!counterAmount || parseFloat(counterAmount) <= 0) {
      toast.error("Please enter a valid counter amount.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/quotes/${id}/counter`, {
        counterAmount: parseFloat(counterAmount),
        note: counterNote || undefined,
      });
      setSubmitting(false);
      toast.success("Counter-offer submitted.");
      setShowCounterForm(false);
      setCounterAmount("");
      setCounterNote("");
      const res = await api.get<QuoteRecord>(`/quotes/${id}`);
      setQuote(res.data);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(message || "Could not submit counter-offer.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-daybreak border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!quote) return null;

  const currentAmount = quote.adminQuoteAmount || quote.customerCounterAmount;
  const canAct = ["quote_sent", "countered_by_admin"].includes(quote.status);
  const roundsRemaining = MAX_ROUNDS - quote.roundsUsed;
  const isAccepted = quote.status === "accepted";
  const isRejected = ["rejected", "expired"].includes(quote.status);
  const history = Array.isArray(quote.negotiationHistory)
    ? quote.negotiationHistory
    : [];

  return (
    <div className="py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 font-body text-slate text-sm hover:text-midnight transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="bg-white border border-slate/20 rounded-xl p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="font-body text-xs text-slate uppercase tracking-widest mb-1">
                {quote.product.category}
              </p>
              <h1 className="font-display font-bold text-midnight text-2xl">
                {quote.product.name}
              </h1>
            </div>
            <span
              className={`font-body text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${
                isAccepted
                  ? "bg-cover-green/10 text-cover-green"
                  : isRejected
                    ? "bg-alert-coral/10 text-alert-coral"
                    : canAct
                      ? "bg-daybreak/10 text-daybreak"
                      : "bg-slate/10 text-slate"
              }`}
            >
              {quote.status
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          </div>

          {currentAmount && (
            <div className="bg-paper rounded-lg p-4">
              <p className="font-body text-sm text-slate mb-1">
                {isAccepted ? "Agreed premium" : "Current offer"}
              </p>
              <p className="font-mono text-midnight text-3xl font-medium">
                ₦{parseFloat(currentAmount).toLocaleString("en-NG")}
                <span className="font-body text-slate text-base font-normal">
                  /year
                </span>
              </p>
              {quote.expiresAt && canAct && (
                <p className="font-body text-xs text-slate/60 mt-2">
                  Offer expires:{" "}
                  {new Date(quote.expiresAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          )}
        </div>

        {quote.status !== "accepted" && quote.status !== "rejected" && (
          <div className="mb-4">
            <QuoteCountdown createdAt={quote.createdAt} deadlineDays={3} />
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-white border border-slate/20 rounded-xl p-6 mb-4">
            <h2 className="font-body font-semibold text-midnight text-base mb-4">
              Negotiation History
            </h2>
            <div className="space-y-4">
              {[...history].reverse().map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      entry.actor === "admin"
                        ? "bg-midnight/10"
                        : "bg-daybreak/10"
                    }`}
                  >
                    <MessageCircle
                      size={14}
                      className={
                        entry.actor === "admin"
                          ? "text-midnight"
                          : "text-daybreak"
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-body text-sm font-semibold text-midnight">
                        {entry.actor === "admin" ? "AfriGlobal" : "You"}
                      </p>
                      <p className="font-body text-xs text-slate">
                        {new Date(entry.timestamp).toLocaleDateString("en-NG")}
                      </p>
                    </div>
                    <p className="font-body text-sm text-slate capitalize">
                      {entry.action.replace(/_/g, " ")}
                      {entry.amount
                        ? ` — ₦${entry.amount.toLocaleString("en-NG")}/year`
                        : ""}
                    </p>
                    {entry.note && (
                      <p className="font-body text-sm text-slate/70 mt-1 italic">
                        &ldquo;{decodeHtml(entry.note)}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showCounterForm && canAct && (
          <div className="bg-white border border-daybreak/30 rounded-xl p-6 mb-4">
            <h2 className="font-body font-semibold text-midnight text-base mb-4">
              Your Counter-Offer
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                  Your proposed premium (₦/year)
                </label>
                <input
                  type="number"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  placeholder="e.g. 95000"
                  className="w-full bg-transparent border-b border-slate/40 pb-2 font-mono text-base text-midnight focus:border-daybreak focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                  Note (optional)
                </label>
                <textarea
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. I would appreciate a lower rate based on my clean claim history."
                  className="w-full bg-transparent border-b border-slate/40 pb-2 font-body text-base text-midnight focus:border-daybreak focus:outline-none transition-colors resize-none"
                />
              </div>
              <p className="font-body text-xs text-slate">
                Rounds remaining: {roundsRemaining} of {MAX_ROUNDS}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCounterForm(false)}
                  className="flex-1 border border-slate/30 text-midnight font-body text-sm py-2.5 rounded-lg hover:border-midnight transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCounter}
                  disabled={submitting}
                  className="flex-1 bg-midnight text-white font-body font-semibold text-sm py-2.5 rounded-lg hover:bg-midnight/90 disabled:opacity-60 transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit Counter"}
                </button>
              </div>
            </div>
          </div>
        )}

        {canAct && !showCounterForm && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleAccept}
              disabled={submitting}
              className="flex-1 bg-daybreak text-midnight font-body font-bold text-sm py-3.5 rounded-lg hover:bg-[#C4700E] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              Accept — ₦
              {parseFloat(currentAmount || "0").toLocaleString("en-NG")}/year
            </button>

            {roundsRemaining > 0 && (
              <button
                type="button"
                onClick={() => setShowCounterForm(true)}
                className="flex-1 border border-midnight text-midnight font-body font-semibold text-sm py-3.5 rounded-lg hover:bg-midnight/5 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} />
                Counter ({roundsRemaining} left)
              </button>
            )}

            <button
              type="button"
              onClick={handleReject}
              disabled={submitting}
              className="flex-1 border border-alert-coral text-alert-coral font-body font-semibold text-sm py-3.5 rounded-lg hover:bg-alert-coral/5 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle size={16} />
              Decline
            </button>
          </div>
        )}

        {isAccepted && quote.finalAmount && (
          <div className="bg-cover-green/10 border border-cover-green/30 rounded-xl p-6 text-center">
            <CheckCircle className="text-cover-green mx-auto mb-3" size={32} />
            <h2 className="font-display font-bold text-midnight text-xl mb-1">
              Quote Accepted
            </h2>
            <p className="font-body text-slate text-sm mb-4">
              Agreed premium: ₦
              {parseFloat(quote.finalAmount).toLocaleString("en-NG")}/year
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  const appRes = await api.get<ApplicationRecord[]>(
                    "/applications/my",
                  );
                  const quoteApp = appRes.data.find(
                    (a) =>
                      (a.formData as { quoteId?: string } | null)?.quoteId ===
                      quote.id,
                  );
                  if (quoteApp) {
                    router.push(
                      `/apply/${quote.product.id}/${quoteApp.id}/payment`,
                    );
                  } else {
                    toast.error(
                      "Application not found. Please contact support.",
                    );
                  }
                } catch {
                  toast.error("Could not load application.");
                }
              }}
              className="bg-daybreak text-midnight font-body font-bold text-sm px-8 py-3 rounded-lg hover:bg-[#C4700E] transition-colors"
            >
              Proceed to Payment
            </button>
          </div>
        )}

        {isRejected && (
          <div className="bg-alert-coral/5 border border-alert-coral/20 rounded-xl p-6 text-center">
            <XCircle className="text-alert-coral mx-auto mb-3" size={32} />
            <h2 className="font-display font-bold text-midnight text-xl mb-1">
              {quote.status === "expired" ? "Quote Expired" : "Quote Declined"}
            </h2>
            <p className="font-body text-slate text-sm mb-4">
              {quote.status === "expired"
                ? "This quote has expired. Request a new one to continue."
                : "This quote has been declined."}
            </p>
            <button
              type="button"
              onClick={() =>
                router.push(`/quotes/new?productId=${quote.product.id}`)
              }
              className="border border-midnight text-midnight font-body font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-midnight/5 transition-colors"
            >
              Request New Quote
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
