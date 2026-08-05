"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { InactivityModal } from "./inactivity-modal";
import { useInactivityTimeout } from "@/hooks/use-inactivity-timeout";
import { clearAuth, isAuthenticated } from "@/lib/auth";

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/session-expired"];

export function InactivityGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAuthPage = AUTH_PATHS.some((p) => pathname?.startsWith(p));
  const authenticated = isAuthenticated();
  const enabled = authenticated && !isAuthPage;

  function stopCountdown() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }

  const handleLogout = useCallback(() => {
    stopCountdown();
    setShowModal(false);
    clearAuth();
    router.push("/session-expired");
  }, [router]);

  const handleStay = useCallback(() => {
    stopCountdown();
    setShowModal(false);
    setCountdown(60);
  }, []);

  const handleIdle = useCallback(() => {
    if (!isAuthenticated()) return;
    setShowModal(true);
    setCountdown(60);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          stopCountdown();
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleLogout]);

  useInactivityTimeout({
    onIdle: handleIdle,
    onActive: handleStay,
    enabled,
  });

  useEffect(() => {
    return () => stopCountdown();
  }, []);

  return (
    <>
      {children}
      <InactivityModal
        open={showModal}
        onStay={handleStay}
        onLogout={handleLogout}
        countdownSeconds={countdown}
      />
    </>
  );
}
