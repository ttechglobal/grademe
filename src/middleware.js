import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Never intercept superadmin — it handles its own auth
  if (pathname.startsWith('/superadmin')) {
    return NextResponse.next()
  }

  // Public routes
  const publicRoutes = ['/', '/login', '/signup', '/onboarding', '/privacy', '/terms']
  if (publicRoutes.some((r) => pathname === r || pathname.startsWith('/t/'))) {
    return NextResponse.next()
  }

  // API routes — never redirect
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Protected routes — check auth
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll:  () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}