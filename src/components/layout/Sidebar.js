'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart2,
  BookOpen,
  Sparkles,
  Link2,
  Settings,
  HelpCircle,
} from 'lucide-react'

const navItems = [
  {
    section: 'Overview',
    links: [
      { label: 'Dashboard',     href: '/dashboard',             icon: LayoutDashboard },
      { label: 'Assessments',   href: '/dashboard/assessments', icon: ClipboardList, badge: '8' },
      { label: 'Students',      href: '/dashboard/students',    icon: Users },
      { label: 'Analytics',     href: '/dashboard/analytics',   icon: BarChart2 },
    ],
  },
  {
    section: 'Tools',
    links: [
      { label: 'Question Bank', href: '/dashboard/questions',   icon: BookOpen },
      { label: 'AI Import',     href: '/dashboard/ai-import',   icon: Sparkles },
      { label: 'Share Links',   href: '/dashboard/links',       icon: Link2 },
    ],
  },
  {
    section: 'Account',
    links: [
      { label: 'Settings',      href: '/dashboard/settings',    icon: Settings },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[220px] min-h-screen bg-brand-900 flex flex-col flex-shrink-0">

      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/10">
        <span className="font-display text-2xl font-bold text-white">
          Grade<span className="text-amber">Me</span>
        </span>
        <p className="text-xs text-white/30 mt-0.5">Assessment Platform</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.section} className="mb-2">
            <p className="px-6 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              {group.section}
            </p>
            {group.links.map(({ label, href, icon: Icon, badge }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-6 py-2.5 text-sm',
                    'transition-colors duration-150 relative',
                    active
                      ? 'text-white font-semibold bg-white/10'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-brand-300 rounded-r-full" />
                  )}
                  <Icon size={16} className="flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="bg-amber text-ink text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Help */}
      <div className="m-4 p-4 bg-white/5 rounded-xl">
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