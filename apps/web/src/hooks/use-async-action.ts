import { useState, useCallback } from "react";

type AsyncFn<T> = () => Promise<T>;

export function useAsyncAction<T = void>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (fn: AsyncFn<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setLoading(false);
      return result;
    } catch (err: unknown) {
      setLoading(false);
      const response = (err as { response?: { data?: { message?: unknown } } })
        .response?.data?.message;
      const message = Array.isArray(response)
        ? String(response[0])
        : typeof response === "string"
          ? response
          : "Something went wrong.";
      setError(message);
      return null;
    }
  }, []);

  return { loading, error, execute };
}
