"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import {
  ClaimFilterPills,
  claimFilterEmptyLabel,
  matchesClaimStatusFilter,
} from "@/components/claims/claim-filter-pills";
import {
  ClaimListCard,
  ClaimListCardSkeleton,
} from "@/components/claims/claim-list-card";
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-container";
import api from "@/lib/api";
import type { ClaimRecord } from "@/types/claim";

export default function ClaimsPage() {
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get<ClaimRecord[]>("/claims/my");
      setClaims(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const filteredClaims = useMemo(
    () =>
      claims.filter((claim) =>
        matchesClaimStatusFilter(claim.status, activeFilter),
      ),
    [claims, activeFilter],
  );

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F5F6F8]">
        <div className="max-w-[1140px] mx-auto px-6 sm:px-8 py-10 sm:py-12">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="font-display font-bold text-midnight text-3xl sm:text-4xl">
              My Claims
            </h1>
            <Link
              href="/claims/new"
              className="inline-flex items-center justify-center bg-daybreak text-midnight font-body font-bold text-sm px-6 py-3 rounded-lg hover:bg-[#C4700E] transition-colors duration-200 shrink-0"
            >
              File a Claim
            </Link>
          </div>

          <div className="mb-8">
            <ClaimFilterPills active={activeFilter} onChange={setActiveFilter} />
          </div>

          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <ClaimListCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-8 text-center max-w-md mx-auto">
              <p className="font-body text-slate text-base mb-4">
                Could not load claims. Please try again.
              </p>
              <button
                type="button"
                onClick={fetchClaims}
                className="bg-daybreak text-midnight font-body font-bold text-sm px-6 py-3 rounded-lg hover:bg-[#C4700E] transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredClaims.length === 0 && (
            <div className="text-center py-16">
              <p className="font-body text-slate text-base mb-4">
                {claimFilterEmptyLabel(activeFilter)}
              </p>
              {claims.length === 0 && (
                <Link
                  href="/claims/new"
                  className="inline-flex items-center justify-center bg-daybreak text-midnight font-body font-bold text-sm px-6 py-3 rounded-lg hover:bg-[#C4700E] transition-colors duration-200"
                >
                  File a Claim
                </Link>
              )}
            </div>
          )}

          {!loading && !error && filteredClaims.length > 0 && (
            <StaggerContainer
              key={activeFilter ?? "all"}
              className="space-y-4"
            >
              {filteredClaims.map((claim) => (
                <StaggerItem key={claim.id}>
                  <ClaimListCard claim={claim} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </main>
    </>
  );
}
