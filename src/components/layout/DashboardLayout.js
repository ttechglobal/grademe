import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomNav from './BottomNav'

const mockUser = {
  name: 'Adaeze Obi',
  role: 'Mathematics Teacher',
}

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-surface">

      {/* Sidebar — desktop only */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={mockUser} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />

    </div>
  )
}