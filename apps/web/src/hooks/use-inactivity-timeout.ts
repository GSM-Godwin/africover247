import { useEffect, useRef, useCallback } from "react";

const IDLE_MS = 5 * 60 * 1000;
const COUNTDOWN_MS = 60 * 1000;
const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];

interface UseInactivityTimeoutOptions {
  onIdle: () => void;
  onActive: () => void;
  enabled?: boolean;
}

export function useInactivityTimeout({
  onIdle,
  onActive,
  enabled = true,
}: UseInactivityTimeoutOptions) {
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    onActive();
    idleTimer.current = setTimeout(onIdle, IDLE_MS);
  }, [onIdle, onActive]);

  useEffect(() => {
    if (!enabled) return;

    EVENTS.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    idleTimer.current = setTimeout(onIdle, IDLE_MS);

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [enabled, resetTimer, onIdle]);

  return { resetTimer };
}

export { COUNTDOWN_MS };
