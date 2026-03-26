'use client'

import { useState } from 'react'
import { Search, Menu, LogOut, Bell } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import MobileDrawer from './MobileDrawer'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Topbar({ user }) {
  const router = useRouter()
  const [query,      setQuery]  = useState('')
  const [drawerOpen, setDrawer] = useState(false)

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric',
    month: 'long',   year: 'numeric',
  })

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <header className="h-16 bg-white border-b border-border flex items-center gap-3 px-4 md:px-6 flex-shrink-0">

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setDrawer(true)}
          className="md:hidden w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center hover:bg-brand-50 transition-colors flex-shrink-0"
        >
          <Menu size={18} className="text-ink-3" />
        </button>

        {/* Mobile logo */}
        <div className="md:hidden flex-1">
          <span className="font-display text-xl font-bold text-brand-900">
            Grade<span className="text-amber">Me</span>
          </span>
        </div>

        {/* Search — desktop only */}
        <div className="hidden md:flex flex-1 items-center gap-3 bg-surface border border-border rounded-full px-4 py-2 max-w-md">
          <Search size={15} className="text-ink-4 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search assessments, students…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-4 outline-none"
          />
        </div>

        <div className="flex-1 hidden md:block" />

        {/* Date — desktop only */}
        <span className="text-sm text-ink-3 hidden lg:block whitespace-nowrap">
          {today}
        </span>

        {/* Bell — always visible, cosmetic for now */}
        <button className="relative w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-brand-50 transition-colors flex-shrink-0">
          <Bell size={16} className="text-ink-3" />
        </button>

        {/* Avatar — clickable → goes to settings */}
        {user && (
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <Avatar name={user.name} size="sm" />
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-ink leading-none">
                {user.name}
              </p>
              <p className="text-xs text-ink-4 mt-0.5">{user.role}</p>
            </div>
          </Link>
        )}

        {/* Sign out — desktop only */}
        <button
          onClick={handleSignOut}
          className="hidden lg:flex items-center gap-1 text-xs text-ink-4 hover:text-danger transition-colors p-1"
          title="Sign out"
        >
          <LogOut size={14} />
        </button>

      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawer(false)} />
    </>
  )
}