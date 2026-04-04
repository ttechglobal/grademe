import { createClient } from '@/lib/supabase/server'
import AssessmentAnalytics from '@/components/dashboard/AssessmentAnalytics'
import { BarChart2 } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all assessments with questions
  const { data: assessments } = await supabase
    .from('assessments')
    .select(`
      id, title, subject, topic, class_level,
      questions (id, text, answer, order_index),
      submissions (id, student_name, score, total, completed_at, answers)
    `)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  const list = assessments ?? []

  // Flatten all submissions
  const allSubs = list.flatMap((a) =>
    (a.submissions ?? []).map((s) => ({ ...s, assessmentTitle: a.title, assessmentTopic: a.topic, subject: a.subject }))
  )

  const totalSubmissions = allSubs.length
  const scores           = allSubs.filter((s) => s.score !== null).map((s) => s.score)
  const classAverage     = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0
  const needSupport      = scores.filter((s) => s < 50).length
  const completionRate   = totalSubmissions > 0
    ? Math.round((scores.length / totalSubmissions) * 100)
    : 0

  // By subject
  const subjectMap = {}
  for (const sub of allSubs) {
    if (!sub.subject) continue
    if (!subjectMap[sub.subject]) subjectMap[sub.subject] = []
    if (sub.score !== null) subjectMap[sub.subject].push(sub.score)
  }
  const bySubject = Object.entries(subjectMap).map(([subject, sc]) => ({
    subject,
    avg: sc.length > 0 ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length) : 0,
  }))

  // Question difficulty across all assessments
  const questionDifficulty = []
  for (const assessment of list) {
    const questions = (assessment.questions ?? []).sort((a, b) => a.order_index - b.order_index)
    const subs      = assessment.submissions ?? []
    if (subs.length === 0) continue

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const correctCount = subs.filter((sub) => {
        const ans = sub.answers?.[i] ?? ''
        return ans.trim().toLowerCase() === q.answer?.trim().toLowerCase()
      }).length
      questionDifficulty.push({
        text:         q.text,
        correctCount,
        totalCount:   subs.length,
        assessment:   assessment.title,
      })
    }
  }

  // Per-student aggregation
  const studentMap = {}
  for (const sub of allSubs) {
    const name = sub.student_name
    if (!studentMap[name]) {
      studentMap[name] = {
        name,
        submissions:    0,
        totalScore:     0,
        scoreHistory:   [],
        topicScores:    {},
      }
    }
    studentMap[name].submissions++
    if (sub.score !== null) {
      studentMap[name].totalScore  += sub.score
      studentMap[name].scoreHistory.push(sub.score)
    }
    const topic = sub.assessmentTopic || sub.assessmentTitle
    if (topic && sub.score !== null) {
      if (!studentMap[name].topicScores[topic]) studentMap[name].topicScores[topic] = []
      studentMap[name].topicScores[topic].push(sub.score)
    }
  }

  const students = Object.values(studentMap).map((s) => {
    const avgScore = s.submissions > 0
      ? Math.round(s.totalScore / s.submissions)
      : 0

    const topicAvgs = Object.entries(s.topicScores).map(([topic, scores]) => ({
      topic,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }))

    const strongTopics = topicAvgs.filter((t) => t.score >= 70).sort((a, b) => b.score - a.score).slice(0, 3)
    const weakTopics   = topicAvgs.filter((t) => t.score < 60).sort((a, b) => a.score - b.score).slice(0, 3)

    return { ...s, avgScore, strongTopics, weakTopics }
  }).sort((a, b) => b.avgScore - a.avgScore)

  // Student → assessment breakdown map
  const studentAssessmentMap = {}
  for (const assessment of list) {
    for (const sub of assessment.submissions ?? []) {
      if (!studentAssessmentMap[sub.student_name]) studentAssessmentMap[sub.student_name] = []
      studentAssessmentMap[sub.student_name].push({
        title: assessment.title,
        topic: assessment.topic,
        score: sub.score ?? 0,
      })
    }
  }

  const topStudents    = [...students].sort((a, b) => b.avgScore - a.avgScore).slice(0, 3)
  const bottomStudents = students.filter((s) => s.avgScore < 50).slice(0, 3)

  const data = {
    totalSubmissions,
    classAverage,
    completionRate,
    needSupport,
    bySubject,
    questionDifficulty,
    students,
    topStudents,
    bottomStudents,
    submissions: allSubs,
    studentAssessmentMap,
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={22} className="text-brand-500" />
          <h1 className="font-display text-3xl font-bold text-ink">Analytics</h1>
        </div>
        <p className="text-ink-3 text-sm">
          Understand how your students are performing across all assessments
        </p>
      </div>

      {totalSubmissions === 0 ? (
        <div className="bg-white border border-dashed border-border rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-semibold text-ink mb-1">No data yet</p>
          <p className="text-sm text-ink-3">
            Analytics will appear once students start completing assessments.
          </p>
        </div>
      ) : (
        <AssessmentAnalytics data={data} />
      )}
    </div>
  )
}