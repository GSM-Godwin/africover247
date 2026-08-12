"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import api from "@/lib/api";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "awaiting_customer", label: "Awaiting Customer" },
  { value: "payment_issue", label: "Payment Issue" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

interface TicketResponse {
  message: string;
  isAdmin: boolean;
}

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  adminNote?: string;
  createdAt: string;
  responses?: TicketResponse[];
}

interface TicketStats {
  open: number;
  inProgress: number;
  awaitingCustomer: number;
  resolved: number;
  total: number;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("");
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        api.get("/support/admin/tickets", {
          params: activeFilter ? { status: activeFilter } : {},
        }),
        api.get("/support/admin/tickets/stats"),
      ]);
      setTickets(ticketsRes.data);
      setStats(statsRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleUpdateStatus() {
    if (!selected || !newStatus) return;
    setUpdating(true);
    try {
      await api.patch(`/support/admin/tickets/${selected.id}/status`, {
        status: newStatus,
        adminNote: adminNote || undefined,
      });
      toast.success("Ticket updated.");
      fetchData();
      setSelected(null);
    } catch {
      toast.error("Could not update ticket.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleReply() {
    if (!selected || !reply.trim()) return;
    setUpdating(true);
    try {
      await api.post(`/support/admin/tickets/${selected.id}/responses`, {
        message: reply,
      });
      toast.success("Reply sent.");
      setReply("");
      fetchData();
    } catch {
      toast.error("Could not send reply.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Support Tickets"
        subtitle="Manage customer support requests."
      />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Open", value: stats.open, color: "text-daybreak" },
            { label: "In Progress", value: stats.inProgress, color: "text-info" },
            {
              label: "Awaiting",
              value: stats.awaitingCustomer,
              color: "text-alert-coral",
            },
            { label: "Resolved", value: stats.resolved, color: "text-cover-green" },
            { label: "Total", value: stats.total, color: "text-midnight" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-slate/10 p-4 text-center"
            >
              <p className={`font-display font-bold text-2xl ${s.color}`}>
                {s.value}
              </p>
              <p className="font-body text-xs text-slate mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {[{ value: "", label: "All" }, ...STATUS_OPTIONS].map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setActiveFilter(s.value)}
            className={`font-body text-sm px-4 py-1.5 rounded-full border transition-colors ${
              activeFilter === s.value
                ? "bg-midnight text-white border-midnight"
                : "border-slate/20 text-slate hover:border-midnight/20"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate/10 overflow-hidden">
        {loading ? (
          <div className="animate-pulse p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate/10 rounded" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <p className="font-body text-slate text-sm p-6">No tickets found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate/5 border-b border-slate/10">
              <tr>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">
                  Reference
                </th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">
                  Customer
                </th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">
                  Subject
                </th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">
                  Category
                </th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">
                  Status
                </th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">
                  Date
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate/5">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate/2">
                  <td className="px-4 py-3 font-mono text-xs text-midnight">
                    #{ticket.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 font-body text-midnight">
                    {ticket.name}
                  </td>
                  <td className="px-4 py-3 font-body text-midnight max-w-xs truncate">
                    {ticket.subject}
                  </td>
                  <td className="px-4 py-3 font-body text-slate">
                    {ticket.category.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        ticket.status === "resolved"
                          ? "bg-cover-green/10 text-cover-green"
                          : ticket.status === "in_progress"
                            ? "bg-info/10 text-info"
                            : ticket.status === "open"
                              ? "bg-daybreak/10 text-daybreak"
                              : "bg-slate/10 text-slate"
                      }`}
                    >
                      {ticket.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-slate text-xs">
                    {new Date(ticket.createdAt).toLocaleDateString("en-NG")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(ticket);
                        setNewStatus(ticket.status);
                        setAdminNote(ticket.adminNote || "");
                      }}
                      className="font-body text-sm text-midnight underline hover:text-daybreak"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display font-bold text-midnight text-xl mb-1">
              {selected.subject}
            </h2>
            <p className="font-body text-slate text-sm mb-4">
              #{selected.id.slice(0, 8).toUpperCase()} · {selected.name} ·{" "}
              {selected.email}
            </p>

            <div className="bg-slate/5 rounded-lg p-4 mb-4">
              <p className="font-body text-sm text-midnight">
                {selected.message}
              </p>
            </div>

            {selected.responses?.map((r, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 mb-2 ${r.isAdmin ? "bg-midnight/5" : "bg-daybreak/5"}`}
              >
                <p className="font-body text-xs text-slate mb-1">
                  {r.isAdmin ? "Support" : "Customer"}
                </p>
                <p className="font-body text-sm text-midnight">{r.message}</p>
              </div>
            ))}

            <div className="border-t border-slate/10 pt-4 mt-4 space-y-3">
              <div>
                <label className="block font-body text-sm font-medium text-midnight mb-1">
                  Update Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-slate/20 rounded-lg px-3 py-2 font-body text-sm focus:outline-none focus:border-daybreak"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-midnight mb-1">
                  Admin Note
                </label>
                <input
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full border border-slate/20 rounded-lg px-3 py-2 font-body text-sm focus:outline-none focus:border-daybreak"
                  placeholder="Internal note..."
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-midnight mb-1">
                  Reply to Customer
                </label>
                <textarea
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="w-full border border-slate/20 rounded-lg px-3 py-2 font-body text-sm focus:outline-none focus:border-daybreak resize-none"
                  placeholder="Type your reply..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="flex-1 border border-slate/20 text-slate font-body font-medium text-sm py-2.5 rounded-xl hover:bg-slate/5"
                >
                  Close
                </button>
                {reply.trim() && (
                  <button
                    type="button"
                    onClick={handleReply}
                    disabled={updating}
                    className="flex-1 bg-midnight text-white font-body font-bold text-sm py-2.5 rounded-xl hover:bg-midnight/90 disabled:opacity-60"
                  >
                    Send Reply
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="flex-1 bg-daybreak text-midnight font-body font-bold text-sm py-2.5 rounded-xl hover:bg-[#D4921A] disabled:opacity-60"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
