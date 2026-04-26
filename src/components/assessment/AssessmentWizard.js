'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StepSetup     from './StepSetup'
import StepQuestions from './StepQuestions'
import StepShare     from './StepShare'
import { cn } from '@/lib/utils'

const STEPS = [
  { number: 1, label: 'Setup'     },
  { number: 2, label: 'Questions' },
  { number: 3, label: 'Share'     },
]

export default function AssessmentWizard({ curriculum = 'uk' }) {
  const router = useRouter()
  const [step, setStep] = useState(1)

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

  return (
    <div className="max-w-2xl mx-auto">

      {/* Step indicator */}
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

      {/* Step content */}
      <div className="bg-white border border-border rounded-3xl p-8 shadow-card">

        {step === 1 && (
          <StepSetup
            data={setupData}
            onChange={updateSetup}
            onNext={() => setStep(2)}
            accountCurriculum={curriculum}
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
            onNext={() => setStep(3)}
            onBack={() => { setStep(1) }}
          />
        )}

        {step === 3 && (
          <StepShare
            data={{ ...setupData, questionCount: questions.length }}
            questions={questions}
            source={questionSource}
            // Back from share → questions list (mode already preserved in questionMode state)
            onBack={() => setStep(2)}
            onFinish={() => router.push('/dashboard/assessments')}
          />
        )}

      </div>
    </div>
  )
}