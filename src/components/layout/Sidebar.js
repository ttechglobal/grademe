'use client'

/**
 * Sidebar — GradeMee design inspired by Chalkie.ai layout patterns
 *
 * What we borrowed from Chalkie:
 *   - Avatar photo (or initials) at the very top — personal, warm
 *   - Nav items: full-width pill for active state (not just a left border)
 *   - No section headers — flat, clean nav list
 *   - Spacious item padding — not cramped
 *   - Soft bottom section for help/credits
 *
 * What stays GradeMee:
 *   - Dark teal sidebar (#0f2e2e) — our brand color
 *   - Amber (#f5a623) for active state — our accent
 *   - GradeMee wordmark and logo treatment
 */

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import { cn }          from '@/lib/utils'
import {
  LayoutDashboard, ClipboardList, Users,
  BookOpen, Settings, Zap,
} from 'lucide-react'
import { useUseCaseProfile } from '@/hooks/useUseCaseProfile'
import { useCredits }        from '@/hooks/useCredits'

// ── Nav definition (flat — no section headers like Chalkie) ────────────────
export function buildNavGroups(participantsLabel = 'Students') {
  return [
    {
      links: [
        { label: 'Home',            href: '/dashboard',             icon: LayoutDashboard },
        { label: 'Assessments',     href: '/dashboard/assessments', icon: ClipboardList   },
        { label: participantsLabel, href: '/dashboard/students',    icon: Users           },
        { label: 'Question Bank',   href: '/dashboard/questions',   icon: BookOpen        },
      ],
    },
    {
      divider: true,
      links: [
        { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ]
}

export const NAV_GROUPS = buildNavGroups('Students')

export function resolveActive(pathname) {
  const allHrefs = NAV_GROUPS.flatMap((g) => g.links.map((l) => l.href))
  if (allHrefs.includes(pathname)) return pathname
  let best = null
  for (const href of allHrefs) {
    if (pathname.startsWith(href + '/') && (!best || href.length > best.length)) best = href
  }
  return best
}

// ── Nav links — used by both desktop sidebar and mobile drawer ─────────────
export function NavLinks({ groups, onNavigate }) {
  const pathname   = usePathname()
  const activeHref = resolveActive(pathname)
  const allGroups  = groups ?? NAV_GROUPS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {allGroups.map((group, gi) => (
        <div key={gi}>
          {group.divider && (
            <div style={{
              height: '1px',
              backgroundColor: 'rgba(255,255,255,0.08)',
              margin: '10px 16px',
            }} />
          )}
          {group.links.map(({ label, href, icon: Icon }) => {
            const isActive = activeHref === href
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  /* Chalkie-style: full-width pill for active */
                  padding: '11px 14px',
                  margin: '1px 10px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: isActive ? '700' : '400',
                  textDecoration: 'none',
                  transition: 'all 0.12s ease',
                  /* Active: amber pill — GradeMee brand */
                  backgroundColor: isActive ? '#f5a623' : 'transparent',
                  color: isActive ? '#0f2e2e' : 'rgba(255,255,255,0.65)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                  }
                }}
              >
                <Icon
                  size={17}
                  style={{
                    flexShrink: 0,
                    color: isActive ? '#0f2e2e' : 'rgba(255,255,255,0.45)',
                  }}
                />
                <span style={{ lineHeight: 1.2 }}>{label}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Credits pill ───────────────────────────────────────────────────────────
function CreditsPill() {
  const { credits, loading } = useCredits()
  if (loading) return null
  return (
    <Link
      href="/dashboard/credits"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#f5a623',
        textDecoration: 'none',
        padding: '5px 10px',
        borderRadius: '20px',
        border: '1px solid rgba(245,166,35,0.25)',
        backgroundColor: 'rgba(245,166,35,0.08)',
        transition: 'background-color 0.12s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(245,166,35,0.14)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(245,166,35,0.08)'}
    >
      <Zap size={11} style={{ color: '#f5a623' }} />
      {credits} credit{credits !== 1 ? 's' : ''}
    </Link>
  )
}

// ── Desktop Sidebar ────────────────────────────────────────────────────────
export default function Sidebar({ user }) {
  const { config } = useUseCaseProfile()
  const navGroups  = buildNavGroups(config.participantsLabel)

  const displayName = user?.name  ?? 'Teacher'
  const role        = user?.role  ?? 'Teacher'
  const initial     = displayName.charAt(0).toUpperCase()

  return (
    <aside
      style={{
        width: '248px',
        minHeight: '100vh',
        /* GradeMee dark teal — our brand color, kept */
        backgroundColor: '#0f2e2e',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* ── Teacher profile — Chalkie puts avatar at top ── */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Avatar — circle with initial (replace src with real photo later) */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          backgroundColor: '#f5a623',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '12px',
          fontWeight: '800', fontSize: '18px', color: '#0f2e2e',
        }}>
          {initial}
        </div>
        <p style={{
          fontSize: '14px', fontWeight: '700', color: '#ffffff',
          lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {displayName}
        </p>
        <p style={{
          fontSize: '12px', fontWeight: '400', color: 'rgba(255,255,255,0.45)',
          marginTop: '2px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {role}
        </p>
      </div>

      {/* ── Nav — Chalkie-style flat list with amber pill active ── */}
      <nav style={{ flex: 1, padding: '14px 0', overflowY: 'auto' }}>
        <NavLinks groups={navGroups} />
      </nav>

      {/* ── Bottom: credits + help — simple, no box ── */}
      <div style={{
        padding: '12px 20px 20px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <CreditsPill />
        <a
          href="mailto:hello@grademee.app"
          style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.35)',
            textDecoration: 'none',
            transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
        >
          Need help?
        </a>
      </div>
    </aside>
  )
}