"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import api from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { NotificationRecord } from "@/types/notification";

interface NotificationBellDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationBellDropdown({
  open,
  onOpenChange,
}: NotificationBellDropdownProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const wasOpenedRef = useRef(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get<{ count: number }>("/notifications/unread-count");
      setUnreadCount(res.data.count);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<NotificationRecord[]>("/notifications");
      setNotifications(res.data.slice(0, 5));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useAutoRefresh(fetchUnreadCount, { intervalMs: 15000 });

  useEffect(() => {
    if (open) {
      wasOpenedRef.current = true;
      fetchNotifications();
      return;
    }

    if (wasOpenedRef.current) {
      fetchUnreadCount();
    }
  }, [open, fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, onOpenChange]);

  function handleNotificationClick(notification: NotificationRecord) {
    api.patch(`/notifications/${notification.id}/read`).catch(() => {});
    fetchUnreadCount();
    onOpenChange(false);

    if (notification.referenceType === "policy" && notification.referenceId) {
      router.push(`/policies/${notification.referenceId}`);
      return;
    }

    if (notification.referenceType === "claim" && notification.referenceId) {
      router.push(`/claims/${notification.referenceId}`);
    }
  }

  async function handleMarkAllRead() {
    setMarkAllLoading(true);
    try {
      await api.patch("/notifications/read-all");
      await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    } finally {
      setMarkAllLoading(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="relative pt-2 text-slate hover:text-midnight transition-colors duration-150"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-daybreak text-midnight font-body text-[10px] font-bold leading-[18px] text-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-4 left-4 top-[4.25rem] md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:left-auto z-[60] w-auto md:w-80 max-w-none md:max-w-none bg-white rounded-lg shadow-[0_4px_24px_rgba(16,26,52,0.12)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate/15">
            <span className="font-body text-sm font-semibold text-midnight">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markAllLoading}
                className="font-body text-xs font-medium text-midnight underline underline-offset-2 hover:text-daybreak disabled:opacity-60 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <div className="px-4 py-6">
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-10 bg-slate-100 rounded" />
                ))}
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 font-body text-sm text-slate text-center">
              No notifications yet
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-100 transition-colors flex items-start gap-2.5"
                  >
                    {!notification.read && (
                      <span
                        className="mt-2 w-2 h-2 rounded-full bg-daybreak shrink-0"
                        aria-hidden
                      />
                    )}
                    <span
                      className={`font-body text-sm leading-relaxed flex-1 min-w-0 ${
                        notification.read
                          ? "text-slate pl-[18px]"
                          : "text-midnight font-semibold"
                      }`}
                    >
                      {notification.message}
                      <span className="text-slate font-normal">
                        {" "}
                        · {formatRelativeTime(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-slate/15 py-1.5">
            <Link
              href="/notifications"
              onClick={() => onOpenChange(false)}
              className="block px-4 py-2.5 font-body text-sm text-midnight hover:bg-slate-100 transition-colors text-center"
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
