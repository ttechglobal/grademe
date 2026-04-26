'use client'

import { useEffect, useState } from 'react'
import PreviewMode from '@/components/student/PreviewMode'

const PREVIEW_SESSION_KEY = 'grademee_preview_draft'

export default function PreviewDraftPage() {
  const [assessment, setAssessment] = useState(null)
  const [error,      setError]      = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PREVIEW_SESSION_KEY)
      if (!raw) { setError(true); return }
      const data = JSON.parse(raw)
      // Clean up so it doesn't persist between sessions
      sessionStorage.removeItem(PREVIEW_SESSION_KEY)
      setAssessment(data)
    } catch {
      setError(true)
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="font-display text-xl font-bold text-ink mb-2">Preview not available</h1>
          <p className="text-sm text-ink-3 leading-relaxed">
            Close this tab and click Preview again from the assessment creation page.
          </p>
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <p className="text-sm text-ink-4">Loading preview…</p>
      </div>
    )
  }

  return <PreviewMode assessment={assessment} />
}