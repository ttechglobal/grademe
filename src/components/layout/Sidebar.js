'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList,
  BookOpen, Sparkles, Settings,
  HelpCircle, Users2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    section: 'Overview',
    links: [
      { label: 'Dashboard',        href: '/dashboard',             icon: LayoutDashboard, exact: true  },
      { label: 'Assessments',      href: '/dashboard/assessments', icon: ClipboardList,   exact: false },
    ],
  },
  {
    section: 'Tools',
    links: [
      { label: 'Question Bank',    href: '/dashboard/questions',   icon: BookOpen,  exact: false },
      { label: 'Import Questions', href: '/dashboard/ai-import',   icon: Sparkles,  exact: false },
    ],
  },
  {
    section: 'Account',
    links: [
      { label: 'Settings', href: '/dashboard/settings', icon: Settings, exact: false },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href, exact) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-[220px] h-screen sticky top-0 bg-brand-900 flex flex-col flex-shrink-0 overflow-hidden">

      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/10 flex-shrink-0">
        <div className="font-display text-2xl font-bold">
          <span className="text-white">Grade</span>
          <span className="text-amber">Mee</span>
        </div>
        <p className="text-xs text-white/30 mt-0.5">Assessment Platform</p>
      </div>

      {/* Nav — scrollable */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.section} className="mb-2">
            <p className="px-6 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              {group.section}
            </p>
            {group.links.map(({ label, href, icon: Icon, exact }) => {
              const active = isActive(href, exact)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-6 py-2.5 text-sm transition-colors duration-150 relative',
                    active
                      ? 'text-white font-semibold bg-white/10'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-amber rounded-r-full" />
                  )}
                  <Icon size={16} className="flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Community link */}
      <div className="mx-4 mb-3 flex-shrink-0">
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

      {/* Help */}
      <div className="m-4 mt-0 p-4 bg-white/5 rounded-xl flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle size={14} className="text-white/40" />
          <span className="text-sm font-semibold text-white">Need help?</span>
        </div>
        <p className="text-xs text-white/30 leading-relaxed">
          Check our docs or reach out to support.
        </p>
      </div>

    </aside>
  )
}