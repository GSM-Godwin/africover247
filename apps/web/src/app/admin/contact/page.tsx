"use client";

import { useEffect, useState } from "react";
import { Mail, MailOpen } from "lucide-react";
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

  useEffect(() => {
    api
      .get("/contact")
      .then((res) => setMessages(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleOpen(msg: ContactMessage) {
    setSelected(msg);
    if (!msg.read) {
      await api.patch(`/contact/${msg.id}/read`);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m)),
      );
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
              <a
                href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}
                className="inline-flex items-center gap-2 mt-6 bg-daybreak text-midnight font-body font-bold text-sm px-4 py-2 rounded-lg hover:bg-[#C4700E] transition-colors"
              >
                <Mail size={14} />
                Reply via Email
              </a>
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
