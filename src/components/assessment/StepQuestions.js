'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import QuestionEditor from './QuestionEditor'
import AIImport       from './AIImport'
import QuestionPicker from './QuestionPicker'
import AIGenerate     from './AIGenerate'
import { PenLine, Sparkles, BookOpen, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const MODES = [
  {
    id:    'manual',
    icon:  PenLine,
    title: 'Type Manually',
    desc:  'Add questions one by one with full control.',
  },
  {
    id:    'bank',
    icon:  BookOpen,
    title: 'Pick from Question Bank',
    desc:  'Reuse questions you have already saved.',
    badge: 'Recommended',
  },
  {
    id:    'ai',
    icon:  Sparkles,
    title: 'AI-Assisted Import',
    desc:  'Paste questions from any source — AI parses them.',
    badge: 'Bulk import',
  },
  {
    id:    'generate',
    icon:  Wand2,
    title: 'Generate Using AI',
    desc:  'Tell the AI your topic and it creates questions for you.',
    badge: '✨ New',
  },
]

export default function StepQuestions({
  questions,
  onChange,
  onSourceChange,
  setupData,
  onNext,
  onBack,
}) {
  const [mode,        setMode]        = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Map())

  const selectMode = (m) => {
    setMode(m)
    onSourceChange?.(m)
  }

  const handleImport = (imported) => {
    onChange(imported)
    // stay on page so user can see questions added
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
      filtered.forEach((q) => selectAll ? next.set(q.id, q) : next.delete(q.id))
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

  // ── Mode picker ──────────────────────────────────────────────────────────
  if (!mode) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-xl font-bold text-ink mb-1">
            Add Questions
          </h2>
          <p className="text-sm text-ink-3">
            How do you want to add questions to this assessment?
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {MODES.map(({ id, icon: Icon, title, desc, badge }) => (
            <button
              key={id}
              onClick={() => selectMode(id)}
              className="flex items-start gap-4 p-5 rounded-2xl border-2 border-border bg-white hover:border-brand-300 hover:bg-brand-50/30 text-left transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-ink-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm text-ink">{title}</p>
                  {badge && (
                    <span className="text-[10px] font-bold bg-amber-light text-amber px-2 py-0.5 rounded-full">
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-3 leading-relaxed">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3 justify-between pt-2">
          <Button variant="ghost" onClick={onBack}>← Back</Button>
        </div>
      </div>
    )
  }

  // ── Bank picker ──────────────────────────────────────────────────────────
  if (mode === 'bank') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">
              Pick from Question Bank
            </h2>
            <p className="text-sm text-ink-3 mt-0.5">
              Select questions to include
            </p>
          </div>
          <button
            onClick={() => setMode(null)}
            className="text-xs text-brand-500 font-semibold hover:text-brand-400"
          >
            ← Change method
          </button>
        </div>

        <QuestionPicker
          selected={selectedIds}
          onToggle={handleToggle}
          onSelectAll={handleSelectAll}
        />

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button variant="ghost" onClick={() => setMode(null)}>← Back</Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-4">
              {selectedIds.size} selected
            </span>
            <Button
              variant="primary"
              onClick={confirmBankSelection}
              disabled={selectedIds.size === 0}
            >
              Use {selectedIds.size > 0 ? selectedIds.size : ''} Selected →
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── AI Generate ──────────────────────────────────────────────────────────
  if (mode === 'generate') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">
              Generate Using AI
            </h2>
            <p className="text-sm text-ink-3 mt-0.5">
              Tell us the topic and we&apos;ll build the prompt for you
            </p>
          </div>
          <button
            onClick={() => setMode(null)}
            className="text-xs text-brand-500 font-semibold hover:text-brand-400"
          >
            ← Change method
          </button>
        </div>

        <AIGenerate
          setupData={setupData}
          onImport={(qs) => {
            onChange(qs)
            onNext()
          }}
        />
      </div>
    )
  }

  // ── Manual or AI Import ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-ink">
          {mode === 'manual' ? 'Add Questions Manually' : 'AI-Assisted Import'}
        </h2>
        <button
          onClick={() => setMode(null)}
          className="text-xs text-brand-500 font-semibold hover:text-brand-400"
        >
          ← Change method
        </button>
      </div>

      {mode === 'manual' ? (
        <QuestionEditor questions={questions} onChange={onChange} />
      ) : (
        <AIImport onImport={handleImport} />
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button variant="ghost" onClick={() => setMode(null)}>← Back</Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-4">
            {questions.length} question{questions.length !== 1 ? 's' : ''} added
          </span>
          <Button
            variant="primary"
            onClick={onNext}
            disabled={questions.length === 0}
          >
            Continue →
          </Button>
        </div>
      </div>
    </div>
  )
}