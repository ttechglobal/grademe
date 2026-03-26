'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

export default function SignupForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  const validate = () => {
    if (!fullName.trim()) return 'Please enter your full name.'
    if (!email.trim())    return 'Please enter your email.'
    if (password.length < 8) return 'Password must be at least 8 characters.'
    return null
  }

  const handleSignup = async () => {
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  // Success state — email confirmation sent
  if (success) {
    return (
      <div className="flex flex-col items-center gap-6 text-center py-8">
        <div className="text-6xl">📬</div>
        <div>
          <h2 className="font-display text-2xl font-bold text-ink mb-2">
            Check your email
          </h2>
          <p className="text-sm text-ink-3 leading-relaxed max-w-sm">
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account, then come back to sign in.
          </p>
        </div>
        <Link href="/login">
          <Button variant="secondary">← Back to Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">
          Create your account
        </h1>
        <p className="text-ink-3 text-sm mt-1">
          Free to start. No credit card needed.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="flex flex-col gap-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="e.g. Adaeze Obi"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          icon={<User size={15} />}
        />
        <Input
          label="Email address"
          type="email"
          placeholder="teacher@school.edu.ng"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={15} />}
        />
        <div className="flex flex-col gap-1.5">
          <Input
            label="Password"
            type={showPw ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={15} />}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="self-end flex items-center gap-1 text-xs text-ink-4 hover:text-ink-2 transition-colors"
          >
            {showPw
              ? <><EyeOff size={12} /> Hide</>
              : <><Eye size={12} /> Show</>
            }
          </button>
        </div>
      </div>

      {/* Password strength indicator */}
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                password.length === 0        ? 'bg-border' :
                password.length < 6         ? (level <= 1 ? 'bg-danger' : 'bg-border') :
                password.length < 8         ? (level <= 2 ? 'bg-amber'  : 'bg-border') :
                password.length < 12        ? (level <= 3 ? 'bg-success' : 'bg-border') :
                                               'bg-success'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-ink-4">
          {password.length === 0   ? 'Enter a password' :
           password.length < 6    ? 'Too short' :
           password.length < 8    ? 'Weak — add more characters' :
           password.length < 12   ? 'Good' :
                                    'Strong password ✓'}
        </p>
      </div>

      {/* Terms */}
      <p className="text-xs text-ink-4 leading-relaxed">
        By creating an account you agree to our{' '}
        <span className="text-brand-600 cursor-pointer">Terms of Service</span>
        {' '}and{' '}
        <span className="text-brand-600 cursor-pointer">Privacy Policy</span>.
      </p>

      {/* Submit */}
      <Button
        variant="amber"
        size="full"
        onClick={handleSignup}
        loading={loading}
      >
        Create Account →
      </Button>

      {/* Switch to login */}
      <p className="text-center text-sm text-ink-3">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-brand-600 font-semibold hover:text-brand-500 transition-colors"
        >
          Sign in
        </Link>
      </p>

    </div>
  )
}