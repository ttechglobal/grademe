'use client'

import { useState, useEffect } from 'react'
import { usePathname }         from 'next/navigation'
import { Menu, X, Zap }        from 'lucide-react'
import { NavLinks, buildNavGroups } from '@/components/layout/Sidebar'
import { useUseCaseProfile }        from '@/hooks/useUseCaseProfile'
import { useCredits }               from '@/hooks/useCredits'

export default function MobileDrawer() {
  const [open,  setOpen]  = useState(false)
  const pathname          = usePathname()
  const { config }        = useUseCaseProfile()
  const navGroups         = buildNavGroups(config.participantsLabel)
  const { credits }       = useCredits()

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Hamburger — dark on cream background */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        style={{
          width: '38px', height: '38px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <Menu size={22} style={{ color: '#0f2e2e' }} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.35)' }}
        />
      )}

      {/* Drawer — GradeMee dark teal */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        width: '272px',
        backgroundColor: '#0f2e2e',
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px' }}>
            <span style={{ color: '#fff' }}>Grade</span>
            <span style={{ color: '#f5a623' }}>Mee</span>
          </span>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} style={{ color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          <NavLinks groups={navGroups} onNavigate={() => setOpen(false)} />
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 20px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href="/dashboard/credits" style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '12px', fontWeight: '600', color: '#f5a623', textDecoration: 'none',
          }}>
            <Zap size={11} style={{ color: '#f5a623' }} />
            {credits} credit{credits !== 1 ? 's' : ''}
          </a>
          <a href="mailto:hello@grademee.app" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
            Need help?
          </a>
        </div>
      </aside>
    </>
  )
}