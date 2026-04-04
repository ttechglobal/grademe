'use server'

import { createClient } from '@/lib/supabase/server'

function answersMatch(studentAnswer, correctAnswer) {
  if (!studentAnswer) return false

  const student = studentAnswer.trim().toLowerCase()
  const correct  = correctAnswer.trim().toLowerCase()

  if (student === correct) return true

  const clean = (s) => s.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
  if (clean(student) === clean(correct)) return true

  const numberWords = {
    zero: '0', one: '1', two: '2', three: '3', four: '4',
    five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  }
  const toNum = (s) => numberWords[s] ?? s
  if (toNum(student) === toNum(correct)) return true

  if (Math.abs(student.length - correct.length) <= 1) {
    let diff = 0
    const minLen = Math.min(student.length, correct.length)
    for (let i = 0; i < minLen; i++) {
      if (student[i] !== correct[i]) diff++
    }
    if (diff <= 1) return true
  }

  if (student.includes(correct) || correct.includes(student)) return true

  return false
}

export async function submitAnswers({
  assessmentId,
  studentName,
  answers,
  questions,
  questionMode = 'mcq',
}) {
  // Use a service-role-like approach — create client without auth
  const supabase = await createClient()

  let correct = 0
  questions.forEach((q, i) => {
    const studentAnswer = answers[i]
    if (!studentAnswer) return

    if (questionMode === 'fill' || q.type === 'fill') {
      if (answersMatch(studentAnswer, q.answer)) correct++
    } else {
      if (studentAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
        correct++
      }
    }
  })

  const score = Math.round((correct / questions.length) * 100)

  console.log('Submitting answers:', {
    assessmentId,
    studentName,
    score,
    total: questions.length,
    answers,
  })

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
    console.error('Submit error full:', JSON.stringify(error))
    return { error: error.message }
  }

  console.log('Submission saved successfully:', data.id)
  return {
    success: true,
    score,
    correct,
    total:   questions.length,
    id:      data.id,
  }
}