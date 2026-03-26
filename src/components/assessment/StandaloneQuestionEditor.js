'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import QuestionEditor from './QuestionEditor'
import { BookOpen, Save } from 'lucide-react'

const SUBJECTS = [
  { value: '',            label: 'Select subject...' },
  { value: 'mathematics', label: 'Mathematics'       },
  { value: 'english',     label: 'English Language'  },
  { value: 'biology',     label: 'Biology'           },
  { value: 'chemistry',   label: 'Chemistry'         },
  { value: 'physics',     label: 'Physics'           },
  { value: 'government',  label: 'Government'        },
  { value: 'economics',   label: 'Economics'         },
  { value: 'literature',  label: 'Literature'        },
  { value: 'geography',   label: 'Geography'         },
  { value: 'history',     label: 'History'           },
]

const CLASSES_BY_CURRICULUM = {
  uk: [
    { value: '',       label: 'Select class...' },
    { value: 'year1',  label: 'Year 1'  }, { value: 'year2',  label: 'Year 2'  },
    { value: 'year3',  label: 'Year 3'  }, { value: 'year4',  label: 'Year 4'  },
    { value: 'year5',  label: 'Year 5'  }, { value: 'year6',  label: 'Year 6'  },
    { value: 'year7',  label: 'Year 7'  }, { value: 'year8',  label: 'Year 8'  },
    { value: 'year9',  label: 'Year 9'  }, { value: 'year10', label: 'Year 10' },
    { value: 'year11', label: 'Year 11' }, { value: 'year12', label: 'Year 12' },
    { value: 'year13', label: 'Year 13' },
  ],
  us: [
    { value: '',        label: 'Select class...' },
    { value: 'kinder',  label: 'Kindergarten' },
    { value: 'grade1',  label: 'Grade 1'  }, { value: 'grade2',  label: 'Grade 2'  },
    { value: 'grade3',  label: 'Grade 3'  }, { value: 'grade4',  label: 'Grade 4'  },
    { value: 'grade5',  label: 'Grade 5'  }, { value: 'grade6',  label: 'Grade 6'  },
    { value: 'grade7',  label: 'Grade 7'  }, { value: 'grade8',  label: 'Grade 8'  },
    { value: 'grade9',  label: 'Grade 9'  }, { value: 'grade10', label: 'Grade 10' },
    { value: 'grade11', label: 'Grade 11' }, { value: 'grade12', label: 'Grade 12' },
  ],
  nigerian: [
    { value: '',     label: 'Select class...' },
    { value: 'jss1', label: 'JSS 1' }, { value: 'jss2', label: 'JSS 2' },
    { value: 'jss3', label: 'JSS 3' }, { value: 'ss1',  label: 'SS 1'  },
    { value: 'ss2',  label: 'SS 2'  }, { value: 'ss3',  label: 'SS 3'  },
  ],
  international: [
    { value: '',         label: 'Select class...' },
    { value: 'pyp1',     label: 'PYP 1' }, { value: 'pyp2', label: 'PYP 2' },
    { value: 'pyp3',     label: 'PYP 3' }, { value: 'pyp4', label: 'PYP 4' },
    { value: 'pyp5',     label: 'PYP 5' }, { value: 'myp1', label: 'MYP 1' },
    { value: 'myp2',     label: 'MYP 2' }, { value: 'myp3', label: 'MYP 3' },
    { value: 'myp4',     label: 'MYP 4' }, { value: 'myp5', label: 'MYP 5' },
    { value: 'dp_year1', label: 'DP Year 1' }, { value: 'dp_year2', label: 'DP Year 2' },
  ],
}

export default function StandaloneQuestionEditor({ curriculum = 'uk' }) {
  const router    = useRouter()
  const { toast } = useToast()
  const classes   = CLASSES_BY_CURRICULUM[curriculum] ?? CLASSES_BY_CURRICULUM.uk

  const [subject,    setSubject]    = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [topic,      setTopic]      = useState('')
  const [questions,  setQuestions]  = useState([])
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  const isValid = subject && classLevel && topic.trim() && questions.length > 0

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      router.push('/login')
      return
    }

    const teacherId = session.user.id

    const rows = questions.map((q, i) => ({
      assessment_id: null,
      teacher_id:    teacherId,
      type:          q.type,
      text:          q.text,
      options:       Array.isArray(q.options) ? q.options : [],
      answer:        q.answer,
      hint:          q.hint          ?? '',
      explanation:   q.explanation   ?? '',
      order_index:   i,
      subject,
      class_level:   classLevel,
      topic,
    }))

    const { error: insertError } = await supabase.from('questions').insert(rows)

    if (insertError) {
      setError(insertError.message)
      toast({ message: 'Failed to save questions.', type: 'error' })
    } else {
      toast({ message: 'Questions saved to Question Bank!', type: 'success' })
      setTimeout(() => router.push('/dashboard/questions'), 1500)
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4 flex items-start gap-3">
        <BookOpen size={18} className="text-brand-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-brand-800">Adding to Question Bank</p>
          <p className="text-xs text-brand-600 mt-0.5 leading-relaxed">
            These questions are saved to your bank independently. You can reuse them when creating assessments later.
          </p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold text-ink">Classify Questions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select label="Subject" options={SUBJECTS} value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Select label="Class"   options={classes}  value={classLevel} onChange={(e) => setClassLevel(e.target.value)} />
          <Input  label="Topic"   placeholder="e.g. Quadratic Equations" value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold text-ink">Add Questions</h2>
        <QuestionEditor questions={questions} onChange={setQuestions} />
      </div>

      {error && (
        <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">{error}</div>
      )}

      <div className="flex items-center justify-between pb-6">
        <Button variant="ghost" onClick={() => router.back()}>← Cancel</Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-4">
            {questions.length} question{questions.length !== 1 ? 's' : ''} ready
          </span>
          <Button variant="primary" onClick={handleSave} loading={saving} disabled={!isValid}>
            <Save size={15} />
            Save to Question Bank
          </Button>
        </div>
      </div>
    </div>
  )
}