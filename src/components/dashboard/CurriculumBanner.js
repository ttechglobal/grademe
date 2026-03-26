'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Globe, X } from 'lucide-react'

export default function CurriculumBanner({ curriculum }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const labels = {
    uk:            'UK Curriculum (Year 7–13)',
    us:            'US Curriculum (Grade K–12)',
    nigerian:      'Nigerian Curriculum (JSS1–SS3)',
    international: 'International (IB)',
  }

  return (
    <div className="bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4 flex items-center gap-4">
      <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
        <Globe size={16} className="text-brand-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-800">
          Currently using: {labels[curriculum] ?? 'UK Curriculum'}
        </p>
        <p className="text-xs text-brand-600 mt-0.5">
          Teaching Nigerian students?{' '}
          <Link
            href="/dashboard/settings"
            className="font-bold underline underline-offset-2 hover:text-brand-800"
          >
            Change your curriculum in Settings →
          </Link>
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-brand-400 hover:text-brand-600 transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  )
}