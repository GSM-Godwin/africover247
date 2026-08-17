"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  User,
  Briefcase,
  Shield,
  ExternalLink,
  CheckCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { StatusBadge } from "@/components/admin/status-badge";
import type { AdminApplication } from "@/types/admin";

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

export default function AdminApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<AdminApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/admin/applications/${id}`)
      .then((res) => setApp(res.data))
      .catch(() => {
        toast.error("Application not found");
        router.push("/admin/applications");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-daybreak border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!app) return null;

  const formData = (app.formData || {}) as Record<string, unknown>;
  const assetDetails = (app.assetDetails || {}) as Record<string, unknown>;
  const kycVerification = formData.kycVerification as
    | {
        type?: string;
        verifiedAt?: string;
        dojahData?: unknown;
      }
    | undefined;

  return (
    <div className="p-6 sm:p-8 max-w-4xl">
      <button
        type="button"
        onClick={() => router.push("/admin/applications")}
        className="flex items-center gap-2 font-body text-slate text-sm hover:text-midnight transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        All Applications
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-midnight text-2xl">
            Application Detail
          </h1>
          <p className="font-body text-slate text-sm mt-1">
            {app.product.name} · {app.user.firstName} {app.user.lastName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={app.status} />
          {app.policy && (
            <Link
              href={`/admin/policies/${app.policy.id}`}
              className="font-body text-sm text-daybreak hover:underline font-medium"
            >
              View Policy →
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Section title="Customer" icon={User}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="First Name" value={app.user.firstName} />
            <Field label="Last Name" value={app.user.lastName} />
            <Field label="Email" value={app.user.email} />
            <Field label="Phone" value={app.user.phone} />
            <div>
              <p className="font-body text-xs text-slate uppercase tracking-wide mb-0.5">
                KYC Verified
              </p>
              <div className="flex items-center gap-1.5">
                {app.kycVerified ? (
                  <>
                    <CheckCircle size={14} className="text-cover-green" />
                    <span className="font-body text-sm text-cover-green font-medium">
                      Verified
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} className="text-slate" />
                    <span className="font-body text-sm text-slate">
                      Not verified
                    </span>
                  </>
                )}
              </div>
            </div>
            <Field
              label="Applied"
              value={new Date(app.createdAt).toLocaleDateString("en-NG")}
            />
          </div>
        </Section>

        <div className="bg-white rounded-xl border border-slate/10 p-5">
          <h3 className="font-body font-semibold text-midnight text-sm mb-3">
            KYC Verification
          </h3>
          <div className="flex items-center gap-3">
            {app.kycVerified ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cover-green/10 text-cover-green text-xs font-semibold">
                  <CheckCircle size={12} />
                  Verified
                </span>
                {kycVerification && (
                  <span className="font-body text-xs text-slate">
                    via {kycVerification.type?.toUpperCase()} ·{" "}
                    {new Date(kycVerification.verifiedAt!).toLocaleDateString(
                      "en-NG",
                    )}
                  </span>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate/10 text-slate text-xs font-semibold">
                Not verified
              </span>
            )}
          </div>
          {kycVerification?.dojahData != null ? (
            <div className="mt-3 bg-slate/5 rounded-lg p-3">
              <p className="font-body text-xs font-semibold text-midnight mb-2">
                Dojah Response
              </p>
              <pre className="font-mono text-xs text-slate overflow-auto">
                {JSON.stringify(kycVerification.dojahData, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>

        {Object.keys(formData).length > 0 && (
          <Section title="Application Form Data" icon={FileText}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(formData)
                .filter(
                  ([key]) =>
                    ![
                      "quoteId",
                      "fromQuote",
                      "quotedPremium",
                      "kycVerification",
                    ].includes(key),
                )
                .map(([key, value]) => (
                  <Field
                    key={key}
                    label={key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (s) => s.toUpperCase())}
                    value={
                      typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value ?? "")
                    }
                  />
                ))}
            </div>
          </Section>
        )}

        {Object.keys(assetDetails).length > 0 && (
          <Section title="Asset Details" icon={Briefcase}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(assetDetails).map(([key, value]) => (
                <Field
                  key={key}
                  label={key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (s) => s.toUpperCase())}
                  value={String(value ?? "")}
                />
              ))}
            </div>
          </Section>
        )}

        <Section title="Product" icon={Shield}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Product Name" value={app.product.name} />
            <Field label="Category" value={app.product.category} />
            <Field label="Pricing Type" value={app.product.pricingType} />
            {app.product.premiumAmount && (
              <Field
                label="Premium"
                value={`₦${parseFloat(app.product.premiumAmount).toLocaleString("en-NG")}/year`}
              />
            )}
            {app.product.rate && (
              <Field
                label="Rate"
                value={`${parseFloat(app.product.rate) * 100}% of ${app.product.calculationBasis}`}
              />
            )}
          </div>
        </Section>

        <Section title="KYC Documents" icon={FileText}>
          {app.kycDocuments.length === 0 ? (
            <p className="font-body text-sm text-slate">
              No documents uploaded yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {app.kycDocuments.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-slate/10 rounded-lg hover:border-daybreak hover:bg-daybreak/5 transition-colors group"
                >
                  <FileText
                    size={16}
                    className="text-slate group-hover:text-daybreak transition-colors shrink-0"
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
                    className="text-slate group-hover:text-daybreak transition-colors shrink-0"
                  />
                </a>
              ))}
            </div>
          )}
        </Section>

        {app.payments.length > 0 && (
          <Section title="Payment History" icon={Shield}>
            <div className="space-y-2">
              {app.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-2 border-b border-slate/5 last:border-0"
                >
                  <div>
                    <p className="font-mono text-sm text-midnight">
                      ₦{parseFloat(payment.amount).toLocaleString("en-NG")}
                    </p>
                    <p className="font-body text-xs text-slate">
                      {new Date(payment.createdAt).toLocaleDateString("en-NG")}
                    </p>
                  </div>
                  <StatusBadge status={payment.status} />
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
