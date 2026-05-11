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
      difficulty      = ['medium'],
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

    // Fix 1: added 'calculation' and 'stepwise' to the allowed types
    const VALID_TYPES = ['mcq', 'true_false', 'calculation', 'stepwise']
    if (!VALID_TYPES.includes(questionType)) {
      return NextResponse.json({ error: 'Invalid questionType' }, { status: 400 })
    }

    const count = parseInt(numberOfQuestions, 10)
    if (isNaN(count) || count < 1 || count > 30) {
      return NextResponse.json({ error: 'numberOfQuestions must be 1–30' }, { status: 400 })
    }

    // Fix 2: difficulty can now be a string OR an array of strings
    const VALID_DIFFICULTIES = ['easy', 'medium', 'hard']
    const difficultyArr = Array.isArray(difficulty) ? difficulty : [difficulty]
    const invalidDiffs  = difficultyArr.filter((d) => !VALID_DIFFICULTIES.includes(d))
    if (invalidDiffs.length > 0) {
      return NextResponse.json({ error: `Invalid difficulty: ${invalidDiffs.join(', ')}` }, { status: 400 })
    }
    // Resolve to a single string for generationService (mix → 'mixed')
    const difficultyStr = difficultyArr.length === 1 ? difficultyArr[0] : 'mixed'
    // Also pass the full array so generationService can use it in the prompt
    const difficultyMix = difficultyArr

    // ── Generate ───────────────────────────────────────────────────────────
    // Fix 3: pass 'classLevel' and 'count' — the keys generationService destructures
    const result = await generateQuestions({
      tutorId:          user.id,
      questionType,
      subject,
      topic:            topic.slice(0, 300),
      classLevel:       gradeLevel,
      curriculum,
      difficulty:       difficultyStr,
      difficultyMix,
      count,
      additionalContext: additionalContext?.slice(0, 500),
      useCase,
      academicStyle,
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/generate/questions]', err.message)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}