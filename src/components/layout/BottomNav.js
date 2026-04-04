'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList,
  BookOpen, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { label: 'Home',        href: '/dashboard',             icon: LayoutDashboard, exact: true  },
  { label: 'Assessments', href: '/dashboard/assessments', icon: ClipboardList,   exact: false },
  { label: 'Questions',   href: '/dashboard/questions',   icon: BookOpen,        exact: false },
  { label: 'Settings',    href: '/dashboard/settings',    icon: Settings,        exact: false },
]

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (href, exact) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border md:hidden">
      <div className="flex items-center">
        {items.map(({ label, href, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors',
                active ? 'text-brand-600' : 'text-ink-4 hover:text-ink-2'
              )}
            >
              <Icon
                size={20}
                className={active ? 'text-brand-600' : 'text-ink-4'}
              />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}