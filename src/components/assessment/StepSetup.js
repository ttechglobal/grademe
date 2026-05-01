'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button  from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Link    from 'next/link'
import { BookOpen, Globe, ChevronDown, Clock, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sortGradeOptions } from '@/lib/sortGrades'

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

import { getUseCaseConfig } from '@/lib/useCaseConfig'

// ── Default intake fields per profile ─────────────────────────────────────
const PROFILE_DEFAULT_FIELDS = {
  k12_tutor:  [{ key: 'full_name', label: 'Full Name', required: true }],
  university: [
    { key: 'full_name',     label: 'Full Name',     required: true  },
    { key: 'matric_number', label: 'Matric Number', required: true  },
  ],
  corporate:  [
    { key: 'full_name',   label: 'Full Name',   required: true  },
    { key: 'employee_id', label: 'Employee ID', required: false },
  ],
  religious:  [{ key: 'full_name', label: 'Full Name', required: true }],
  vocational: [{ key: 'full_name', label: 'Full Name', required: true }],
  other:      [{ key: 'full_name', label: 'Full Name', required: true }],
}

const SUGGESTED_EXTRA_FIELDS = {
  k12_tutor:  [{ key: 'class_arm',  label: 'Class Arm'  }, { key: 'student_id', label: 'Student ID' }],
  university: [{ key: 'department', label: 'Department' }, { key: 'course_code', label: 'Course Code' }],
  corporate:  [{ key: 'department', label: 'Department' }, { key: 'team',        label: 'Team'        }],
  religious:  [{ key: 'cell_group', label: 'Cell Group' }, { key: 'cohort',      label: 'Cohort'      }],
  vocational: [{ key: 'batch',      label: 'Batch'      }, { key: 'skill_track', label: 'Skill Track' }],
  other:      [{ key: 'group',      label: 'Group'      }],
}

function getDefaultFields(useCaseProfile) {
  return PROFILE_DEFAULT_FIELDS[useCaseProfile] ?? PROFILE_DEFAULT_FIELDS.k12_tutor
}

// ── Participant intake fields editor ──────────────────────────────────────
function ParticipantFieldsEditor({ fields, useCaseProfile, onChange }) {
  const [expanded, setExpanded]   = useState(false)
  const [newLabel, setNewLabel]   = useState('')
  const [required, setRequired]   = useState(true)   // required by default

  // Resolve: if null, use profile defaults (not yet customised)
  const defaults     = getDefaultFields(useCaseProfile)
  const active       = fields ?? defaults
  const isCustomised = fields !== null

  const suggestions = (SUGGESTED_EXTRA_FIELDS[useCaseProfile] ?? [])
    .filter((s) => !active.some((f) => f.key === s.key))

  const addSuggested = (s) => {
    onChange([...active, { key: s.key, label: s.label, required: true }])  // required by default
  }

  const addCustom = () => {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    if (active.some((f) => f.key === key)) return
    onChange([...active, { key, label: trimmed, required }])
    setNewLabel('')
    setRequired(true)   // reset to required for next field
  }

  const remove = (key) => {
    if (key === 'full_name') return  // Full Name is always required
    onChange(active.filter((f) => f.key !== key))
  }

  const resetToDefaults = () => onChange(null)

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-600 text-sm font-bold">?</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              What to collect from participants
            </p>
            <p className="text-xs text-ink-4 mt-0.5">
              {active.map((f) => f.label).join(', ')}
              {isCustomised && <span className="ml-1.5 text-brand-500 font-semibold">• Custom</span>}
            </p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={cn('text-ink-4 transition-transform flex-shrink-0', expanded && 'rotate-180')}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border flex flex-col gap-4 pt-4">

          {/* Current fields list */}
          <div className="flex flex-col gap-2">
            {active.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-ink truncate">{f.label}</span>
                  {f.required && (
                    <span className="text-[10px] font-bold text-danger bg-danger-light px-1.5 py-0.5 rounded flex-shrink-0">Required</span>
                  )}
                </div>
                {f.key !== 'full_name' && (
                  <button
                    type="button"
                    onClick={() => remove(f.key)}
                    className="text-ink-4 hover:text-danger transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
                {f.key === 'full_name' && (
                  <span className="text-[10px] text-ink-4 flex-shrink-0">Always on</span>
                )}
              </div>
            ))}
          </div>

          {/* Suggested fields — one-tap add */}
          {suggestions.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-ink-4 uppercase tracking-widest">Suggested</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => addSuggested(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-border rounded-xl text-xs font-semibold text-ink hover:border-brand-400 hover:bg-brand-50 transition-colors"
                  >
                    <Plus size={11} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom field add */}
          {active.length < 5 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-ink-4 uppercase tracking-widest">Add custom field</p>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
                  placeholder="Field label — e.g. Registration Number"
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-brand-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setRequired((v) => !v)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs font-bold border-2 transition-colors flex-shrink-0',
                    required
                      ? 'border-danger bg-danger-light text-danger'
                      : 'border-border text-ink-4 hover:border-brand-300'
                  )}
                >
                  {required ? 'Required' : 'Optional'}
                </button>
                <button
                  type="button"
                  onClick={addCustom}
                  disabled={!newLabel.trim()}
                  className="px-3 py-2 bg-brand-800 text-white text-xs font-bold rounded-xl hover:bg-brand-700 disabled:opacity-40 transition-colors flex-shrink-0"
                >
                  Add
                </button>
              </div>
              <p className="text-[11px] text-ink-4">
                Fields are required by default — tap "Required" to make one optional.
              </p>
            </div>
          )}

          {/* Reset link */}
          {isCustomised && (
            <button
              type="button"
              onClick={resetToDefaults}
              className="text-xs text-ink-4 hover:text-brand-500 transition-colors self-start"
            >
              Reset to defaults
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Participant Fields Editor ───────────────────────────────────────────────
// Shown in Step 1 of assessment creation so tutors/lecturers can see
// and customise what they collect from participants — right in the flow.
// Full Name is always first and locked. Everything else is editable.
const SUGGESTED_FIELDS = {
  k12_tutor:  [{ key: 'class_arm',     label: 'Class Arm',     required: false }],
  university: [{ key: 'matric_number', label: 'Matric Number', required: true  },
               { key: 'department',    label: 'Department',    required: false }],
  other:      [{ key: 'id_number',     label: 'ID Number',     required: false }],
}


// ── Main component ─────────────────────────────────────────────────────────
export default function StepSetup({ data, onChange, onNext, onBack, accountCurriculum = 'uk', questionType }) {
  const [profile,       setProfile]       = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [useCaseProfile, setUseCaseProfile] = useState('k12_tutor')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }

      const { data: p } = await supabase
        .from('profiles')
        .select('teaching_subjects, teaching_classes, teaching_courses, curriculum, use_case_profile')
        .eq('id', session.user.id)
        .single()

      setProfile(p)

      const resolvedProfile = p?.use_case_profile ?? 'k12_tutor'
      setUseCaseProfile(resolvedProfile)

      // When switching to university — clear any stale subject/class from a previous tutor session
      if (resolvedProfile === 'university') {
        if (data.subject)    onChange('subject', '')
        if (data.classLevel) onChange('classLevel', '')
      }

      // Default per-assessment curriculum to account curriculum (on first load only)
      if (p?.curriculum && !data.curriculum) {
        onChange('curriculum', p.curriculum)
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ucConfig = getUseCaseConfig(useCaseProfile)
  const isUniversity = useCaseProfile === 'university'

  const accountCurr      = profile?.curriculum ?? accountCurriculum
  const activeCurriculum = data.curriculum || accountCurr
  const currDef          = CURRICULUM_MAP[activeCurriculum] ?? CURRICULUM_MAP.uk

  // Subject options — only used for non-university profiles
  const teachingSubjects = profile?.teaching_subjects ?? []
  const subjectList      = teachingSubjects.length > 0 ? teachingSubjects : ALL_SUBJECTS
  const subjectOptions   = subjectList.map((s) => ({
    value: s.toLowerCase().replace(/\s+/g, '_'),
    label: s,
  }))

  // Class options — only used for non-university profiles
  const teachingClasses = profile?.teaching_classes ?? []
  const classList       = teachingClasses.length > 0 ? teachingClasses : currDef.classes
  const classOptions    = sortGradeOptions(classList.map((c) => ({
    value: c.toLowerCase().replace(/\s+/g, '_'),
    label: c,
  })))

  // Course options — university only. teaching_courses is [{name, code}]
  const teachingCourses = profile?.teaching_courses ?? []
  const courseOptions   = teachingCourses.map((c) => ({
    value: c.code ? `${c.code}__${c.name}` : c.name,
    label: c.code ? `${c.code} — ${c.name}` : c.name,
  }))

  const curriculumOptions = CURRICULA.map((c) => ({
    value: c.value,
    label: c.value === accountCurr ? `${c.label} (account default)` : c.label,
  }))

  // isValid — different required fields per profile
  const isValid = isUniversity
    ? (data.classLevel && data.assessmentType)           // course (stored in classLevel) + type
    : (data.subject && data.classLevel && data.assessmentType)  // subject + class + type

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

      {/* ── UNIVERSITY FLOW ─────────────────────────────────────────────
          Only shows: Course → Assessment Type → Title (opt) → Timer
          No subject, no class/grade dropdown, no curriculum.
      ─────────────────────────────────────────────────────────────────── */}
      {isUniversity ? (
        <>
          {/* Course — primary academic unit for university */}
          {courseOptions.length > 0 ? (
            <CustomSelect
              label="Course"
              value={data.classLevel}
              onChange={(e) => onChange('classLevel', e.target.value)}
              options={courseOptions}
              placeholder="Select a course…"
              hint={
                <Link href="/dashboard/settings" className="text-brand-500 font-semibold hover:text-brand-400">
                  Manage courses in Settings →
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink-2">Course</label>
              <div className="bg-amber-light border border-amber/25 rounded-xl px-4 py-3.5 flex items-start gap-3">
                <span className="text-amber text-base flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-amber">No courses added yet</p>
                  <p className="text-xs text-amber/80 mt-0.5">
                    Add your courses in Settings before creating assessments.{' '}
                    <Link href="/dashboard/settings" className="font-bold underline underline-offset-2 hover:text-amber">
                      Go to Settings →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ── TUTOR / K-12 FLOW ──────────────────────────────────────────
           Curriculum (if applicable) → Subject → Class/Grade
        ─────────────────────────────────────────────────────────────────── */
        <>
          {ucConfig.showCurriculum && (
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
                onChange('classLevel', '')
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
          )}

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

          {ucConfig.showGradeLevel ? (
            <CustomSelect
              label={ucConfig.classLabel}
              value={data.classLevel}
              onChange={(e) => onChange('classLevel', e.target.value)}
              options={classOptions}
              placeholder="Select a class…"
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink-2">{ucConfig.classLabel}</label>
              <input
                type="text"
                value={data.classLevel ?? ''}
                onChange={(e) => onChange('classLevel', e.target.value)}
                placeholder={`e.g. ${ucConfig.classLabel} name`}
                className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 hover:border-brand-300 transition-all"
              />
            </div>
          )}
        </>
      )}

      {/* Assessment title — optional for both profiles */}
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
        <p className="text-xs text-ink-4 px-0.5">
          {isUniversity ? 'e.g. CSCD 201 — Mid-Semester Test' : 'e.g. Mid-term Test — Algebra'}
        </p>
      </div>

      {/* Assessment type — same for both profiles */}
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

      {/* ── Participant intake fields ──────────────────────────────────
          Shown as a collapsed summary by default — expand to customise.
          Defaults are set from the use case profile when null.
      ─────────────────────────────────────────────────────────────────── */}
      <ParticipantFieldsEditor
        fields={data.participant_fields}
        useCaseProfile={useCaseProfile}
        onChange={(fields) => onChange('participant_fields', fields)}
      />

      {/* Timer — same for both profiles */}
      <div className="bg-white border border-border rounded-2xl px-5 py-4 flex flex-col gap-4">
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

      <div className="flex items-center justify-between pt-2">
        {onBack ? (
          <Button variant="secondary" onClick={onBack}>← Back</Button>
        ) : (
          <div />
        )}
        <Button variant="primary" onClick={onNext} disabled={!isValid}>
          Continue →
        </Button>
      </div>
    </div>
  )
}