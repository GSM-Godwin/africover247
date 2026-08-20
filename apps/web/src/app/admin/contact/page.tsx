"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Loader2, Mail, MailOpen, Send } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [adminName, setAdminName] = useState("");
  const [sending, setSending] = useState(false);
  const [replySent, setReplySent] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/contact")
      .then((res) => setMessages(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleOpen(msg: ContactMessage) {
    setSelected(msg);
    setShowReply(false);
    setReplyMessage("");
    setReplySent(null);
    if (!msg.read) {
      await api.patch(`/contact/${msg.id}/read`);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m)),
      );
    }
  }

  async function handleSendReply() {
    if (!selected || !replyMessage.trim() || !adminName.trim()) return;
    setSending(true);
    try {
      await api.post(`/contact/${selected.id}/reply`, {
        message: replyMessage,
        adminName,
      });
      setReplySent(selected.email);
      setShowReply(false);
      setReplyMessage("");
    } catch {
      toast.error("Could not send reply. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const unread = messages.filter((m) => !m.read).length;

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <AdminPageHeader
        title="Contact Messages"
        subtitle={
          unread > 0
            ? `${unread} unread message${unread > 1 ? "s" : ""}`
            : "All messages read"
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {loading ? (
            <p className="font-body text-slate text-sm">Loading...</p>
          ) : messages.length === 0 ? (
            <p className="font-body text-slate text-sm">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <button
                key={msg.id}
                type="button"
                onClick={() => handleOpen(msg)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selected?.id === msg.id
                    ? "border-daybreak bg-daybreak/5"
                    : msg.read
                      ? "border-slate/10 bg-white hover:border-slate/20"
                      : "border-midnight/20 bg-midnight/5 hover:border-midnight/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {msg.read ? (
                      <MailOpen size={16} className="text-slate" />
                    ) : (
                      <Mail size={16} className="text-midnight" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p
                        className={`font-body text-sm truncate ${msg.read ? "text-slate" : "font-semibold text-midnight"}`}
                      >
                        {msg.name}
                      </p>
                      <p className="font-body text-xs text-slate shrink-0">
                        {new Date(msg.createdAt).toLocaleDateString("en-NG")}
                      </p>
                    </div>
                    <p className="font-body text-xs text-slate truncate">
                      {msg.subject}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="bg-white border border-slate/10 rounded-xl p-6">
          {selected ? (
            <div>
              <div className="mb-6 pb-6 border-b border-slate/10">
                <h2 className="font-body font-bold text-midnight text-lg mb-4">
                  {selected.subject}
                </h2>
                <div className="space-y-2">
                  {[
                    { label: "From", value: selected.name },
                    { label: "Email", value: selected.email },
                    { label: "Phone", value: selected.phone || "—" },
                    {
                      label: "Received",
                      value: new Date(selected.createdAt).toLocaleString(
                        "en-NG",
                      ),
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-3">
                      <p className="font-body text-xs text-slate uppercase tracking-wide w-16 pt-0.5">
                        {label}
                      </p>
                      <p className="font-body text-sm text-midnight font-medium flex-1">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="font-body text-sm text-midnight leading-relaxed whitespace-pre-wrap">
                {selected.message}
              </p>
              {replySent ? (
                <div className="mt-6 flex items-center gap-2 bg-cover-green/10 border border-cover-green/20 rounded-xl px-4 py-3">
                  <CheckCircle size={16} className="text-cover-green shrink-0" />
                  <p className="font-body text-sm text-cover-green">
                    Reply sent to {replySent}
                  </p>
                </div>
              ) : showReply ? (
                <div className="mt-6 space-y-4 bg-slate/5 border border-slate/10 rounded-xl p-5">
                  <h3 className="font-body font-semibold text-midnight text-sm">
                    Reply to {selected.name}
                  </h3>
                  <div className="bg-slate/5 rounded-lg px-3 py-2 border border-slate/10">
                    <p className="font-body text-xs text-slate">Subject</p>
                    <p className="font-body text-sm text-midnight font-medium">
                      Re: {selected.subject}
                    </p>
                  </div>
                  <div>
                    <label className="block font-body text-xs text-slate mb-1.5">
                      Your name
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g. Casmir Azubuike"
                      className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-xs text-slate mb-1.5">
                      Message
                    </label>
                    <textarea
                      rows={6}
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder={`Dear ${selected.name},\n\nThank you for reaching out...`}
                      className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowReply(false)}
                      className="flex-1 border border-slate/20 text-slate font-body font-medium text-sm py-2.5 rounded-xl hover:bg-slate/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={
                        sending || !replyMessage.trim() || !adminName.trim()
                      }
                      className="flex-1 bg-daybreak text-midnight font-body font-bold text-sm py-2.5 rounded-xl hover:bg-[#C4700E] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Send Reply
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowReply(true)}
                  className="inline-flex items-center gap-2 mt-6 bg-daybreak text-midnight font-body font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-[#C4700E] transition-colors"
                >
                  <Mail size={14} />
                  Reply via Email
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Mail size={32} className="text-slate/30 mb-3" />
              <p className="font-body text-slate text-sm">
                Select a message to read it
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
