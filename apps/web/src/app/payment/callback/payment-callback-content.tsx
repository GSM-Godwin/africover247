"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Check, Download, Loader2, X } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import api from "@/lib/api";
import { initiateAndRedirect } from "@/lib/payment";
import { PENDING_APPLICATION_ID_KEY } from "@/types/payment";
import {
  isPaymentFailed,
  isPaymentSuccessful,
  type PaymentStatusResponse,
} from "@/types/payment";
import { formatPolicyDate, type PolicyRecord } from "@/types/policy";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 60;
const POLICY_FETCH_DELAY_MS = 1500;
const POLICY_RETRY_ATTEMPTS = 3;
const POLICY_RETRY_DELAY_MS = 1000;

type CallbackState =
  | "loading"
  | "success"
  | "failure"
  | "timeout"
  | "missing_application";

export function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [state, setState] = useState<CallbackState>("loading");
  const [policy, setPolicy] = useState<PolicyRecord | null>(null);
  const [policyPending, setPolicyPending] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const productName = policy?.product?.name ?? "Insurance";

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const fetchPolicy = useCallback(async (appId: string) => {
    for (let attempt = 0; attempt < POLICY_RETRY_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, POLICY_RETRY_DELAY_MS),
        );
      }

      const res = await api.get<PolicyRecord[]>("/policies/my");
      const matched =
        res.data.find((item) => item.applicationId === appId) ??
        res.data[0] ??
        null;

      if (matched?.policyPdfUrl) {
        setPolicy(matched);
        setPolicyPending(false);
        return;
      }
    }

    setPolicyPending(true);
  }, []);

  const resolveStatus = useCallback(
    async (appId: string, status: PaymentStatusResponse) => {
      if (isPaymentSuccessful(status)) {
        stopPolling();
        await new Promise((resolve) =>
          setTimeout(resolve, POLICY_FETCH_DELAY_MS),
        );
        await fetchPolicy(appId);
        setState("success");
        return true;
      }

      if (isPaymentFailed(status)) {
        stopPolling();
        setState("failure");
        return true;
      }

      return false;
    },
    [fetchPolicy, stopPolling],
  );

  const checkStatus = useCallback(
    async (appId: string) => {
      const res = await api.get<PaymentStatusResponse>(
        `/payments/status/${appId}`,
      );
      return resolveStatus(appId, res.data);
    },
    [resolveStatus],
  );

  useEffect(() => {
    const paymentReference = searchParams.get("paymentReference");
    if (paymentReference) {
      sessionStorage.setItem(
        "africover_last_payment_reference",
        paymentReference,
      );
    }

    const storedApplicationId = sessionStorage.getItem(
      PENDING_APPLICATION_ID_KEY,
    );
    if (!storedApplicationId) {
      setState("missing_application");
      return;
    }

    setApplicationId(storedApplicationId);

    pollTimer.current = setInterval(async () => {
      pollCount.current += 1;

      if (pollCount.current > MAX_POLL_ATTEMPTS) {
        stopPolling();
        setState("timeout");
        return;
      }

      try {
        const resolved = await checkStatus(storedApplicationId);
        if (resolved) stopPolling();
      } catch {
        /* keep polling */
      }
    }, POLL_INTERVAL_MS);

    checkStatus(storedApplicationId).then((resolved) => {
      if (resolved) stopPolling();
    });

    return () => stopPolling();
  }, [searchParams, checkStatus, stopPolling]);

  async function handleManualCheck() {
    if (!applicationId) return;
    setStatusLoading(true);
    try {
      const resolved = await checkStatus(applicationId);
      if (!resolved) setState("loading");
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleTryAgain() {
    if (!applicationId) return;
    setRetryLoading(true);
    try {
      await initiateAndRedirect(applicationId);
    } catch {
      setRetryLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F5F6F8]">
        <div className="max-w-lg mx-auto px-6 sm:px-8 py-10 sm:py-12">
          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(16,26,52,0.06)] p-6 sm:p-10">
            {state === "missing_application" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                  <AlertCircle size={32} className="text-slate" />
                </div>
                <h1 className="font-display font-bold text-midnight text-2xl sm:text-3xl mb-3">
                  We couldn&apos;t confirm your payment status automatically.
                </h1>
                <p className="font-body text-slate text-sm mb-8 leading-relaxed">
                  If you completed payment, your policy should appear there
                  shortly. If not, please try applying again or contact support.
                </p>
                <Link
                  href="/policies"
                  className="inline-block w-full max-w-xs bg-daybreak text-midnight font-body font-bold text-base py-4 rounded-lg hover:bg-[#D4921A] transition-colors duration-200 mb-4"
                >
                  Go to My Policies
                </Link>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="font-body text-sm font-medium text-midnight underline underline-offset-2 hover:text-daybreak transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            )}

            {state === "loading" && applicationId && (
              <div className="text-center py-8">
                <div className="relative w-16 h-16 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-slate/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-daybreak animate-spin" />
                </div>
                <h1 className="font-display font-bold text-midnight text-2xl sm:text-3xl mb-3">
                  Processing your payment...
                </h1>
                <p className="font-body text-slate text-base">
                  Please do not close this page
                </p>
              </div>
            )}

            {state === "timeout" && applicationId && (
              <div className="text-center py-8">
                <h1 className="font-display font-bold text-midnight text-2xl sm:text-3xl mb-3">
                  This is taking longer than expected
                </h1>
                <p className="font-body text-slate text-base mb-8">
                  Your payment may still be processing.
                </p>
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={statusLoading}
                  className="w-full bg-daybreak text-midnight font-body font-bold text-base py-4 rounded-lg hover:bg-[#D4921A] disabled:opacity-60 transition-colors duration-200 flex items-center justify-center gap-2 mb-4"
                >
                  {statusLoading && <Loader2 size={18} className="animate-spin" />}
                  Check status
                </button>
                <Link
                  href="/dashboard"
                  className="font-body text-sm font-medium text-midnight underline underline-offset-2 hover:text-daybreak transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}

            {state === "failure" && applicationId && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-alert-coral flex items-center justify-center">
                  <X size={32} className="text-white" strokeWidth={2.5} />
                </div>
                <h1 className="font-display font-bold text-midnight text-2xl sm:text-3xl mb-3">
                  Payment unsuccessful
                </h1>
                <p className="font-body text-slate text-base mb-8">
                  Application saved. Try again
                </p>
                <button
                  type="button"
                  onClick={handleTryAgain}
                  disabled={retryLoading}
                  className="w-full max-w-xs mx-auto bg-daybreak text-midnight font-body font-bold text-base py-4 rounded-lg hover:bg-[#D4921A] disabled:opacity-60 transition-colors duration-200 flex items-center justify-center gap-2 mb-6"
                >
                  {retryLoading && <Loader2 size={18} className="animate-spin" />}
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="font-body text-sm font-medium text-midnight underline underline-offset-2 hover:text-daybreak transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

            {state === "success" && applicationId && (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-cover-green flex items-center justify-center">
                  <Check size={32} className="text-white" strokeWidth={2.5} />
                </div>
                <h1 className="font-display font-bold text-midnight text-2xl sm:text-3xl mb-6">
                  You&apos;re covered!
                </h1>

                {policyPending || !policy ? (
                  <p className="font-body text-slate text-sm mb-8 px-4">
                    Your policy is still being generated — check My Policies shortly
                  </p>
                ) : (
                  <div className="border border-slate/20 rounded-xl p-5 mb-8 text-left">
                    <span className="inline-block font-mono text-xs font-medium text-midnight border border-slate/30 rounded-full px-3 py-1 mb-3">
                      {policy.policyNumber}
                    </span>
                    <p className="font-body text-slate text-sm">
                      {productName} · Issued {formatPolicyDate(policy.issueDate)}{" "}
                      · Expires {formatPolicyDate(policy.expiryDate)}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      policy?.policyPdfUrl &&
                      window.open(policy.policyPdfUrl, "_blank")
                    }
                    disabled={!policy?.policyPdfUrl}
                    className="flex-1 border border-midnight text-midnight font-body font-semibold text-sm py-3.5 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download Policy
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="flex-1 bg-daybreak text-midnight font-body font-bold text-sm py-3.5 rounded-lg hover:bg-[#D4921A] transition-colors duration-200"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
