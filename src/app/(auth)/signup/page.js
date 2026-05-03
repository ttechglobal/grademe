'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function PasswordStrength({ password }) {
  if (!password) return null
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password)]
  const score  = checks.filter(Boolean).length
  const label  = score === 1 ? 'Weak' : score === 2 ? 'Fair' : 'Strong'
  const colors = ['', 'bg-red-400', 'bg-amber', 'bg-success']
  const widths  = ['', 'w-1/3', 'w-2/3', 'w-full']
  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="h-1 bg-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colors[score]} ${widths[score]}`} />
      </div>
      <p className={`text-xs font-semibold ${score === 1 ? 'text-red-500' : score === 2 ? 'text-amber' : 'text-success'}`}>
        {label} password
      </p>
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPw,   setShowPw]   = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!fullName.trim())        { setError('Please enter your full name.'); return }
    if (!email)                  { setError('Please enter your email.'); return }
    if (password.length < 8)     { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    })
    if (err) { setError(err.message); setLoading(false) }
    else router.push('/onboarding')
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px] flex flex-col">

        {/* Logo above card — centred, clean */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-1">
            <span className="font-display text-[26px] font-extrabold tracking-tight">
              <span className="text-brand-900">Grade</span><span className="text-amber">Mee</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-4">
              Empowering Learning
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[24px] border border-black/[0.06] shadow-xl shadow-black/[0.04] overflow-hidden">

          {/* Card header */}
          <div className="bg-gradient-to-br from-brand-900 to-brand-700 px-8 pt-8 pb-7">
            <h1 className="font-display text-2xl font-extrabold text-white leading-tight">
              Create your account
            </h1>
            <p className="text-white/50 text-sm mt-1.5">
              Start building assessments in minutes — free forever.
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={handleSignup} className="flex flex-col gap-5" noValidate>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="fullName" className="text-xs font-bold text-ink-3 uppercase tracking-widest">
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setError('') }}
                  placeholder="e.g. Adaeze Obi"
                  autoComplete="name"
                  className="w-full px-4 py-3.5 bg-[#f7f7f5] border border-black/[0.08] rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-bold text-ink-3 uppercase tracking-widest">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="you@email.com"
                  autoComplete="email"
                  className="w-full px-4 py-3.5 bg-[#f7f7f5] border border-black/[0.08] rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-bold text-ink-3 uppercase tracking-widest">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-500 transition-colors"
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className="w-full px-4 py-3.5 bg-[#f7f7f5] border border-black/[0.08] rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                />
                <PasswordStrength password={password} />
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-danger-light border border-danger/20 rounded-xl px-4 py-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5" aria-hidden="true">
                    <circle cx="8" cy="8" r="7" stroke="#e5534b" strokeWidth="1.5" />
                    <path d="M8 5v3.5M8 11h.01" stroke="#e5534b" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm text-danger leading-snug">{error}</p>
                </div>
              )}

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
                    Creating account…
                  </>
                ) : 'Create Free Account'}
              </button>

            </form>
          </div>

          {/* Card footer */}
          <div className="px-8 pb-8 pt-0">
            <div className="border-t border-black/[0.06] pt-6 text-center">
              <p className="text-sm text-ink-4">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-brand-600 hover:text-brand-500 transition-colors">
                  Sign in →
                </Link>
              </p>
            </div>
          </div>

        </div>

        {/* Below-card note */}
        <p className="text-center text-xs text-ink-4 mt-5 leading-relaxed">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-ink transition-colors">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink transition-colors">Privacy Policy</Link>.
        </p>

      </div>
    </div>
  )
}