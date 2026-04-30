'use client'

import { useState } from 'react'
import { CheckSquare, ToggleLeft, PenLine, GitBranch } from 'lucide-react'
import { FLAGS } from '@/lib/featureFlags'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

/**
 * Question type definitions.
 * Adding a new type in the future = adding one object to this array.
 */
const QUESTION_TYPES = [
  {
    id:          'mcq',
    icon:        CheckSquare,
    iconBg:      'bg-brand-100',
    iconColor:   'text-brand-600',
    title:       'Multiple Choice',
    description: 'Students choose one correct answer from four options',
    available:   true,   // always on
  },
  {
    id:          'true_false',
    icon:        ToggleLeft,
    iconBg:      'bg-amber-light',
    iconColor:   'text-amber',
    title:       'True or False',
    description: 'Students decide if a statement is true or false',
    get available() { return FLAGS.TRUE_FALSE_QUESTIONS },
  },
  {
    id:          'short_answer',
    icon:        PenLine,
    iconBg:      'bg-surface',
    iconColor:   'text-ink-4',
    title:       'Short Answer',
    description: 'Students write a brief response in their own words',
    available:   false,
    comingSoon:  true,
  },
  {
    id:          'stepwise',
    icon:        GitBranch,
    iconBg:      'bg-surface',
    iconColor:   'text-ink-4',
    title:       'Stepwise',
    description: 'Students show full working step-by-step — great for Maths',
    available:   false,
    comingSoon:  true,
  },
]

function QuestionTypeCard({ type, selected, onClick }) {
  const Icon = type.icon
  const isAvailable = type.available

  return (
    <button
      onClick={isAvailable ? onClick : undefined}
      disabled={!isAvailable}
      className={cn(
        // Base
        'relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-200',
        'flex flex-col gap-3',
        // Available — interactive
        isAvailable && !selected && [
          'bg-white border-border cursor-pointer',
          'hover:border-brand-400 hover:shadow-lg hover:-translate-y-0.5',
        ],
        // Selected state
        isAvailable && selected && [
          'bg-brand-50 border-brand-600 shadow-lg -translate-y-0.5 cursor-pointer',
        ],
        // Coming soon — greyed out
        !isAvailable && [
          'bg-surface border-border opacity-50 cursor-not-allowed',
        ],
      )}
    >
      {/* Coming Soon badge */}
      {type.comingSoon && (
        <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-ink-4 bg-border px-2 py-0.5 rounded-full">
          Soon
        </span>
      )}

      {/* Icon */}
      <div className={cn(
        'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
        isAvailable && selected ? 'bg-brand-600' : type.iconBg,
      )}>
        <Icon
          size={20}
          className={cn(
            isAvailable && selected ? 'text-white' : type.iconColor,
          )}
        />
      </div>

      {/* Text */}
      <div>
        <p className={cn(
          'text-base font-bold leading-snug',
          isAvailable ? 'text-ink' : 'text-ink-4',
        )}>
          {type.title}
        </p>
        <p className={cn(
          'text-sm mt-1 leading-relaxed',
          isAvailable ? 'text-ink-3' : 'text-ink-4',
        )}>
          {type.description}
        </p>
      </div>

      {/* Selection indicator */}
      {isAvailable && (
        <div className={cn(
          'absolute top-4 right-4 w-5 h-5 rounded-full border-2 transition-all duration-150',
          selected
            ? 'border-brand-600 bg-brand-600'
            : 'border-border bg-white',
        )}>
          {selected && (
            <svg viewBox="0 0 10 10" className="w-full h-full p-0.5" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}
    </button>
  )
}

export default function StepQuestionType({ onSelect }) {
  const [selected, setSelected] = useState(null)

  // Clicking a card selects it but does NOT advance automatically.
  // The tutor must press Next → to proceed.
  const handleCardClick = (typeId) => {
    setSelected(typeId)
  }

  const handleNext = () => {
    if (selected) onSelect(selected)
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Heading */}
      <div>
        <h2 className="font-display text-2xl font-bold text-ink leading-snug">
          What type of questions do you want to create?
        </h2>
        <p className="text-sm text-ink-3 mt-2">
          Choose a question type to get started.
        </p>
      </div>

      {/* Card grid — 2×2 on desktop, single column on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUESTION_TYPES.map((type) => (
          <QuestionTypeCard
            key={type.id}
            type={type}
            selected={selected === type.id}
            onClick={() => handleCardClick(type.id)}
          />
        ))}
      </div>

      {/* Next button — disabled until a type is selected */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={!selected}
          className="w-full"
        >
          {selected ? 'Next →' : 'Select a question type to continue'}
        </Button>
      </div>

    </div>
  )
}