import { useState, useCallback } from "react";

const HIGH_RISK_MS = 10 * 60 * 1000;

export function useReauth() {
  const [showModal, setShowModal] = useState(false);
  const [lastAuth, setLastAuth] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireReauth = useCallback(
    (action: () => void) => {
      const now = Date.now();
      if (lastAuth && now - lastAuth < HIGH_RISK_MS) {
        action();
        return;
      }
      setPendingAction(() => action);
      setShowModal(true);
    },
    [lastAuth],
  );

  const onSuccess = useCallback(() => {
    setLastAuth(Date.now());
    setShowModal(false);
    pendingAction?.();
    setPendingAction(null);
  }, [pendingAction]);

  const onCancel = useCallback(() => {
    setShowModal(false);
    setPendingAction(null);
  }, []);

  return { showModal, requireReauth, onSuccess, onCancel };
}
