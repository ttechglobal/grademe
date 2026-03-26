import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { Plus, ClipboardList } from 'lucide-react'

const SUBJECT_COLORS = {
  mathematics: 'bg-brand-400',
  english:     'bg-blue-500',
  biology:     'bg-emerald-500',
  chemistry:   'bg-purple-500',
  physics:     'bg-sky-500',
  government:  'bg-orange-500',
  economics:   'bg-rose-500',
  default:     'bg-brand-400',
}

function AssessmentRow({ assessment }) {
  const submissionCount = assessment.submissions?.[0]?.count ?? 0
  const questionCount   = assessment.questions?.[0]?.count   ?? 0
  const color = SUBJECT_COLORS[assessment.subject?.toLowerCase()] ?? SUBJECT_COLORS.default

  return (
    <Link
      href={`/dashboard/assessments/${assessment.id}`}
      className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-none hover:bg-surface transition-colors"
    >
      {/* Color dot */}
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{assessment.title}</p>
        <p className="text-xs text-ink-4 mt-0.5">
          {assessment.subject} · {assessment.class_level?.toUpperCase()} · {questionCount} questions
        </p>
      </div>

      {/* Submissions badge */}
      <Badge variant={submissionCount > 0 ? 'green' : 'grey'}>
        {submissionCount} response{submissionCount !== 1 ? 's' : ''}
      </Badge>

      {/* Arrow */}
      <span className="text-ink-4 text-sm">→</span>
    </Link>
  )
}

export default async function AssessmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: assessments } = await supabase
    .from('assessments')
    .select(`
      id, title, subject, class_level,
      topic, slug, created_at,
      submissions (count),
      questions (count)
    `)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  const list = assessments ?? []

  // Group by subject
  const grouped = list.reduce((acc, a) => {
    const key = a.subject ?? 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList size={22} className="text-brand-500" />
            <h1 className="font-display text-3xl font-bold text-ink">Assessments</h1>
          </div>
          <p className="text-ink-3 text-sm">
            {list.length} assessment{list.length !== 1 ? 's' : ''} created
          </p>
        </div>
        <Link
          href="/dashboard/assessments/new"
          className="inline-flex items-center gap-2 bg-amber text-ink text-sm font-bold px-5 py-2.5 rounded-xl hover:brightness-105 transition-all shadow-card"
        >
          <Plus size={15} />
          New Assessment
        </Link>
      </div>

      {/* Empty state */}
      {list.length === 0 && (
        <div className="bg-white border border-dashed border-border rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold text-ink mb-1">No assessments yet</p>
          <p className="text-sm text-ink-3 mb-4">
            Create your first assessment to get started
          </p>
          <Link
            href="/dashboard/assessments/new"
            className="inline-flex items-center gap-2 bg-brand-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors"
          >
            <Plus size={15} />
            Create Assessment
          </Link>
        </div>
      )}

      {/* Grouped by subject */}
      {Object.entries(grouped).map(([subject, items]) => (
        <div key={subject}>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-2 px-1">
            {subject}
          </p>
          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
            {items.map((a) => (
              <AssessmentRow key={a.id} assessment={a} />
            ))}
          </div>
        </div>
      ))}

    </div>
  )
}