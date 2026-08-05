import { useEffect, useRef, useCallback } from 'react'
import { AppState, AppStateStatus } from 'react-native'

const IDLE_MS = 5 * 60 * 1000

interface UseInactivityTimeoutOptions {
  onIdle: () => void
  onActive: () => void
  enabled?: boolean
}

export function useInactivityTimeout({
  onIdle,
  onActive,
  enabled = true,
}: UseInactivityTimeoutOptions) {
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const backgroundTime = useRef<number | null>(null)

  const resetTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    onActive()
    if (enabled) {
      idleTimer.current = setTimeout(onIdle, IDLE_MS)
    }
  }, [onIdle, onActive, enabled])

  useEffect(() => {
    if (!enabled) return

    idleTimer.current = setTimeout(onIdle, IDLE_MS)

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background') {
        backgroundTime.current = Date.now()
        if (idleTimer.current) clearTimeout(idleTimer.current)
      } else if (state === 'active') {
        const elapsed = backgroundTime.current
          ? Date.now() - backgroundTime.current
          : 0
        if (elapsed >= IDLE_MS) {
          onIdle()
        } else {
          const remaining = IDLE_MS - elapsed
          idleTimer.current = setTimeout(onIdle, remaining)
        }
        backgroundTime.current = null
      }
    })

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      subscription.remove()
    }
  }, [enabled, onIdle])

  return { resetTimer }
}
