"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import {
  PolicyFilterPills,
  matchesPolicyStatusFilter,
  policyFilterEmptyLabel,
} from "@/components/policies/policy-filter-pills";
import {
  PolicyListCard,
  PolicyListCardSkeleton,
} from "@/components/policies/policy-list-card";
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-container";
import api from "@/lib/api";
import type { PolicyRecord } from "@/types/policy";

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get<PolicyRecord[]>("/policies/my");
      setPolicies(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const filteredPolicies = useMemo(
    () =>
      policies.filter((policy) =>
        matchesPolicyStatusFilter(policy.status, activeFilter),
      ),
    [policies, activeFilter],
  );

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F5F6F8]">
        <div className="max-w-[1140px] mx-auto px-6 sm:px-8 py-10 sm:py-12">
          <div className="mb-8">
            <h1 className="font-display font-bold text-midnight text-3xl sm:text-4xl">
              My Policies
            </h1>
          </div>

          <div className="mb-8">
            <PolicyFilterPills active={activeFilter} onChange={setActiveFilter} />
          </div>

          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <PolicyListCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-8 text-center max-w-md mx-auto">
              <p className="font-body text-slate text-base mb-4">
                Could not load policies. Please try again.
              </p>
              <button
                type="button"
                onClick={fetchPolicies}
                className="bg-daybreak text-midnight font-body font-bold text-sm px-6 py-3 rounded-lg hover:bg-[#C4700E] transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredPolicies.length === 0 && (
            <div className="text-center py-16">
              <p className="font-body text-slate text-base mb-4">
                {policyFilterEmptyLabel(activeFilter)}
              </p>
              {policies.length === 0 && (
                <Link
                  href="/products"
                  className="font-body text-sm font-semibold text-midnight underline underline-offset-2 hover:text-daybreak transition-colors"
                >
                  Browse Products
                </Link>
              )}
            </div>
          )}

          {!loading && !error && filteredPolicies.length > 0 && (
            <StaggerContainer
              key={activeFilter ?? "all"}
              className="space-y-4"
            >
              {filteredPolicies.map((policy) => (
                <StaggerItem key={policy.id}>
                  <PolicyListCard policy={policy} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </main>
    </>
  );
}
