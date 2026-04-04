'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Globe, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const LABELS = {
  uk:            'UK Curriculum (Year 1–13)',
  us:            'US Curriculum (Grade K–12)',
  nigerian:      'Nigerian Curriculum (JSS1–SS3)',
  international: 'International (IB)',
}

export default function CurriculumBanner() {
  const [dismissed,  setDismissed]  = useState(false)
  const [curriculum, setCurriculum] = useState(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data } = await supabase
        .from('profiles')
        .select('curriculum')
        .eq('id', session.user.id)
        .single()

      setCurriculum(data?.curriculum ?? 'uk')
    }
    load()
  }, [])

  if (dismissed || !curriculum) return null

  const label = LABELS[curriculum] ?? 'UK Curriculum'
  const isNonDefault = curriculum !== 'uk'

  return (
    <div className="bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4 flex items-center gap-4">
      <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
        <Globe size={16} className="text-brand-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-800">
          Active curriculum: {label}
        </p>
        <p className="text-xs text-brand-600 mt-0.5">
          {isNonDefault
            ? 'Your assessments will use this curriculum\'s class structure.'
            : 'Teaching Nigerian or US students? '
          }
          {!isNonDefault && (
            <Link
              href="/dashboard/settings"
              className="font-bold underline underline-offset-2 hover:text-brand-800"
            >
              Change curriculum in Settings →
            </Link>
          )}
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