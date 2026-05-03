'use client'

import { useState, useEffect } from 'react'
import { useRouter }      from 'next/navigation'
import { createClient }   from '@/lib/supabase/client'
import StepQuestionType   from './StepQuestionType'
import StepSetup          from './StepSetup'
import StepQuestions      from './StepQuestions'
import StepShare          from './StepShare'
import { cn } from '@/lib/utils'

const STEPS = [
  { number: 1, label: 'Setup'     },
  { number: 2, label: 'Questions' },
  { number: 3, label: 'Share'     },
]

export default function AssessmentWizard({ curriculum = 'uk' }) {
  const router = useRouter()

  const [step,           setStep]           = useState(0)
  const [questionType,   setQuestionType]   = useState(null)
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
    questionMode:       'mcq',
    questionType:       null,   // the canonical type — set when tutor picks on step 0
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

  // Called by StepQuestionType when the tutor picks a type
  const handleTypeSelect = (typeId) => {
    setQuestionType(typeId)
    // Keep questionMode for legacy downstream consumers (MCQ / TF),
    // and also store the canonical questionType so the server action can read it.
    setSetupData((prev) => ({
      ...prev,
      questionMode: typeId === 'true_false' ? 'true_false' : 'mcq',
      questionType: typeId,   // ← this is the fix — passes 'calculation' through
    }))
    setStep(1)
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Step indicator — only shown once wizard begins (step >= 1) */}
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

        {step === 0 && (
          <StepQuestionType onSelect={handleTypeSelect} />
        )}

        {step === 1 && (
          <StepSetup
            data={setupData}
            onChange={updateSetup}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
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
            onBack={() => { setStep(1) }}
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