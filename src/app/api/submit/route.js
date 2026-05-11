// src/app/api/submit/route.js
import { createClient } from '@/lib/supabase/server'
import { NextResponse }  from 'next/server'

// ─── SCORING HELPERS ──────────────────────────────────────────────────────────

function scoreMCQ(question, studentAnswer) {
  if (!studentAnswer) return false
  const correct = (question.answer || '').trim().toUpperCase()[0]
  const student  = String(studentAnswer).trim().toUpperCase()[0]
  return correct === student
}

function scoreTrueFalse(question, studentAnswer) {
  if (!studentAnswer) return false
  const correct = /^true/i.test(question.answer || '') ? 'true' : 'false'
  const student  = /^true/i.test(String(studentAnswer)) ? 'true' : 'false'
  return correct === student
}

function scoreCalculation(question, studentBoxValues) {
  const template = question.answer_template
  if (!template || !template.structure?.length) {
    return { correct: false, boxResults: {} }
  }
  const boxResults = {}
  let allCorrect   = true
  for (const item of template.structure) {
    const studentVal   = (studentBoxValues?.[item.id] || '').trim().toLowerCase()
    const accepted     = (item.accepted || [item.answer]).map((a) => String(a).trim().toLowerCase())
    const isBoxCorrect = accepted.includes(studentVal)
    boxResults[item.id] = isBoxCorrect ? 'correct' : 'wrong'
    if (!isBoxCorrect) allCorrect = false
  }
  return { correct: allCorrect, boxResults }
}

function scoreStepwise(question, studentFilled) {
  const steps  = question.steps ?? []
  const blanks = steps.filter((s) => s.is_blank)
  if (!blanks.length) return false
  const filled = (typeof studentFilled === 'object' && studentFilled !== null) ? studentFilled : {}
  return blanks.every((s) => {
    const sv = (filled[s.id] ?? '').trim().toLowerCase()
    return sv === (s.answer ?? '').trim().toLowerCase()
  })
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      assessmentId,
      studentName,
      studentData,
      answers,       // { [questionId]: string | { [boxId]: string } | { [stepId]: string } }
      sessionKey,
      timeTakenSecs,
    } = body

    if (!assessmentId || !studentName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // ── Fetch assessment ───────────────────────────────────────────────────
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, question_type, show_results, is_active')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    if (!assessment.is_active) {
      return NextResponse.json({ error: 'This assessment is no longer active' }, { status: 403 })
    }

    // ── Fetch questions ────────────────────────────────────────────────────
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, type, question_type, answer, options, answer_template, steps')
      .eq('assessment_id', assessmentId)
      .order('order_index')

    if (questionsError || !questions?.length) {
      console.error('[submit] Questions fetch error:', questionsError)
      return NextResponse.json({ error: 'No questions found' }, { status: 404 })
    }

    // ── Server-side scoring ────────────────────────────────────────────────
    let correctCount         = 0
    const scoredAnswers      = {}
    const calculationResults = {}

    for (const question of questions) {
      const qType         = question.question_type || question.type || assessment.question_type || 'mcq'
      const studentAnswer = answers?.[question.id]

      if (qType === 'calculation') {
        const boxValues = (typeof studentAnswer === 'object' && studentAnswer !== null)
          ? studentAnswer : {}
        const { correct, boxResults } = scoreCalculation(question, boxValues)
        if (correct) correctCount++
        scoredAnswers[question.id]      = boxValues
        calculationResults[question.id] = boxResults

      } else if (qType === 'true_false' || qType === 'truefalse') {
        const isCorrect = scoreTrueFalse(question, studentAnswer)
        if (isCorrect) correctCount++
        scoredAnswers[question.id] = studentAnswer || ''

      } else if (qType === 'stepwise') {
        const filled = (typeof studentAnswer === 'object' && studentAnswer !== null)
          ? studentAnswer : {}
        const isCorrect = scoreStepwise(question, filled)
        if (isCorrect) correctCount++
        scoredAnswers[question.id] = filled

      } else {
        // MCQ (default)
        const isCorrect = scoreMCQ(question, studentAnswer)
        if (isCorrect) correctCount++
        scoredAnswers[question.id] = studentAnswer || ''
      }
    }

    const totalQuestions = questions.length
    const score          = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0

    // ── Insert submission ──────────────────────────────────────────────────
    const insertPayload = {
      assessment_id: assessmentId,
      student_name:  studentName,
      answers:       scoredAnswers,
      score,
      total:         totalQuestions,
      completed_at:  new Date().toISOString(),
    }

    if (studentData && typeof studentData === 'object') {
      insertPayload.student_data = studentData
    }

    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert(insertPayload)
      .select('id, score, total')
      .single()

    if (submissionError) {
      console.error('[submit] Insert error:', submissionError.message)
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
    }

    // ── Build results payload ──────────────────────────────────────────────
    if (!assessment.show_results) {
      return NextResponse.json({
        success:        true,
        submissionId:   submission.id,
        score:          submission.score,
        totalQuestions: submission.total,
        correctCount,
        showResults:    false,
      })
    }

    // Fetch full questions for results display — only columns that exist
    const { data: fullQuestions } = await supabase
      .from('questions')
      .select('id, type, question_type, text, options, answer, explanation, hint, answer_template, steps, word_bank, order_index')
      .eq('assessment_id', assessmentId)
      .order('order_index')

    return NextResponse.json({
      success:            true,
      submissionId:       submission.id,
      score:              submission.score,
      totalQuestions:     submission.total,
      correctCount,
      showResults:        true,
      questions:          fullQuestions || [],
      answers:            scoredAnswers,
      calculationResults,
    })

  } catch (err) {
    console.error('[submit] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}