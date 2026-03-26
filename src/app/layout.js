import './globals.css'
import { ToastProvider } from '@/components/ui/ToastProvider'

export const metadata = {
  title:       'GradeMe — Smart Assessments for Every Teacher',
  description: 'Create, share and analyse assessments for any subject, any class.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface font-sans antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}