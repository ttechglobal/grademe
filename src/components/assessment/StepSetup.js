'use client'

import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { BookOpen } from 'lucide-react'

const SUBJECTS = [
  { value: '', label: 'Select a subject...' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'english', label: 'English Language' },
  { value: 'biology', label: 'Biology' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'physics', label: 'Physics' },
  { value: 'government', label: 'Government' },
  { value: 'economics', label: 'Economics' },
  { value: 'literature', label: 'Literature' },
  { value: 'geography', label: 'Geography' },
  { value: 'history', label: 'History' },
]

const CLASSES = [
  { value: '', label: 'Select a class...' },
  { value: 'jss1', label: 'JSS 1' },
  { value: 'jss2', label: 'JSS 2' },
  { value: 'jss3', label: 'JSS 3' },
  { value: 'ss1',  label: 'SS 1'  },
  { value: 'ss2',  label: 'SS 2'  },
  { value: 'ss3',  label: 'SS 3'  },
]

export default function StepSetup({ data, onChange, onNext }) {
  const isValid = data.subject && data.classLevel && data.topic.trim()

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={18} className="text-brand-500" />
          <h2 className="font-display text-xl font-bold text-ink">
            Assessment Details
          </h2>
        </div>
        <p className="text-sm text-ink-3">
          Set the subject, class, and topic. This helps organise your library.
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4">
        <Select
          label="Subject"
          options={SUBJECTS}
          value={data.subject}
          onChange={(e) => onChange('subject', e.target.value)}
        />
        <Select
          label="Class / Grade"
          options={CLASSES}
          value={data.classLevel}
          onChange={(e) => onChange('classLevel', e.target.value)}
        />
        <Input
          label="Topic"
          placeholder="e.g. Quadratic Equations"
          value={data.topic}
          onChange={(e) => onChange('topic', e.target.value)}
        />
        <Input
          label="Assessment Title (optional)"
          placeholder="Auto-filled from topic if left blank"
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          hint="e.g. Mid-term Test — Linear Equations"
        />
      </div>

      {/* CTA */}
      <div className="flex justify-end pt-2">
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!isValid}
        >
          Continue →
        </Button>
      </div>

    </div>
  )
}