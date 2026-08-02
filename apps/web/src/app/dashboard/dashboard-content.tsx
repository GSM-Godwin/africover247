"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { QuotesSection } from "@/components/dashboard/quotes-section";
import { LogoutConfirmModal } from "@/components/shared/logout-confirm-modal";
import { Reveal } from "@/components/shared/reveal";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  applicationStep,
  formatDate,
  formatExpiryShort,
  formatRelativeTime,
  greetingPeriod,
  productDisplayTitle,
} from "@/lib/utils";
import {
  applyStepPath,
  type ApplicationRecord,
} from "@/types/application";
import type { ClaimRecord } from "@/types/claim";
import type { NotificationRecord } from "@/types/notification";
import type { PolicyRecord } from "@/types/policy";

function SectionSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-5 bg-slate-100 rounded w-40" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-16 bg-slate-100 rounded-xl" />
      ))}
    </div>
  );
}

function ViewLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="font-body text-sm font-semibold text-midnight underline underline-offset-2 hover:text-daybreak transition-colors shrink-0"
    >
      View
    </Link>
  );
}

export function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quotesSectionRef = useRef<HTMLElement>(null);
  const firstName = String(getUser()?.firstName ?? "there");

  const [draftApp, setDraftApp] = useState<ApplicationRecord | null>(null);
  const [draftCount, setDraftCount] = useState(0);
  const [draftLoading, setDraftLoading] = useState(true);

  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(true);

  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(true);

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const recentPolicies = useMemo(
    () =>
      [...policies]
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? b.issueDate).getTime() -
            new Date(a.createdAt ?? a.issueDate).getTime(),
        )
        .slice(0, 2),
    [policies],
  );

  const recentClaims = useMemo(() => claims.slice(0, 2), [claims]);

  const recentNotifications = useMemo(
    () => notifications.slice(0, 2),
    [notifications],
  );

  const fetchDraft = useCallback(async () => {
    setDraftLoading(true);
    try {
      const res = await api.get<ApplicationRecord[]>("/applications/my");
      const inProgress = res.data.filter(
        (app) => app.status === "draft" || app.status === "pending_payment",
      );
      setDraftApp(inProgress[0] ?? null);
      setDraftCount(inProgress.length);
    } catch {
      setDraftApp(null);
      setDraftCount(0);
    } finally {
      setDraftLoading(false);
    }
  }, []);

  const fetchPolicies = useCallback(async () => {
    setPoliciesLoading(true);
    try {
      const res = await api.get<PolicyRecord[]>("/policies/my");
      setPolicies(res.data);
    } catch {
      setPolicies([]);
    } finally {
      setPoliciesLoading(false);
    }
  }, []);

  const fetchClaims = useCallback(async () => {
    setClaimsLoading(true);
    try {
      const res = await api.get<ClaimRecord[]>("/claims/my");
      setClaims(res.data);
    } catch {
      setClaims([]);
    } finally {
      setClaimsLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const res = await api.get<NotificationRecord[]>("/notifications");
      setNotifications(res.data);
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const fetchDashboardData = useCallback(async () => {
    await Promise.all([
      fetchDraft(),
      fetchPolicies(),
      fetchClaims(),
      fetchNotifications(),
    ]);
  }, [fetchDraft, fetchPolicies, fetchClaims, fetchNotifications]);

  useAutoRefresh(fetchDashboardData, { intervalMs: 30000 });

  useEffect(() => {
    if (searchParams.get("tab") !== "quotes") return;
    quotesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams]);

  function handleNotificationClick(notification: NotificationRecord) {
    api.patch(`/notifications/${notification.id}/read`).catch(() => {});

    if (notification.referenceType === "quote" && notification.referenceId) {
      router.push(`/quotes/${notification.referenceId}`);
      return;
    }

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
      <LogoutConfirmModal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
      />
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F5F6F8]">
        <div className="max-w-[1140px] mx-auto px-6 sm:px-8 py-10 sm:py-12">
          <Reveal>
            <h1 className="font-display font-bold text-midnight text-3xl sm:text-4xl mb-8">
              Good {greetingPeriod()}, {firstName}
            </h1>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              {draftLoading ? (
                <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8">
                  <SectionSkeleton lines={1} />
                </div>
              ) : (
                draftApp && (
                  <Reveal delay={0.05}>
                    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                      <div>
                        <h2 className="font-display font-bold text-midnight text-lg sm:text-xl mb-1.5">
                          {productDisplayTitle(draftApp.product.name)}
                        </h2>
                        <p className="font-body text-slate text-sm">
                          Step {draftApp.stepCompleted} of 5 completed · Saved on
                          this device
                        </p>
                      </div>
                      <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
                        <Link
                          href={applyStepPath(
                            draftApp.productId,
                            draftApp.id,
                            applicationStep(draftApp.stepCompleted),
                          )}
                          className="bg-daybreak text-midnight font-body font-bold text-sm sm:text-base px-6 py-3.5 rounded-lg hover:bg-[#D4921A] transition-colors duration-200 text-center"
                        >
                          Continue Application
                        </Link>
                        {draftCount > 1 && (
                          <Link
                            href="/applications/drafts"
                            className="font-body text-sm font-semibold text-midnight underline underline-offset-2 hover:text-daybreak transition-colors text-center"
                          >
                            View all drafts ({draftCount})
                          </Link>
                        )}
                      </div>
                    </div>
                  </Reveal>
                )
              )}

              <Reveal delay={0.1}>
                <section className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8">
                  <h2 className="font-display font-bold text-midnight text-lg mb-5">
                    Your Policies
                  </h2>

                  {policiesLoading ? (
                    <SectionSkeleton lines={2} />
                  ) : recentPolicies.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="font-body text-slate text-sm mb-4">
                        No policies yet.
                      </p>
                      <Link
                        href="/products"
                        className="font-body text-sm font-semibold text-midnight underline underline-offset-2 hover:text-daybreak transition-colors"
                      >
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentPolicies.map((policy) => (
                        <div
                          key={policy.id}
                          className="border border-slate/15 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p className="font-body font-semibold text-midnight text-base mb-1.5">
                              {policy.product.name}
                            </p>
                            <p className="font-body text-slate text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="font-mono text-xs bg-slate-100 text-midnight px-2 py-0.5 rounded">
                                {policy.policyNumber}
                              </span>
                              <span>· {formatExpiryShort(policy.expiryDate)}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <StatusBadge status={policy.status} kind="policy" />
                            <ViewLink href={`/policies/${policy.id}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </Reveal>

              <Reveal delay={0.15}>
                <section className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8">
                  <h2 className="font-display font-bold text-midnight text-lg mb-5">
                    Recent Claims
                  </h2>

                  {claimsLoading ? (
                    <SectionSkeleton lines={2} />
                  ) : recentClaims.length === 0 ? (
                    <p className="font-body text-slate text-sm py-2">
                      No claims filed yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {recentClaims.map((claim) => (
                        <div
                          key={claim.id}
                          className="border border-slate/15 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                        >
                          <p className="font-body text-slate text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-mono text-xs bg-slate-100 text-midnight px-2 py-0.5 rounded">
                              {claim.claimReference}
                            </span>
                            <span>· {formatDate(claim.createdAt)}</span>
                          </p>
                          <div className="flex items-center gap-4 shrink-0">
                            <StatusBadge status={claim.status} kind="claim" />
                            <ViewLink href={`/claims/${claim.id}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </Reveal>

              <Reveal delay={0.17}>
                <section
                  ref={quotesSectionRef}
                  id="quotes"
                  className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8"
                >
                  <h2 className="font-display font-bold text-midnight text-lg mb-5">
                    My Quotes
                  </h2>
                  <QuotesSection />
                </section>
              </Reveal>
            </div>

            <div className="space-y-6">
              <Reveal delay={0.1}>
                <section className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8">
                  <h2 className="font-display font-bold text-midnight text-lg mb-5">
                    Quick Actions
                  </h2>
                  <div className="space-y-3">
                    <Link
                      href="/products"
                      className="block w-full text-center font-body font-medium text-midnight text-sm border border-slate/25 rounded-lg py-3.5 hover:bg-slate-100 transition-colors duration-200"
                    >
                      Browse Products
                    </Link>
                    <Link
                      href="/claims/new"
                      className="block w-full text-center font-body font-medium text-midnight text-sm border border-slate/25 rounded-lg py-3.5 hover:bg-slate-100 transition-colors duration-200"
                    >
                      File a Claim
                    </Link>
                    <button
                      type="button"
                      onClick={() => setLogoutModalOpen(true)}
                      className="w-full font-body font-medium text-midnight text-sm border border-slate/25 rounded-lg py-3.5 hover:bg-slate-100 transition-colors duration-200"
                    >
                      Log Out
                    </button>
                  </div>
                </section>
              </Reveal>

              <Reveal delay={0.15}>
                <section className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <h2 className="font-display font-bold text-midnight text-lg">
                      Recent Notifications
                    </h2>
                    <Link
                      href="/notifications"
                      className="font-body text-sm font-semibold text-midnight underline underline-offset-2 hover:text-daybreak transition-colors shrink-0"
                    >
                      View all
                    </Link>
                  </div>

                  {notificationsLoading ? (
                    <SectionSkeleton lines={2} />
                  ) : recentNotifications.length === 0 ? (
                    <p className="font-body text-slate text-sm py-2">
                      No notifications yet.
                    </p>
                  ) : (
                    <ul className="space-y-4">
                      {recentNotifications.map((notification) => (
                        <li key={notification.id}>
                          <button
                            type="button"
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                            className="w-full text-left flex items-start gap-2.5 group"
                          >
                            {!notification.read && (
                              <span
                                className="mt-2 w-2 h-2 rounded-full bg-daybreak shrink-0"
                                aria-hidden
                              />
                            )}
                            <span
                              className={`font-body text-sm leading-relaxed group-hover:text-daybreak transition-colors ${
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
                </section>
              </Reveal>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
