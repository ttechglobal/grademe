'use client'

import { useState, useEffect } from 'react'
import { createClient }        from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import MobileDrawer            from '@/components/layout/MobileDrawer'
import Avatar                  from '@/components/ui/Avatar'
import { LogOut, Settings, Zap } from 'lucide-react'
import Link                    from 'next/link'
import { useCredits }          from '@/hooks/useCredits'

function usePageTitle() {
  const p = usePathname()
  if (p === '/dashboard')                         return 'Home'
  if (p.startsWith('/dashboard/assessments/new')) return 'New Assessment'
  if (p.startsWith('/dashboard/assessments'))     return 'Assessments'
  if (p.startsWith('/dashboard/students'))        return 'Students'
  if (p.startsWith('/dashboard/questions'))       return 'Question Bank'
  if (p.startsWith('/dashboard/credits'))         return 'Credits'
  if (p.startsWith('/dashboard/settings'))        return 'Settings'
  return 'GradeMee'
}

function TopbarCredits() {
  const { credits, loading } = useCredits()
  if (loading) return null
  return (
    <Link href="/dashboard/credits" style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      fontSize: '13px', fontWeight: '500', color: '#f5a623',
      textDecoration: 'none', padding: '6px 10px',
      borderRadius: '6px', backgroundColor: '#fef3c7',
    }}>
      <Zap size={12} style={{ color: '#f5a623' }} />
      {credits}
    </Link>
  )
}

export default function Topbar({ user: userProp }) {
  const router = useRouter()
  const title  = usePageTitle()
  const [user, setUser] = useState(userProp ?? null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!userProp) {
      createClient().auth.getUser().then(({ data: { user: u } }) => setUser(u))
    }
  }, [userProp])

  const handleSignOut = async () => {
    await createClient().auth.signOut()
    router.push('/login')
  }

  const displayName = userProp?.name
    || user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'Teacher'

  return (
    <header style={{
      height: '56px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2ede8',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
      position: 'sticky', top: 0, zIndex: 30,
    }}>

      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="md:hidden">
          <MobileDrawer />
        </div>
        {/* Title hidden on mobile (MobileDrawer shows wordmark) */}
        <h1 className="hidden md:block" style={{
          fontSize: '20px', fontWeight: '600', color: '#1a1a1a', margin: 0, lineHeight: 1,
        }}>
          {title}
        </h1>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
        <div className="hidden sm:block">
          <TopbarCredits />
        </div>

        <button onClick={() => setOpen(!open)} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
        }}>
          <Avatar name={displayName} size="sm" />
          <span className="hidden sm:block" style={{
            fontSize: '14px', fontWeight: '500', color: '#4b5563',
            maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </span>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: '200px', backgroundColor: '#fff',
              border: '1px solid #e2ede8', borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 20, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2ede8' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>{displayName}</p>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{user?.email}</p>
              </div>
              <Link href="/dashboard/settings" onClick={() => setOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 16px', fontSize: '13px', color: '#4b5563', textDecoration: 'none',
              }}>
                <Settings size={14} style={{ color: '#9ca3af' }} /> Settings
              </Link>
              <button onClick={handleSignOut} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 16px', fontSize: '13px', color: '#dc2626',
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}