'use client'

import Link        from 'next/link'
import { Zap }    from 'lucide-react'
import { useCredits } from '@/hooks/useCredits'

/**
 * CreditsDisplay — compact credit balance pill for the Topbar.
 * Tapping navigates to the credits page.
 */
export default function CreditsDisplay() {
  const { credits, loading } = useCredits()

  return (
    <Link
      href="/dashboard/credits"
      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition-colors"
      title="View credits"
    >
      <Zap size={13} className="text-amber flex-shrink-0" />
      {loading ? (
        <span className="text-xs font-semibold text-white/60 w-6">—</span>
      ) : (
        <span className="text-xs font-bold text-white">{credits.toLocaleString()}</span>
      )}
      <span className="text-[10px] text-white/50 font-medium hidden sm:block">credits</span>
    </Link>
  )
}