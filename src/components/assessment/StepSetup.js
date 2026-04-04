'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const ALL_SUBJECTS = [
  'Mathematics', 'English Language', 'Biology', 'Chemistry',
  'Physics', 'Government', 'Economics', 'Literature',
  'Geography', 'History', 'Further Mathematics', 'Agricultural Science',
  'Computer Science', 'French', 'Music', 'Physical Education',
  'Religious Studies', 'Business Studies', 'Accounting', 'Art',
]

const CLASSES_BY_CURRICULUM = {
  uk:            ['Year 1','Year 2','Year 3','Year 4','Year 5','Year 6','Year 7','Year 8','Year 9','Year 10','Year 11','Year 12','Year 13'],
  us:            ['Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'],
  nigerian:      ['JSS 1','JSS 2','JSS 3','SS 1','SS 2','SS 3'],
  international: ['PYP 1','PYP 2','PYP 3','PYP 4','PYP 5','MYP 1','MYP 2','MYP 3','MYP 4','MYP 5','DP Year 1','DP Year 2'],
  india:         ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'],
  other:         ['Level 1','Level 2','Level 3','Level 4','Level 5','Level 6'],
}

const CURRICULUM_LABELS = {
  uk:            'UK (Year 1–13)',
  us:            'US (Kindergarten–Grade 12)',
  nigerian:      'Nigerian (JSS1–SS3)',
  international: 'International IB',
  india:         'Indian (Class 1–12)',
  other:         'Other / Custom',
}

const ASSESSMENT_TYPES = [
  {
    id:    'assignment',
    label: 'Assignment',
    desc:  'Homework given to students to complete at home',
    icon:  '📝',
  },
  {
    id:    'quiz',
    label: 'Quiz',
    desc:  'A quick in-class check of understanding',
    icon:  '⚡',
  },
  {
    id:    'test',
    label: 'Test',
    desc:  'A more formal evaluation',
    icon:  '📋',
  },
]

export default function StepSetup({ data, onChange, onNext, curriculum = 'uk' }) {
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
      setLoading(false)
    }
    load()
  }, [])

  const teachingSubjects = profile?.teaching_subjects ?? []
  const subjectList      = teachingSubjects.length > 0 ? teachingSubjects : ALL_SUBJECTS

  const subjectOptions = [
    { value: '', label: 'Select a subject...' },
    ...subjectList.map((s) => ({
      value: s.toLowerCase().replace(/\s+/g, '_'),
      label: s,
    })),
  ]

  const teachingClasses      = profile?.teaching_classes ?? []
  const activeCurriculum     = profile?.curriculum ?? curriculum
  const allClassesForCurr    = CLASSES_BY_CURRICULUM[activeCurriculum] ?? CLASSES_BY_CURRICULUM.uk
  const classList            = teachingClasses.length > 0 ? teachingClasses : allClassesForCurr

  const classOptions = [
    { value: '', label: 'Select a class...' },
    ...classList.map((c) => ({
      value: c.toLowerCase().replace(/\s+/g, '_'),
      label: c,
    })),
  ]

  const currLabel = CURRICULUM_LABELS[activeCurriculum] ?? 'UK'
  const isValid   = data.subject && data.classLevel && data.assessmentType

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-6 h-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={18} className="text-brand-500" />
          <h2 className="font-display text-xl font-bold text-ink">
            Assessment Details
          </h2>
        </div>
        <p className="text-sm text-ink-3">Set up your assessment details below.</p>
      </div>

      {/* Curriculum indicator */}
      <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5">
        <span className="text-xs font-semibold text-brand-700">🌍 {currLabel}</span>
        <Link
          href="/dashboard/settings"
          className="ml-auto text-xs text-brand-500 font-semibold hover:text-brand-400 underline underline-offset-2"
        >
          Edit preferences →
        </Link>
      </div>

      {/* Subject + Class */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Select
            label="Subject"
            options={subjectOptions}
            value={data.subject}
            onChange={(e) => onChange('subject', e.target.value)}
          />
          {!data.subject && (
            <p className="text-xs text-ink-4 px-1">
              Can&apos;t find your subject?{' '}
              <Link
                href="/dashboard/settings"
                className="text-brand-500 font-semibold hover:text-brand-400"
              >
                Edit your preferences →
              </Link>
            </p>
          )}
        </div>

        <Select
          label="Class / Grade"
          options={classOptions}
          value={data.classLevel}
          onChange={(e) => onChange('classLevel', e.target.value)}
        />

        <Input
          label="Assessment Title (optional)"
          placeholder="Auto-generated if left blank"
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          hint="e.g. Mid-term Test — Algebra"
        />
      </div>

      {/* Assessment Type */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-ink-2">
          Assessment Type <span className="text-danger">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {ASSESSMENT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => onChange('assessmentType', type.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all',
                data.assessmentType === type.id
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-border bg-white hover:border-brand-200'
              )}
            >
              <span className="text-2xl">{type.icon}</span>
              <p className={cn(
                'text-sm font-semibold',
                data.assessmentType === type.id ? 'text-brand-800' : 'text-ink'
              )}>
                {type.label}
              </p>
              <p className="text-xs text-ink-4 leading-tight hidden sm:block">
                {type.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* MCQ only notice */}
      <div className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-2">
        <span className="text-lg">🔘</span>
        <div>
          <p className="text-sm font-semibold text-ink">Multiple Choice Questions (MCQ)</p>
          <p className="text-xs text-ink-4 mt-0.5">
            Only MCQ is supported right now. Fill-in questions are coming soon.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={onNext} disabled={!isValid}>
          Continue →
        </Button>
      </div>
    </div>
  )
}