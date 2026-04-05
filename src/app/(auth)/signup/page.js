'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <div className="font-display text-4xl font-bold mb-2">
              <span className="text-ink">Grade</span>
              <span className="text-amber">Mee</span>
            </div>
          </Link>
          <p className="text-ink-3 text-sm">Create your free teacher account</p>
        </div>

        <div className="bg-white border border-border rounded-3xl p-8 shadow-card">
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Adaeze Obi"
              required
            />
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
              placeholder="Min. 8 characters"
              required
            />

            {error && (
              <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="full" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-ink-4">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-600 font-semibold hover:text-brand-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}