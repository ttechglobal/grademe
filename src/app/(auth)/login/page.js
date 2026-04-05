'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPw,   setShowPw]   = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-xl font-extrabold tracking-tight">
          <span className="text-brand-900">Grade</span>
          <span className="text-amber">Mee</span>
        </Link>
        <Link
          href="/signup"
          className="text-sm font-semibold text-ink-3 hover:text-ink transition-colors"
        >
          Create account →
        </Link>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">

          {/* Card */}
          <div className="bg-white rounded-[24px] border border-black/[0.06] shadow-xl shadow-black/[0.04] overflow-hidden">

            {/* Card header strip */}
            <div className="bg-gradient-to-br from-brand-900 to-brand-700 px-8 pt-8 pb-7">
              <div className="inline-flex w-11 h-11 rounded-2xl bg-amber items-center justify-center mb-5">
                <span className="font-display font-extrabold text-brand-900 text-lg leading-none">G</span>
              </div>
              <h1 className="font-display text-2xl font-extrabold text-white leading-tight">
                Welcome back
              </h1>
              <p className="text-white/50 text-sm mt-1.5">
                Sign in to your GradeMee account
              </p>
            </div>

            {/* Form */}
            <div className="px-8 py-8">
              <form onSubmit={handleLogin} className="flex flex-col gap-5" noValidate>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-ink-3 uppercase tracking-widest">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    placeholder="you@school.com"
                    autoComplete="email"
                    className="w-full px-4 py-3.5 bg-[#f7f7f5] border border-black/[0.08] rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs font-bold text-ink-3 uppercase tracking-widest">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="text-xs text-brand-500 font-semibold hover:text-brand-400 transition-colors"
                    >
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    placeholder="Your password"
                    autoComplete="current-password"
                    className="w-full px-4 py-3.5 bg-[#f7f7f5] border border-black/[0.08] rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2.5 bg-danger-light border border-danger/20 rounded-xl px-4 py-3">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5" aria-hidden="true">
                      <circle cx="8" cy="8" r="7" stroke="#e5534b" strokeWidth="1.5" />
                      <path d="M8 5v3.5M8 11h.01" stroke="#e5534b" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <p className="text-sm text-danger leading-snug">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-brand-900 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-900/20 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

              </form>
            </div>

            {/* Card footer */}
            <div className="px-8 pb-8 pt-0">
              <div className="border-t border-black/[0.06] pt-6 text-center">
                <p className="text-sm text-ink-4">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="font-bold text-brand-600 hover:text-brand-500 transition-colors">
                    Create one free →
                  </Link>
                </p>
              </div>
            </div>

          </div>

          {/* Below-card note */}
          <p className="text-center text-xs text-ink-4 mt-6 leading-relaxed">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline underline-offset-2 hover:text-ink transition-colors">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-ink transition-colors">Privacy Policy</Link>.
          </p>
        </div>
      </div>

    </div>
  )
}