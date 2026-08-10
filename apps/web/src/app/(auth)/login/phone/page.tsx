"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Phone, ArrowRight } from "lucide-react"
import { AuthInput } from "@/components/auth/auth-input"
import api from "@/lib/api"
import { setToken, setUser, setRole } from "@/lib/auth"
import Image from "next/image"

type Step = 'phone' | 'otp'

export default function PhoneLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOtp() {
    if (!phone.trim()) {
      setError('Please enter your phone number.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/phone/send-otp', { phone: phone.trim() })
      setLoading(false)
      setStep('otp')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message
      setError(typeof message === 'string' ? message : 'Could not send OTP. Please try again.')
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/phone/verify-otp', { phone: phone.trim(), otp })
      setToken(res.data.accessToken)
      setUser(res.data.user)
      setRole(res.data.user.role)
      setLoading(false)
      router.push(res.data.user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message
      setError(typeof message === 'string' ? message : 'Invalid or expired code.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-2xl px-6 py-4">
          <Image src="/afriglobal_logo.png" alt="AfriGlobal" width={160} height={50} className="object-contain" />
        </div>
      </div>

      {step === 'phone' ? (
        <>
          <div className="mb-8">
            <h1 className="font-display font-bold text-midnight text-3xl mb-2">
              Sign in with phone
            </h1>
            <p className="font-body text-slate text-base">
              We&apos;ll send a verification code to your number.
            </p>
          </div>

          {error && (
            <div className="bg-alert-coral/10 border border-alert-coral/20 rounded-xl px-4 py-3 mb-4">
              <p className="font-body text-sm text-alert-coral">{error}</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <AuthInput
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08012345678"
              required
            />
          </div>

          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-daybreak text-midnight font-body font-bold text-base py-4 rounded-xl hover:bg-[#D4921A] disabled:opacity-60 transition-colors"
          >
            {loading ? 'Sending...' : (
              <>
                <Phone size={18} />
                Send OTP
              </>
            )}
          </button>
        </>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="font-display font-bold text-midnight text-3xl mb-2">
              Enter your code
            </h1>
            <p className="font-body text-slate text-base">
              We sent a 6-digit code to <strong>{phone}</strong>.
            </p>
          </div>

          {error && (
            <div className="bg-alert-coral/10 border border-alert-coral/20 rounded-xl px-4 py-3 mb-4">
              <p className="font-body text-sm text-alert-coral">{error}</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <AuthInput
              label="Verification Code"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              required
            />
          </div>

          <button
            onClick={handleVerifyOtp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-daybreak text-midnight font-body font-bold text-base py-4 rounded-xl hover:bg-[#D4921A] disabled:opacity-60 transition-colors mb-4"
          >
            {loading ? 'Verifying...' : (
              <>
                <ArrowRight size={18} />
                Verify & Sign In
              </>
            )}
          </button>

          <button
            onClick={() => { setStep('phone'); setOtp(''); setError('') }}
            className="w-full font-body text-sm text-slate hover:text-midnight transition-colors"
          >
            ← Change phone number
          </button>

          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full font-body text-sm text-midnight font-semibold hover:text-daybreak transition-colors mt-2"
          >
            Resend code
          </button>
        </>
      )}

      <p className="font-body text-sm text-slate text-center mt-6">
        Sign in with email instead?{' '}
        <Link href="/login" className="font-semibold text-midnight hover:text-daybreak transition-colors">
          Use email
        </Link>
      </p>
    </div>
  )
}
