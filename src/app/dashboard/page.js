import { createClient } from '@/lib/supabase/server'
import HeroBanner from '@/components/dashboard/HeroBanner'
import CurriculumBanner from '@/components/dashboard/CurriculumBanner'
import StatsRow from '@/components/dashboard/StatsRow'
import AssessmentCard from '@/components/dashboard/AssessmentCard'
import SubmissionsTable from '@/components/dashboard/SubmissionsTable'
import Link from 'next/link'

const SUBJECT_COLORS = {
  mathematics: 'green',
  english:     'blue',
  biology:     'amber',
  chemistry:   'amber',
  physics:     'blue',
  government:  'green',
  economics:   'purple',
  default:     'green',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Fetch assessments with submission counts
  const { data: assessments } = await supabase
    .from('assessments')
    .select(`
      id, title, subject, class_level,
      topic, slug, created_at,
      submissions (count)
    `)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6)

  // Fetch recent submissions
  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id, student_name, score, total,
      completed_at, assessment_id,
      assessments!inner (
        title, class_level, teacher_id
      )
    `)
    .eq('assessments.teacher_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(8)

  // Calculate stats
  const totalAssessments = assessments?.length ?? 0
  const totalResponses   = assessments?.reduce(
    (sum, a) => sum + (a.submissions?.[0]?.count ?? 0), 0
  ) ?? 0
  const scores = submissions?.filter((s) => s.score !== null).map((s) => s.score) ?? []
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  const stats = [
    { label: 'Assessments',     value: totalAssessments, change: 'Total created',      positive: true },
    { label: 'Total Responses', value: totalResponses,   change: 'Across all tests',   positive: true },
    { label: 'Class Average',   value: `${avgScore}%`,   change: 'All submissions',    positive: avgScore >= 50 },
  ]

  const submissionRows = (submissions ?? []).map((s) => ({
    student:    s.student_name,
    assessment: `${s.assessments?.title} — ${s.assessments?.class_level?.toUpperCase()}`,
    submittedAt: s.completed_at,
    score:       s.score,
  }))

  const name = profile?.full_name?.split(' ')[0] ?? 'Teacher'

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <HeroBanner name={name} />
      <CurriculumBanner curriculum={profile?.curriculum ?? 'uk'} />
      <StatsRow stats={stats} />

      {/* Assessments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-ink">
            Recent Assessments
          </h2>
          <Link
            href="/dashboard/assessments"
            className="text-sm font-semibold text-brand-500 hover:text-brand-400"
          >
            View all →
          </Link>
        </div>

        {assessments?.length === 0 ? (
          <div className="bg-white border border-dashed border-border rounded-2xl p-12 text-center">
            <p className="text-3xl mb-3">📋</p>
            <p className="font-semibold text-ink mb-1">No assessments yet</p>
            <p className="text-sm text-ink-3 mb-4">
              Create your first assessment to get started
            </p>
            <Link
              href="/dashboard/assessments/new"
              className="inline-flex items-center gap-2 bg-brand-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors"
            >
              + Create Assessment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(assessments ?? []).map((a) => (
              <AssessmentCard
                key={a.id}
                subject={a.subject}
                title={a.title}
                meta={`${a.class_level?.toUpperCase()} · ${a.submissions?.[0]?.count ?? 0} submissions`}
                submitted={a.submissions?.[0]?.count ?? 0}
                total={a.submissions?.[0]?.count ?? 0}
                color={SUBJECT_COLORS[a.subject] ?? SUBJECT_COLORS.default}
              />
            ))}
          </div>
        )}
      </div>

      {/* Submissions */}
      {submissionRows.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-ink">
              Recent Submissions
            </h2>
          </div>
          <SubmissionsTable submissions={submissionRows} />
        </div>
      )}
    </div>
  )
}