'use client'

import { useState } from 'react'
import Button        from '@/components/ui/Button'
import QuestionEditor    from './QuestionEditor'
import AIImport          from './AIImport'
import QuestionPicker    from './QuestionPicker'
import AIGenerate        from './AIGenerate'
import InAppGeneration   from './InAppGeneration'
import { Sparkles, BookOpen, ImagePlus, Wand2 } from 'lucide-react'
import { FLAGS } from '@/lib/featureFlags'
import { cn } from '@/lib/utils'

// ── Per-question-type method availability ─────────────────────────────────
const QUESTION_TYPE_CONFIG = {
  mcq: {
    label:            'Multiple Choice',
    availableMethods: ['inapp', 'generate', 'bank', 'ai'],
  },
  true_false: {
    label:            'True or False',
    availableMethods: ['inapp', 'generate', 'bank', 'ai'],
  },
  calculation: {
    label:            'Fill in the Answer',
    availableMethods: ['inapp', 'generate'],
    // bank excluded — question bank stores MCQ/TF only
    // ai excluded — image extraction can't produce answer_template structures
  },
  stepwise: {
    label:            'Stepwise',
    availableMethods: ['inapp'],
    comingSoon:       true,
  },
  scenario: {
    label:            'Scenario-Based',
    availableMethods: ['inapp'],
    comingSoon:       true,
  },
}

// ── Method definitions ─────────────────────────────────────────────────────
const ALL_METHODS = [
  {
    id:          'inapp',
    icon:        Sparkles,
    iconBg:      'bg-brand-100',
    iconColor:   'text-brand-600',
    title:       'Generate with AI',
    desc:        'Questions generated instantly inside GradeMee — no copy-pasting needed.',
    badge:       '1 credit / Q',
    badgeStyle:  'bg-brand-100 text-brand-700',
    borderAccent: 'border-l-brand-500',
    hidden:      !FLAGS.IN_APP_AI,
  },
  {
    id:          'generate',
    icon:        Wand2,
    iconBg:      'bg-surface',
    iconColor:   'text-ink-3',
    title:       'Generate with AI (Copy & Paste)',
    desc:        'Copy a prompt → paste into ChatGPT or Gemini → paste the response back here.',
    badge:       'Free',
    badgeStyle:  'bg-success-light text-success',
    borderAccent: 'border-l-success',
  },
  {
    id:          'bank',
    icon:        BookOpen,
    iconBg:      'bg-surface',
    iconColor:   'text-ink-3',
    title:       'Pick from Question Bank',
    desc:        'Choose from questions you have already saved.',
    badge:       null,
    borderAccent: 'border-l-ink-4',
  },
  {
    id:          'ai',
    icon:        ImagePlus,
    iconBg:      'bg-surface',
    iconColor:   'text-ink-3',
    title:       'AI-Assisted Input',
    desc:        'Upload a worksheet or image — AI extracts the questions for you.',
    badge:       'Free',
    badgeStyle:  'bg-success-light text-success',
    borderAccent: 'border-l-success',
  },
]

export default function StepQuestions({
  questions,
  onChange,
  onSourceChange,
  setupData,
  onNext,
  onBack,
  initialMode = null,
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

  // ── Mode picker ────────────────────────────────────────────────────────
  if (!mode) {
    const typeConfig     = QUESTION_TYPE_CONFIG[questionType] ?? QUESTION_TYPE_CONFIG.mcq
    const allowedIds     = typeConfig.availableMethods
    const visibleMethods = ALL_METHODS.filter(
      (m) => !m.hidden && allowedIds.includes(m.id)
    )

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-xl font-bold text-ink mb-1">How would you like to add questions?</h2>
          <p className="text-sm text-ink-3">Choose a method to get started.</p>
        </div>

        <div className="flex flex-col gap-4">
          {visibleMethods.map(({ id, icon: Icon, iconBg, iconColor, title, desc, badge, badgeStyle }) => (
            <button
              key={id}
              type="button"
              onClick={() => selectMode(id)}
              className={cn(
                'flex items-center gap-4 px-5 py-5 rounded-2xl border-2 bg-white text-left w-full',
                'border-border hover:border-brand-400 hover:shadow-sm',
                'transition-all duration-150'
              )}
            >
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
                <Icon size={20} className={iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink leading-snug">{title}</p>
                <p className="text-xs text-ink-3 mt-0.5 leading-relaxed">{desc}</p>
              </div>
              {badge && (
                <span className={cn(
                  'text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap',
                  badgeStyle
                )}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

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

  // ── In-App Generation ───────────────────────────────────────────────────
  if (mode === 'inapp') {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => selectMode(null)}
          className="self-start flex items-center gap-1.5 text-sm font-semibold text-ink-3 hover:text-ink transition-colors"
        >
          ← Back
        </button>
        <InAppGeneration
          setupData={setupData}
          questionType={questionType}
          useCase={setupData?.useCaseProfile ?? 'k12_tutor'}
          onImport={(qs) => { onChange(qs); onNext() }}
        />
      </div>
    )
  }

  // ── AI Generate (copy-paste) ────────────────────────────────────────────
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
        : <AIImport onImport={handleImport} questionType={questionType} />
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