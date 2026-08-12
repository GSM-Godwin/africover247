"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import api from "@/lib/api";

interface TicketResponse {
  id: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  message: string;
  createdAt: string;
  responses?: TicketResponse[];
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .get(`/support/tickets/${id}`)
      .then((res) => setTicket(res.data))
      .catch(() => router.push("/help"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/support/tickets/${id}/responses`, { message: reply });
      setReply("");
      const res = await api.get(`/support/tickets/${id}`);
      setTicket(res.data);
    } catch {
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-paper flex items-center justify-center">
          <div className="animate-pulse w-full max-w-2xl px-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate/10 rounded-xl" />
            ))}
          </div>
        </main>
      </>
    );
  }

  if (!ticket) return null;

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-paper">
        <div className="max-w-2xl mx-auto px-6 py-12 pt-[130px]">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 font-body text-slate text-sm hover:text-midnight mb-6 transition-colors"
          >
            <ArrowLeft size={14} />
            Help Centre
          </Link>

          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display font-bold text-midnight text-2xl">
                {ticket.subject}
              </h1>
              <p className="font-body text-slate text-sm mt-1">
                #{ticket.id.slice(0, 8).toUpperCase()} ·{" "}
                {ticket.category.replace(/_/g, " ")} ·{" "}
                {new Date(ticket.createdAt).toLocaleDateString("en-NG")}
              </p>
            </div>
            <span
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                ticket.status === "resolved"
                  ? "bg-cover-green/10 text-cover-green"
                  : ticket.status === "in_progress"
                    ? "bg-info/10 text-info"
                    : ticket.status === "awaiting_customer"
                      ? "bg-alert-coral/10 text-alert-coral"
                      : "bg-daybreak/10 text-daybreak"
              }`}
            >
              {ticket.status.replace(/_/g, " ")}
            </span>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-white rounded-xl border border-slate/10 p-5">
              <p className="font-body text-xs text-slate mb-2">
                Your original message
              </p>
              <p className="font-body text-midnight text-sm leading-relaxed">
                {ticket.message}
              </p>
            </div>

            {ticket.responses?.map((response) => (
              <div
                key={response.id || response.createdAt}
                className={`rounded-xl border p-5 ${
                  response.isAdmin
                    ? "bg-midnight/5 border-midnight/10"
                    : "bg-white border-slate/10"
                }`}
              >
                <p className="font-body text-xs text-slate mb-2">
                  {response.isAdmin ? "AfriGlobal Support" : "You"} ·{" "}
                  {new Date(response.createdAt).toLocaleDateString("en-NG")}
                </p>
                <p className="font-body text-midnight text-sm leading-relaxed">
                  {response.message}
                </p>
              </div>
            ))}
          </div>

          {ticket.status !== "resolved" && ticket.status !== "closed" && (
            <div className="bg-white rounded-xl border border-slate/10 p-5">
              <textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Add a reply..."
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak resize-none mb-3"
              />
              <button
                type="button"
                onClick={handleReply}
                disabled={sending || !reply.trim()}
                className="inline-flex items-center gap-2 bg-daybreak text-midnight font-body font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#D4921A] disabled:opacity-60 transition-colors"
              >
                <Send size={14} />
                {sending ? "Sending..." : "Send Reply"}
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
