import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomNav from './BottomNav'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, school')
    .eq('id', user.id)
    .single()

  const currentUser = {
    name:  profile?.full_name ?? user.email,
    role:  profile?.role      ?? 'Teacher',
    email: user.email,
  }

  return (
    // Fixed to the viewport — overflow:hidden ensures nothing bleeds outside
    <div className="flex h-screen overflow-hidden bg-surface">

      {/* Sidebar — fixed height, never stretches with page content */}
      <div className="hidden md:flex h-screen flex-shrink-0">
        <Sidebar />
      </div>

      {/* Right column — topbar pinned at top, content area scrolls independently */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar user={currentUser} />
        {/* Only this element scrolls — sidebar remains completely unaffected */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}