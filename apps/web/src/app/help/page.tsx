"use client";

import { useEffect, useState, useCallback, type ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Phone,
  Calendar,
  FileText,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Clock,
  CheckCircle,
  CreditCard,
  X,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { isAuthenticated } from "@/lib/auth";
import api from "@/lib/api";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
  responses: { message: string; isAdmin: boolean; createdAt: string }[];
}

interface Appointment {
  id: string;
  topic: string;
  preferredDate: string;
  status: string;
  confirmedDate: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: ComponentType<{ size?: number }> }
> = {
  open: { label: "Open", color: "bg-daybreak/10 text-daybreak", icon: Clock },
  in_progress: {
    label: "In Progress",
    color: "bg-info/10 text-info",
    icon: RefreshCw,
  },
  awaiting_customer: {
    label: "Awaiting You",
    color: "bg-alert-coral/10 text-alert-coral",
    icon: AlertCircle,
  },
  payment_issue: {
    label: "Payment Issue",
    color: "bg-alert-coral/10 text-alert-coral",
    icon: CreditCard,
  },
  resolved: {
    label: "Resolved",
    color: "bg-cover-green/10 text-cover-green",
    icon: CheckCircle,
  },
  closed: { label: "Closed", color: "bg-slate/10 text-slate", icon: X },
};

const QUICK_ACTIONS = [
  {
    icon: MessageCircle,
    label: "Chat with us",
    href: null,
    action: "chat",
    color: "bg-[#25D366]/10 text-[#25D366]",
  },
  {
    icon: Phone,
    label: "Call us",
    href: "tel:+2348101315330",
    action: null,
    color: "bg-daybreak/10 text-daybreak",
  },
  {
    icon: Calendar,
    label: "Book appointment",
    href: "/help/appointment",
    action: null,
    color: "bg-info/10 text-info",
  },
  {
    icon: FileText,
    label: "Make a claim",
    href: "/claims/new",
    action: null,
    color: "bg-midnight/10 text-midnight",
  },
  {
    icon: Search,
    label: "Track my claim",
    href: "/claims",
    action: null,
    color: "bg-midnight/10 text-midnight",
  },
  {
    icon: Download,
    label: "Download policy",
    href: "/policies",
    action: null,
    color: "bg-cover-green/10 text-cover-green",
  },
  {
    icon: RefreshCw,
    label: "Renew my policy",
    href: "/policies",
    action: null,
    color: "bg-daybreak/10 text-daybreak",
  },
  {
    icon: AlertCircle,
    label: "Make a complaint",
    href: "/help/complaint",
    action: null,
    color: "bg-alert-coral/10 text-alert-coral",
  },
];

export default function HelpPage() {
  const router = useRouter();
  const authenticated = isAuthenticated();
  const [search, setSearch] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMyRequests = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    try {
      const [ticketsRes, appointmentsRes] = await Promise.all([
        api.get("/support/tickets/my"),
        api.get("/support/appointments/my"),
      ]);
      setTickets(ticketsRes.data);
      setAppointments(appointmentsRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [authenticated]);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  function handleQuickAction(action: string | null, href: string | null) {
    if (action === "chat") {
      window.open(
        "https://wa.me/2349063675032?text=Hello%2C%20I%20need%20help%20with%20my%20AfriCover247%20insurance.",
        "_blank",
      );
      return;
    }
    if (href) {
      if (href.startsWith("tel:")) {
        window.location.href = href;
        return;
      }
      router.push(href);
    }
  }

  const filteredTickets = tickets.filter(
    (t) =>
      !search || t.subject.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-paper">
        <section className="bg-midnight text-white py-12 px-6 pt-[130px]">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-display font-bold text-3xl sm:text-4xl mb-3">
              How can we help you?
            </h1>
            <p className="font-body text-white/70 text-base mb-6">
              Search for answers or choose a quick action below
            </p>
            <div className="relative max-w-lg mx-auto">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. how to file a claim, download policy..."
                className="w-full pl-11 pr-4 py-3.5 rounded-xl font-body text-sm text-midnight placeholder:text-slate focus:outline-none focus:ring-2 focus:ring-daybreak"
              />
            </div>
          </div>
        </section>

        <section className="py-12 px-6">
          <div className="max-w-[1140px] mx-auto space-y-10">
            <div>
              <h2 className="font-display font-bold text-midnight text-xl mb-5">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() =>
                      handleQuickAction(action.action, action.href)
                    }
                    className="flex flex-col items-center gap-3 bg-white rounded-2xl border border-slate/10 p-5 hover:border-daybreak/30 hover:shadow-md transition-all text-center group"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}
                    >
                      <action.icon size={22} />
                    </div>
                    <span className="font-body text-sm font-semibold text-midnight group-hover:text-daybreak transition-colors">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate/10 p-6">
              <h2 className="font-display font-bold text-midnight text-xl mb-4">
                Support Hours
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    channel: "WhatsApp & Live Chat",
                    hours: "8am – 6pm",
                    days: "Mon – Sat",
                    icon: MessageCircle,
                  },
                  {
                    channel: "Phone",
                    hours: "9am – 5pm",
                    days: "Mon – Fri",
                    icon: Phone,
                  },
                  {
                    channel: "Appointments",
                    hours: "9am – 5pm",
                    days: "Mon – Fri",
                    icon: Calendar,
                  },
                  {
                    channel: "Email & Claims",
                    hours: "24/7",
                    days: "Always available",
                    icon: FileText,
                  },
                ].map((item) => (
                  <div key={item.channel} className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-midnight/5 flex items-center justify-center shrink-0">
                      <item.icon size={18} className="text-midnight" />
                    </div>
                    <div>
                      <p className="font-body font-semibold text-midnight text-sm">
                        {item.channel}
                      </p>
                      <p className="font-body text-slate text-xs">{item.hours}</p>
                      <p className="font-body text-slate text-xs">{item.days}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {authenticated && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display font-bold text-midnight text-xl">
                    My Requests
                  </h2>
                  <Link
                    href="/help/new-ticket"
                    className="font-body text-sm font-semibold text-midnight border border-slate/20 px-4 py-2 rounded-lg hover:bg-slate/5 transition-colors"
                  >
                    New request
                  </Link>
                </div>

                {loading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-20 bg-slate/10 rounded-xl" />
                    ))}
                  </div>
                ) : tickets.length === 0 && appointments.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate/10 p-8 text-center">
                    <p className="font-body text-slate text-sm">
                      No support requests yet.
                    </p>
                    <Link
                      href="/help/new-ticket"
                      className="font-body text-sm font-semibold text-midnight underline mt-2 inline-block hover:text-daybreak transition-colors"
                    >
                      Submit a request
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTickets.map((ticket) => {
                      const statusConf =
                        STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                      const StatusIcon = statusConf.icon;
                      return (
                        <Link
                          key={ticket.id}
                          href={`/help/tickets/${ticket.id}`}
                          className="block bg-white rounded-xl border border-slate/10 p-5 hover:border-daybreak/20 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-body font-semibold text-midnight text-sm truncate">
                                {ticket.subject}
                              </p>
                              <p className="font-body text-slate text-xs mt-0.5">
                                #{ticket.id.slice(0, 8).toUpperCase()} ·{" "}
                                {ticket.category.replace(/_/g, " ")} ·{" "}
                                {new Date(ticket.createdAt).toLocaleDateString(
                                  "en-NG",
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusConf.color}`}
                              >
                                <StatusIcon size={12} />
                                {statusConf.label}
                              </span>
                              <ChevronRight size={16} className="text-slate" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}

                    {appointments.map((appt) => (
                      <div
                        key={appt.id}
                        className="bg-white rounded-xl border border-slate/10 p-5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-body font-semibold text-midnight text-sm">
                              Appointment: {appt.topic}
                            </p>
                            <p className="font-body text-slate text-xs mt-0.5">
                              Requested:{" "}
                              {new Date(appt.preferredDate).toLocaleDateString(
                                "en-NG",
                              )}
                              {appt.confirmedDate &&
                                ` · Confirmed: ${new Date(appt.confirmedDate).toLocaleDateString("en-NG")}`}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                              appt.status === "confirmed"
                                ? "bg-cover-green/10 text-cover-green"
                                : appt.status === "pending"
                                  ? "bg-daybreak/10 text-daybreak"
                                  : "bg-slate/10 text-slate"
                            }`}
                          >
                            {appt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!authenticated && (
              <div className="bg-midnight rounded-2xl p-8 text-center">
                <h2 className="font-display font-bold text-white text-xl mb-2">
                  Track your support requests
                </h2>
                <p className="font-body text-white/70 text-sm mb-5">
                  Log in to view your ticket status, appointment confirmations
                  and claim updates.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-daybreak text-midnight font-body font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#D4921A] transition-colors"
                >
                  Log in to view my requests
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
