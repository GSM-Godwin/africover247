"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Check, Clock, Download, SearchX, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import api from "@/lib/api";
import {
  PENDING_APPLICATION_ID_KEY,
  callbackOutcomeFor,
  type PaymentStatusResponse,
} from "@/types/payment";
import { formatPolicyDate, type PolicyRecord } from "@/types/policy";
import { ReauthModal } from "@/components/shared/reauth-modal";
import { useReauth } from "@/hooks/use-reauth";
import {
  initiateAndRedirect,
  isStepUpRejection,
  paymentErrorMessage,
} from "@/lib/payment";

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_DURATION_MS = 60 * 1000;
const POLICY_RETRY_ATTEMPTS = 3;
const POLICY_RETRY_DELAY_MS = 1500;
const LAST_PAYMENT_REFERENCE_KEY = "africover_last_payment_reference";

type CallbackState =
  | "checking"
  | "success"
  | "cancelled"
  | "failed"
  | "unconfirmed"
  | "not_found";

const primaryButton =
  "w-full bg-daybreak text-midnight font-body font-bold text-base py-4 rounded-lg hover:bg-[#D4921A] transition-colors duration-200 text-center";
const secondaryButton =
  "w-full border border-slate/30 text-midnight font-body font-medium text-base py-4 rounded-lg hover:border-midnight transition-colors duration-200 text-center";

function OutcomeCard({
  icon,
  iconClassName,
  title,
  children,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="text-center py-4">
      <div
        className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${iconClassName}`}
      >
        {icon}
      </div>
      <h1 className="font-display font-bold text-midnight text-2xl sm:text-3xl mb-3">{title}</h1>
      {children}
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showModal, requireReauth, onSuccess, onCancel, resetReauth } = useReauth();

  const [state, setState] = useState<CallbackState>("checking");
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<PaymentStatusResponse | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [policy, setPolicy] = useState<PolicyRecord | null>(null);
  const [pollRound, setPollRound] = useState(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const loadPolicy = useCallback(async (appId: string) => {
    for (let attempt = 0; attempt < POLICY_RETRY_ATTEMPTS; attempt++) {
      if (attempt > 0) await wait(POLICY_RETRY_DELAY_MS);
      try {
        const res = await api.get<PolicyRecord[]>("/policies/my");
        const matched = res.data.find((item) => item.applicationId === appId);
        if (matched) {
          setPolicy(matched);
          if (matched.policyPdfUrl) return;
        }
      } catch {
        return;
      }
    }
  }, []);

  useEffect(() => {
    const referenceFromUrl =
      searchParams.get("paymentReference") ?? searchParams.get("reference");
    const storedReference = sessionStorage.getItem(LAST_PAYMENT_REFERENCE_KEY);
    const reference = referenceFromUrl ?? storedReference;
    if (referenceFromUrl) sessionStorage.setItem(LAST_PAYMENT_REFERENCE_KEY, referenceFromUrl);
    setPaymentReference(reference);

    const storedApplicationId = sessionStorage.getItem(PENDING_APPLICATION_ID_KEY);

    if (!referenceFromUrl) {
      if (storedApplicationId) setApplicationId(storedApplicationId);
      else setState("not_found");
      return;
    }

    api
      .get<{ applicationId?: string }>(
        `/payments/by-reference/${encodeURIComponent(referenceFromUrl)}`,
      )
      .then((res) => {
        if (!res.data?.applicationId) {
          setState("not_found");
          return;
        }
        sessionStorage.setItem(PENDING_APPLICATION_ID_KEY, res.data.applicationId);
        setApplicationId(res.data.applicationId);
      })
      .catch(() => setState("not_found"));
  }, [searchParams]);

  useEffect(() => {
    if (!applicationId || state !== "checking") return;

    let cancelled = false;
    const startedAt = Date.now();

    async function poll() {
      if (cancelled || !applicationId) return;
      try {
        const res = await api.get<PaymentStatusResponse>(`/payments/status/${applicationId}`);
        if (cancelled) return;
        setLastStatus(res.data);
        if (res.data.payment?.gatewayReference) {
          setPaymentReference(res.data.payment.gatewayReference);
        }
        const outcome = callbackOutcomeFor(res.data);
        if (outcome === "success") {
          await loadPolicy(applicationId);
          if (!cancelled) setState("success");
          return;
        }
        if (outcome) {
          setState(outcome);
          return;
        }
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          if (!cancelled) setState("not_found");
          return;
        }
      }

      if (Date.now() - startedAt >= MAX_POLL_DURATION_MS) {
        if (!cancelled) setState("unconfirmed");
        return;
      }
      pollTimer.current = setTimeout(poll, POLL_INTERVAL_MS);
    }

    void poll();
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [applicationId, state, pollRound, loadPolicy, stopPolling]);

  async function retryPayment(stepUpToken?: string) {
    if (!applicationId) {
      router.push("/dashboard");
      return;
    }
    try {
      window.location.href = await initiateAndRedirect(
        applicationId,
        lastStatus?.payment?.paymentPlan ?? "annual",
        stepUpToken,
      );
    } catch (err) {
      if (isStepUpRejection(err)) {
        resetReauth();
        toast.error(paymentErrorMessage(err, "Please confirm your identity again."));
        return;
      }
      toast.error(paymentErrorMessage(err, "Could not start the payment. Please try again."));
    }
  }

  function checkAgain() {
    setState("checking");
    setPollRound((round) => round + 1);
  }

  const applicationHref =
    lastStatus?.productId && applicationId
      ? `/apply/${lastStatus.productId}/${applicationId}/payment`
      : "/applications/drafts";

  const tryAgainButton = (
    <button
      type="button"
      onClick={() => requireReauth((token) => void retryPayment(token))}
      className={primaryButton}
    >
      Try again
    </button>
  );

  const referenceLine = paymentReference ? (
    <p className="font-body text-slate/70 text-xs mb-6 break-all">
      Payment reference: <span className="font-mono">{paymentReference}</span>
    </p>
  ) : null;

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F5F6F8]">
        <div className="max-w-lg mx-auto px-4 sm:px-8 py-10 sm:py-12">
          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-10">
            {state === "checking" && (
              <div className="text-center py-8" role="status" aria-live="polite">
                <div className="relative w-16 h-16 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-slate/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-daybreak animate-spin" />
                </div>
                <h1 className="font-display font-bold text-midnight text-2xl sm:text-3xl mb-3">
                  Checking your payment...
                </h1>
                <p className="font-body text-slate text-base">
                  We&apos;re confirming the result with Monnify. This usually takes a few
                  seconds.
                </p>
              </div>
            )}

            {state === "success" && (
              <OutcomeCard
                icon={<Check size={32} className="text-white" strokeWidth={2.5} />}
                iconClassName="bg-cover-green"
                title="Payment successful"
              >
                {policy ? (
                  <div className="border border-slate/20 rounded-xl p-5 mb-6 text-left">
                    <span className="inline-block font-mono text-xs font-medium text-midnight border border-slate/30 rounded-full px-3 py-1 mb-3">
                      {policy.policyNumber}
                    </span>
                    <p className="font-body text-slate text-sm">
                      {policy.product?.name ?? "Insurance"} · Issued{" "}
                      {formatPolicyDate(policy.issueDate)} · Expires{" "}
                      {formatPolicyDate(policy.expiryDate)}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="font-body text-slate text-sm mb-2">
                      Your payment is confirmed. Your policy is being prepared and will appear in
                      My Policies shortly.
                    </p>
                    {referenceLine}
                  </>
                )}
                <div className="flex flex-col gap-3">
                  <Link
                    href={policy ? `/policies/${policy.id}` : "/policies"}
                    className={primaryButton}
                  >
                    {policy ? "View my policy" : "Go to My Policies"}
                  </Link>
                  {policy?.policyPdfUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(policy.policyPdfUrl ?? "", "_blank")}
                      className={`${secondaryButton} flex items-center justify-center gap-2`}
                    >
                      <Download size={16} />
                      Download policy
                    </button>
                  )}
                </div>
              </OutcomeCard>
            )}

            {state === "cancelled" && (
              <OutcomeCard
                icon={<XCircle size={32} className="text-slate" />}
                iconClassName="bg-slate-100"
                title="Payment cancelled"
              >
                <p className="font-body text-slate text-base mb-8">
                  You cancelled this payment. No money was taken.
                </p>
                <div className="flex flex-col gap-3">
                  {tryAgainButton}
                  <Link href={applicationHref} className={secondaryButton}>
                    Back to my application
                  </Link>
                </div>
              </OutcomeCard>
            )}

            {state === "failed" && (
              <OutcomeCard
                icon={<AlertCircle size={32} className="text-alert-coral" />}
                iconClassName="bg-alert-coral/10"
                title="Payment not completed"
              >
                <p className="font-body text-slate text-base mb-2">
                  Your payment was not completed.
                </p>
                {lastStatus?.failureReason && (
                  <p className="font-body text-slate text-sm mb-2">{lastStatus.failureReason}</p>
                )}
                <p className="font-body text-slate text-sm mb-6">
                  Your application has been saved, so you can try again.
                </p>
                {referenceLine}
                <div className="flex flex-col gap-3">
                  {tryAgainButton}
                  <Link href="/contact" className={secondaryButton}>
                    Contact support
                  </Link>
                </div>
              </OutcomeCard>
            )}

            {state === "unconfirmed" && (
              <OutcomeCard
                icon={<Clock size={32} className="text-daybreak" />}
                iconClassName="bg-daybreak/10"
                title="We haven't received confirmation yet"
              >
                <p className="font-body text-slate text-base mb-4">
                  If money left your account, don&apos;t pay again: your policy will appear in
                  your dashboard once we confirm it.
                </p>
                {referenceLine}
                <div className="flex flex-col gap-3">
                  <Link href="/dashboard" className={primaryButton}>
                    Go to my dashboard
                  </Link>
                  <Link href="/contact" className={secondaryButton}>
                    Contact support
                  </Link>
                  <button
                    type="button"
                    onClick={checkAgain}
                    className="font-body text-sm font-medium text-midnight underline underline-offset-2 hover:text-daybreak transition-colors"
                  >
                    Check again
                  </button>
                </div>
              </OutcomeCard>
            )}

            {state === "not_found" && (
              <OutcomeCard
                icon={<SearchX size={32} className="text-slate" />}
                iconClassName="bg-slate-100"
                title="We couldn't find this payment"
              >
                <p className="font-body text-slate text-base mb-8">
                  This payment link isn&apos;t linked to your account. If you were charged,
                  contact support with your payment reference.
                </p>
                <div className="flex flex-col gap-3">
                  <Link href="/dashboard" className={primaryButton}>
                    Go to my dashboard
                  </Link>
                  <Link href="/contact" className={secondaryButton}>
                    Contact support
                  </Link>
                </div>
              </OutcomeCard>
            )}

            <p className="font-body text-slate/50 text-xs mt-8 text-center">
              Secured by Monnify · Your data is safe
            </p>
          </div>
        </div>
      </main>
      <ReauthModal
        open={showModal}
        onSuccess={onSuccess}
        onCancel={onCancel}
        reason="Please confirm your password before trying the payment again."
        allowEmailCode
        paymentContext={
          applicationId
            ? { applicationId, paymentPlan: lastStatus?.payment?.paymentPlan ?? "annual" }
            : undefined
        }
      />
    </>
  );
}
