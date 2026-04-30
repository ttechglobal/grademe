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
      <head>
        {/* Nunito — warm, rounded EdTech font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface font-sans antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  )
}