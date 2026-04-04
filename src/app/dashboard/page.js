import { createClient } from '@/lib/supabase/server'
import HeroBanner from '@/components/dashboard/HeroBanner'
import StatsRow from '@/components/dashboard/StatsRow'
import CurriculumBanner from '@/components/dashboard/CurriculumBanner'
import LiveSubmissions from '@/components/dashboard/LiveSubmissions'
import LiveAssessmentStats from '@/components/dashboard/LiveAssessmentStats'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: assessments } = await supabase
    .from('assessments')
    .select('id')
    .eq('teacher_id', user.id)

  const assessmentIds = (assessments ?? []).map((a) => a.id)

  const { count: totalSubmissions } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .in('assessment_id', assessmentIds.length > 0 ? assessmentIds : ['none'])

  const { data: recentScores } = await supabase
    .from('submissions')
    .select('score')
    .in('assessment_id', assessmentIds.length > 0 ? assessmentIds : ['none'])
    .not('score', 'is', null)
    .limit(100)

  const scores   = (recentScores ?? []).map((s) => s.score)
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  const stats = [
    {
      label:    'Assessments',
      value:    assessments?.length ?? 0,
      change:   'Total created',
      positive: true,
    },
    {
      label:    'Total Responses',
      value:    totalSubmissions ?? 0,
      change:   'Across all tests',
      positive: true,
    },
    {
      label:    'Class Average',
      value:    `${avgScore}%`,
      change:   'All submissions',
      positive: avgScore >= 50,
    },
  ]

  const name           = profile?.full_name?.split(' ')[0] ?? 'Teacher'
  const hasAssessments = (assessments?.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">

      <CurriculumBanner />

      <HeroBanner name={name} />

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

        {!hasAssessments ? (
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
          <LiveAssessmentStats userId={user.id} />
        )}
      </div>

      {/* Submissions — live */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-ink">
            Recent Submissions
          </h2>
        </div>
        <LiveSubmissions userId={user.id} />
      </div>

    </div>
  )
}