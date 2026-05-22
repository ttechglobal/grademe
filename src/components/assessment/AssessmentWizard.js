'use client'

/**
 * AssessmentWizard
 *
 * Step 0 (question type selection) is intentionally bypassed.
 * The wizard starts directly at step 1 (Setup), defaulting to MCQ.
 *
 * Why: calculation and stepwise question types have grading pipeline
 * issues not yet resolved for production. Hiding the type step removes
 * any path to broken functionality. True/False is available, but most
 * teachers start with MCQ, and they can pick T/F in a future release
 * of this step once all types are stable.
 *
 * To re-enable: change START_STEP back to 0.
 */

import { useState, useEffect } from 'react'
import { useRouter }      from 'next/navigation'
import { createClient }   from '@/lib/supabase/client'
import StepQuestionType   from './StepQuestionType'
import StepSetup          from './StepSetup'
import StepQuestions      from './StepQuestions'
import StepShare          from './StepShare'
import { cn } from '@/lib/utils'

// ── Feature flag: set to 0 to re-show question type selection step ────────
const START_STEP    = 1
const DEFAULT_TYPE  = 'mcq'

const STEPS = [
  { number: 1, label: 'Setup'     },
  { number: 2, label: 'Questions' },
  { number: 3, label: 'Share'     },
]

export default function AssessmentWizard({ curriculum = 'uk' }) {
  const router = useRouter()

  // Start at step 1, type already set to MCQ
  const [step,           setStep]           = useState(START_STEP)
  const [questionType,   setQuestionType]   = useState(DEFAULT_TYPE)
  const [useCaseProfile, setUseCaseProfile] = useState('k12_tutor')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return
      supabase.from('profiles').select('use_case_profile').eq('id', session.user.id).single()
        .then(({ data }) => {
          if (data?.use_case_profile) {
            setUseCaseProfile(data.use_case_profile)
            setSetupData((prev) => ({ ...prev, useCaseProfile: data.use_case_profile }))
          }
        })
    })
  }, [])

  const [setupData, setSetupData] = useState({
    subject:            '',
    classLevel:         '',
    assessmentType:     '',
    title:              '',
    questionMode:       DEFAULT_TYPE === 'true_false' ? 'true_false' : 'mcq',
    questionType:       DEFAULT_TYPE,
    curriculum:         '',
    timerEnabled:       false,
    timeLimitMins:      30,
    participant_fields: null,
  })

  const [questions,      setQuestions]      = useState([])
  const [questionSource, setQuestionSource] = useState('manual')
  const [questionMode,   setQuestionMode]   = useState(null)

  const updateSetup = (field, value) =>
    setSetupData((prev) => ({ ...prev, [field]: value }))

  // Preserved for when step 0 is re-enabled
  const handleTypeSelect = (typeId) => {
    setQuestionType(typeId)
    setSetupData((prev) => ({
      ...prev,
      questionMode: typeId === 'true_false' ? 'true_false' : 'mcq',
      questionType: typeId,
    }))
    setStep(1)
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Step indicator — shown from step 1 onward */}
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

      <div className="bg-white border border-border rounded-3xl p-8 shadow-card">

        {/* Step 0 hidden — preserved for re-enabling */}
        {step === 0 && (
          <StepQuestionType onSelect={handleTypeSelect} />
        )}

        {step === 1 && (
          <StepSetup
            data={setupData}
            onChange={updateSetup}
            onNext={() => setStep(2)}
            onBack={() => {
              // Back from step 1: if type step is hidden, nothing to go back to
              if (START_STEP === 0) setStep(0)
              else router.push('/dashboard/assessments')
            }}
            accountCurriculum={curriculum}
            questionType={questionType}
          />
        )}

        {step === 2 && (
          <StepQuestions
            questions={questions}
            onChange={setQuestions}
            onSourceChange={(m) => { setQuestionMode(m); setQuestionSource(m) }}
            initialMode={questionMode}
            setupData={setupData}
            questionType={questionType}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <StepShare
            data={{ ...setupData, questionCount: questions.length }}
            questions={questions}
            source={questionSource}
            questionType={questionType}
            useCaseProfile={useCaseProfile}
            onBack={() => setStep(2)}
            onFinish={() => router.push('/dashboard/assessments')}
          />
        )}

      </div>
    </div>
  )
}