"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  User,
  Clock,
  ExternalLink,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { StatusBadge } from "@/components/admin/status-badge";
import type { AdminClaim } from "@/types/admin";

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate/10 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate/10">
        <Icon size={16} className="text-midnight" />
        <h2 className="font-body font-semibold text-midnight text-base">
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | undefined | null;
}) {
  return (
    <div>
      <p className="font-body text-xs text-slate uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="font-body text-sm text-midnight font-medium">
        {value || "—"}
      </p>
    </div>
  );
}

const STATUS_FLOW = ["submitted", "in_review", "approved"] as const;

export default function AdminClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [claim, setClaim] = useState<AdminClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);

  const fetchClaim = useCallback(() => {
    api
      .get(`/admin/claims/${id}`)
      .then((res) => {
        setClaim(res.data);
        setNewStatus(res.data.status);
      })
      .catch(() => {
        toast.error("Claim not found");
        router.push("/admin/claims");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    fetchClaim();
  }, [fetchClaim]);

  async function handleStatusUpdate() {
    if (!newStatus || newStatus === claim?.status) {
      toast.error("Please select a different status.");
      return;
    }
    setUpdating(true);
    try {
      await api.patch(`/admin/claims/${id}/status`, {
        status: newStatus,
        note: note || undefined,
      });
      toast.success("Claim status updated. Customer has been notified.");
      setNote("");
      fetchClaim();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(message || "Could not update status.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleComment() {
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      await api.post(`/claims/${id}/comments`, { comment });
      toast.success("Comment added.");
      setComment("");
      fetchClaim();
    } catch {
      toast.error("Could not add comment.");
    } finally {
      setCommenting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-daybreak border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!claim) return null;

  const isTerminal = ["approved", "rejected"].includes(claim.status);
  const currentFlowIndex = STATUS_FLOW.indexOf(
    claim.status as (typeof STATUS_FLOW)[number],
  );

  return (
    <div className="p-6 sm:p-8 max-w-4xl">
      <button
        type="button"
        onClick={() => router.push("/admin/claims")}
        className="flex items-center gap-2 font-body text-slate text-sm hover:text-midnight transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        All Claims
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-midnight text-2xl">
            {claim.claimReference}
          </h1>
          <p className="font-body text-slate text-sm mt-1">
            {claim.policy.product.name} · {claim.user.firstName}{" "}
            {claim.user.lastName}
          </p>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      <div className="space-y-4">
        {!isTerminal && (
          <div className="bg-daybreak/5 border border-daybreak/20 rounded-xl p-5">
            <h2 className="font-body font-semibold text-midnight text-base mb-4">
              Update Claim Status
            </h2>

            <div className="flex items-center gap-2 mb-5">
              {STATUS_FLOW.map((s, i) => {
                const current = claim.status === s;
                const past = currentFlowIndex > i;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        past || current
                          ? "bg-daybreak text-midnight"
                          : "bg-slate/10 text-slate"
                      }`}
                    >
                      {past ? <CheckCircle size={14} /> : i + 1}
                    </div>
                    <span
                      className={`font-body text-xs capitalize ${
                        current ? "text-midnight font-semibold" : "text-slate"
                      }`}
                    >
                      {s.replace(/_/g, " ")}
                    </span>
                    {i < STATUS_FLOW.length - 1 && (
                      <div className="w-6 h-px bg-slate/20" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-white border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak"
                >
                  <option value="submitted">Submitted</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block font-body text-sm font-medium text-midnight mb-1.5">
                  Note to customer (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. We have received your documents and are processing your claim."
                  className="w-full bg-white border border-slate/20 rounded-lg px-3 py-2.5 font-body text-sm text-midnight focus:outline-none focus:border-daybreak resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={updating || newStatus === claim.status}
                className="bg-daybreak text-midnight font-body font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-[#C4700E] disabled:opacity-50 transition-colors"
              >
                {updating ? "Updating..." : "Update Status"}
              </button>

              <p className="font-body text-xs text-slate">
                Customer will be notified by email, SMS, and in-app notification.
              </p>
            </div>
          </div>
        )}

        <Section title="Incident Details" icon={AlertCircle}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <Field label="Claim Type" value={claim.claimType} />
            <Field
              label="Incident Date"
              value={new Date(claim.incidentDate).toLocaleDateString("en-NG")}
            />
            <Field label="Location" value={claim.incidentLocation} />
            <Field
              label="Estimated Amount"
              value={
                claim.estimatedAmount
                  ? `₦${parseFloat(claim.estimatedAmount).toLocaleString("en-NG")}`
                  : undefined
              }
            />
            <Field
              label="Police Report"
              value={claim.policeReportFiled ? "Filed" : "Not filed"}
            />
            {claim.policeReportNumber && (
              <Field label="Report Number" value={claim.policeReportNumber} />
            )}
          </div>
          <div>
            <p className="font-body text-xs text-slate uppercase tracking-wide mb-1">
              Description
            </p>
            <p className="font-body text-sm text-midnight leading-relaxed">
              {claim.description}
            </p>
          </div>
        </Section>

        <Section title="Customer & Policy" icon={User}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field
              label="Customer"
              value={`${claim.user.firstName} ${claim.user.lastName}`}
            />
            <Field label="Email" value={claim.user.email} />
            <Field label="Phone" value={claim.user.phone} />
            <Field label="Policy Number" value={claim.policy.policyNumber} />
            <Field label="Product" value={claim.policy.product.name} />
          </div>
        </Section>

        <Section title="Claim Documents" icon={FileText}>
          {claim.documents.length === 0 ? (
            <p className="font-body text-sm text-slate">No documents uploaded.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {claim.documents.map((doc) => (
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
                    <p className="font-body text-xs text-slate">
                      {new Date(doc.uploadedAt).toLocaleDateString("en-NG")}
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
        </Section>

        <Section title="Status History" icon={Clock}>
          {claim.statusHistory.length === 0 ? (
            <p className="font-body text-sm text-slate">No history yet.</p>
          ) : (
            <div className="space-y-4">
              {claim.statusHistory.map((entry, i) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-midnight/10 flex items-center justify-center shrink-0">
                      <CheckCircle size={14} className="text-midnight" />
                    </div>
                    {i < claim.statusHistory.length - 1 && (
                      <div className="w-px flex-1 bg-slate/10 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <StatusBadge status={entry.newStatus} />
                      <span className="font-body text-xs text-slate">
                        {new Date(entry.changedAt).toLocaleString("en-NG", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="font-body text-xs text-slate">
                      by {entry.user.firstName} {entry.user.lastName} (
                      {entry.user.role})
                    </p>
                    {entry.note && (
                      <p className="font-body text-sm text-midnight mt-1 bg-slate/5 rounded-lg px-3 py-2 italic">
                        &ldquo;{entry.note}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Comments" icon={MessageCircle}>
          <div className="space-y-3 mb-4">
            {claim.comments.length === 0 ? (
              <p className="font-body text-sm text-slate">No comments yet.</p>
            ) : (
              claim.comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-midnight/10 flex items-center justify-center shrink-0 text-xs font-bold text-midnight">
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
                    <p className="font-body text-sm text-midnight">
                      {c.comment}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

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
        </Section>
      </div>
    </div>
  );
}
