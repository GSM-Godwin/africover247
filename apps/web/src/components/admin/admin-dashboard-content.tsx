"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Shield,
  ClipboardList,
  MessageSquare,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import api from "@/lib/api";

interface Metrics {
  totalApplications: number;
  activeApplications: number;
  activePolicies: number;
  pendingClaims: number;
  newThisWeek: number;
  totalUsers: number;
  applicationsThisWeek: number;
  newCustomersThisWeek: number;
  totalRevenue: number;
}

interface RecentApplication {
  id: string;
  status: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  product: { name: string; category: string };
}

interface PendingClaim {
  id: string;
  claimReference: string;
  claimType: string;
  estimatedAmount: string | null;
  createdAt: string;
  user?: { firstName: string; lastName: string };
  policy: {
    policyNumber: string;
    product?: { name: string };
  };
}

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  user?: { firstName: string; lastName: string };
}

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  href,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent: string;
  href?: string;
}) {
  const displayValue =
    typeof value === "number" && title.toLowerCase().includes("revenue")
      ? `₦${value.toLocaleString("en-NG")}`
      : typeof value === "number"
        ? value.toLocaleString("en-NG")
        : value;

  const inner = (
    <div className="bg-white rounded-xl border border-slate/10 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}
        >
          <Icon size={18} className="text-white" />
        </div>
        {href && <ArrowRight size={14} className="text-slate/40 mt-1" />}
      </div>
      <p className="font-mono text-midnight text-3xl font-medium mb-0.5">
        {displayValue}
      </p>
      <p className="font-body text-slate text-sm">{title}</p>
      {sub && <p className="font-body text-xs text-slate/60 mt-1">{sub}</p>}
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-slate/10 text-slate",
    pending_payment: "bg-daybreak/10 text-daybreak",
    paid: "bg-cover-green/10 text-cover-green",
    issued: "bg-cover-green/10 text-cover-green",
    submitted: "bg-daybreak/10 text-daybreak",
    in_review: "bg-info/10 text-info",
    approved: "bg-cover-green/10 text-cover-green",
    rejected: "bg-alert-coral/10 text-alert-coral",
    active: "bg-cover-green/10 text-cover-green",
    expired: "bg-slate/10 text-slate",
    pending_review: "bg-slate/10 text-slate",
    quote_sent: "bg-daybreak/10 text-daybreak",
  };

  return (
    <span
      className={`font-body text-xs font-medium px-2 py-0.5 rounded-full ${
        map[status] || "bg-slate/10 text-slate"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function Skeleton({ className }: { className: string }) {
  return (
    <div className={`bg-slate/10 rounded-lg animate-pulse ${className}`} />
  );
}

export function AdminDashboardContent() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentApps, setRecentApps] = useState<RecentApplication[]>([]);
  const [pendingClaims, setPendingClaims] = useState<PendingClaim[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingQuoteCount, setPendingQuoteCount] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get("/admin/dashboard/metrics"),
      api.get("/admin/dashboard/recent-applications"),
      api.get("/admin/dashboard/pending-claims"),
      api.get("/admin/dashboard/activity"),
    ])
      .then(([metricsRes, appsRes, claimsRes, activityRes]) => {
        setMetrics(metricsRes.data);
        setRecentApps(appsRes.data);
        setPendingClaims(claimsRes.data);
        setActivity(activityRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api
      .get("/admin/quotes?status=pending_review")
      .then((res) => setPendingQuoteCount(res.data.length))
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 sm:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="font-display font-bold text-midnight text-2xl sm:text-3xl">
          Dashboard
        </h1>
        <p className="font-body text-slate text-sm mt-1">
          {new Date().toLocaleDateString("en-NG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Applications This Week"
            value={metrics?.applicationsThisWeek ?? 0}
            sub="New applications"
            icon={FileText}
            accent="bg-midnight"
            href="/admin/applications"
          />
          <KpiCard
            title="Active Policies"
            value={metrics?.activePolicies ?? 0}
            sub="Currently in force"
            icon={Shield}
            accent="bg-cover-green"
            href="/admin/policies"
          />
          <KpiCard
            title="Pending Claims"
            value={metrics?.pendingClaims ?? 0}
            sub="Awaiting review"
            icon={ClipboardList}
            accent="bg-daybreak"
            href="/admin/claims"
          />
          <KpiCard
            title="Pending Quotes"
            value={pendingQuoteCount}
            sub="Awaiting response"
            icon={MessageSquare}
            accent="bg-info"
            href="/admin/quotes"
          />
          <KpiCard
            title="Total Applications"
            value={metrics?.totalApplications ?? 0}
            sub="All time"
            icon={FileText}
            accent="bg-midnight"
          />
          <KpiCard
            title="New Customers"
            value={metrics?.newCustomersThisWeek ?? 0}
            sub="This week"
            icon={Users}
            accent="bg-midnight"
            href="/admin/customers"
          />
          <KpiCard
            title="Total Revenue"
            value={metrics?.totalRevenue ?? 0}
            sub="Premiums collected"
            icon={TrendingUp}
            accent="bg-cover-green"
          />
          <KpiCard
            title="Active Applications"
            value={metrics?.activeApplications ?? 0}
            sub="In progress"
            icon={AlertCircle}
            accent="bg-daybreak"
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl border border-slate/10 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate/10">
              <h2 className="font-body font-semibold text-midnight text-base">
                Recent Applications
              </h2>
              <Link
                href="/admin/applications"
                className="font-body text-sm text-daybreak hover:underline font-medium"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : recentApps.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-body text-slate text-sm">
                  No applications yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate/5">
                {recentApps.map((app) => (
                  <Link
                    key={app.id}
                    href={`/admin/applications/${app.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate/5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-midnight/10 flex items-center justify-center shrink-0">
                      <span className="font-body text-xs font-semibold text-midnight">
                        {app.user.firstName[0]}
                        {app.user.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold text-midnight truncate">
                        {app.user.firstName} {app.user.lastName}
                      </p>
                      <p className="font-body text-xs text-slate truncate">
                        {app.product.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={app.status} />
                      <p className="font-body text-xs text-slate/60">
                        {new Date(app.createdAt).toLocaleDateString("en-NG")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate/10 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate/10">
              <h2 className="font-body font-semibold text-midnight text-base">
                Pending Claims
              </h2>
              <Link
                href="/admin/claims"
                className="font-body text-sm text-daybreak hover:underline font-medium"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : pendingClaims.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle
                  size={24}
                  className="text-cover-green mx-auto mb-2"
                />
                <p className="font-body text-slate text-sm">No pending claims</p>
              </div>
            ) : (
              <div className="divide-y divide-slate/5">
                {pendingClaims.slice(0, 5).map((claim) => (
                  <Link
                    key={claim.id}
                    href={`/admin/claims/${claim.id}`}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate/5 transition-colors"
                  >
                    <AlertCircle
                      size={16}
                      className="text-daybreak mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-midnight font-medium">
                        {claim.claimReference}
                      </p>
                      <p className="font-body text-xs text-slate truncate">
                        {claim.policy.product?.name ?? claim.policy.policyNumber}
                      </p>
                      {claim.estimatedAmount && (
                        <p className="font-mono text-xs text-daybreak font-medium mt-0.5">
                          ₦
                          {parseFloat(claim.estimatedAmount).toLocaleString(
                            "en-NG",
                          )}
                        </p>
                      )}
                    </div>
                    <p className="font-body text-xs text-slate/60 shrink-0">
                      {new Date(claim.createdAt).toLocaleDateString("en-NG")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate/10">
              <h2 className="font-body font-semibold text-midnight text-base">
                Recent Activity
              </h2>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="p-6 text-center">
                <p className="font-body text-slate text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-slate/5">
                {activity.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex gap-3 px-5 py-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-daybreak mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-xs text-midnight">
                        <span className="font-semibold">
                          {item.user
                            ? `${item.user.firstName} ${item.user.lastName}`
                            : "System"}
                        </span>{" "}
                        {item.action.toLowerCase().replace(/_/g, " ")}{" "}
                        <span className="text-slate">
                          {item.entityType.toLowerCase()}
                        </span>
                      </p>
                      <p className="font-body text-xs text-slate/60 mt-0.5">
                        {new Date(item.createdAt).toLocaleString("en-NG", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Review Quotes",
            href: "/admin/quotes",
            icon: MessageSquare,
            count: pendingQuoteCount,
          },
          {
            label: "Review Claims",
            href: "/admin/claims",
            icon: ClipboardList,
            count: metrics?.pendingClaims ?? 0,
          },
          {
            label: "Applications",
            href: "/admin/applications",
            icon: FileText,
            count: metrics?.applicationsThisWeek ?? 0,
          },
          {
            label: "All Customers",
            href: "/admin/customers",
            icon: Users,
            count: null,
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white border border-slate/10 rounded-xl p-4 hover:border-daybreak hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <action.icon
                size={18}
                className="text-slate group-hover:text-daybreak transition-colors"
              />
              {action.count !== null && action.count > 0 && (
                <span className="font-mono text-xs font-bold text-white bg-daybreak px-1.5 py-0.5 rounded-full">
                  {action.count}
                </span>
              )}
            </div>
            <p className="font-body text-sm font-semibold text-midnight group-hover:text-daybreak transition-colors">
              {action.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
