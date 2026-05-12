'use client'

import { useState } from 'react'
import Button            from '@/components/ui/Button'
import QuestionEditor    from './QuestionEditor'
import AIImport          from './AIImport'
import QuestionPicker    from './QuestionPicker'
import AIGenerate        from './AIGenerate'
import InAppGeneration   from './InAppGeneration'
import InAppStepwiseGeneration from './InAppStepwiseGeneration'
import { Sparkles, BookOpen, ImagePlus, Wand2 } from 'lucide-react'
import { FLAGS } from '@/lib/featureFlags'
import { cn } from '@/lib/utils'

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
  },
  stepwise: {
    label:            'Stepwise',
    availableMethods: ['inapp'],
  },
  scenario: {
    label:            'Scenario-Based',
    availableMethods: ['inapp'],
    comingSoon:       true,
  },
}

const ALL_METHODS = [
  {
    id:           'inapp',
    icon:         Sparkles,
    iconBg:       'bg-brand-100',
    iconColor:    'text-brand-600',
    title:        'Generate with AI',
    desc:         'Questions generated instantly inside GradeMee — review them before adding.',
    badge:        '1 credit / Q',
    badgeStyle:   'bg-brand-100 text-brand-700',
    borderAccent: 'border-l-brand-500',
    hidden:       !FLAGS.IN_APP_AI,
  },
  {
    id:           'generate',
    icon:         Wand2,
    iconBg:       'bg-surface',
    iconColor:    'text-ink-3',
    title:        'Generate with AI (Copy & Paste)',
    desc:         'Copy a prompt → paste into ChatGPT or Gemini → paste the response back here.',
    badge:        'Free',
    badgeStyle:   'bg-success-light text-success',
    borderAccent: 'border-l-success',
  },
  {
    id:           'bank',
    icon:         BookOpen,
    iconBg:       'bg-surface',
    iconColor:    'text-ink-3',
    title:        'Pick from Question Bank',
    desc:         'Choose from questions you have already saved.',
    badge:        null,
    borderAccent: 'border-l-ink-4',
  },
  {
    id:           'ai',
    icon:         ImagePlus,
    iconBg:       'bg-surface',
    iconColor:    'text-ink-3',
    title:        'AI-Assisted Input',
    desc:         'Upload a worksheet or image — AI extracts the questions for you.',
    badge:        'Free',
    badgeStyle:   'bg-success-light text-success',
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
  initialMode  = null,
  questionType = 'mcq',
}) {
  const [mode,        setMode]        = useState(initialMode)
  const [selectedIds, setSelectedIds] = useState(new Map())

  const selectMode = (m) => {
    setMode(m)
    onSourceChange?.(m)
  }

  // ── KEY FIX: after import, call onNext to advance the wizard ──────────────
  const handleImport = (imported) => {
    onChange(imported)
    // Only auto-advance for inapp — other methods (generate/ai) have their own flow
    if (mode === 'inapp') {
      onNext?.()
    }
  }

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
    const picked = Array.from(selectedIds.values()).map(({ id, ...rest }) => rest)
    onChange(picked)
    onNext()
  }

  // ── Mode picker ──────────────────────────────────────────────────────────
  if (!mode) {
    const typeConfig       = QUESTION_TYPE_CONFIG[questionType] ?? QUESTION_TYPE_CONFIG.mcq
    const availableMethods = typeConfig.availableMethods ?? ['inapp', 'generate', 'bank', 'ai']
    const visibleMethods   = ALL_METHODS.filter((m) => availableMethods.includes(m.id) && !m.hidden)

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Add Questions</h2>
          <p className="text-sm text-ink-3 mt-0.5">How would you like to add {typeConfig.label} questions?</p>
        </div>

        <div className="flex flex-col gap-3">
          {visibleMethods.map((method) => {
            const Icon   = method.icon
            const isSoon = typeConfig.comingSoon
            return (
              <button
                key={method.id} type="button"
                disabled={isSoon}
                onClick={() => !isSoon && selectMode(method.id)}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-2xl border-2 border-l-4 text-left transition-all',
                  isSoon
                    ? 'border-border opacity-50 cursor-not-allowed'
                    : 'border-border hover:border-brand-300 hover:shadow-sm cursor-pointer',
                  method.borderAccent,
                )}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', method.iconBg)}>
                  <Icon size={18} className={method.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-ink">{method.title}</p>
                    {method.badge && (
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', method.badgeStyle)}>
                        {method.badge}
                      </span>
                    )}
                    {isSoon && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface text-ink-4">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-3 mt-1 leading-relaxed">{method.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="border-t border-border pt-4">
          <button type="button" onClick={() => selectMode('manual')}
            className="text-sm font-semibold text-brand-600 hover:text-brand-500 transition-colors">
            + Add questions manually
          </button>
        </div>

        <div className="flex justify-start pt-2">
          <Button variant="ghost" onClick={onBack}>← Back</Button>
        </div>
      </div>
    )
  }

  // ── Manual ───────────────────────────────────────────────────────────────
  if (mode === 'manual') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Add Questions</h2>
            <p className="text-sm text-ink-3 mt-0.5">Enter your questions below.</p>
          </div>
          <button type="button" onClick={() => setMode(null)}
            className="text-xs text-brand-500 font-semibold hover:text-brand-400">
            ← Change method
          </button>
        </div>
        <QuestionEditor questions={questions} onChange={onChange} questionType={questionType} />
        {questions.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-sm text-ink-4">{questions.length} question{questions.length !== 1 ? 's' : ''} added</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onBack}>← Back</Button>
              <Button variant="primary" onClick={onNext}>Continue with {questions.length} →</Button>
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

  // ── Bank ─────────────────────────────────────────────────────────────────
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
        <QuestionPicker selected={selectedIds} onToggle={handleToggle} onSelectAll={handleSelectAll} questionType={questionType} />
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

  // ── In-App Generation ────────────────────────────────────────────────────
  if (mode === 'inapp') {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => selectMode(null)}
          className="self-start flex items-center gap-1.5 text-sm font-semibold text-ink-3 hover:text-ink transition-colors">
          ← Back
        </button>
        {questionType === 'stepwise' ? (
          <InAppStepwiseGeneration
            setupData={setupData}
            onImport={handleImport}
            refreshCredits={() => {}}
          />
        ) : (
          <InAppGeneration
            setupData={setupData}
            questionType={questionType}
            useCase={setupData?.useCaseProfile ?? setupData?.useCase ?? 'k12_tutor'}
            onImport={handleImport}
            refreshCredits={() => {}}
          />
        )}
      </div>
    )
  }

  // ── Copy/Paste Prompt ────────────────────────────────────────────────────
  if (mode === 'generate') {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => selectMode(null)}
          className="self-start flex items-center gap-1.5 text-sm font-semibold text-ink-3 hover:text-ink transition-colors">
          ← Back
        </button>
        <AIGenerate setupData={setupData} questionType={questionType} onImport={(imported) => { onChange(imported); onNext?.() }} />
      </div>
    )
  }

  // ── AI Image Import ───────────────────────────────────────────────────────
  if (mode === 'ai') {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => selectMode(null)}
          className="self-start flex items-center gap-1.5 text-sm font-semibold text-ink-3 hover:text-ink transition-colors">
          ← Back
        </button>
        <AIImport setupData={setupData} questionType={questionType} onImport={(imported) => { onChange(imported); onNext?.() }} />
      </div>
    )
  }

  return null
}