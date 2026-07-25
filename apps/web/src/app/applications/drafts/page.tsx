"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import {
  DraftApplicationListCard,
  DraftApplicationListCardSkeleton,
} from "@/components/applications/draft-application-list-card";
import { DeleteApplicationConfirmModal } from "@/components/shared/delete-application-confirm-modal";
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-container";
import api from "@/lib/api";
import type { ApplicationRecord } from "@/types/application";

function isInProgressApplication(application: ApplicationRecord): boolean {
  return (
    application.status === "draft" || application.status === "pending_payment"
  );
}

export default function DraftApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApplicationRecord | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get<ApplicationRecord[]>("/applications/my");
      setApplications(res.data.filter(isInProgressApplication));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const sortedApplications = useMemo(
    () =>
      [...applications].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [applications],
  );

  function openDeleteModal(application: ApplicationRecord) {
    setDeleteError(null);
    setDeleteTarget(application);
  }

  function closeDeleteModal() {
    if (deleteLoading) return;
    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await api.delete(`/applications/${deleteTarget.id}`);
      setApplications((current) =>
        current.filter((application) => application.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      toast.success("Application deleted");
    } catch {
      setDeleteError("Could not delete this application. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <DeleteApplicationConfirmModal
        open={Boolean(deleteTarget)}
        productName={deleteTarget?.product.name ?? ""}
        loading={deleteLoading}
        error={deleteError}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F5F6F8]">
        <div className="max-w-[1140px] mx-auto px-6 sm:px-8 py-10 sm:py-12">
          <div className="mb-8">
            <h1 className="font-display font-bold text-midnight text-3xl sm:text-4xl">
              Draft Applications
            </h1>
          </div>

          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <DraftApplicationListCardSkeleton key={index} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-8 text-center max-w-md mx-auto">
              <p className="font-body text-slate text-base mb-4">
                Could not load applications. Please try again.
              </p>
              <button
                type="button"
                onClick={fetchApplications}
                className="bg-daybreak text-midnight font-body font-bold text-sm px-6 py-3 rounded-lg hover:bg-[#D4921A] transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && sortedApplications.length === 0 && (
            <div className="text-center py-16">
              <p className="font-body text-slate text-base mb-4">
                No draft applications right now.
              </p>
              <Link
                href="/products"
                className="font-body text-sm font-semibold text-midnight underline underline-offset-2 hover:text-daybreak transition-colors"
              >
                Browse Products
              </Link>
            </div>
          )}

          {!loading && !error && sortedApplications.length > 0 && (
            <StaggerContainer className="space-y-4">
              {sortedApplications.map((application) => (
                <StaggerItem key={application.id}>
                  <DraftApplicationListCard
                    application={application}
                    onDelete={openDeleteModal}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </main>
    </>
  );
}
