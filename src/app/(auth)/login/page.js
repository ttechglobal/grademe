'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* Brand */}
        <div className="text-center">
          <div className="font-display text-4xl font-bold mb-2">
            <span className="text-ink">Grade</span>
            <span className="text-amber">Mee</span>
          </div>
          <p className="text-ink-3 text-sm">Sign in to your teacher account</p>
        </div>

        {/* Form */}
        <div className="bg-white border border-border rounded-3xl p-8 shadow-card">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="full"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-ink-4">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-brand-600 font-semibold hover:text-brand-500"
              >
                Sign up free
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}