// src/app/api/submit/route.js
import { NextResponse }  from 'next/server'
import { createClient }  from '@/lib/supabase/server'

// ── Scoring helpers ────────────────────────────────────────────────────────

function scoreMCQ(question, studentAnswer) {
  if (!studentAnswer) return false
  const correct = (question.correct_answer || question.answer || '').trim().toUpperCase()
  const student  = String(studentAnswer).trim().toUpperCase()
  return correct.charAt(0) === student.charAt(0)
}

function scoreTrueFalse(question, studentAnswer) {
  if (!studentAnswer) return false
  const correct = /^true/i.test(question.correct_answer || question.answer || '') ? 'true' : 'false'
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

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      assessmentId,
      studentName,
      studentData,
      answers,        // { [questionId]: string | { [boxId]: string } }
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
      .select('id, question_type, type, correct_answer, answer, options, answer_template')
      .eq('assessment_id', assessmentId)
      .order('order_index')

    if (questionsError || !questions?.length) {
      console.error('[submit] Questions fetch error:', questionsError)
      return NextResponse.json({ error: 'No questions found for this assessment' }, { status: 404 })
    }

    // ── Server-side scoring ────────────────────────────────────────────────
    let correctCount         = 0
    const scoredAnswers      = {}
    const calculationResults = {}

    for (const question of questions) {
      // Resolve type — handle both column names and values
      const qType         = question.question_type || question.type || assessment.question_type || 'mcq'
      const studentAnswer = answers?.[question.id]

      if (qType === 'calculation') {
        const boxValues = (typeof studentAnswer === 'object' && studentAnswer !== null) ? studentAnswer : {}
        const { correct, boxResults } = scoreCalculation(question, boxValues)
        if (correct) correctCount++
        scoredAnswers[question.id]      = boxValues
        calculationResults[question.id] = boxResults
      } else if (qType === 'true_false' || qType === 'truefalse') {
        const isCorrect = scoreTrueFalse(question, studentAnswer)
        if (isCorrect) correctCount++
        scoredAnswers[question.id] = studentAnswer || ''
      } else {
        // MCQ default
        const isCorrect = scoreMCQ(question, studentAnswer)
        if (isCorrect) correctCount++
        scoredAnswers[question.id] = studentAnswer || ''
      }
    }

    const totalQuestions = questions.length
    const score          = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100 * 10) / 10
      : 0

    // ── Build insert payload — only use columns that definitely exist ───────
    // Do NOT include ip_address — it may not exist in all deployments
    const insertPayload = {
      assessment_id: assessmentId,
      student_name:  studentName,
      answers:       scoredAnswers,
      score,
      total_questions: totalQuestions,
      completed_at:    new Date().toISOString(),
    }

    // Only add optional fields if they have values
    if (studentData && typeof studentData === 'object' && Object.keys(studentData).length > 0) {
      insertPayload.student_data = studentData
    }
    if (typeof timeTakenSecs === 'number' && timeTakenSecs > 0) {
      insertPayload.time_taken_secs = timeTakenSecs
    }

    // ── Insert submission ──────────────────────────────────────────────────
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert(insertPayload)
      .select('id, score, total_questions')
      .single()

    if (submissionError) {
      console.error('[submit] Insert error:', submissionError.message, submissionError.details)
      return NextResponse.json(
        { error: 'Failed to save submission', detail: submissionError.message },
        { status: 500 }
      )
    }

    // ── Build results payload ──────────────────────────────────────────────
    if (!assessment.show_results) {
      return NextResponse.json({
        success:        true,
        submissionId:   submission.id,
        score:          submission.score,
        totalQuestions: submission.total_questions,
        correctCount,
        showResults:    false,
      })
    }

    // Fetch full questions for results display
    const { data: fullQuestions } = await supabase
      .from('questions')
      .select('id, text, question_text, question_type, type, options, correct_answer, answer, explanation, hint, answer_template, order_index')
      .eq('assessment_id', assessmentId)
      .order('order_index')

    return NextResponse.json({
      success:            true,
      submissionId:       submission.id,
      score:              submission.score,
      totalQuestions:     submission.total_questions,
      correctCount,
      showResults:        true,
      questions:          fullQuestions ?? [],
      answers:            scoredAnswers,
      calculationResults,
    })

  } catch (err) {
    console.error('[submit] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}