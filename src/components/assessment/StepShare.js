'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Copy, CheckCheck, BookOpen, ArrowLeft, Loader2 } from 'lucide-react'
import { createAssessment } from '@/lib/actions/assessments'
import { useToast } from '@/components/ui/ToastProvider'

export default function StepShare({ data, questions, source = 'manual', onBack, onFinish }) {
  const { toast } = useToast()

  const [copied,  setCopied]  = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [slug,    setSlug]    = useState('')
  const [error,   setError]   = useState('')

  const shareUrl = slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/t/${slug}`
    : ''

  const handleSave = async () => {
    setSaving(true)
    setError('')

    const result = await createAssessment(
      data,
      questions,
      {
        showResults:      true,
        showExplanations: true,
        requireName:      true,
        timeLimit:        false,
      },
      source
    )

    if (result.error) {
      setError(result.error)
      toast({ message: result.error, type: 'error' })
      setSaving(false)
      return
    }

    setSlug(result.slug)
    setSaved(true)
    setSaving(false)
    toast({ message: 'Assessment saved! Share the link with your students.', type: 'success' })
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast({ message: 'Link copied!', type: 'success' })
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="text-center py-4">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="font-display text-2xl font-bold text-ink">
          {saved ? 'Assessment Ready!' : 'Almost there!'}
        </h2>
        <p className="text-sm text-ink-3 mt-1">
          <span className="capitalize">{data.assessmentType || 'Assessment'}</span>
          {' · '}
          {data.subject?.replace(/_/g, ' ')}
          {' · '}
          {data.classLevel?.replace(/_/g, ' ')?.toUpperCase()}
          {' · '}
          {questions.length} question{questions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Link — shown after save */}
      {saved && shareUrl && (
        <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={15} className="text-brand-500" />
            <p className="text-sm font-semibold text-ink">Share this link with your students</p>
          </div>

          {/* Clean link display */}
          <div className="flex items-center gap-2 bg-surface rounded-xl px-4 py-3 border border-border">
            <span className="flex-1 text-sm font-medium text-brand-600 truncate">
              {shareUrl}
            </span>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 bg-brand-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors flex-shrink-0"
            >
              {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <p className="text-xs text-ink-4">
            Students can open this link on any device — no account needed.
          </p>
        </div>
      )}

      {/* Actions */}
      {!saved ? (
        <div className="flex flex-col gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors"
          >
            <ArrowLeft size={15} />
            Edit Questions
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber text-ink text-sm font-bold hover:bg-amber/90 transition-colors disabled:opacity-70"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <Loader2 size={15} className="animate-spin -ml-3" />
                Saving…
              </>
            ) : (
              'Save & Get Link'
            )}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors"
          >
            <ArrowLeft size={15} />
            Edit Questions
          </button>
          <button
            onClick={onFinish}
            className="w-full py-3 rounded-xl bg-brand-800 text-white text-sm font-bold hover:bg-brand-700 transition-colors"
          >
            Go to Assessments →
          </button>
        </div>
      )}

    </div>
  )
}