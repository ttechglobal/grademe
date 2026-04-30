import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Allowed redirect paths — must start with / and stay on this origin.
// Never allow external redirects via the ?next= parameter.
function safeNextPath(next) {
  if (!next || typeof next !== 'string') return '/dashboard'
  // Only allow same-origin paths (starting with /)
  if (!next.startsWith('/')) return '/dashboard'
  // Block protocol-relative URLs like //evil.com
  if (next.startsWith('//')) return '/dashboard'
  return next
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}