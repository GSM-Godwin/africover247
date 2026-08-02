"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import {
  StatusBadge,
  formatClaimStatusLabel,
  getClaimStatusDotClass,
} from "@/components/shared/status-badge";
import api from "@/lib/api";
import { formatDate, formatNaira } from "@/lib/utils";
import type {
  ClaimDetailRecord,
  ClaimStatusHistoryEntry,
} from "@/types/claim";

function formatActorName(entry: ClaimStatusHistoryEntry): string {
  const name =
    `${entry.user.firstName} ${entry.user.lastName}`.trim() || "Unknown";
  if (entry.user.role === "admin") return `${name} (Admin)`;
  return name;
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8 h-48" />
      <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8 h-64" />
    </div>
  );
}

export function ClaimDetailContent() {
  const params = useParams<{ id: string }>();
  const claimId = params.id;

  const [claim, setClaim] = useState<ClaimDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);

  const fetchClaim = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await api.get<ClaimDetailRecord>(`/claims/${claimId}`);
      setClaim(res.data);
    } catch {
      setNotFound(true);
      setClaim(null);
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    fetchClaim();
  }, [fetchClaim]);

  async function handleComment() {
    if (!comment.trim() || !claimId) return;
    setCommenting(true);
    try {
      await api.post(`/claims/${claimId}/comments`, { comment });
      setComment("");
      await fetchClaim();
    } catch {
    } finally {
      setCommenting(false);
    }
  }

  const documents = claim?.documents ?? [];
  const comments = claim?.comments ?? [];

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F5F6F8]">
        <div className="max-w-[1140px] mx-auto px-6 sm:px-8 py-10 sm:py-12">
          {loading && <DetailSkeleton />}

          {!loading && notFound && (
            <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-8 sm:p-10 text-center max-w-lg mx-auto">
              <p className="font-body text-slate text-base mb-6">
                This claim isn&apos;t available.
              </p>
              <Link
                href="/claims"
                className="font-body text-sm font-semibold text-midnight underline underline-offset-2 hover:text-daybreak transition-colors"
              >
                Back to My Claims
              </Link>
            </div>
          )}

          {!loading && claim && (
            <>
              <Link
                href="/claims"
                className="inline-block font-body text-sm text-info hover:text-midnight transition-colors mb-6"
              >
                ← Back to claims
              </Link>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                <h1 className="font-display font-bold text-midnight text-3xl sm:text-4xl">
                  Claim {claim.claimReference}
                </h1>
                <StatusBadge status={claim.status} kind="claim" className="shrink-0" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <section className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8">
                  <h2 className="font-display font-bold text-midnight text-lg mb-4">
                    Claim Information
                  </h2>
                  <p className="font-body font-semibold text-midnight text-base mb-3">
                    {claim.claimType}
                    {claim.estimatedAmount != null && (
                      <>
                        {" "}
                        · {formatNaira(parseFloat(claim.estimatedAmount))}
                      </>
                    )}
                  </p>
                  <p className="font-body text-slate text-sm leading-relaxed">
                    {claim.description}
                  </p>
                </section>

                <section className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8">
                  <h2 className="font-display font-bold text-midnight text-lg mb-5">
                    Status Timeline
                  </h2>
                  {claim.statusHistory.length === 0 ? (
                    <p className="font-body text-slate text-sm">
                      No status updates yet.
                    </p>
                  ) : (
                    <ul className="space-y-6">
                      {claim.statusHistory.map((entry) => (
                        <li key={entry.id} className="flex gap-3">
                          <span
                            className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${getClaimStatusDotClass(entry.newStatus)}`}
                            aria-hidden
                          />
                          <div>
                            <p className="font-body font-semibold text-midnight text-sm">
                              {formatClaimStatusLabel(entry.newStatus)}:{" "}
                              {formatActorName(entry)}
                            </p>
                            <p className="font-body text-slate text-xs mt-1">
                              {formatDate(entry.changedAt)}
                            </p>
                            {entry.note && (
                              <p className="font-body text-sm text-slate italic mt-1">
                                &ldquo;{entry.note}&rdquo;
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <div className="mt-6 space-y-6">
                <section className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8">
                  <h2 className="font-display font-bold text-midnight text-lg mb-4">
                    Documents
                  </h2>
                  {documents.length === 0 ? (
                    <p className="font-body text-slate text-sm">No documents uploaded.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 border border-slate/10 rounded-lg hover:border-daybreak hover:bg-daybreak/5 transition-colors group"
                        >
                          <FileText
                            size={16}
                            className="text-slate group-hover:text-daybreak shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-sm font-medium text-midnight capitalize truncate">
                              {doc.documentType.replace(/-/g, " ")}
                            </p>
                            <p className="font-body text-xs text-slate truncate">
                              {doc.fileName}
                            </p>
                          </div>
                          <ExternalLink
                            size={14}
                            className="text-slate group-hover:text-daybreak shrink-0"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </section>

                <section className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-8">
                  <h2 className="font-display font-bold text-midnight text-lg mb-4">
                    Comments
                  </h2>
                  {comments.length === 0 ? (
                    <p className="font-body text-slate text-sm mb-4">No comments yet.</p>
                  ) : (
                    <div className="space-y-4 mb-4">
                      {comments.map((c) => (
                        <div key={c.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-midnight/10 flex items-center justify-center shrink-0 text-xs font-bold text-midnight">
                            {c.user.firstName[0]}
                            {c.user.lastName[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-body text-sm font-semibold text-midnight">
                                {c.user.firstName} {c.user.lastName}
                              </p>
                              <p className="font-body text-xs text-slate capitalize">
                                {c.user.role}
                              </p>
                              <p className="font-body text-xs text-slate">
                                {new Date(c.createdAt).toLocaleDateString("en-NG")}
                              </p>
                            </div>
                            <p className="font-body text-sm text-midnight">{c.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="border-t border-slate/10 pt-4">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                      placeholder="Add a comment..."
                      className="w-full bg-slate/5 border border-slate/10 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak resize-none mb-2"
                    />
                    <button
                      type="button"
                      onClick={handleComment}
                      disabled={commenting || !comment.trim()}
                      className="bg-midnight text-white font-body font-semibold text-sm px-4 py-2 rounded-lg hover:bg-midnight/90 disabled:opacity-50 transition-colors"
                    >
                      {commenting ? "Adding..." : "Add Comment"}
                    </button>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
