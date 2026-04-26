'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button  from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Link    from 'next/link'
import { BookOpen, Globe, ChevronDown, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── All subjects ───────────────────────────────────────────────────────────
const ALL_SUBJECTS = [
  'Mathematics', 'English Language', 'Biology', 'Chemistry',
  'Physics', 'Government', 'Economics', 'Literature',
  'Geography', 'History', 'Further Mathematics', 'Agricultural Science',
  'Computer Science', 'French', 'Music', 'Physical Education',
  'Religious Studies', 'Business Studies', 'Accounting', 'Art',
]

// ── Curriculum definitions (Canadian included) ─────────────────────────────
const CURRICULA = [
  { value: 'uk',            label: 'UK Curriculum',        short: 'UK (Year 1–13)', classes: ['Year 1','Year 2','Year 3','Year 4','Year 5','Year 6','Year 7','Year 8','Year 9','Year 10','Year 11','Year 12','Year 13'] },
  { value: 'us',            label: 'US Curriculum',        short: 'US (K–Grade 12)', classes: ['Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'] },
  { value: 'canadian',      label: 'Canadian Curriculum',  short: 'Canadian (K–Grade 12)', classes: ['Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'] },
  { value: 'nigerian',      label: 'Nigerian Curriculum',  short: 'Nigerian (JSS1–SS3)', classes: ['JSS 1','JSS 2','JSS 3','SS 1','SS 2','SS 3'] },
  { value: 'international', label: 'International (IB)',   short: 'International IB', classes: ['PYP 1','PYP 2','PYP 3','PYP 4','PYP 5','MYP 1','MYP 2','MYP 3','MYP 4','MYP 5','DP Year 1','DP Year 2'] },
  { value: 'india',         label: 'Indian Curriculum',    short: 'Indian (Class 1–12)', classes: ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'] },
  { value: 'other',         label: 'Other / Custom',       short: 'Other / Custom', classes: ['Level 1','Level 2','Level 3','Level 4','Level 5','Level 6'] },
]
const CURRICULUM_MAP = Object.fromEntries(CURRICULA.map((c) => [c.value, c]))

const ASSESSMENT_TYPES = [
  { id: 'assignment', label: 'Assignment', desc: 'Homework to complete at home', icon: '📝' },
  { id: 'quiz',       label: 'Quiz',       desc: 'A quick in-class check',       icon: '⚡' },
  { id: 'test',       label: 'Test',       desc: 'A more formal evaluation',     icon: '📋' },
]

// Timer duration presets
const TIMER_OPTIONS = [
  { value: 5,   label: '5 mins'   },
  { value: 10,  label: '10 mins'  },
  { value: 15,  label: '15 mins'  },
  { value: 20,  label: '20 mins'  },
  { value: 30,  label: '30 mins'  },
  { value: 45,  label: '45 mins'  },
  { value: 60,  label: '1 hour'   },
  { value: 90,  label: '1.5 hours'},
  { value: 120, label: '2 hours'  },
]

// ── Custom Select component ────────────────────────────────────────────────
// Replaces the browser-default <select> with a consistently styled version.
function CustomSelect({ label, value, onChange, options, placeholder, hint, disabled = false }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-ink-2">{label}</label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            'w-full appearance-none px-4 py-3 pr-10',
            'border-2 border-border rounded-xl text-sm text-ink bg-white',
            'outline-none transition-all cursor-pointer',
            'focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
            'hover:border-brand-300',
            disabled && 'opacity-50 cursor-not-allowed bg-surface',
            !value && 'text-ink-4'
          )}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {/* Custom chevron */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <ChevronDown size={15} className={cn('text-ink-4', disabled && 'opacity-40')} />
        </div>
      </div>
      {hint && <p className="text-xs text-ink-4 px-0.5 leading-relaxed">{hint}</p>}
    </div>
  )
}

// ── iOS-style toggle ───────────────────────────────────────────────────────
function Toggle({ enabled, onToggle, label }) {
  return (
    <div className="flex items-center gap-3">
      {/* Track */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={cn(
          'relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2',
          'transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
          enabled
            ? 'bg-success border-success'
            : 'bg-surface border-border'
        )}
      >
        {/* Thumb */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0',
            'transition-transform duration-200 ease-in-out',
            // mt-0.5 centres the thumb vertically within the track border
            'mt-0.5',
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
      {label && (
        <span className={cn('text-sm font-semibold', enabled ? 'text-ink' : 'text-ink-3')}>
          {label}
        </span>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function StepSetup({ data, onChange, onNext, accountCurriculum = 'uk' }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }

      const { data: p } = await supabase
        .from('profiles')
        .select('teaching_subjects, teaching_classes, curriculum')
        .eq('id', session.user.id)
        .single()

      setProfile(p)

      // Default per-assessment curriculum to account curriculum (on first load only)
      if (p?.curriculum && !data.curriculum) {
        onChange('curriculum', p.curriculum)
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const accountCurr      = profile?.curriculum ?? accountCurriculum
  const activeCurriculum = data.curriculum || accountCurr
  const currDef          = CURRICULUM_MAP[activeCurriculum] ?? CURRICULUM_MAP.uk

  // Subject options
  const teachingSubjects = profile?.teaching_subjects ?? []
  const subjectList      = teachingSubjects.length > 0 ? teachingSubjects : ALL_SUBJECTS
  const subjectOptions   = subjectList.map((s) => ({
    value: s.toLowerCase().replace(/\s+/g, '_'),
    label: s,
  }))

  // Class options — derived from selected curriculum
  const teachingClasses = profile?.teaching_classes ?? []
  const classList       = teachingClasses.length > 0 ? teachingClasses : currDef.classes
  const classOptions    = classList.map((c) => ({
    value: c.toLowerCase().replace(/\s+/g, '_'),
    label: c,
  }))

  // Curriculum options
  const curriculumOptions = CURRICULA.map((c) => ({
    value: c.value,
    label: c.value === accountCurr ? `${c.label} (account default)` : c.label,
  }))

  const isValid = data.subject && data.classLevel && data.assessmentType

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-6 h-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={18} className="text-brand-500" />
          <h2 className="font-display text-xl font-bold text-ink">Assessment Details</h2>
        </div>
        <p className="text-sm text-ink-3">Set up your assessment before adding questions.</p>
      </div>

      {/* Curriculum selector */}
      <CustomSelect
        label={
          <span className="flex items-center gap-1.5">
            <Globe size={13} className="text-brand-500" />
            Curriculum
          </span>
        }
        value={activeCurriculum}
        onChange={(e) => {
          onChange('curriculum', e.target.value)
          onChange('classLevel', '')  // reset class when curriculum changes
        }}
        options={curriculumOptions}
        hint={
          <>
            Defaults to your account curriculum.{' '}
            {activeCurriculum !== accountCurr && (
              <button
                type="button"
                onClick={() => { onChange('curriculum', accountCurr); onChange('classLevel', '') }}
                className="text-brand-500 font-semibold hover:text-brand-400 underline underline-offset-2"
              >
                Reset to default
              </button>
            )}
          </>
        }
      />

      {/* Subject */}
      <CustomSelect
        label="Subject"
        value={data.subject}
        onChange={(e) => onChange('subject', e.target.value)}
        options={subjectOptions}
        placeholder="Select a subject…"
        hint={
          !data.subject && (
            <>
              Can't find your subject?{' '}
              <Link href="/dashboard/settings" className="text-brand-500 font-semibold hover:text-brand-400">
                Edit your preferences →
              </Link>
            </>
          )
        }
      />

      {/* Class / Grade */}
      <CustomSelect
        label="Class / Grade"
        value={data.classLevel}
        onChange={(e) => onChange('classLevel', e.target.value)}
        options={classOptions}
        placeholder="Select a class…"
      />

      {/* Assessment title (optional — plain input, no custom select needed) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-ink-2">
          Assessment Title <span className="text-ink-4 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={data.title ?? ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Auto-generated if left blank"
          className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 hover:border-brand-300 transition-all"
        />
        <p className="text-xs text-ink-4 px-0.5">e.g. Mid-term Test — Algebra</p>
      </div>

      {/* Assessment type */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-ink-2">
          Assessment Type <span className="text-danger">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {ASSESSMENT_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange('assessmentType', type.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all',
                data.assessmentType === type.id
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-border bg-white hover:border-brand-200'
              )}
            >
              <span className="text-2xl">{type.icon}</span>
              <p className={cn('text-sm font-semibold', data.assessmentType === type.id ? 'text-brand-800' : 'text-ink')}>
                {type.label}
              </p>
              <p className="text-xs text-ink-4 leading-tight hidden sm:block">{type.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* MCQ notice */}
      <div className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-2">
        <span className="text-lg">🔘</span>
        <div>
          <p className="text-sm font-semibold text-ink">Multiple Choice Questions (MCQ)</p>
          <p className="text-xs text-ink-4 mt-0.5">
            Only MCQ is supported right now. Fill-in questions are coming soon.
          </p>
        </div>
      </div>

      {/* ── Timer ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-border rounded-2xl px-5 py-4 flex flex-col gap-4">

        {/* Toggle row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock size={16} className={cn('flex-shrink-0', data.timerEnabled ? 'text-success' : 'text-ink-4')} />
            <div>
              <p className="text-sm font-semibold text-ink">Timer</p>
              <p className="text-xs text-ink-3 mt-0.5">
                {data.timerEnabled
                  ? 'Students have a time limit to complete the assessment.'
                  : 'No time limit — students take as long as they need.'}
              </p>
            </div>
          </div>

          <Toggle
            enabled={!!data.timerEnabled}
            onToggle={() => {
              const next = !data.timerEnabled
              onChange('timerEnabled', next)
              if (next && !data.timeLimitMins) onChange('timeLimitMins', 30)
            }}
            label={data.timerEnabled ? 'On' : 'Off'}
          />
        </div>

        {/* Duration selector — only when ON */}
        {data.timerEnabled && (
          <div className="border-t border-border pt-4">
            <CustomSelect
              label="Duration"
              value={data.timeLimitMins ?? 30}
              onChange={(e) => onChange('timeLimitMins', Number(e.target.value))}
              options={TIMER_OPTIONS}
              hint={`Students will have ${TIMER_OPTIONS.find((o) => o.value === (data.timeLimitMins ?? 30))?.label ?? '30 mins'} to complete the assessment. The timer starts when they click Begin.`}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={onNext} disabled={!isValid}>
          Continue →
        </Button>
      </div>
    </div>
  )
}