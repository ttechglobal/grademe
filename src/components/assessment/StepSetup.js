'use client'

import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { BookOpen } from 'lucide-react'

const SUBJECTS = [
  { value: '',            label: 'Select a subject...' },
  { value: 'mathematics', label: 'Mathematics'         },
  { value: 'english',     label: 'English Language'    },
  { value: 'biology',     label: 'Biology'             },
  { value: 'chemistry',   label: 'Chemistry'           },
  { value: 'physics',     label: 'Physics'             },
  { value: 'government',  label: 'Government'          },
  { value: 'economics',   label: 'Economics'           },
  { value: 'literature',  label: 'Literature'          },
  { value: 'geography',   label: 'Geography'           },
  { value: 'history',     label: 'History'             },
]

const CLASSES_BY_CURRICULUM = {
  uk: [
    { value: '',       label: 'Select a class...' },
    { value: 'year1',  label: 'Year 1'            },
    { value: 'year2',  label: 'Year 2'            },
    { value: 'year3',  label: 'Year 3'            },
    { value: 'year4',  label: 'Year 4'            },
    { value: 'year5',  label: 'Year 5'            },
    { value: 'year6',  label: 'Year 6'            },
    { value: 'year7',  label: 'Year 7'            },
    { value: 'year8',  label: 'Year 8'            },
    { value: 'year9',  label: 'Year 9'            },
    { value: 'year10', label: 'Year 10'           },
    { value: 'year11', label: 'Year 11'           },
    { value: 'year12', label: 'Year 12'           },
    { value: 'year13', label: 'Year 13'           },
  ],
  us: [
    { value: '',        label: 'Select a class...' },
    { value: 'kinder',  label: 'Kindergarten'      },
    { value: 'grade1',  label: 'Grade 1'           },
    { value: 'grade2',  label: 'Grade 2'           },
    { value: 'grade3',  label: 'Grade 3'           },
    { value: 'grade4',  label: 'Grade 4'           },
    { value: 'grade5',  label: 'Grade 5'           },
    { value: 'grade6',  label: 'Grade 6'           },
    { value: 'grade7',  label: 'Grade 7'           },
    { value: 'grade8',  label: 'Grade 8'           },
    { value: 'grade9',  label: 'Grade 9'           },
    { value: 'grade10', label: 'Grade 10'          },
    { value: 'grade11', label: 'Grade 11'          },
    { value: 'grade12', label: 'Grade 12'          },
  ],
  nigerian: [
    { value: '',     label: 'Select a class...' },
    { value: 'jss1', label: 'JSS 1'             },
    { value: 'jss2', label: 'JSS 2'             },
    { value: 'jss3', label: 'JSS 3'             },
    { value: 'ss1',  label: 'SS 1'              },
    { value: 'ss2',  label: 'SS 2'              },
    { value: 'ss3',  label: 'SS 3'              },
  ],
  international: [
    { value: '',         label: 'Select a class...' },
    { value: 'pyp1',     label: 'PYP 1'             },
    { value: 'pyp2',     label: 'PYP 2'             },
    { value: 'pyp3',     label: 'PYP 3'             },
    { value: 'pyp4',     label: 'PYP 4'             },
    { value: 'pyp5',     label: 'PYP 5'             },
    { value: 'myp1',     label: 'MYP 1'             },
    { value: 'myp2',     label: 'MYP 2'             },
    { value: 'myp3',     label: 'MYP 3'             },
    { value: 'myp4',     label: 'MYP 4'             },
    { value: 'myp5',     label: 'MYP 5'             },
    { value: 'dp_year1', label: 'DP Year 1'         },
    { value: 'dp_year2', label: 'DP Year 2'         },
  ],
}

const CURRICULUM_LABELS = {
  uk:            'UK (Year 1–13)',
  us:            'US (Kindergarten–Grade 12)',
  nigerian:      'Nigerian (JSS1–SS3)',
  international: 'International IB',
}

export default function StepSetup({ data, onChange, onNext, curriculum = 'uk' }) {
  const isValid   = data.subject && data.classLevel && data.topic.trim()
  const classes   = CLASSES_BY_CURRICULUM[curriculum] ?? CLASSES_BY_CURRICULUM.uk
  const currLabel = CURRICULUM_LABELS[curriculum] ?? 'UK'

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

      {/* Curriculum indicator */}
      <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5">
        <span className="text-xs font-semibold text-brand-700">
          🌍 Curriculum:
        </span>
        <span className="text-xs text-brand-600 font-medium">
          {currLabel}
        </span>
        <a
          href="/dashboard/settings"
          className="ml-auto text-xs text-brand-500 font-semibold hover:text-brand-400 underline underline-offset-2"
        >
          Change in Settings
        </a>
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
          options={classes}
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