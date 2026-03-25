'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import QuestionEditor from './QuestionEditor'
import AIImport from './AIImport'
import { PenLine, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const MODES = [
  {
    id:    'manual',
    icon:  PenLine,
    title: 'Type manually',
    desc:  'Add questions one by one. Full control over type, options, and hints.',
  },
  {
    id:    'ai',
    icon:  Sparkles,
    title: 'AI-assisted import',
    desc:  'Paste questions from any source — AI parses them instantly.',
    badge: 'Recommended for bulk',
  },
]

export default function StepQuestions({ questions, onChange, onNext, onBack }) {
  const [mode, setMode] = useState('manual')
  const [modeChosen, setModeChosen] = useState(false)

  const handleImport = (imported) => {
    onChange(imported)
    setModeChosen(true)
  }

  // Mode picker
  if (!modeChosen) {
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
              onClick={() => setMode(id)}
              className={cn(
                'flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all',
                mode === id
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-border bg-white hover:border-brand-200'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                mode === id ? 'bg-brand-700' : 'bg-surface'
              )}>
                <Icon size={18} className={mode === id ? 'text-white' : 'text-ink-4'} />
              </div>
              <div>
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
          <Button
            variant="primary"
            onClick={() => setModeChosen(true)}
          >
            Continue →
          </Button>
        </div>
      </div>
    )
  }

  // Manual editor or AI import
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-ink">
          {mode === 'manual' ? 'Add Questions' : 'AI Import'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModeChosen(false)}
            className="text-xs text-brand-500 font-semibold hover:text-brand-400"
          >
            Switch mode
          </button>
        </div>
      </div>

      {mode === 'manual' ? (
        <QuestionEditor questions={questions} onChange={onChange} />
      ) : (
        <AIImport onImport={handleImport} />
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button variant="ghost" onClick={() => setModeChosen(false)}>← Back</Button>
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