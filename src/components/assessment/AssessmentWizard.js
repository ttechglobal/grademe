'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StepQuestionType from './StepQuestionType'
import StepSetup        from './StepSetup'
import StepQuestions    from './StepQuestions'
import StepShare        from './StepShare'
import { cn } from '@/lib/utils'

// Steps shown in the progress indicator (steps 1–3 are the existing flow).
// Step 0 is the question-type picker — it acts as a pre-flight screen before
// the numbered wizard begins and does not appear in the step indicator.
const STEPS = [
  { number: 1, label: 'Setup'     },
  { number: 2, label: 'Questions' },
  { number: 3, label: 'Share'     },
]

export default function AssessmentWizard({ curriculum = 'uk' }) {
  const router = useRouter()

  // step 0 = question type picker (new pre-flight screen)
  // step 1 = Setup, step 2 = Questions, step 3 = Share (unchanged)
  const [step, setStep] = useState(0)

  // The selected question type — set on step 0, carried through the rest of the flow
  const [questionType, setQuestionType] = useState(null)

  const [setupData, setSetupData] = useState({
    subject:        '',
    classLevel:     '',
    assessmentType: '',
    title:          '',
    questionMode:   'mcq',
    curriculum:     '',
    timerEnabled:   false,
    timeLimitMins:  30,
  })

  const [questions,      setQuestions]      = useState([])
  const [questionSource, setQuestionSource] = useState('manual')

  // Track which question-entry mode the tutor was using (manual/bank/ai/generate).
  // When they return from Step 3 (preview/share) back to Step 2, we restore this
  // so they land on their question list, not the mode-picker screen.
  const [questionMode, setQuestionMode] = useState(null)

  const updateSetup = (field, value) =>
    setSetupData((prev) => ({ ...prev, [field]: value }))

  // Called by StepQuestionType when the tutor picks a type
  const handleTypeSelect = (typeId) => {
    setQuestionType(typeId)
    // Sync questionMode in setupData so downstream components know the type
    updateSetup('questionMode', typeId === 'true_false' ? 'true_false' : 'mcq')
    setStep(1)
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Step indicator — only visible once the wizard proper begins (step >= 1) */}
      {step >= 1 && (
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                  step === s.number ? 'bg-brand-800 text-white' :
                  step > s.number  ? 'bg-success text-white'   : 'bg-border text-ink-4'
                )}>
                  {step > s.number ? '✓' : s.number}
                </div>
                <span className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  step === s.number ? 'text-brand-700' : 'text-ink-4'
                )}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2 mb-4 transition-colors',
                  step > s.number ? 'bg-success' : 'bg-border'
                )} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step content */}
      <div className="bg-white border border-border rounded-3xl p-8 shadow-card">

        {/* Step 0 — Question type picker (pre-flight screen, not in step indicator) */}
        {step === 0 && (
          <StepQuestionType onSelect={handleTypeSelect} />
        )}

        {step === 1 && (
          <StepSetup
            data={setupData}
            onChange={updateSetup}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}          // ← back returns to type picker
            accountCurriculum={curriculum}
            questionType={questionType}         // passed for display / future use
          />
        )}

        {step === 2 && (
          <StepQuestions
            questions={questions}
            onChange={setQuestions}
            onSourceChange={(m) => { setQuestionMode(m); setQuestionSource(m) }}
            // Restore the last mode used — so Back from Step 3 shows question list, not picker
            initialMode={questionMode}
            setupData={setupData}
            questionType={questionType}             // ← threaded through
            onNext={() => setStep(3)}
            onBack={() => { setStep(1) }}
          />
        )}

        {step === 3 && (
          <StepShare
            data={{ ...setupData, questionCount: questions.length }}
            questions={questions}
            source={questionSource}
            questionType={questionType}             // ← threaded through
            // Back from share → questions list (mode already preserved in questionMode state)
            onBack={() => setStep(2)}
            onFinish={() => router.push('/dashboard/assessments')}
          />
        )}

      </div>
    </div>
  )
}