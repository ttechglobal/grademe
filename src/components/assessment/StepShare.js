'use client'

import { useState } from 'react'
import Button  from '@/components/ui/Button'
import { Copy, CheckCheck, Eye, ExternalLink } from 'lucide-react'
import { createAssessment } from '@/lib/actions/assessments'
import { useToast } from '@/components/ui/ToastProvider'
import { cn } from '@/lib/utils'

const PREVIEW_SESSION_KEY = 'grademee_preview_draft'

export default function StepShare({ data, questions, source = 'manual', onBack, onFinish }) {
  const { toast } = useToast()

  const [copied,  setCopied]  = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [slug,    setSlug]    = useState('')
  const [error,   setError]   = useState('')

  // Assessment settings are fixed — show results and explanations always on.
  // The "Assessment Settings" toggle section has been removed as it was redundant.
  const settings = {
    showResults:      true,
    showExplanations: true,
    requireName:      true,
  }

  const shareUrl   = slug ? `${window.location.origin}/t/${slug}` : ''
  const previewUrl = slug ? `${shareUrl}?preview=1` : null

  // ── Pre-save preview via sessionStorage ───────────────────────────────
  const handlePreviewDraft = () => {
    try {
      const draft = {
        title:       data.title || `${data.subject?.replace(/_/g, ' ')} ${data.assessmentType}`,
        subject:     data.subject,
        class_level: data.classLevel,
        curriculum:  data.curriculum || 'uk',
        questions:   questions.map((q, i) => ({
          id:          `draft-${i}`,
          type:        q.type ?? 'mcq',
          text:        q.text,
          options:     q.options ?? [],
          answer:      q.answer,
          hint:        q.hint        ?? '',
          explanation: q.explanation ?? '',
          order_index: i,
        })),
        time_limit_mins: data.timeLimitMins ?? null,
        is_active:       true,
      }
      sessionStorage.setItem(PREVIEW_SESSION_KEY, JSON.stringify(draft))
      window.open('/preview-draft', '_blank')
    } catch {
      toast({ message: 'Could not open preview. Try again.', type: 'error' })
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    setError('')
    // Pass the per-assessment curriculum through to createAssessment
    const result = await createAssessment(data, questions, settings, source)
    if (result.error) {
      setError(result.error)
      toast({ message: 'Failed to save assessment. Please try again.', type: 'error' })
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

  // ── Pre-save ──────────────────────────────────────────────────────────
  if (!saved) {
    return (
      <div className="flex flex-col gap-6">

        <div className="text-center">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="font-display text-2xl font-bold text-ink mb-1">Almost ready!</h2>
          <p className="text-sm text-ink-3 max-w-md mx-auto leading-relaxed">
            You have <strong>{questions.length} question{questions.length !== 1 ? 's' : ''}</strong>.
            Preview first to check for any issues, then save and share.
          </p>
        </div>

        {/* Preview button — prominent */}
        <button
          type="button"
          onClick={handlePreviewDraft}
          disabled={questions.length === 0}
          className="flex items-center gap-4 w-full p-5 bg-brand-50 border-2 border-brand-300 rounded-2xl
                     hover:border-brand-500 hover:bg-brand-100/60 transition-all group text-left
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-800 flex items-center justify-center flex-shrink-0">
            <Eye size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-brand-900 text-base leading-tight">👁️ Preview Assessment</p>
            <p className="text-sm text-brand-700 mt-0.5 leading-relaxed">
              See exactly what your students will see — questions, options, and layout.
              Opens in a new tab. Nothing is saved yet.
            </p>
          </div>
          <ExternalLink size={17} className="text-brand-400 group-hover:text-brand-600 flex-shrink-0" />
        </button>

        {/* Summary — no Assessment Settings section */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-3">Summary</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              { label: 'Subject',    value: data.subject?.replace(/_/g, ' ') || '—' },
              { label: 'Class',      value: data.classLevel?.toUpperCase()   || '—' },
              { label: 'Type',       value: data.assessmentType              || '—' },
              { label: 'Curriculum', value: data.curriculum?.toUpperCase()   || '—' },
              { label: 'Questions',  value: questions.length                        },
            ].map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5">
                <span className="text-ink-4 text-xs">{row.label}</span>
                <span className="font-semibold text-ink capitalize">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="ghost" onClick={onBack} className="sm:w-auto">← Back</Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={saving || questions.length === 0}
            className="flex-1"
          >
            {saving ? 'Saving…' : 'Save & Get Link →'}
          </Button>
        </div>

        {questions.length === 0 && (
          <p className="text-xs text-center text-danger">Add at least one question before saving.</p>
        )}
      </div>
    )
  }

  // ── Post-save ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      <div className="text-center py-4">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="font-display text-2xl font-bold text-ink mb-2">Assessment Ready!</h2>
        <p className="text-sm text-ink-3">Share the link below with your students.</p>
      </div>

      {/* Share link */}
      <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-4">Student Link</p>
        <div className="flex items-center gap-2 bg-surface rounded-xl px-4 py-3 border border-border">
          <span className="flex-1 text-sm text-brand-600 font-medium truncate">{shareUrl}</span>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 bg-brand-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors flex-shrink-0"
          >
            {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Preview with real slug */}
      {previewUrl && (
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-5 bg-brand-50 border-2 border-brand-200 rounded-2xl hover:border-brand-400 hover:bg-brand-100/60 transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-brand-800 flex items-center justify-center flex-shrink-0">
            <Eye size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-brand-900 text-sm">👁️ Preview Assessment</p>
            <p className="text-xs text-brand-600 mt-0.5">
              See exactly what your students will see. Nothing is recorded.
            </p>
          </div>
          <ExternalLink size={15} className="text-brand-400 group-hover:text-brand-600 flex-shrink-0" />
        </a>
      )}

      <Button variant="primary" onClick={onFinish}>Go to Assessments →</Button>
    </div>
  )
}