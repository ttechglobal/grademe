import './globals.css'
import 'katex/dist/katex.min.css'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { Analytics } from '@vercel/analytics/react'

export const metadata = {
  title:       'GradeMee — Smart Assessments for Every Teacher',
  description: 'Create, share and automatically grade assessments in minutes.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface font-sans antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
        {/* Vercel Analytics — tracks page views, locations, referrers */}
        {/* To migrate to Google Analytics later, replace <Analytics /> with
            a GA4 script tag and gtag() calls using the same event names */}
        <Analytics />
      </body>
    </html>
  )
}