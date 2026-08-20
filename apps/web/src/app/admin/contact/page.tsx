"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Loader2, Mail, MailOpen, Send } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

interface ContactReply {
  id: string;
  adminName: string;
  content: string;
  sentAt: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  read: boolean;
  replied: boolean;
  repliedAt: string | null;
  createdAt: string;
  replies: ContactReply[];
}

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [replySent, setReplySent] = useState(false);

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
    setReplySent(false);
    if (!msg.read) {
      await api.patch(`/contact/${msg.id}/read`);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m)),
      );
    }
  }

  async function handleSendReply() {
    if (!selected || !replyMessage.trim()) return;
    setSending(true);
    try {
      await api.post(`/contact/${selected.id}/reply`, {
        message: replyMessage,
      });
      setReplySent(true);
      setShowReply(false);
      setReplyMessage("");
      const res = await api.get(`/contact/${selected.id}`);
      setSelected(res.data);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selected.id
            ? { ...m, replied: true, replies: res.data.replies }
            : m,
        ),
      );
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
                    <div className="flex items-center gap-2">
                      <p className="font-body text-xs text-slate truncate flex-1">
                        {msg.subject}
                      </p>
                      {msg.replied && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cover-green/10 text-cover-green text-xs font-semibold">
                          <CheckCircle size={10} />
                          Replied
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="bg-white border border-slate/10 rounded-xl p-6 min-h-[32rem]">
          {selected ? (
            <div className="flex flex-col h-full">
              <div className="mb-5 pb-5 border-b border-slate/10">
                <h2 className="font-body font-bold text-midnight text-lg mb-3">
                  {selected.subject}
                </h2>
                <div className="space-y-1.5">
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

              <div className="flex-1 space-y-4 overflow-y-auto mb-5 max-h-96">
                <div className="bg-slate/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-midnight/10 flex items-center justify-center">
                      <span className="font-body text-xs font-bold text-midnight">
                        {selected.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-body text-xs font-semibold text-midnight">
                        {selected.name}
                      </p>
                      <p className="font-body text-xs text-slate">
                        {new Date(selected.createdAt).toLocaleString("en-NG")}
                      </p>
                    </div>
                  </div>
                  <p className="font-body text-sm text-midnight leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </p>
                </div>

                {selected.replies?.map((reply) => (
                  <div
                    key={reply.id}
                    className="bg-daybreak/5 border border-daybreak/20 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-daybreak/20 flex items-center justify-center">
                        <span className="font-body text-xs font-bold text-daybreak">
                          {reply.adminName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-body text-xs font-semibold text-midnight">
                          {reply.adminName}{" "}
                          <span className="text-daybreak font-normal">
                            (AfriGlobal)
                          </span>
                        </p>
                        <p className="font-body text-xs text-slate">
                          {new Date(reply.sentAt).toLocaleString("en-NG")}
                        </p>
                      </div>
                    </div>
                    <p className="font-body text-sm text-midnight leading-relaxed whitespace-pre-wrap">
                      {reply.content}
                    </p>
                  </div>
                ))}
              </div>

              {replySent && (
                <div className="flex items-center gap-2 bg-cover-green/10 border border-cover-green/20 rounded-xl px-4 py-3 mb-3">
                  <CheckCircle
                    size={16}
                    className="text-cover-green shrink-0"
                  />
                  <p className="font-body text-sm text-cover-green">
                    Reply sent successfully
                  </p>
                </div>
              )}

              {showReply ? (
                <div className="space-y-3 bg-slate/5 border border-slate/10 rounded-xl p-4">
                  <p className="font-body text-xs font-semibold text-midnight uppercase tracking-wide">
                    Reply to {selected.name}
                  </p>
                  <div className="bg-white rounded-lg px-3 py-2 border border-slate/10">
                    <p className="font-body text-xs text-slate">Subject</p>
                    <p className="font-body text-sm text-midnight font-medium">
                      Re: {selected.subject}
                    </p>
                  </div>
                  <textarea
                    rows={5}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak resize-none"
                  />
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
                      disabled={sending || !replyMessage.trim()}
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
                  className="inline-flex items-center gap-2 bg-daybreak text-midnight font-body font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-[#C4700E] transition-colors"
                >
                  <Mail size={14} />
                  Reply
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
