// NEW: Stepwise feature — does not affect existing MCQ functionality
'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, Check, ChevronDown, ChevronUp } from 'lucide-react'
import MathRenderer from '@/components/ui/MathRenderer'
import StepwiseQuestion from '@/components/assessment/StepwiseQuestion'
import { cn } from '@/lib/utils'

const DIFFICULTY_OPTIONS = [
  { id: 'easy',   label: 'Easy',   desc: 'One key blank — final answer only',         color: 'border-success/40 bg-success-light text-success' },
  { id: 'medium', label: 'Medium', desc: '2–3 key steps blanked',                      color: 'border-amber/40 bg-amber-light text-amber' },
  { id: 'hard',   label: 'Hard',   desc: 'Most steps blanked — full reconstruction',   color: 'border-danger/40 bg-danger-light text-danger' },
]

export default function InAppStepwiseGeneration({ setupData, onImport, refreshCredits }) {
  const [topic,       setTopic]       = useState(setupData?.title || '')
  const [difficulty,  setDifficulty]  = useState('medium')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [preview,     setPreview]     = useState(null)   // generated question object
  const [approved,    setApproved]    = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  const subject    = setupData?.subject    || ''
  const classLevel = setupData?.classLevel || ''
  const canGenerate = topic.trim().length >= 3 && !loading

  const handleGenerate = async (isRegen = false) => {
    if (!canGenerate) return
    setLoading(true)
    setError('')
    if (!isRegen) {
      setPreview(null)
      setApproved(false)
    }

    try {
      const res  = await fetch('/api/generate/stepwise', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic:      topic.trim(),
          subject,
          classLevel,
          difficulty,
          useCase:    setupData?.useCaseProfile ?? 'k12_tutor',
          curriculum: setupData?.curriculum,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Generation failed. Please try again.')
        setLoading(false)
        return
      }

      // Validate the question has steps before previewing
      const q = data.question
      if (!q || !q.steps || q.steps.length === 0) {
        setError('AI returned a question with no steps. Please try again.')
        setLoading(false)
        return
      }

      setPreview(q)
      setApproved(false)
      setShowPreview(true)
      refreshCredits?.()
    } catch {
      setError('Network error. Please try again.')
    }

    setLoading(false)
  }

  const handleApprove = () => {
    if (!preview) return
    const q = {
      ...preview,
      id:            Math.random().toString(36).slice(2),
      type:          'stepwise',
      question_type: 'stepwise',
      // text is used everywhere internally; question_text is the DB column
      text:          preview.question_text || preview.text || '',
      options:       [],
      answer:        '',
    }
    onImport?.([q])
    setApproved(true)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-ink">Generate Stepwise Question</h3>
        <p className="text-sm text-ink-3 mt-1">
          AI will build a step-by-step worked solution with blanks for students to fill in.
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4">
        {/* Topic */}
        <div>
          <label className="block text-xs font-semibold text-ink-3 mb-1.5">
            Topic <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Solving simultaneous equations, Photosynthesis, Newton's laws"
            className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-xs font-semibold text-ink-3 mb-2">Difficulty</label>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                className={cn(
                  'flex flex-col gap-1.5 px-3 py-3 rounded-xl border-2 text-left transition-all',
                  difficulty === d.id
                    ? d.color
                    : 'border-border bg-white text-ink hover:border-brand-300'
                )}
              >
                <span className="text-sm font-bold">{d.label}</span>
                <span className="text-xs opacity-70 leading-snug">{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          type="button"
          onClick={() => handleGenerate(false)}
          disabled={!canGenerate}
          className={cn(
            'w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2',
            canGenerate
              ? 'bg-brand-800 text-white hover:bg-brand-700 active:scale-[0.98]'
              : 'bg-border text-ink-4 cursor-not-allowed'
          )}
        >
          {loading ? (
            <><RefreshCw size={15} className="animate-spin" /> Generating…</>
          ) : (
            <><Sparkles size={15} /> Generate Stepwise Question</>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}
      </div>

      {/* Preview — only render when question is valid and has steps */}
      {preview && preview.steps?.length > 0 && !approved && (
        <div className="flex flex-col gap-4 border-t border-border pt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink">Preview</p>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="text-xs text-ink-3 hover:text-ink flex items-center gap-1"
            >
              {showPreview
                ? <><ChevronUp size={13} /> Hide</>
                : <><ChevronDown size={13} /> Show</>
              }
            </button>
          </div>

          {showPreview && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              {/* Safe render — question is guaranteed non-null with steps here */}
              <StepwiseQuestion
                key={preview.question_text || preview.text}
                question={preview}
                readOnly
              />
            </div>
          )}

          {/* Word bank display below preview */}
          {showPreview && preview.word_bank?.length > 0 && (
            <div className="bg-white border border-border rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-ink-4 uppercase tracking-wide mb-2">Word Bank</p>
              <div className="flex flex-wrap gap-2">
                {preview.word_bank.map((w, i) => (
                  <span key={i} className="px-3 py-1 bg-surface border border-border rounded-lg text-sm text-ink">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Approve / Regenerate */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleGenerate(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Regenerate
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-success text-white text-sm font-bold hover:bg-success/90 transition-colors"
            >
              <Check size={15} />
              Use This Question
            </button>
          </div>
        </div>
      )}

      {/* Approved confirmation */}
      {approved && (
        <div className="flex items-center gap-3 px-4 py-3 bg-success-light border border-success/20 rounded-2xl">
          <Check size={18} className="text-success flex-shrink-0" />
          <p className="text-sm font-semibold text-success">
            Question added! You can generate another or continue to the next step.
          </p>
        </div>
      )}

    </div>
  )
}