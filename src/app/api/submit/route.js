import { NextResponse }                    from 'next/server'
import { createClient }                    from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS for the submission insert
// Students are unauthenticated so the anon client can fail RLS checks
function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { assessmentId, studentName, answers, timeTakenSecs, studentData } = body

    if (!assessmentId || !studentName?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch assessment
    const { data: assessment, error: aErr } = await supabase
      .from('assessments')
      .select('id, question_type, show_results, is_active')
      .eq('id', assessmentId)
      .single()

    if (aErr || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    if (!assessment.is_active) {
      return NextResponse.json({ error: 'This assessment is no longer active' }, { status: 403 })
    }

    // Fetch questions for scoring
    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('id, question_type, type, answer, options, answer_template')
      .eq('assessment_id', assessmentId)
      .order('order_index')

    if (qErr || !questions?.length) {
      console.error('[submit] questions fetch error:', qErr?.message)
      return NextResponse.json({ error: 'No questions found' }, { status: 404 })
    }

    // Score answers
    let correctCount = 0
    const scoredAnswers = {}

    for (const q of questions) {
      const qType = q.question_type || q.type || assessment.question_type || 'mcq'
      const sa    = answers?.[q.id]
      scoredAnswers[q.id] = sa || ''

      if (qType === 'true_false' || qType === 'truefalse') {
        const correct = /^true/i.test(q.answer || '') ? 'true' : 'false'
        const student  = /^true/i.test(String(sa || '')) ? 'true' : 'false'
        if (correct === student && sa) correctCount++
      } else {
        // MCQ
        const correct = (q.answer || '').trim().toUpperCase().charAt(0)
        const student  = String(sa || '').trim().toUpperCase().charAt(0)
        if (correct && correct === student) correctCount++
      }
    }

    const score = questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0

    // Insert — using exact column names from schema
    const insertRow = {
      assessment_id: assessmentId,
      student_name:  studentName.trim(),
      answers:       scoredAnswers,
      score,
      total:         questions.length,
      completed_at:  new Date().toISOString(),
    }

    if (timeTakenSecs > 0) insertRow.time_taken_secs = timeTakenSecs
    if (studentData && Object.keys(studentData).length > 0) insertRow.student_data = studentData

    // Use service role for insert — student has no session (anon client can fail RLS)
    const admin = adminClient()
    const { data: sub, error: subErr } = await admin
      .from('submissions')
      .insert(insertRow)
      .select('id, score, total')
      .single()

    if (subErr) {
      console.error('[submit] insert error:', subErr.message, '| hint:', subErr.hint, '| detail:', subErr.details)
      return NextResponse.json({ error: 'Failed to save submission', detail: subErr.message }, { status: 500 })
    }

    // Fetch full questions for results display
    const { data: fullQ } = await supabase
      .from('questions')
      .select('id, text, question_text, question_type, type, options, answer, explanation, hint, order_index')
      .eq('assessment_id', assessmentId)
      .order('order_index')

    return NextResponse.json({
      success:        true,
      submissionId:   sub.id,
      score:          sub.score,
      totalQuestions: sub.total,
      correctCount,
      showResults:    true,
      questions:      fullQ ?? [],
      answers:        scoredAnswers,
    })

  } catch (err) {
    console.error('[submit] unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error', detail: err.message }, { status: 500 })
  }
}