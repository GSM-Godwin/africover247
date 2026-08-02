"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { NumberInput } from "@/components/shared/number-input";
import { QuoteCountdown } from "@/components/shared/quote-countdown";
import type { QuoteRecord } from "@/types/quote";

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

export default function AdminQuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    api
      .get<QuoteRecord>(`/admin/quotes/${id}`)
      .then((res) => setQuote(res.data))
      .catch(() => {
        toast.error("Quote not found");
        router.push("/admin/quotes");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleRespond() {
    if (!quoteAmount || parseFloat(quoteAmount) <= 0) {
      toast.error("Please enter a valid quote amount.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/admin/quotes/${id}/respond`, {
        quoteAmount: parseFloat(quoteAmount),
        note: note || undefined,
      });
      setSubmitting(false);
      toast.success("Quote sent to customer.");
      setQuoteAmount("");
      setNote("");
      const res = await api.get<QuoteRecord>(`/admin/quotes/${id}`);
      setQuote(res.data);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(message || "Could not send quote.");
      setSubmitting(false);
    }
  }

  async function handleAcceptCounter() {
    setSubmitting(true);
    try {
      await api.post(`/admin/quotes/${id}/accept-counter`);
      setSubmitting(false);
      toast.success("Counter-offer accepted. Application created.");
      router.push("/admin/quotes");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(message || "Could not accept counter.");
      setSubmitting(false);
    }
  }

  async function handleCounter() {
    if (!quoteAmount || parseFloat(quoteAmount) <= 0) {
      toast.error("Please enter a counter amount.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/admin/quotes/${id}/counter`, {
        counterAmount: parseFloat(quoteAmount),
        note: note || undefined,
      });
      setSubmitting(false);
      toast.success("Counter-offer sent to customer.");
      setQuoteAmount("");
      setNote("");
      const res = await api.get<QuoteRecord>(`/admin/quotes/${id}`);
      setQuote(res.data);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(message || "Could not send counter.");
      setSubmitting(false);
    }
  }

  async function handleReject() {
    setSubmitting(true);
    try {
      await api.post(`/admin/quotes/${id}/reject`, {
        reason: rejectReason || undefined,
      });
      setSubmitting(false);
      toast.success("Quote rejected.");
      router.push("/admin/quotes");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(message || "Could not reject quote.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-daybreak border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!quote) return null;

  const isPendingReview = quote.status === "pending_review";
  const isCounteredByCustomer = quote.status === "countered_by_customer";
  const isTerminal = ["accepted", "rejected", "expired"].includes(quote.status);
  const roundsRemaining = MAX_ROUNDS - quote.roundsUsed;
  const history = Array.isArray(quote.negotiationHistory)
    ? quote.negotiationHistory
    : [];

  return (
    <div className="p-6 sm:p-8 max-w-4xl">
      <button
        type="button"
        onClick={() => router.push("/admin/quotes")}
        className="flex items-center gap-2 font-body text-slate text-sm hover:text-midnight transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        All Quotes
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="font-body text-xs text-slate uppercase tracking-widest mb-1">
            {quote.product.category}
          </p>
          <h1 className="font-display font-bold text-midnight text-2xl">
            {quote.product.name}
          </h1>
          <p className="font-body text-slate text-sm mt-1">
            {quote.customer?.firstName} {quote.customer?.lastName} ·{" "}
            {quote.customer?.email}
          </p>
          {quote.customer?.phone && (
            <p className="font-body text-slate text-sm">{quote.customer.phone}</p>
          )}
        </div>
        <span className="font-body text-xs font-medium px-3 py-1.5 rounded-full bg-slate/10 text-slate shrink-0">
          {quote.status.replace(/_/g, " ")}
        </span>
      </div>

      {quote.status === "pending_review" && (
        <div className="mb-4">
          <QuoteCountdown createdAt={quote.createdAt} deadlineDays={3} />
        </div>
      )}

      <div className="space-y-4">
      <div className="bg-white border border-slate/20 rounded-xl p-6">
        <h2 className="font-body font-semibold text-midnight text-base mb-4">
          Customer Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {Object.entries(quote.customerDetails || {}).map(([key, value]) => (
            <div key={key}>
              <p className="font-body text-xs text-slate uppercase tracking-wide mb-0.5">
                {key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (s) => s.toUpperCase())}
              </p>
              <p className="font-body text-sm text-midnight font-medium">
                {String(value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-white border border-slate/20 rounded-xl p-6">
          <h2 className="font-body font-semibold text-midnight text-base mb-4">
            Negotiation History
          </h2>
          <div className="space-y-3">
            {[...history].reverse().map((entry, i) => (
              <div key={i} className="flex gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    entry.actor === "admin" ? "bg-midnight" : "bg-daybreak"
                  }`}
                />
                <div>
                  <p className="font-body text-sm font-semibold text-midnight">
                    {entry.actor === "admin"
                      ? "You (AfriGlobal)"
                      : `${quote.customer?.firstName} ${quote.customer?.lastName}`}
                    <span className="font-normal text-slate ml-2 text-xs">
                      {new Date(entry.timestamp).toLocaleDateString("en-NG")}
                    </span>
                  </p>
                  <p className="font-body text-sm text-slate">
                    {entry.action.replace(/_/g, " ")}
                    {entry.amount
                      ? ` — ₦${Number(entry.amount).toLocaleString("en-NG")}/year`
                      : ""}
                  </p>
                  {entry.note && (
                    <p className="font-body text-xs text-slate/70 italic mt-0.5">
                      &ldquo;{decodeHtml(entry.note)}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isTerminal && (
        <div className="bg-white border border-slate/20 rounded-xl p-6">
          <h2 className="font-body font-semibold text-midnight text-base mb-4">
            {isPendingReview
              ? "Send Quote"
              : isCounteredByCustomer
                ? `Customer Counter: ₦${parseFloat(quote.customerCounterAmount || "0").toLocaleString("en-NG")}/year`
                : "Quote Sent — Awaiting Customer Response"}
          </h2>

          {isCounteredByCustomer && quote.customerNote && (
            <div className="bg-daybreak/10 border border-daybreak/20 rounded-lg p-3 mb-4">
              <p className="font-body text-sm text-midnight italic">
                Customer note: &ldquo;{decodeHtml(quote.customerNote)}&rdquo;
              </p>
            </div>
          )}

          {(isPendingReview || isCounteredByCustomer) && (
            <div className="space-y-4 mb-4">
              <div>
                <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                  {isCounteredByCustomer
                    ? "Your counter amount (₦/year)"
                    : "Quote amount (₦/year)"}
                </label>
                <NumberInput
                  value={quoteAmount}
                  onChange={(raw) => setQuoteAmount(raw)}
                  placeholder="Enter quote amount"
                  prefix="₦"
                  className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                  Notes / Terms (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Rate based on property age and construction type."
                  className="w-full bg-transparent border-b border-slate/40 pb-2 font-body text-base text-midnight focus:border-daybreak focus:outline-none transition-colors resize-none"
                />
              </div>
              {isCounteredByCustomer && (
                <p className="font-body text-xs text-slate">
                  Rounds used: {quote.roundsUsed} of {MAX_ROUNDS}
                </p>
              )}
            </div>
          )}

          {isPendingReview && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRespond}
                disabled={submitting}
                className="flex-1 bg-daybreak text-midnight font-body font-bold text-sm py-3 rounded-lg hover:bg-[#C4700E] disabled:opacity-60 transition-colors"
              >
                {submitting ? "Sending..." : "Send Quote"}
              </button>
              <button
                type="button"
                onClick={() => setShowRejectForm(!showRejectForm)}
                className="border border-alert-coral text-alert-coral font-body text-sm px-4 py-3 rounded-lg hover:bg-alert-coral/5 transition-colors"
              >
                Reject
              </button>
            </div>
          )}

          {isCounteredByCustomer && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleAcceptCounter}
                disabled={submitting}
                className="flex-1 bg-cover-green text-white font-body font-bold text-sm py-3 rounded-lg hover:bg-cover-green/90 disabled:opacity-60 transition-colors"
              >
                Accept Counter
              </button>
              {roundsRemaining > 0 && (
                <button
                  type="button"
                  onClick={handleCounter}
                  disabled={submitting}
                  className="flex-1 bg-daybreak text-midnight font-body font-bold text-sm py-3 rounded-lg hover:bg-[#C4700E] disabled:opacity-60 transition-colors"
                >
                  {submitting ? "Sending..." : `Counter (${roundsRemaining} left)`}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowRejectForm(!showRejectForm)}
                className="border border-alert-coral text-alert-coral font-body text-sm px-4 py-3 rounded-lg hover:bg-alert-coral/5 transition-colors"
              >
                Reject
              </button>
            </div>
          )}

          {showRejectForm && (
            <div className="mt-4 p-4 bg-alert-coral/5 border border-alert-coral/20 rounded-lg">
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                Reason for rejection (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                placeholder="e.g. Unable to offer cover for this risk profile at this time."
                className="w-full bg-transparent border-b border-alert-coral/40 pb-2 font-body text-sm text-midnight focus:outline-none resize-none mb-3"
              />
              <button
                type="button"
                onClick={handleReject}
                disabled={submitting}
                className="w-full bg-alert-coral text-white font-body font-bold text-sm py-2.5 rounded-lg hover:bg-alert-coral/90 disabled:opacity-60 transition-colors"
              >
                {submitting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          )}
        </div>
      )}

      {isTerminal && (
        <div className="bg-white border border-slate/20 rounded-xl p-6 text-center">
          <p className="font-body text-slate text-base">
            This quote is{" "}
            <span className="font-semibold text-midnight">
              {quote.status.replace(/_/g, " ")}
            </span>
            {quote.finalAmount && (
              <>
                {" "}
                at ₦{parseFloat(quote.finalAmount).toLocaleString("en-NG")}/year
              </>
            )}
            .
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
