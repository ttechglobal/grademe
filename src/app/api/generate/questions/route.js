import { NextResponse }           from 'next/server'
import { createClient }           from '@/lib/supabase/server'
import { generateQuestions }      from '@/lib/generationService'

export async function POST(request) {
  try {
    // ── Auth ───────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Input validation ───────────────────────────────────────────────────
    const body = await request.json()
    const {
      questionType,
      subject,
      topic,
      gradeLevel,
      curriculum,
      difficulty      = 'medium',
      numberOfQuestions,
      additionalContext,
      useCase         = 'k12_tutor',
      academicStyle   = 'standard',
    } = body

    if (!questionType || !subject || !topic || !gradeLevel || !numberOfQuestions) {
      return NextResponse.json(
        { error: 'Missing required fields: questionType, subject, topic, gradeLevel, numberOfQuestions' },
        { status: 400 }
      )
    }

    // Fix 1: 'calculation' is a valid type
    if (!['mcq', 'true_false', 'calculation'].includes(questionType)) {
      return NextResponse.json({ error: 'Invalid questionType' }, { status: 400 })
    }

    const count = parseInt(numberOfQuestions, 10)
    if (isNaN(count) || count < 1 || count > 30) {
      return NextResponse.json({ error: 'numberOfQuestions must be 1–30' }, { status: 400 })
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
    }

    // ── Generate ───────────────────────────────────────────────────────────
    // Fix 2: pass 'classLevel' and 'count' — the keys generationService destructures
    const result = await generateQuestions({
      tutorId:           user.id,
      questionType,
      subject,
      topic:             topic.slice(0, 300),
      classLevel:        gradeLevel,
      curriculum,
      difficulty,
      count,
      additionalContext: additionalContext?.slice(0, 500),
      useCase,
      academicStyle,
    })

    // result already has the right shape: { success, questions, error?, creditsUsed? }
    return NextResponse.json(result)

  } catch (err) {
    console.error('[/api/generate/questions]', err.message)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}