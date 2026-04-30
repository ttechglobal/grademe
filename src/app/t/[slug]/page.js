import { createClient }    from '@/lib/supabase/server'
import StudentAssessment   from '@/components/student/StudentAssessment'
import PreviewMode         from '@/components/student/PreviewMode'

/**
 * /t/[slug] — student assessment page
 *
 * ?preview=1  → renders PreviewMode (teacher view, answers revealed, nothing recorded)
 * normal      → renders StudentAssessment (student view, submits to DB)
 */
export default async function StudentTestPage({ params, searchParams }) {
  const { slug }  = await params
  const sp        = await searchParams
  const isPreview = sp?.preview === '1'

  const supabase = await createClient()

  const { data: assessment, error } = await supabase
    .from('assessments')
    .select(`
      *,
      questions (
        id, type, question_type, text, options, answer, hint, explanation, order_index
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !assessment) {
    return <UnavailableScreen message="This assessment link is invalid or has been removed." />
  }

  if (!isPreview && assessment.is_active === false) {
    return <UnavailableScreen message="This assessment is no longer available. Contact your tutor." />
  }

  // Sort questions by order_index
  assessment.questions = [...(assessment.questions ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  )

  // Defensively normalise question_type on every question.
  // Older rows may have type='truefalse' but question_type='mcq' (default from migration).
  // The DB default filled 'mcq' for pre-migration T/F rows — fix that here.
  assessment.questions = assessment.questions.map((q) => ({
    ...q,
    question_type:
      q.type === 'truefalse' || q.type === 'true_false'
        ? 'true_false'
        : q.question_type ?? 'mcq',
  }))

  // Preview mode — show answers, explanations, no submission
  if (isPreview) {
    return <PreviewMode assessment={assessment} />
  }

  // Student mode — normal assessment flow
  return <StudentAssessment assessment={assessment} />
}

function UnavailableScreen({ message }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="font-display text-2xl font-bold text-ink mb-3">Unavailable</h1>
        <p className="text-sm text-ink-3 leading-relaxed">{message}</p>
      </div>
    </div>
  )
}