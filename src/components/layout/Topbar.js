'use client'

import { useState } from 'react'
import { Search, Bell, Menu } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import MobileDrawer from './MobileDrawer'

export default function Topbar({ user }) {
  const [query, setQuery]       = useState('')
  const [drawerOpen, setDrawer] = useState(false)

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  })

  return (
    <>
      <header className="h-16 bg-white border-b border-border flex items-center gap-3 px-4 md:px-6 flex-shrink-0">

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setDrawer(true)}
          className="md:hidden w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center hover:bg-brand-50 transition-colors"
        >
          <Menu size={18} className="text-ink-3" />
        </button>

        {/* Search */}
        <div className="flex-1 flex items-center gap-3 bg-surface border border-border rounded-full px-4 py-2 max-w-md">
          <Search size={15} className="text-ink-4 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search assessments, students…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-4 outline-none min-w-0"
          />
        </div>

        <div className="flex-1 hidden md:block" />

        {/* Date — desktop only */}
        <span className="text-sm text-ink-3 hidden lg:block whitespace-nowrap">
          {today}
        </span>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-brand-50 transition-colors flex-shrink-0">
          <Bell size={16} className="text-ink-3" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-white" />
        </button>

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} size="sm" />
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-ink leading-none">{user.name}</p>
              <p className="text-xs text-ink-4 mt-0.5">{user.role}</p>
            </div>
          </div>
        )}

      </header>

      {/* Mobile drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawer(false)}
      />
    </>
  )
}