"use client"

import { useState } from "react"
import { formatNumberInput } from "@/lib/format-number"

interface NumberInputProps {
  value: string
  onChange: (raw: string, formatted: string) => void
  placeholder?: string
  className?: string
  prefix?: string
}

export function NumberInput({
  value,
  onChange,
  placeholder = "0",
  className,
  prefix,
}: NumberInputProps) {
  const [display, setDisplay] = useState(value ? formatNumberInput(value) : '')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    const formatted = raw ? parseInt(raw, 10).toLocaleString('en-NG') : ''
    setDisplay(formatted)
    onChange(raw, formatted)
  }

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-slate">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${className} ${prefix ? 'pl-8' : ''}`}
      />
    </div>
  )
}
