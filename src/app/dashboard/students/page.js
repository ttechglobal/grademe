import { createClient } from '@/lib/supabase/server'
import StudentsList from '@/components/dashboard/StudentsList'
import { Users } from 'lucide-react'

export default async function StudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get all submissions for this teacher's assessments
  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id,
      student_name,
      score,
      total,
      completed_at,
      assessment_id,
      assessments!inner (
        id,
        title,
        class_level,
        subject,
        teacher_id
      )
    `)
    .eq('assessments.teacher_id', user.id)
    .order('completed_at', { ascending: false })

  // Group by student name to build student profiles
  const studentMap = {}
  for (const sub of submissions ?? []) {
    const name = sub.student_name
    if (!studentMap[name]) {
      studentMap[name] = {
        id:             name,
        name,
        class:          sub.assessments?.class_level?.toUpperCase() ?? '—',
        testsCompleted: 0,
        totalScore:     0,
        lastActive:     sub.completed_at,
        submissions:    [],
      }
    }
    studentMap[name].testsCompleted++
    studentMap[name].totalScore += sub.score ?? 0
    studentMap[name].submissions.push({
      assessment: sub.assessments?.title ?? '—',
      score:      sub.score ?? 0,
      date:       new Date(sub.completed_at).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      }),
    })
  }

  const students = Object.values(studentMap).map((s) => ({
    ...s,
    avgScore: s.testsCompleted > 0
      ? Math.round(s.totalScore / s.testsCompleted)
      : 0,
    lastActive: new Date(s.lastActive).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    }),
  }))

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={22} className="text-brand-500" />
            <h1 className="font-display text-3xl font-bold text-ink">
              Students
            </h1>
          </div>
          <p className="text-ink-3 text-sm">
            Track every student&apos;s progress across all assessments
          </p>
        </div>
        <div className="bg-white border border-border rounded-2xl px-5 py-3 text-center shadow-card">
          <p className="font-display text-2xl font-bold text-brand-700">
            {students.length}
          </p>
          <p className="text-xs text-ink-4">Total Students</p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white border border-dashed border-border rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="font-semibold text-ink mb-1">No students yet</p>
          <p className="text-sm text-ink-3">
            Students will appear here once they complete an assessment.
          </p>
        </div>
      ) : (
        <StudentsList students={students} />
      )}
    </div>
  )
}