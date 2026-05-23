// src/app/api/submit/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── Scoring helpers ────────────────────────────────────────────────────────
function scoreMCQ(question, studentAnswer) {
  if (!studentAnswer) return false
  const correct = (question.correct_answer || question.answer || '').trim().toUpperCase().charAt(0)
  const student  = String(studentAnswer).trim().toUpperCase().charAt(0)
  return correct === student && correct !== ''
}

function scoreTrueFalse(question, studentAnswer) {
  if (!studentAnswer) return false
  const correct = /^true/i.test(question.correct_answer || question.answer || '') ? 'true' : 'false'
  const student  = /^true/i.test(String(studentAnswer)) ? 'true' : 'false'
  return correct === student
}

function scoreCalculation(question, studentBoxValues) {
  const template = question.answer_template
  if (!template?.structure?.length) return { correct: false, boxResults: {} }
  const boxResults = {}
  let allCorrect   = true
  for (const item of template.structure) {
    const sv  = (studentBoxValues?.[item.id] || '').trim().toLowerCase()
    const acc = (item.accepted || [item.answer]).map((a) => String(a).trim().toLowerCase())
    const ok  = acc.includes(sv)
    boxResults[item.id] = ok ? 'correct' : 'wrong'
    if (!ok) allCorrect = false
  }
  return { correct: allCorrect, boxResults }
}

// ── POST handler ───────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json()
    const { assessmentId, studentName, studentData, answers, timeTakenSecs } = body

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

    // Fetch questions
    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('id, question_type, type, correct_answer, answer, options, answer_template')
      .eq('assessment_id', assessmentId)
      .order('order_index')

    if (qErr || !questions?.length) {
      console.error('[submit] questions fetch:', qErr?.message)
      return NextResponse.json({ error: 'No questions found' }, { status: 404 })
    }

    // Score
    let correctCount = 0
    const scoredAnswers      = {}
    const calculationResults = {}

    for (const q of questions) {
      const qType = q.question_type || q.type || assessment.question_type || 'mcq'
      const sa    = answers?.[q.id]

      if (qType === 'calculation') {
        const boxes = (typeof sa === 'object' && sa !== null) ? sa : {}
        const { correct, boxResults } = scoreCalculation(q, boxes)
        if (correct) correctCount++
        scoredAnswers[q.id]      = boxes
        calculationResults[q.id] = boxResults
      } else if (qType === 'true_false' || qType === 'truefalse') {
        if (scoreTrueFalse(q, sa)) correctCount++
        scoredAnswers[q.id] = sa || ''
      } else {
        if (scoreMCQ(q, sa)) correctCount++
        scoredAnswers[q.id] = sa || ''
      }
    }

    const score = questions.length > 0
      ? Math.round((correctCount / questions.length) * 100 * 10) / 10
      : 0

    // Build insert — ONLY columns that always exist, no ip_address
    const insertRow = {
      assessment_id:   assessmentId,
      student_name:    studentName.trim(),
      answers:         scoredAnswers,
      score,
      total_questions: questions.length,
      completed_at:    new Date().toISOString(),
    }
    // Only add optional fields if they have values
    if (studentData && Object.keys(studentData).length > 0) insertRow.student_data = studentData
    if (typeof timeTakenSecs === 'number' && timeTakenSecs > 0) insertRow.time_taken_secs = timeTakenSecs

    const { data: sub, error: subErr } = await supabase
      .from('submissions')
      .insert(insertRow)
      .select('id, score, total_questions')
      .single()

    if (subErr) {
      console.error('[submit] insert error:', subErr.message, subErr.details, subErr.hint)
      return NextResponse.json(
        { error: 'Failed to save submission', detail: subErr.message },
        { status: 500 }
      )
    }

    // If show_results is off, just confirm success
    if (!assessment.show_results) {
      return NextResponse.json({
        success: true, submissionId: sub.id,
        score: sub.score, totalQuestions: sub.total_questions, correctCount,
        showResults: false,
      })
    }

    // Fetch full questions for result display
    const { data: fullQ } = await supabase
      .from('questions')
      .select('id, text, question_text, question_type, type, options, correct_answer, answer, explanation, hint, answer_template, order_index')
      .eq('assessment_id', assessmentId)
      .order('order_index')

    return NextResponse.json({
      success: true, submissionId: sub.id,
      score: sub.score, totalQuestions: sub.total_questions, correctCount,
      showResults: true,
      questions:   fullQ ?? [],
      answers:     scoredAnswers,
      calculationResults,
    })

  } catch (err) {
    console.error('[submit] unexpected:', err)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}