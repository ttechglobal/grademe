'use client'

import { useState, useEffect } from 'react'
import Link                    from 'next/link'
import { usePathname }         from 'next/navigation'
import { Menu, X, Users2, HelpCircle, ChevronRight } from 'lucide-react'
import { NavLinks }            from '@/components/layout/Sidebar'
import { cn }                  from '@/lib/utils'

/**
 * MobileDrawer
 *
 * Renders a hamburger button (visible only on mobile, hidden on md+).
 * Tapping it slides in a full-height drawer with the exact same nav
 * links as the desktop Sidebar — because both import NAV_GROUPS from
 * the same source. Students, Assessments, Question Bank etc. are all
 * guaranteed to be present.
 *
 * Usage: render <MobileDrawer /> inside the Topbar.
 */
export default function MobileDrawer() {
  const [open,    setOpen]    = useState(false)
  const pathname              = usePathname()

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* ── Hamburger button — only visible on mobile ─────────────── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
      >
        <Menu size={20} className="text-white" />
      </button>

      {/* ── Backdrop ──────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Drawer ────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-brand-900',
          'flex flex-col shadow-2xl transition-transform duration-300 ease-out md:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo + tagline + close */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/10 flex-shrink-0">
          <div>
            <div className="font-display text-xl font-bold select-none">
              <span className="text-white">Grade</span>
              <span className="text-amber">Mee</span>
            </div>
            <p className="text-[11px] font-medium tracking-[0.06em] text-white/30 mt-1 select-none">
              Empowering Learning
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors mt-0.5"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Nav — imported from Sidebar, identical to desktop */}
        <nav className="flex-1 py-5 overflow-y-auto">
          <NavLinks onNavigate={() => setOpen(false)} />
        </nav>

        {/* Community */}
        <div className="mx-3 mb-3">
          <a
            href="https://chat.whatsapp.com/grademe-teachers"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-3 bg-amber/10 border border-amber/20 rounded-xl hover:bg-amber/15 transition-colors group"
          >
            <Users2 size={15} className="text-amber flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-amber leading-none">Teacher Community</p>
              <p className="text-[10px] text-white/30 mt-0.5">Join our WhatsApp group</p>
            </div>
            <ChevronRight size={12} className="text-amber/40 group-hover:text-amber/70 flex-shrink-0" />
          </a>
        </div>

        {/* Help */}
        <div className="mx-3 mb-5 p-4 bg-white/5 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle size={13} className="text-white/30" />
            <span className="text-xs font-semibold text-white/60">Need help?</span>
          </div>
          <p className="text-[11px] text-white/25 leading-relaxed">
            Reach out to support or check our docs.
          </p>
        </div>
      </aside>
    </>
  )
}