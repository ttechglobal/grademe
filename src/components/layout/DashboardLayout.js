import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import Sidebar   from './Sidebar'
import Topbar    from './Topbar'
import BottomNav from './BottomNav'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const currentUser = {
    name:  profile?.full_name ?? user.email,
    role:  profile?.role      ?? 'Teacher',
    email: user.email,
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f0f7f4' }}>
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex h-screen flex-shrink-0">
        <Sidebar user={currentUser} />
      </div>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar user={currentUser} />

        {/* Scrollable area — green tint bg, white card floats inside */}
        <main
          style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f0f7f4', padding: '28px 32px', paddingBottom: '80px' }}
          className="md:pb-8"
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2ede8',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              padding: '36px 40px',
              maxWidth: '1040px',
              margin: '0 auto',
              minHeight: 'calc(100vh - 160px)',
            }}
            className="mobile-card"
          >
            {children}
          </div>
        </main>
      </div>

      <BottomNav />

      <style>{`
        @media (max-width: 767px) {
          .mobile-card {
            padding: 20px !important;
            border-radius: 12px !important;
          }
          main { padding: 16px !important; }
        }
      `}</style>
    </div>
  )
}