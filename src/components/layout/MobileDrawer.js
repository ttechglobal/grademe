'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, BookOpen,
  Sparkles, Settings, X, Users2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard',        href: '/dashboard',             icon: LayoutDashboard, exact: true  },
  { label: 'Assessments',      href: '/dashboard/assessments', icon: ClipboardList,   exact: false },
  { label: 'Question Bank',    href: '/dashboard/questions',   icon: BookOpen,        exact: false },
  { label: 'Import Questions', href: '/dashboard/ai-import',   icon: Sparkles,        exact: false },
  { label: 'Settings',         href: '/dashboard/settings',    icon: Settings,        exact: false },
]

export default function MobileDrawer({ open, onClose }) {
  const pathname = usePathname()

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const isActive = (href, exact) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-brand-900 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="font-display text-2xl font-bold">
            <span className="text-white">Grade</span>
            <span className="text-amber">Mee</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-6 py-3.5 text-sm transition-colors relative',
                  active
                    ? 'text-white font-semibold bg-white/10'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                )}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-amber rounded-r-full" />
                )}
                <Icon size={18} className="flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Community — visible on mobile */}
        <div className="mx-4 mb-3">
          <a
            href="https://chat.whatsapp.com/grademe-teachers"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 bg-amber/10 border border-amber/20 rounded-xl hover:bg-amber/20 transition-colors"
          >
            <Users2 size={15} className="text-amber flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber leading-none">Teacher Community</p>
              <p className="text-[10px] text-white/30 mt-0.5">Join our WhatsApp group</p>
            </div>
          </a>
        </div>

      </div>
    </>
  )
}