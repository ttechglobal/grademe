'use server'

import { createClient } from '@/lib/supabase/server'

// ─── SUBMIT STUDENT ANSWERS ───────────────────
export async function submitAnswers({
  assessmentId,
  studentName,
  answers,
  questions,
}) {
  const supabase = await createClient()

  // Calculate score on the server — never trust the client
  let correct = 0
  questions.forEach((q, i) => {
    const studentAnswer = answers[i]
    if (!studentAnswer) return
    if (studentAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
      correct++
    }
  })

  const score = Math.round((correct / questions.length) * 100)

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      assessment_id: assessmentId,
      student_name:  studentName,
      answers,
      score,
      total: questions.length,
    })
    .select()
    .single()

  if (error) {
    console.error('Submit error:', error)
    return { error: error.message }
  }

  return { success: true, score, correct, total: questions.length, id: data.id }
}