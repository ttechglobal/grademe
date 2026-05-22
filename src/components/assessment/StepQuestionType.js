'use client'

/**
 * StepQuestionType
 *
 * NOTE (internal): calculation and stepwise types are intentionally hidden
 * from this UI until their grading pipelines are production-ready.
 * The code for those types is preserved in StepQuestions.js and the
 * generation service — do not delete it.
 *
 * Only MCQ and True/False are shown to users right now.
 */

import { CheckSquare, ToggleLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

// calculation and stepwise exist in the codebase but are hidden here
const VISIBLE_QUESTION_TYPES = [
  {
    id:          'mcq',
    label:       'Multiple Choice',
    description: 'Students choose one correct answer from four options. Great for testing knowledge and recall.',
    icon:        CheckSquare,
  },
  {
    id:          'true_false',
    label:       'True / False',
    description: 'Students decide if a statement is true or false. Fast to create and auto-graded instantly.',
    icon:        ToggleLeft,
  },
]

export default function StepQuestionType({ onSelect }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-ink mb-1">Question Type</h2>
        <p className="text-sm" style={{ color: '#4b5563' }}>
          Choose the format students will answer in. You can only use one type per assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {VISIBLE_QUESTION_TYPES.map((type) => {
          const Icon = type.icon
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              className={cn(
                'flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all duration-150',
                'border-border bg-white hover:border-brand-500 hover:shadow-sm',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-brand-500">
                <Icon className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <p className="font-semibold text-sm leading-tight text-ink">{type.label}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
                  {type.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-center pt-1" style={{ color: '#9ca3af' }}>
        Select a question type to continue.
      </p>
    </div>
  )
}