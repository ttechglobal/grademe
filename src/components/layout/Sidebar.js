'use client'

import Link        from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ClipboardList, Users,
  BookOpen, Sparkles, Settings,
  HelpCircle, Users2, ChevronRight, Zap,
} from 'lucide-react'
import { FLAGS } from '@/lib/featureFlags'
import { useUseCaseProfile } from '@/hooks/useUseCaseProfile'

// Build nav groups dynamically — participantsLabel changes per use case profile
export function buildNavGroups(participantsLabel = 'Students') {
  return [
    {
      section: 'Overview',
      links: [
        { label: 'Dashboard',           href: '/dashboard',             icon: LayoutDashboard },
        { label: 'Assessments',         href: '/dashboard/assessments', icon: ClipboardList   },
        { label: participantsLabel,     href: '/dashboard/students',    icon: Users           },
      ],
    },
    {
      section: 'Tools',
      links: [
        { label: 'Question Bank',    href: '/dashboard/questions',   icon: BookOpen  },
        { label: 'Import Questions', href: '/dashboard/ai-import',   icon: Sparkles  },
        ...(FLAGS.CREDITS_COMING_SOON_UI ? [
          { label: 'Credits', href: '/dashboard/credits', icon: Zap, badge: 'Soon' },
        ] : []),
      ],
    },
    {
      section: 'Account',
      links: [
        { label: 'Settings',         href: '/dashboard/settings',    icon: Settings  },
      ],
    },
  ]
}

// Keep backward-compatible export for MobileDrawer
export const NAV_GROUPS = buildNavGroups('Students')

/**
 * Longest-prefix-wins active link resolution.
 * Prevents /dashboard from lighting up on every /dashboard/* route.
 */
export function resolveActive(pathname) {
  const allHrefs = NAV_GROUPS.flatMap((g) => g.links.map((l) => l.href))
  // Exact match wins first
  if (allHrefs.includes(pathname)) return pathname
  // Otherwise pick the longest prefix match
  let best = null
  for (const href of allHrefs) {
    if (pathname.startsWith(href + '/') && (!best || href.length > best.length)) {
      best = href
    }
  }
  return best
}

// ── NavLinks ───────────────────────────────────────────────────────────────
// Reusable nav link renderer used by both Sidebar and MobileDrawer
export function NavLinks({ onNavigate, groups }) {
  const pathname  = usePathname()
  const navGroups = groups ?? NAV_GROUPS
  const active   = resolveActive(pathname)

  return (
    <>
      {navGroups.map((group) => (
        <div key={group.section} className="mb-5">
          <p className="px-6 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/25">
            {group.section}
          </p>
          {group.links.map(({ label, href, icon: Icon, badge }) => {
            const isActive = active === href
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  'group relative flex items-center gap-3 px-5 py-2.5 mx-2 rounded-xl',
                  'text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/45 hover:text-white/80 hover:bg-white/6'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-amber rounded-r-full" />
                )}
                <Icon
                  size={16}
                  className={cn(
                    'flex-shrink-0 transition-colors duration-150',
                    isActive ? 'text-amber' : 'text-white/35 group-hover:text-white/60'
                  )}
                />
                <span className="flex-1 leading-none">{label}</span>
                {badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wide bg-amber/15 text-amber px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      ))}
    </>
  )
}

// ── Bottom section (community + help) ─────────────────────────────────────
function SidebarBottom() {
  return (
    <>
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

      <div className="mx-3 mb-5 p-4 bg-white/5 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle size={13} className="text-white/30" />
          <span className="text-xs font-semibold text-white/60">Need help?</span>
        </div>
        <p className="text-[11px] text-white/25 leading-relaxed">Reach out to support or check our docs.</p>
      </div>
    </>
  )
}

// ── Desktop Sidebar ────────────────────────────────────────────────────────
export default function Sidebar() {
  const { config } = useUseCaseProfile()
  const navGroups  = buildNavGroups(config.participantsLabel)

  return (
    <aside className="w-[220px] min-h-screen bg-brand-900 flex flex-col flex-shrink-0 hidden md:flex">

      {/* Logo + tagline */}
      <div className="px-6 py-7 border-b border-white/10 flex-shrink-0">
        <div className="font-display text-2xl font-bold select-none">
          <span className="text-white">Grade</span>
          <span className="text-amber">Mee</span>
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-white/30 mt-1 select-none">
          Empowering Learning
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 overflow-y-auto">
        <NavLinks groups={navGroups} />
      </nav>

      <SidebarBottom />
    </aside>
  )
}