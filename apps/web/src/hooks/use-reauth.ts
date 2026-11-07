import { useState, useCallback } from "react";

const HIGH_RISK_MS = 10 * 60 * 1000;

type ReauthAction = (stepUpToken?: string) => void;

export function useReauth() {
  const [showModal, setShowModal] = useState(false);
  const [lastAuth, setLastAuth] = useState<number | null>(null);
  const [stepUpToken, setStepUpToken] = useState<string | undefined>(undefined);
  const [pendingAction, setPendingAction] = useState<ReauthAction | null>(null);

  const requireReauth = useCallback(
    (action: ReauthAction) => {
      const now = Date.now();
      if (lastAuth && now - lastAuth < HIGH_RISK_MS) {
        action(stepUpToken);
        return;
      }
      setPendingAction(() => action);
      setShowModal(true);
    },
    [lastAuth, stepUpToken],
  );

  const onSuccess = useCallback(
    (token?: string) => {
      setLastAuth(Date.now());
      setStepUpToken(token);
      setShowModal(false);
      pendingAction?.(token);
      setPendingAction(null);
    },
    [pendingAction],
  );

  const onCancel = useCallback(() => {
    setShowModal(false);
    setPendingAction(null);
  }, []);

  const resetReauth = useCallback(() => {
    setLastAuth(null);
    setStepUpToken(undefined);
  }, []);

  return { showModal, requireReauth, onSuccess, onCancel, resetReauth };
}
