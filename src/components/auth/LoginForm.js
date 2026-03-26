'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginForm() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">
          Welcome back
        </h1>
        <p className="text-ink-3 text-sm mt-1">
          Sign in to your GradeMe account
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
            placeholder="••••••••"
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
              ? <><EyeOff size={12} /> Hide password</>
              : <><Eye size={12} /> Show password</>
            }
          </button>
        </div>
      </div>

      {/* Submit */}
      <Button
        variant="primary"
        size="full"
        onClick={handleLogin}
        loading={loading}
      >
        Sign In →
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-ink-4">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Google OAuth */}
      <Button
        variant="secondary"
        size="full"
        onClick={async () => {
          const supabase = createClient()
          await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          })
        }}
      >
        <span className="text-lg">G</span>
        Continue with Google
      </Button>

      {/* Switch to signup */}
      <p className="text-center text-sm text-ink-3">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="text-brand-600 font-semibold hover:text-brand-500 transition-colors"
        >
          Create one free
        </Link>
      </p>

    </div>
  )
}