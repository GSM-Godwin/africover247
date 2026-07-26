import { useEffect, useRef } from "react"

interface UseAutoRefreshOptions {
  intervalMs?: number
  enabled?: boolean
}

export function useAutoRefresh(
  fetchFn: () => void | Promise<void>,
  options: UseAutoRefreshOptions = {}
) {
  const { intervalMs = 30000, enabled = true } = options
  const fetchRef = useRef(fetchFn)

  useEffect(() => {
    fetchRef.current = fetchFn
  }, [fetchFn])

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      fetchRef.current()
    }, intervalMs)

    function onFocus() {
      fetchRef.current()
    }
    window.addEventListener("focus", onFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
    }
  }, [intervalMs, enabled])
}
