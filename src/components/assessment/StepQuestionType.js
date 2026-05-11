'use client';

import { CheckSquare, ToggleLeft, Calculator, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FLAGS } from '@/lib/featureFlags';

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
    label:       'Fill-in Answer',
    description: 'Students fill in structured answer boxes. Perfect for maths and science.',
    icon:        Calculator,
  },
  // NEW: Stepwise — shown only when flag is enabled
  ...(FLAGS.STEPWISE_QUESTIONS ? [{
    id:          'stepwise',
    label:       'Stepwise',
    description: 'Students complete a worked solution by filling blanks in ordered steps. Best for problem-solving subjects.',
    icon:        Footprints,
  }] : []),
]

// The wizard calls this component as:
//   <StepQuestionType onSelect={handleTypeSelect} />
// handleTypeSelect(typeId) sets questionType state and advances to step 1.
// This component holds NO selection state — the wizard owns it.
export default function StepQuestionType({ onSelect }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink mb-1">Question Type</h2>
        <p className="text-ink-3 text-sm">
          Choose the format students will use to answer questions. You can only use one type per assessment.
        </p>
      </div>

      <div className={cn(
        'grid grid-cols-1 gap-4',
        QUESTION_TYPES.length === 4 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
      )}>
        {QUESTION_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              className={cn(
                'flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all duration-150',
                'border-border bg-white hover:border-brand-500 hover:shadow-sm',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                type.id === 'stepwise' && 'border-purple-200 hover:border-purple-500'
              )}
            >
              <span className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg bg-surface',
                type.id === 'stepwise' ? 'text-purple-600' : 'text-brand-500'
              )}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm leading-tight text-ink">{type.label}</p>
                  {type.id === 'stepwise' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">NEW</span>
                  )}
                </div>
                <p className="text-xs text-ink-3 leading-relaxed">{type.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-ink-4 text-center pt-2">Select a question type to continue.</p>
    </div>
  );
}