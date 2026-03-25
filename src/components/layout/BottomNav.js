'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart2,
  Plus,
} from 'lucide-react'

const tabs = [
  { label: 'Home',        href: '/dashboard',             icon: LayoutDashboard },
  { label: 'Assessments', href: '/dashboard/assessments', icon: ClipboardList   },
  { label: 'Create',      href: '/dashboard/assessments/new', icon: Plus, primary: true },
  { label: 'Students',    href: '/dashboard/students',    icon: Users           },
  { label: 'Analytics',   href: '/dashboard/analytics',   icon: BarChart2       },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border md:hidden">
      <div className="flex items-stretch h-16">
        {tabs.map(({ label, href, icon: Icon, primary }) => {
          const active = pathname === href

          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-800 flex items-center justify-center shadow-lg -mt-5 border-4 border-white">
                  <Icon size={20} className="text-white" />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 pt-2',
                'transition-colors duration-150',
                active ? 'text-brand-700' : 'text-ink-4'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
      {/* Safe area spacer for iOS */}
      <div className="h-safe-bottom bg-white" />
    </nav>
  )
}