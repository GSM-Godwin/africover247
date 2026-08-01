"use client"

import { useEffect, useState } from "react"
import { Clock, AlertTriangle } from "lucide-react"

interface QuoteCountdownProps {
  createdAt: string
  deadlineDays?: number
}

function getTimeRemaining(createdAt: string, deadlineDays: number) {
  const created = new Date(createdAt).getTime()
  const deadline = created + deadlineDays * 24 * 60 * 60 * 1000
  const now = Date.now()
  const diff = deadline - now

  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, total: diff }
}

export function QuoteCountdown({ createdAt, deadlineDays = 3 }: QuoteCountdownProps) {
  const [remaining, setRemaining] = useState(() =>
    getTimeRemaining(createdAt, deadlineDays)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getTimeRemaining(createdAt, deadlineDays))
    }, 1000)
    return () => clearInterval(interval)
  }, [createdAt, deadlineDays])

  if (!remaining) {
    return (
      <div className="flex items-center gap-2 bg-alert-coral/10 border border-alert-coral/20 rounded-xl px-4 py-3">
        <AlertTriangle size={16} className="text-alert-coral shrink-0" />
        <p className="font-body text-sm text-alert-coral font-semibold">
          Quote response window has expired
        </p>
      </div>
    )
  }

  const isUrgent = remaining.total < 24 * 60 * 60 * 1000

  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
      isUrgent
        ? 'bg-alert-coral/10 border border-alert-coral/20'
        : 'bg-daybreak/10 border border-daybreak/20'
    }`}>
      <Clock size={16} className={isUrgent ? 'text-alert-coral shrink-0' : 'text-daybreak shrink-0'} />
      <div className="flex-1">
        <p className={`font-body text-xs font-semibold uppercase tracking-wide mb-1 ${
          isUrgent ? 'text-alert-coral' : 'text-daybreak'
        }`}>
          {isUrgent ? 'Urgent — Response needed soon' : 'Response window'}
        </p>
        <div className="flex items-center gap-2">
          {[
            { value: remaining.days, label: 'd' },
            { value: remaining.hours, label: 'h' },
            { value: remaining.minutes, label: 'm' },
            { value: remaining.seconds, label: 's' },
          ].map(({ value, label }) => (
            <div key={label} className="flex items-baseline gap-0.5">
              <span className={`font-mono font-bold text-lg ${
                isUrgent ? 'text-alert-coral' : 'text-midnight'
              }`}>
                {String(value).padStart(2, '0')}
              </span>
              <span className="font-body text-xs text-slate">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
