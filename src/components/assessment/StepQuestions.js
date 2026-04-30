'use client'

import { useState } from 'react'
import Button        from '@/components/ui/Button'
import QuestionEditor from './QuestionEditor'
import AIImport       from './AIImport'
import QuestionPicker from './QuestionPicker'
import AIGenerate     from './AIGenerate'
import { PenLine, ImagePlus, BookOpen, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const MODES = [
  {
    id:        'manual',
    emoji:     '✏️',
    icon:      PenLine,
    title:     'Type Manually',
    desc:      'Add questions one by one. Full control over every option, answer, hint, and explanation.',
    badge:     null,
  },
  {
    id:        'bank',
    emoji:     '📚',
    icon:      BookOpen,
    title:     'Pick from Question Bank',
    desc:      'Reuse questions you have already saved. Great for recurring topics.',
    badge:     'Recommended',
  },
  {
    id:        'ai',
    emoji:     '📷',
    icon:      ImagePlus,
    title:     'AI-Assisted Import',
    desc:      'Upload a photo or image of a worksheet, textbook page, or handwritten notes — we\'ll read it and generate questions automatically. Perfect if you already have material.',
    badge:     'Upload worksheet',
    highlight: true,
  },
  {
    id:        'generate',
    emoji:     '✨',
    icon:      Wand2,
    title:     'Generate Using AI',
    desc:      'Describe a topic and let AI build the questions for you from scratch.',
    badge:     '✨ New',
  },
]

export default function StepQuestions({
  questions,
  onChange,
  onSourceChange,
  setupData,
  onNext,
  onBack,
  // Restored from AssessmentWizard so Back from Step 3 returns to the question list.
  // When null, tutor sees the mode-picker. When set, they see that mode's editor.
  initialMode = null,
  // The question type selected on Step 0 — threaded through to all sub-components
  questionType = 'mcq',
}) {
  const [mode,        setMode]        = useState(initialMode)
  const [selectedIds, setSelectedIds] = useState(new Map())

  const selectMode = (m) => {
    setMode(m)
    onSourceChange?.(m)
  }

  const handleImport = (imported) => onChange(imported)

  const handleToggle = (question) => {
    setSelectedIds((prev) => {
      const next = new Map(prev)
      next.has(question.id) ? next.delete(question.id) : next.set(question.id, question)
      return next
    })
  }

  const handleSelectAll = (filtered, selectAll) => {
    setSelectedIds((prev) => {
      const next = new Map(prev)
      filtered.forEach((q) => (selectAll ? next.set(q.id, q) : next.delete(q.id)))
      return next
    })
  }

  const confirmBankSelection = () => {
    const picked = Array.from(selectedIds.values()).map((q) => ({
      type:        q.type,
      text:        q.text,
      options:     Array.isArray(q.options) ? q.options : [],
      answer:      q.answer,
      hint:        q.hint        ?? '',
      explanation: q.explanation ?? '',
    }))
    onChange(picked)
    onNext()
  }

  // ── Mode picker — shown when mode is null ──────────────────────────────
  if (!mode) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-xl font-bold text-ink mb-1">Add Questions</h2>
          <p className="text-sm text-ink-3">Choose how you want to add questions to this assessment.</p>
        </div>

        <div className="flex flex-col gap-3">
          {MODES.map(({ id, emoji, icon: Icon, title, desc, badge, highlight }) => (
            <button
              key={id}
              type="button"
              onClick={() => selectMode(id)}
              className={cn(
                'flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all',
                highlight
                  ? 'border-brand-300 bg-brand-50/40 hover:border-brand-500 hover:bg-brand-50'
                  : 'border-border bg-white hover:border-brand-300 hover:bg-brand-50/20'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl',
                highlight ? 'bg-brand-100' : 'bg-surface'
              )}>
                {emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className={cn('font-semibold text-sm', highlight ? 'text-brand-800' : 'text-ink')}>
                    {title}
                  </p>
                  {badge && (
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      highlight ? 'bg-brand-700 text-white' : 'bg-amber-light text-amber'
                    )}>
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-3 leading-relaxed">{desc}</p>
              </div>
              <span className="text-ink-4 flex-shrink-0 mt-1">›</span>
            </button>
          ))}
        </div>

        {/* Show existing questions if any (e.g. after returning from preview) */}
        {questions.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-sm text-ink-3">
              {questions.length} question{questions.length !== 1 ? 's' : ''} already added
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onBack}>← Back</Button>
              <Button variant="primary" onClick={onNext}>
                Continue with {questions.length} →
              </Button>
            </div>
          </div>
        )}

        {questions.length === 0 && (
          <div className="flex justify-start pt-2">
            <Button variant="ghost" onClick={onBack}>← Back</Button>
          </div>
        )}
      </div>
    )
  }

  // ── Bank picker ────────────────────────────────────────────────────────
  if (mode === 'bank') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Question Bank</h2>
            <p className="text-sm text-ink-3 mt-0.5">Select questions to add to this assessment.</p>
          </div>
          <button type="button" onClick={() => setMode(null)}
            className="text-xs text-brand-500 font-semibold hover:text-brand-400">
            ← Change method
          </button>
        </div>

        <QuestionPicker
          selected={selectedIds}
          onToggle={handleToggle}
          onSelectAll={handleSelectAll}
          questionType={questionType}
        />

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button variant="ghost" onClick={() => setMode(null)}>← Back</Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-4">{selectedIds.size} selected</span>
            <Button variant="primary" onClick={confirmBankSelection} disabled={selectedIds.size === 0}>
              Use {selectedIds.size > 0 ? selectedIds.size : ''} Selected →
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── AI Generate ────────────────────────────────────────────────────────
  if (mode === 'generate') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Generate Using AI</h2>
            <p className="text-sm text-ink-3 mt-0.5">Describe your topic and we'll build the questions.</p>
          </div>
          <button type="button" onClick={() => setMode(null)}
            className="text-xs text-brand-500 font-semibold hover:text-brand-400">
            ← Change method
          </button>
        </div>
        <AIGenerate
          setupData={setupData}
          questionType={questionType}
          onImport={(qs) => { onChange(qs); onNext() }}
        />
      </div>
    )
  }

  // ── Manual or AI Import ────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">
            {mode === 'manual' ? 'Add Questions Manually' : 'AI-Assisted Import'}
          </h2>
          {mode === 'ai' && (
            <p className="text-sm text-ink-3 mt-0.5">
              Upload a worksheet image or paste text — AI will extract the questions.
            </p>
          )}
        </div>
        <button type="button" onClick={() => setMode(null)}
          className="text-xs text-brand-500 font-semibold hover:text-brand-400">
          ← Change method
        </button>
      </div>

      {mode === 'manual'
        ? <QuestionEditor questions={questions} onChange={onChange} questionType={questionType} />
        : <AIImport onImport={handleImport} />
      }

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button variant="ghost" onClick={() => setMode(null)}>← Back</Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-4">
            {questions.length} question{questions.length !== 1 ? 's' : ''} added
          </span>
          <Button variant="primary" onClick={onNext} disabled={questions.length === 0}>
            Continue →
          </Button>
        </div>
      </div>
    </div>
  )
}