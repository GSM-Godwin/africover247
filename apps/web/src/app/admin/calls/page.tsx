"use client";

import { useEffect, useState } from "react";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import api from "@/lib/api";

const OUTCOMES = [
  "Resolved",
  "Follow-up required",
  "Escalated",
  "No answer",
  "Voicemail left",
  "Customer callback requested",
  "Transferred",
];

const TOPICS = [
  "Policy query",
  "Claim support",
  "Payment issue",
  "Product enquiry",
  "Complaint",
  "Renewal reminder",
  "Quote follow-up",
  "General enquiry",
];

interface CallLog {
  id: string;
  customerName: string;
  customerPhone: string;
  direction: string;
  duration: number | null;
  topic: string;
  notes: string | null;
  outcome: string;
  calledAt: string;
  admin: { firstName: string; lastName: string };
}

interface CallStats {
  total: number;
  outbound: number;
  inbound: number;
  todayTotal: number;
}

export default function AdminCallsPage() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [stats, setStats] = useState<CallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    direction: "outbound",
    duration: "",
    topic: "",
    notes: "",
    outcome: "",
    calledAt: new Date().toISOString().slice(0, 16),
  });

  async function fetchData() {
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.get("/support/calls", { params: search ? { search } : {} }),
        api.get("/support/calls/stats"),
      ]);
      setLogs(logsRes.data);
      setStats(statsRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [search]);

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.customerName || !form.customerPhone || !form.topic || !form.outcome) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/support/calls", {
        ...form,
        duration: form.duration ? parseInt(form.duration) : undefined,
      });
      toast.success("Call logged.");
      setShowForm(false);
      setForm({
        customerName: "",
        customerPhone: "",
        direction: "outbound",
        duration: "",
        topic: "",
        notes: "",
        outcome: "",
        calledAt: new Date().toISOString().slice(0, 16),
      });
      fetchData();
    } catch {
      toast.error("Could not save call log.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this call log?")) return;
    try {
      await api.delete(`/support/calls/${id}`);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      toast.success("Call log deleted.");
    } catch {
      toast.error("Could not delete.");
    }
  }

  function formatDuration(minutes: number | null) {
    if (!minutes) return "—";
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl space-y-6">
      <AdminPageHeader
        title="Call Logs"
        subtitle="Log and track all customer calls."
      />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Calls", value: stats.total, icon: Phone },
            { label: "Outbound", value: stats.outbound, icon: PhoneOutgoing },
            { label: "Inbound", value: stats.inbound, icon: PhoneIncoming },
            { label: "Today", value: stats.todayTotal, icon: Phone },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-slate/10 p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className="text-slate" />
                <p className="font-body text-sm text-slate">{label}</p>
              </div>
              <p className="font-display font-bold text-midnight text-2xl">
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate/20 rounded-lg font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-daybreak text-midnight font-body font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#D4921A] transition-colors"
        >
          <Plus size={16} />
          Log a Call
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate/10 p-6 space-y-4">
          <h3 className="font-body font-semibold text-midnight text-base">
            Log New Call
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                Customer Name *
              </label>
              <input
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
                placeholder="Full name"
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm focus:outline-none focus:border-daybreak"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                Phone Number *
              </label>
              <input
                value={form.customerPhone}
                onChange={(e) => update("customerPhone", e.target.value)}
                placeholder="08012345678"
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm focus:outline-none focus:border-daybreak"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                Direction
              </label>
              <select
                value={form.direction}
                onChange={(e) => update("direction", e.target.value)}
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm focus:outline-none focus:border-daybreak bg-white"
              >
                <option value="outbound">Outbound (we called)</option>
                <option value="inbound">Inbound (they called us)</option>
              </select>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) => update("duration", e.target.value)}
                placeholder="e.g. 15"
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm focus:outline-none focus:border-daybreak"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                Topic *
              </label>
              <select
                value={form.topic}
                onChange={(e) => update("topic", e.target.value)}
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm focus:outline-none focus:border-daybreak bg-white"
              >
                <option value="">Select topic</option>
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                Outcome *
              </label>
              <select
                value={form.outcome}
                onChange={(e) => update("outcome", e.target.value)}
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm focus:outline-none focus:border-daybreak bg-white"
              >
                <option value="">Select outcome</option>
                {OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={form.calledAt}
                onChange={(e) => update("calledAt", e.target.value)}
                className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm focus:outline-none focus:border-daybreak"
              />
            </div>
          </div>
          <div>
            <label className="block font-body text-sm font-medium text-midnight mb-1.5">
              Notes
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Summary of the call..."
              className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm focus:outline-none focus:border-daybreak resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 border border-slate/20 text-slate font-body font-medium text-sm py-2.5 rounded-xl hover:bg-slate/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-daybreak text-midnight font-body font-bold text-sm py-2.5 rounded-xl hover:bg-[#D4921A] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Call Log"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate/10 overflow-x-auto">
        {loading ? (
          <div className="animate-pulse p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate/10 rounded" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <Phone size={32} className="text-slate/30 mx-auto mb-3" />
            <p className="font-body text-slate text-sm">
              No call logs yet. Log your first call above.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate/5 border-b border-slate/10">
              <tr>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">
                  Date & Time
                </th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">
                  Customer
                </th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">
                  Direction
                </th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">
                  Topic
                </th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">
                  Duration
                </th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">
                  Outcome
                </th>
                <th className="text-left font-body font-semibold text-slate px-4 py-3">
                  Logged by
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate/2">
                  <td className="px-4 py-3 font-body text-slate text-xs whitespace-nowrap">
                    {new Date(log.calledAt).toLocaleDateString("en-NG")}{" "}
                    {new Date(log.calledAt).toLocaleTimeString("en-NG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-body text-midnight text-sm">
                      {log.customerName}
                    </p>
                    <p className="font-body text-slate text-xs">
                      {log.customerPhone}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        log.direction === "outbound"
                          ? "bg-daybreak/10 text-daybreak"
                          : "bg-midnight/10 text-midnight"
                      }`}
                    >
                      {log.direction === "outbound" ? (
                        <PhoneOutgoing size={10} />
                      ) : (
                        <PhoneIncoming size={10} />
                      )}
                      {log.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-midnight text-sm">
                    {log.topic}
                  </td>
                  <td className="px-4 py-3 font-body text-slate text-sm">
                    {formatDuration(log.duration)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        log.outcome === "Resolved"
                          ? "bg-cover-green/10 text-cover-green"
                          : log.outcome === "No answer"
                            ? "bg-slate/10 text-slate"
                            : log.outcome === "Escalated"
                              ? "bg-alert-coral/10 text-alert-coral"
                              : "bg-daybreak/10 text-daybreak"
                      }`}
                    >
                      {log.outcome}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-slate text-xs">
                    {log.admin.firstName} {log.admin.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(log.id)}
                      className="text-slate hover:text-alert-coral transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
