"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import {
  NotificationFilterPills,
  notificationEmptyLabel,
} from "@/components/notifications/notification-filter-pills";
import api from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { NotificationRecord } from "@/types/notification";

function NotificationRowSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-5 animate-pulse flex items-center gap-4">
      <div className="w-5 h-5 bg-slate-100 rounded shrink-0" />
      <div className="h-4 bg-slate-100 rounded flex-1" />
      <div className="w-2 h-2 bg-slate-100 rounded-full shrink-0" />
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        activeFilter === "unread"
          ? "/notifications?unread=true"
          : "/notifications";
      const res = await api.get<NotificationRecord[]>(url);
      setNotifications(res.data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  function handleNotificationClick(notification: NotificationRecord) {
    api.patch(`/notifications/${notification.id}/read`).catch(() => {});

    if (notification.referenceType === "policy" && notification.referenceId) {
      router.push(`/policies/${notification.referenceId}`);
      return;
    }

    if (notification.referenceType === "claim" && notification.referenceId) {
      router.push(`/claims/${notification.referenceId}`);
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F5F6F8]">
        <div className="max-w-[1140px] mx-auto px-6 sm:px-8 py-10 sm:py-12">
          <div className="mb-8">
            <h1 className="font-display font-bold text-midnight text-3xl sm:text-4xl">
              Notifications
            </h1>
          </div>

          <div className="mb-8">
            <NotificationFilterPills
              active={activeFilter}
              onChange={setActiveFilter}
            />
          </div>

          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <NotificationRowSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <p className="font-body text-slate text-base text-center py-16">
              {notificationEmptyLabel(activeFilter)}
            </p>
          )}

          {!loading && notifications.length > 0 && (
            <ul className="space-y-4">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-5 sm:p-6 flex items-center gap-4 text-left hover:shadow-[0_4px_24px_rgba(16,26,52,0.08)] transition-shadow duration-200"
                  >
                    <Bell
                      size={18}
                      className="text-daybreak shrink-0"
                      strokeWidth={2}
                    />
                    <span
                      className={`font-body text-sm sm:text-base flex-1 min-w-0 ${
                        notification.read
                          ? "text-slate"
                          : "text-midnight font-semibold"
                      }`}
                    >
                      {notification.message}
                      <span className="text-slate font-normal">
                        {" "}
                        -- {formatRelativeTime(notification.createdAt)}
                      </span>
                    </span>
                    {!notification.read && (
                      <span
                        className="w-2.5 h-2.5 rounded-full bg-daybreak shrink-0"
                        aria-hidden
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
