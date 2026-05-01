'use client'

import { useState, useEffect } from 'react'
import { createClient }        from '@/lib/supabase/client'
import { useRouter }           from 'next/navigation'
import MobileDrawer            from '@/components/layout/MobileDrawer'
import Avatar                  from '@/components/ui/Avatar'
import CreditsDisplay          from '@/components/ui/CreditsDisplay'
import { LogOut, Settings }    from 'lucide-react'
import Link                    from 'next/link'

export default function Topbar() {
  const router  = useRouter()
  const [user,  setUser]  = useState(null)
  const [open,  setOpen]  = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'Teacher'

  return (
    <header className="h-14 bg-brand-900 border-b border-white/10 flex items-center justify-between px-4 md:px-6 flex-shrink-0 sticky top-0 z-30">

      {/* Left: hamburger (mobile only) + logo on mobile */}
      <div className="flex items-center gap-3">
        {/* Hamburger — MobileDrawer renders the button + overlay + drawer */}
        <MobileDrawer />

        {/* Brand name on mobile (hidden on desktop — sidebar shows it there) */}
        <div className="md:hidden font-display text-lg font-bold select-none">
          <span className="text-white">Grade</span>
          <span className="text-amber">Mee</span>
        </div>
      </div>

      {/* Right: credits + user avatar */}
      <div className="flex items-center gap-2">
        <CreditsDisplay />

        <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label="Account menu"
        >
          <Avatar name={displayName} size="sm" className="flex-shrink-0" />
          <span className="text-white/70 text-sm font-medium hidden sm:block max-w-[140px] truncate">
            {displayName}
          </span>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-border rounded-2xl shadow-xl z-20 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-ink truncate">{displayName}</p>
                <p className="text-xs text-ink-4 truncate">{user?.email}</p>
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-ink hover:bg-surface transition-colors"
              >
                <Settings size={15} className="text-ink-4" />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-danger hover:bg-danger-light transition-colors"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
      </div>
    </header>
  )
}