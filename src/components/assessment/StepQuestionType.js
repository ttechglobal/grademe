'use client'

import { useState } from 'react'
import { CheckSquare, ToggleLeft, Calculator, Footprints, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUESTION_TYPES = [
  {
    id:          'mcq',
    label:       'Multiple Choice',
    description: 'Students choose one correct answer from four options. Great for testing knowledge recall.',
    icon:        CheckSquare,
  },
  {
    id:          'true_false',
    label:       'True / False',
    description: 'Students decide if a statement is true or false. Quick to create and mark.',
    icon:        ToggleLeft,
  },
  {
    id:          'calculation',
    label:       'Fill in the Answer',
    description: 'Students fill in structured answer boxes. Perfect for maths and physics calculations.',
    icon:        Calculator,
  },
  {
    id:          'stepwise',
    label:       'Stepwise',
    description: 'Students complete a worked solution by filling in missing steps. Ideal for problem-solving subjects.',
    icon:        Footprints,
    isNew:       true,
  },
]

// Wizard calls: <StepQuestionType onSelect={handleTypeSelect} />
// Card click only selects — does NOT call onSelect or navigate.
// Navigation happens only when the Next button is clicked.
export default function StepQuestionType({ onSelect }) {
  const [selected, setSelected] = useState(null)

  const handleNext = () => {
    if (!selected) return
    onSelect(selected)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink mb-1">Question Type</h2>
        <p className="text-ink-3 text-sm">
          Choose the format students will use to answer questions. You can only use one type per assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {QUESTION_TYPES.map((type) => {
          const Icon       = type.icon
          const isSelected = selected === type.id

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelected(type.id)}
              className={cn(
                'relative flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                isSelected
                  ? 'border-brand-600 bg-brand-50 shadow-sm'
                  : 'border-border bg-white hover:border-brand-300 hover:shadow-sm'
              )}
            >
              {/* "New" badge for Stepwise */}
              {type.isNew && (
                <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  New
                </span>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center">
                  <Check size={11} className="text-white" strokeWidth={3} />
                </span>
              )}

              <span className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                isSelected ? 'bg-brand-100 text-brand-700' : 'bg-surface text-brand-500'
              )}>
                <Icon className="h-5 w-5" />
              </span>

              <div className="space-y-1">
                <p className={cn(
                  'font-semibold text-sm leading-tight',
                  isSelected ? 'text-brand-800' : 'text-ink'
                )}>
                  {type.label}
                </p>
                <p className="text-xs text-ink-3 leading-relaxed">{type.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-ink-4">
          {selected
            ? `${QUESTION_TYPES.find((t) => t.id === selected)?.label} selected`
            : 'Select a question type to continue'}
        </p>
        <button
          type="button"
          onClick={handleNext}
          disabled={!selected}
          className={cn(
            'px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
            selected
              ? 'bg-brand-800 text-white hover:bg-brand-700 active:scale-[0.98]'
              : 'bg-border text-ink-4 cursor-not-allowed'
          )}
        >
          Next →
        </button>
      </div>
    </div>
  )
}