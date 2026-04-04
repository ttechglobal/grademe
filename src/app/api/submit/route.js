import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function POST(request) {
  try {
    const body = await request.json()
    const { assessmentId, studentName, answers, questions, questionMode } = body

    console.log('Submit API hit:', { assessmentId, studentName })

    if (!assessmentId || !studentName || !answers || !questions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing env vars:', {
        hasUrl:            !!supabaseUrl,
        hasServiceRoleKey: !!serviceRoleKey,
      })
      return NextResponse.json(
        { error: 'Server configuration error — missing environment variables' },
        { status: 500 }
      )
    }

    // Service role key bypasses RLS entirely
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken:  false,
        persistSession:    false,
      },
    })

    // Calculate score
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

    console.log('Inserting submission:', { assessmentId, studentName, score })

    const { data, error } = await supabase
      .from('submissions')
      .insert({
        assessment_id: assessmentId,
        student_name:  studentName,
        answers,
        score,
        total:         questions.length,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Insert error:', JSON.stringify(error))
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log('Submission saved:', data.id)

    return NextResponse.json({
      success: true,
      score,
      correct,
      total:   questions.length,
      id:      data.id,
    })

  } catch (err) {
    console.error('Route exception:', err)
    return NextResponse.json(
      { error: err.message || 'Unexpected server error' },
      { status: 500 }
    )
  }
}