'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const TEACHING_MODES = [
  { value: 'online',    label: 'Online',    icon: '💻' },
  { value: 'in_person', label: 'In Person', icon: '🏫' },
  { value: 'both',      label: 'Both',      icon: '🌍' },
]

const HEARD_FROM = [
  { value: 'social_media', label: 'Social Media',          icon: '📱' },
  { value: 'referral',     label: 'A friend or colleague', icon: '🤝' },
  { value: 'google',       label: 'Google Search',         icon: '🔍' },
  { value: 'whatsapp',     label: 'WhatsApp group',        icon: '💬' },
  { value: 'other',        label: 'Other',                 icon: '✨' },
]

const SCHOOL_TYPES = [
  { value: 'primary',          label: 'Primary / Elementary',  icon: '🏫' },
  { value: 'secondary',        label: 'Secondary / High School', icon: '🎓' },
  { value: 'university',       label: 'University / College',  icon: '🏛️' },
  { value: 'private_tutoring', label: 'Private Tutoring',      icon: '👤' },
  { value: 'online_school',    label: 'Online School',         icon: '💻' },
  { value: 'other',            label: 'Other',                 icon: '✨' },
]

const YEARS_TEACHING = [
  { value: '0_1',     label: 'Less than 1 year' },
  { value: '2_5',     label: '2–5 years'        },
  { value: '6_10',    label: '6–10 years'       },
  { value: '10_plus', label: '10+ years'        },
]

// Single-select option button
function SingleOption({ selected, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left text-sm font-medium transition-all w-full',
        selected
          ? 'border-brand-600 bg-brand-50 text-brand-800'
          : 'border-border bg-white text-ink hover:border-brand-200'
      )}
    >
      {icon && <span className="text-xl flex-shrink-0">{icon}</span>}
      <span className="flex-1">{label}</span>
      {selected && <span className="ml-auto text-brand-600 font-bold">✓</span>}
    </button>
  )
}

// Multi-select option button
function MultiOption({ selected, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left text-sm font-medium transition-all w-full',
        selected
          ? 'border-brand-600 bg-brand-50 text-brand-800'
          : 'border-border bg-white text-ink hover:border-brand-200'
      )}
    >
      {/* Checkbox indicator */}
      <div className={cn(
        'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors',
        selected ? 'border-brand-600 bg-brand-600' : 'border-border bg-white'
      )}>
        {selected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {icon && <span className="text-xl flex-shrink-0">{icon}</span>}
      <span className="flex-1">{label}</span>
    </button>
  )
}

function StepHeader({ current, total, title, subtitle }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar */}
      <div className="flex items-center gap-1.5">
        {[...Array(total)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 h-1.5 rounded-full transition-all duration-500',
              i < current ? 'bg-brand-600' : 'bg-border'
            )}
          />
        ))}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-ink-4">
          Step {current} of {total}
        </p>
        <h2 className="font-display text-xl font-bold text-ink mt-1">{title}</h2>
        {subtitle && (
          <p className="text-sm text-ink-4 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()

  const [step,          setStep]          = useState(1)
  const [teachingMode,  setTeachingMode]  = useState('')
  const [heardFrom,     setHeardFrom]     = useState('')
  const [schoolTypes,   setSchoolTypes]   = useState([]) // multi-select array
  const [yearsTeaching, setYearsTeaching] = useState('')
  const [saving,        setSaving]        = useState(false)

  const totalSteps = 4

  const toggleSchoolType = (value) => {
    setSchoolTypes((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    )
  }

  const saveSurvey = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        await supabase
          .from('onboarding_surveys')
          .upsert({
            user_id:        session.user.id,
            teaching_mode:  teachingMode  || null,
            heard_from:     heardFrom     || null,
            school_type:    schoolTypes.join(',') || null, // store as comma-separated
            years_teaching: yearsTeaching || null,
          })

        await supabase
          .from('profiles')
          .update({ onboarding_complete: true })
          .eq('id', session.user.id)
      }
    } catch (err) {
      console.error('Survey save error:', err)
    }
    router.push('/dashboard')
  }

  const handleSkip = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await supabase
          .from('profiles')
          .update({ onboarding_complete: true })
          .eq('id', session.user.id)
      }
    } catch {
      // non-critical
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-5">

        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <div className="font-display text-2xl font-extrabold">
              <span className="text-ink">Grade</span>
              <span className="text-amber">Mee</span>
            </div>
          </Link>
          <p className="text-ink-4 text-sm mt-1">
            Quick setup — takes less than a minute
          </p>
        </div>

        <div className="bg-white border border-border rounded-3xl p-8 shadow-card flex flex-col gap-6">

          {/* ── Step 1: Teaching mode ── */}
          {step === 1 && (
            <>
              <StepHeader
                current={1}
                total={totalSteps}
                title="How do you teach?"
              />
              <div className="flex flex-col gap-2">
                {TEACHING_MODES.map((m) => (
                  <SingleOption
                    key={m.value}
                    selected={teachingMode === m.value}
                    onClick={() => setTeachingMode(m.value)}
                    icon={m.icon}
                    label={m.label}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!teachingMode}
                className="w-full py-3 rounded-xl bg-brand-800 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </>
          )}

          {/* ── Step 2: Heard from ── */}
          {step === 2 && (
            <>
              <StepHeader
                current={2}
                total={totalSteps}
                title="How did you hear about us?"
              />
              <div className="flex flex-col gap-2">
                {HEARD_FROM.map((h) => (
                  <SingleOption
                    key={h.value}
                    selected={heardFrom === h.value}
                    onClick={() => setHeardFrom(h.value)}
                    icon={h.icon}
                    label={h.label}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!heardFrom}
                  className="flex-1 py-3 rounded-xl bg-brand-800 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue →
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: School type — MULTI-SELECT ── */}
          {step === 3 && (
            <>
              <StepHeader
                current={3}
                total={totalSteps}
                title="Where do you teach?"
                subtitle="Select all that apply"
              />
              <div className="flex flex-col gap-2">
                {SCHOOL_TYPES.map((s) => (
                  <MultiOption
                    key={s.value}
                    selected={schoolTypes.includes(s.value)}
                    onClick={() => toggleSchoolType(s.value)}
                    icon={s.icon}
                    label={s.label}
                  />
                ))}
              </div>

              {schoolTypes.length > 0 && (
                <p className="text-xs text-brand-600 font-semibold -mt-2">
                  {schoolTypes.length} selected
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={schoolTypes.length === 0}
                  className="flex-1 py-3 rounded-xl bg-brand-800 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue →
                </button>
              </div>
            </>
          )}

          {/* ── Step 4: Years teaching ── */}
          {step === 4 && (
            <>
              <StepHeader
                current={4}
                total={totalSteps}
                title="How long have you been teaching?"
              />
              <div className="flex flex-col gap-2">
                {YEARS_TEACHING.map((y) => (
                  <SingleOption
                    key={y.value}
                    selected={yearsTeaching === y.value}
                    onClick={() => setYearsTeaching(y.value)}
                    label={y.label}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={saveSurvey}
                  disabled={!yearsTeaching || saving}
                  className="flex-1 py-3 rounded-xl bg-amber text-ink text-sm font-bold hover:bg-amber/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? 'Setting up…' : 'Go to Dashboard 🎉'}
                </button>
              </div>
            </>
          )}

        </div>

        {/* Skip */}
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm text-ink-4 hover:text-ink text-center transition-colors"
        >
          Skip for now →
        </button>

      </div>
    </div>
  )
}