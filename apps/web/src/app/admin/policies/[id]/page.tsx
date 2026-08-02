"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  User,
  Shield,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { StatusBadge } from "@/components/admin/status-badge";
import type { AdminPolicy } from "@/types/admin";

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

export default function AdminPolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [policy, setPolicy] = useState<AdminPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    api
      .get(`/admin/policies/${id}`)
      .then((res) => setPolicy(res.data))
      .catch(() => {
        toast.error("Policy not found");
        router.push("/admin/policies");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleCancel() {
    setCancelling(true);
    try {
      await api.patch(`/admin/policies/${id}/cancel`);
      toast.success("Policy cancelled.");
      setShowCancelConfirm(false);
      setCancelling(false);
      const res = await api.get(`/admin/policies/${id}`);
      setPolicy(res.data);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(message || "Could not cancel policy.");
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-daybreak border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!policy) return null;

  const daysUntilExpiry = Math.ceil(
    (new Date(policy.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  const coverageItems = policy.product.coverageHighlights
    .split("\n")
    .filter(Boolean);
  const exclusionItems = policy.product.exclusions.split("\n").filter(Boolean);

  return (
    <div className="p-6 sm:p-8 max-w-4xl">
      <button
        type="button"
        onClick={() => router.push("/admin/policies")}
        className="flex items-center gap-2 font-body text-slate text-sm hover:text-midnight transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        All Policies
      </button>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-midnight text-2xl">
            {policy.policyNumber}
          </h1>
          <p className="font-body text-slate text-sm mt-1">
            {policy.product.name} · {policy.user.firstName}{" "}
            {policy.user.lastName}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={policy.status} />
          {policy.policyPdfUrl && (
            <a
              href={policy.policyPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-body text-sm text-midnight hover:text-daybreak font-medium transition-colors border border-slate/20 px-3 py-1.5 rounded-lg hover:border-daybreak"
            >
              <Download size={14} />
              Download PDF
            </a>
          )}
          {policy.status === "active" && (
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="font-body text-sm text-alert-coral border border-alert-coral/30 px-3 py-1.5 rounded-lg hover:bg-alert-coral/5 transition-colors"
            >
              Cancel Policy
            </button>
          )}
        </div>
      </div>

      {isExpiringSoon && (
        <div className="flex items-center gap-3 bg-daybreak/10 border border-daybreak/30 rounded-xl px-4 py-3 mb-4">
          <AlertTriangle size={16} className="text-daybreak shrink-0" />
          <p className="font-body text-sm text-midnight">
            This policy expires in{" "}
            <span className="font-semibold">{daysUntilExpiry} days</span>.
          </p>
        </div>
      )}

      {showCancelConfirm && (
        <div className="bg-alert-coral/5 border border-alert-coral/20 rounded-xl p-5 mb-4">
          <p className="font-body text-sm text-midnight font-semibold mb-1">
            Cancel this policy?
          </p>
          <p className="font-body text-sm text-slate mb-4">
            This action cannot be undone. The customer will be notified.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-alert-coral text-white font-body font-bold text-sm px-4 py-2 rounded-lg hover:bg-alert-coral/90 disabled:opacity-50 transition-colors"
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel Policy"}
            </button>
            <button
              type="button"
              onClick={() => setShowCancelConfirm(false)}
              className="border border-slate/20 text-midnight font-body text-sm px-4 py-2 rounded-lg hover:border-midnight transition-colors"
            >
              Keep Policy
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Section title="Policy Summary" icon={Shield}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Policy Number" value={policy.policyNumber} />
            <Field label="Product" value={policy.product.name} />
            <Field label="Category" value={policy.product.category} />
            <Field
              label="Premium Paid"
              value={`₦${parseFloat(policy.premiumPaid).toLocaleString("en-NG")}`}
            />
            <Field
              label="Issue Date"
              value={new Date(policy.issueDate).toLocaleDateString("en-NG")}
            />
            <Field
              label="Start Date"
              value={new Date(policy.startDate).toLocaleDateString("en-NG")}
            />
            <Field
              label="Expiry Date"
              value={new Date(policy.expiryDate).toLocaleDateString("en-NG")}
            />
            <div>
              <p className="font-body text-xs text-slate uppercase tracking-wide mb-0.5">
                Days Remaining
              </p>
              <p
                className={`font-mono text-sm font-medium ${
                  daysUntilExpiry <= 0
                    ? "text-alert-coral"
                    : isExpiringSoon
                      ? "text-daybreak"
                      : "text-midnight"
                }`}
              >
                {daysUntilExpiry <= 0 ? "Expired" : `${daysUntilExpiry} days`}
              </p>
            </div>
          </div>
        </Section>

        <Section title="Policyholder" icon={User}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field
              label="Full Name"
              value={`${policy.user.firstName} ${policy.user.lastName}`}
            />
            <Field label="Email" value={policy.user.email} />
            <Field label="Phone" value={policy.user.phone} />
          </div>
        </Section>

        <Section title="Coverage Details" icon={CheckCircle}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="font-body text-xs text-slate uppercase tracking-wide mb-3">
                What&apos;s Covered
              </p>
              <ul className="space-y-2">
                {coverageItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle
                      size={14}
                      className="text-cover-green mt-0.5 shrink-0"
                    />
                    <p className="font-body text-sm text-midnight">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-body text-xs text-slate uppercase tracking-wide mb-3">
                Exclusions
              </p>
              <ul className="space-y-2">
                {exclusionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <XCircle
                      size={14}
                      className="text-alert-coral mt-0.5 shrink-0"
                    />
                    <p className="font-body text-sm text-midnight">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {policy.application?.kycDocuments?.length > 0 && (
          <Section title="KYC Documents" icon={FileText}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {policy.application.kycDocuments.map((doc) => (
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
                  <p className="font-body text-sm font-medium text-midnight capitalize flex-1 truncate">
                    {doc.documentType.replace(/-/g, " ")}
                  </p>
                  <ExternalLink
                    size={14}
                    className="text-slate group-hover:text-daybreak shrink-0"
                  />
                </a>
              ))}
            </div>
          </Section>
        )}

        <Section title="Claims History" icon={AlertTriangle}>
          {policy.claims.length === 0 ? (
            <p className="font-body text-sm text-slate">
              No claims filed against this policy.
            </p>
          ) : (
            <div className="space-y-2">
              {policy.claims.map((claim) => (
                <Link
                  key={claim.id}
                  href={`/admin/claims/${claim.id}`}
                  className="flex items-center justify-between p-3 border border-slate/10 rounded-lg hover:border-daybreak hover:bg-daybreak/5 transition-colors"
                >
                  <div>
                    <p className="font-mono text-sm text-midnight font-medium">
                      {claim.claimReference}
                    </p>
                    <p className="font-body text-xs text-slate">
                      {claim.claimType} ·{" "}
                      {new Date(claim.createdAt).toLocaleDateString("en-NG")}
                    </p>
                  </div>
                  <StatusBadge status={claim.status} />
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
