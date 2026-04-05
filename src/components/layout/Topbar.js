'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import MobileDrawer from './MobileDrawer'
import { Menu, Bell, Search, X } from 'lucide-react'

const PAGE_TITLES = {
  '/dashboard':                 'Dashboard',
  '/dashboard/assessments':     'Assessments',
  '/dashboard/assessments/new': 'New Assessment',
  '/dashboard/questions':       'Question Bank',
  '/dashboard/ai-import':       'Import Questions',
  '/dashboard/settings':        'Settings',
  '/dashboard/students':        'Students',
}

export default function Topbar() {
  const pathname  = usePathname()
  const router    = useRouter()

  const [profile,     setProfile]     = useState(null)
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) return
      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', data.user.id)
        .single()
      setProfile({ ...p, email: data.user.email })
    })
  }, [])

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const title = PAGE_TITLES[pathname]
    ?? (pathname.includes('/assessments/') ? 'Assessment Details' : 'GradeMee')

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/dashboard/assessments?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-border px-4 md:px-6 py-3 flex items-center gap-3">

        {/* Mobile — hamburger */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="md:hidden w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-ink-3 hover:bg-border transition-colors flex-shrink-0"
        >
          <Menu size={18} />
        </button>

        {/* Mobile logo */}
        <div className="md:hidden font-display text-xl font-bold flex-1">
          <span className="text-ink">Grade</span>
          <span className="text-amber">Mee</span>
        </div>

        {/* Desktop — page title */}
        <h1 className="hidden md:block font-display text-xl font-bold text-ink flex-1">
          {title}
        </h1>

        {/* Desktop — search bar */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs">
          <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 w-full">
            <Search size={14} className="text-ink-4 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search assessments…"
              className="flex-1 bg-transparent text-sm outline-none text-ink placeholder:text-ink-4"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>
                <X size={13} className="text-ink-4 hover:text-ink" />
              </button>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Mobile search */}
          {searchOpen ? (
            <div className="flex items-center gap-2 md:hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search assessments…"
                autoFocus
                className="w-40 px-3 py-1.5 text-sm border border-border rounded-xl outline-none focus:border-brand-500 bg-surface"
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center text-ink-4"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-ink-3 hover:bg-border transition-colors"
            >
              <Search size={16} />
            </button>
          )}

          {/* Bell */}
          <button className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-ink-3 hover:bg-border transition-colors relative">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
          </button>

          {/* Profile — clickable dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-xl hover:bg-surface px-2 py-1 transition-colors"
            >
              <Avatar
                name={profile?.full_name || profile?.email || 'Teacher'}
                size="sm"
              />
              <span className="hidden md:block text-sm font-medium text-ink max-w-[120px] truncate">
                {profile?.full_name?.split(' ')[0] || 'Account'}
              </span>
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-2xl shadow-lg overflow-hidden z-50">
                {/* Profile info */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-ink truncate">
                    {profile?.full_name || 'Teacher'}
                  </p>
                  <p className="text-xs text-ink-4 truncate mt-0.5">
                    {profile?.email}
                  </p>
                </div>
                {/* Links */}
                <div className="py-1">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors"
                  >
                    Account Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger-light transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}