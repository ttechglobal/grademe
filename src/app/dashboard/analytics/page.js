import { createClient } from '@/lib/supabase/server'
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts'
import { BarChart2 } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all submissions for teacher's assessments
  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id, score, total, completed_at,
      assessments!inner (
        id, title, subject, class_level, teacher_id
      )
    `)
    .eq('assessments.teacher_id', user.id)

  // Fetch assessments with question counts
  const { data: assessments } = await supabase
    .from('assessments')
    .select(`
      id, title, subject,
      questions (count),
      submissions (count)
    `)
    .eq('teacher_id', user.id)

  const subs        = submissions ?? []
  const totalSubs   = subs.length
  const scores      = subs.filter((s) => s.score !== null).map((s) => s.score)
  const classAvg    = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0
  const needSupport = scores.filter((s) => s < 50).length

  // Completion rate — submissions vs total possible
  const totalPossible = (assessments ?? []).reduce(
    (sum, a) => sum + (a.submissions?.[0]?.count ?? 0), 0
  )
  const completionRate = totalPossible > 0
    ? Math.round((totalSubs / totalPossible) * 100)
    : 0

  // Group by subject for bar chart
  const subjectMap = {}
  for (const sub of subs) {
    const subject = sub.assessments?.subject ?? 'Other'
    if (!subjectMap[subject]) subjectMap[subject] = []
    if (sub.score !== null) subjectMap[subject].push(sub.score)
  }
  const bySubject = Object.entries(subjectMap).map(([subject, sc]) => ({
    label: subject.charAt(0).toUpperCase() + subject.slice(1, 5),
    value: sc.length > 0
      ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length)
      : 0,
  }))

  // Score distribution
  const bands = [
    { label: '0–49%',   min: 0,  max: 49  },
    { label: '50–64%',  min: 50, max: 64  },
    { label: '65–74%',  min: 65, max: 74  },
    { label: '75–89%',  min: 75, max: 89  },
    { label: '90–100%', min: 90, max: 100 },
  ]
  const scoreDistribution = bands.map((b) => ({
    label: b.label,
    value: scores.filter((s) => s >= b.min && s <= b.max).length,
  }))

  // Top and bottom students
  const studentScores = {}
  for (const sub of subs) {
    const name = sub.student_name ?? 'Unknown'
    if (!studentScores[name]) {
      studentScores[name] = {
        name,
        class: sub.assessments?.class_level?.toUpperCase() ?? '—',
        scores: [],
      }
    }
    if (sub.score !== null) studentScores[name].scores.push(sub.score)
  }

  const studentAvgs = Object.values(studentScores)
    .filter((s) => s.scores.length > 0)
    .map((s) => ({
      name:  s.name,
      class: s.class,
      score: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length),
    }))
    .sort((a, b) => b.score - a.score)

  const topStudents    = studentAvgs.slice(0, 3)
  const bottomStudents = [...studentAvgs].sort((a, b) => a.score - b.score).slice(0, 3)

  // Fetch question difficulty for the most recent assessment
  const latestAssessment = (assessments ?? [])[0]
  let questionDifficulty = []

  if (latestAssessment) {
    const { data: questions } = await supabase
      .from('questions')
      .select('id, text, order_index')
      .eq('assessment_id', latestAssessment.id)
      .order('order_index')

    const { data: latestSubs } = await supabase
      .from('submissions')
      .select('answers')
      .eq('assessment_id', latestAssessment.id)

    const { data: questionsFull } = await supabase
      .from('questions')
      .select('id, text, answer, order_index')
      .eq('assessment_id', latestAssessment.id)
      .order('order_index')

    if (questionsFull && latestSubs) {
      questionDifficulty = questionsFull.map((q, i) => {
        const correct = latestSubs.filter((sub) => {
          const ans = sub.answers?.[i]
          return ans?.trim().toLowerCase() === q.answer.trim().toLowerCase()
        }).length
        const pct = latestSubs.length > 0
          ? Math.round((correct / latestSubs.length) * 100)
          : 0
        return {
          label: q.text.slice(0, 50) + (q.text.length > 50 ? '…' : ''),
          pct,
          count: latestSubs.length,
        }
      })
    }
  }

  const data = {
    totalSubmissions: totalSubs,
    classAverage:     classAvg,
    completionRate,
    needSupport,
    bySubject:        bySubject.length > 0 ? bySubject : [{ label: 'No data', value: 0 }],
    scoreDistribution,
    questionDifficulty,
    topStudents,
    bottomStudents,
    latestAssessmentTitle: latestAssessment?.title ?? '',
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={22} className="text-brand-500" />
          <h1 className="font-display text-3xl font-bold text-ink">
            Analytics
          </h1>
        </div>
        <p className="text-ink-3 text-sm">
          Understand how your students are performing across all assessments
        </p>
      </div>

      {totalSubs === 0 ? (
        <div className="bg-white border border-dashed border-border rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-semibold text-ink mb-1">No data yet</p>
          <p className="text-sm text-ink-3">
            Analytics will appear once students start completing assessments.
          </p>
        </div>
      ) : (
        <AnalyticsCharts data={data} />
      )}
    </div>
  )
}