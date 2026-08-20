"use client";

import { useEffect, useState } from "react";
import { Search, TrendingUp, AlertCircle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import api from "@/lib/api";

interface ZeroResultQuery {
  query: string;
  _count: { query: number };
}

interface TopQuery {
  query: string;
  _count: { query: number };
}

interface SearchStats {
  totalSearches: number;
  zeroResultSearches: number;
  zeroResultRate: number;
  topQueries: TopQuery[];
}

export default function SearchAnalyticsPage() {
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [zeroResults, setZeroResults] = useState<ZeroResultQuery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, zeroRes] = await Promise.all([
          api.get("/search/analytics/stats"),
          api.get("/search/analytics/zero-results"),
        ]);
        setStats(statsRes.data);
        setZeroResults(zeroRes.data);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-6 sm:p-8 max-w-7xl space-y-6">
      <AdminPageHeader
        title="Search Analytics"
        subtitle="Monitor what customers are searching for and identify gaps in product coverage."
      />

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate/10 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Total Searches",
                value: stats?.totalSearches || 0,
                icon: Search,
              },
              {
                label: "Zero Result Searches",
                value: stats?.zeroResultSearches || 0,
                icon: AlertCircle,
              },
              {
                label: "Zero Result Rate",
                value: `${stats?.zeroResultRate || 0}%`,
                icon: TrendingUp,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-slate/10 p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon size={18} className="text-slate" />
                  <p className="font-body text-sm text-slate">{label}</p>
                </div>
                <p className="font-display font-bold text-midnight text-2xl">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate/10 flex items-center gap-2">
                <AlertCircle size={16} className="text-alert-coral" />
                <h2 className="font-body font-semibold text-midnight text-base">
                  Zero Result Searches
                </h2>
                <span className="font-body text-xs text-slate ml-auto">
                  Add these to keyword map
                </span>
              </div>
              <div className="divide-y divide-slate/5">
                {zeroResults.length === 0 ? (
                  <p className="font-body text-slate text-sm p-5">
                    No zero-result searches yet.
                  </p>
                ) : (
                  zeroResults.map((item) => (
                    <div
                      key={item.query}
                      className="px-5 py-3 flex items-center justify-between"
                    >
                      <p className="font-body text-sm text-midnight font-medium">
                        &quot;{item.query}&quot;
                      </p>
                      <span className="font-body text-xs text-alert-coral font-bold">
                        {item._count.query}x
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate/10 flex items-center gap-2">
                <TrendingUp size={16} className="text-cover-green" />
                <h2 className="font-body font-semibold text-midnight text-base">
                  Top Searches
                </h2>
              </div>
              <div className="divide-y divide-slate/5">
                {!stats?.topQueries.length ? (
                  <p className="font-body text-slate text-sm p-5">
                    No searches yet.
                  </p>
                ) : (
                  stats.topQueries.map((item) => (
                    <div
                      key={item.query}
                      className="px-5 py-3 flex items-center justify-between"
                    >
                      <p className="font-body text-sm text-midnight font-medium">
                        &quot;{item.query}&quot;
                      </p>
                      <span className="font-body text-xs text-cover-green font-bold">
                        {item._count.query}x
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
