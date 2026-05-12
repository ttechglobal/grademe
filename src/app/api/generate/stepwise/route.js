// src/app/api/generate/stepwise/route.js
// NEW: Stepwise feature — does not affect existing MCQ functionality

import { NextResponse }       from 'next/server'
import { createClient }       from '@/lib/supabase/server'
import { validateCredits, deductCredits } from '@/lib/creditService'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent'
const STEPWISE_CREDIT_COST = 1

const STEM_SUBJECTS = [
  'math', 'maths', 'mathematics', 'further mathematics', 'additional mathematics',
  'physics', 'chemistry', 'biology', 'statistics', 'computer science',
  'accounting', 'economics', 'engineering',
]
function isStem(subject = '') {
  const s = subject.toLowerCase()
  return STEM_SUBJECTS.some((stem) => s.includes(stem))
}

// ── Blank count by difficulty ─────────────────────────────────────────────
const BLANK_COUNT = {
  easy:   { min: 1, max: 2 },
  medium: { min: 2, max: 3 },
  hard:   { min: 3, max: 5 },
}

function buildStepwisePrompt({ topic, subject, classLevel, difficulty, curriculum, useCase }) {
  const stem       = isStem(subject)
  const blankRange = BLANK_COUNT[difficulty] ?? BLANK_COUNT.medium
  const diffDesc   = {
    easy:   'Remove only the most critical 1–2 values — make it achievable for weaker students',
    medium: 'Remove 2–3 key values spread across the steps',
    hard:   'Remove 3–5 values including formula variables — students must reconstruct most of the working',
  }[difficulty] || 'Remove 2–3 key values'

  const blankInstructions = stem
    ? `
BLANK SELECTION RULES — STEM SUBJECT (${subject}):

This is a MATHEMATICS or SCIENCE question. You MUST follow these blank selection rules exactly.

ALLOWED blanks (ONLY these):
- Specific numbers and values: e.g. 250, 3.5, 437.5, 0.5, 2.4
- Formula variables when used in context: e.g. v, d, t, x, y, F, m, a
- Units that are the answer to what something IS: e.g. "metres", "m/s", "kg"
- Final calculated results

FORBIDDEN blanks (NEVER these):
- Conjunctions: "and", "the", "we", "is", "are", "be", "to"
- Explanatory words: "calculate", "find", "using", "this", "because", "where", "so"
- Step labels: anything like "Step 1", "Step 2", "Therefore", "Thus", "Hence"
- Prepositions: "of", "in", "at", "by", "for", "with", "from"
- Any word that is not a number, variable, unit, or formula element

CORRECT EXAMPLE:
Step text: "d = (250 × 3.5) ÷ 2 = 437.5 metres"
Good blanks on: 250, 3.5, 437.5
Bad blanks on: "metres" as a word, "÷", "="

WRONG EXAMPLE (DO NOT DO THIS):
Step text: "We use the formula to find the distance"
Bad blank: "formula" (too vague) or "distance" (label) or "We" or "the"

Difficulty: ${diffDesc}
Blank count: ${blankRange.min}–${blankRange.max} blanks total across all steps
`
    : `
BLANK SELECTION RULES — HUMANITIES/CONCEPT SUBJECT (${subject}):

ALLOWED blanks (ONLY these):
- Key vocabulary terms specific to the topic
- Names of people, places, events, concepts, theories
- Specific dates or factual values
- Technical terms the student must know

FORBIDDEN blanks (NEVER these):
- Articles: "the", "a", "an"
- Common verbs: "is", "are", "was", "were", "be", "have", "do"
- Prepositions: "of", "in", "at", "by", "for", "with", "to"
- Generic words that could mean anything in context

Difficulty: ${diffDesc}
Blank count: ${blankRange.min}–${blankRange.max} blanks total
`

  const profileBlock = useCase === 'university'
    ? `Target audience: University / higher education students. Maintain academic rigour.`
    : `Target audience: School students${classLevel ? ` — ${classLevel}` : ''}. ${curriculum ? `Curriculum: ${curriculum}.` : ''} Use clear, grade-appropriate language.`

  const stemStructure = stem
    ? `For this STEM topic, structure steps as:
       Step 1: What are we finding? (one sentence)
       Step 2: The formula or rule (write it out clearly)
       Step 3: Known values listed (one per line)
       Step 4: Substitution and calculation (show full working)
       Step 5: Final answer with units
       
       Each step must contain the actual mathematics — not just descriptions.`
    : `For this concept/humanities topic, structure steps as cause → mechanism → effect, or premise → evidence → conclusion. Each step must be a complete, specific, factual statement.`

  return `You are an expert educational content creator for ${useCase === 'university' ? 'university-level' : 'school-level'} students.
${profileBlock}

Generate ONE stepwise question about: "${topic}" in ${subject}.

${stemStructure}

${blankInstructions}

WORD BANK RULES:
- word_bank must contain ALL correct answers (the blanked values) PLUS 2–3 plausible wrong options
- Wrong options must be similar in type: if blanks are numbers, add plausible wrong numbers
- Shuffle the word bank — do not put correct answers first
- Total word bank size: ${blankRange.min + blankRange.max + 2}–${blankRange.max * 2 + 3} words

EXPLANATION RULES:
- explain_correct: 1–2 sentences explaining WHY this answer is right (reinforce understanding)
- explain_wrong: 1–2 sentences correcting the likely misconception
- Only fill these for steps where is_blank is true

QUALITY RULES:
- question_text must be a clear, well-posed question — not just a topic title
- All mathematical expressions must use proper notation
- Every blank must have a single, unambiguous correct answer
- The word bank must make it possible to answer correctly if the student understands the topic

Respond ONLY with valid JSON — no markdown, no backticks, no extra text:

{
  "question_text": "Clear question asking the student to solve or explain something",
  "subject": "${subject}",
  "difficulty": "${difficulty}",
  "steps": [
    {
      "id": "step_1",
      "text": "Step text with ___ where exactly one blank is — or full step if no blank",
      "is_blank": true,
      "answer": "exact correct word/value that fills the blank",
      "explain_correct": "why this is the right answer",
      "explain_wrong": "what the student likely misunderstood"
    },
    {
      "id": "step_2",
      "text": "Full step text with no blank",
      "is_blank": false,
      "answer": null,
      "explain_correct": null,
      "explain_wrong": null
    }
  ],
  "word_bank": ["correct1", "correct2", "decoy1", "decoy2", "decoy3"]
}`
}

function parseStepwiseResponse(rawText) {
  let cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim()

  const start = cleaned.indexOf('{')
  const end   = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found')
  cleaned = cleaned.slice(start, end + 1)

  const parsed = JSON.parse(cleaned)

  if (!parsed.question_text || typeof parsed.question_text !== 'string')
    throw new Error('Missing question_text')
  if (!Array.isArray(parsed.steps) || parsed.steps.length < 2)
    throw new Error('steps must be an array with at least 2 items')
  if (!Array.isArray(parsed.word_bank) || parsed.word_bank.length < 2)
    throw new Error('word_bank must have at least 2 items')

  const steps = parsed.steps.map((s, i) => {
    if (!s.id) s.id = `step_${i + 1}`
    if (!s.text) throw new Error(`Step ${i + 1} missing text`)
    return {
      id:              String(s.id),
      text:            String(s.text).trim(),
      is_blank:        Boolean(s.is_blank),
      answer:          s.answer          ? String(s.answer).trim()          : null,
      explain_correct: s.explain_correct ? String(s.explain_correct).trim() : null,
      explain_wrong:   s.explain_wrong   ? String(s.explain_wrong).trim()   : null,
    }
  })

  for (const step of steps) {
    if (step.is_blank && !step.answer)
      throw new Error(`Step ${step.id} is marked as blank but has no answer`)
  }

  // Ensure all correct answers are in word bank
  const correctAnswers = steps.filter((s) => s.is_blank).map((s) => s.answer)
  const wordBank = [...new Set([...parsed.word_bank.map(String), ...correctAnswers])]

  return {
    question_text:  parsed.question_text.trim(),
    question_type:  'stepwise',
    type:           'stepwise',
    text:           parsed.question_text.trim(),
    subject:        parsed.subject || '',
    difficulty:     parsed.difficulty || 'medium',
    steps,
    word_bank:      wordBank,
    options:        [],
    answer:         '',
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { topic, subject, classLevel, difficulty = 'medium', curriculum, useCase = 'k12_tutor' } = body

    if (!topic?.trim()) return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    if (!['easy', 'medium', 'hard'].includes(difficulty))
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })

    // Credit validation
    const validation = await validateCredits(user.id, STEPWISE_CREDIT_COST)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please top up to generate stepwise questions.' },
        { status: 402 }
      )
    }

    // Mock mode
    if (!process.env.GEMINI_API_KEY) {
      const mock = {
        question_text:  `[MOCK] What is the distance to a cliff if an echo returns after 3.5 seconds? (Speed of sound = 250 m/s)`,
        question_type:  'stepwise',
        type:           'stepwise',
        text:           `[MOCK] What is the distance to a cliff if an echo returns after 3.5 seconds?`,
        subject:        subject || 'Physics',
        difficulty,
        steps: [
          { id: 'step_1', text: 'We need to find the distance to the cliff (d).', is_blank: false, answer: null, explain_correct: null, explain_wrong: null },
          { id: 'step_2', text: 'Formula: d = (v × t) ÷ 2  [divide by 2 because sound travels there AND back]', is_blank: false, answer: null, explain_correct: null, explain_wrong: null },
          { id: 'step_3', text: 'd = (___ × 3.5) ÷ 2', is_blank: true, answer: '250', explain_correct: 'The speed of sound is 250 m/s as given in the question.', explain_wrong: 'The speed of sound is given in the question as 250 m/s — do not confuse it with the time (3.5 s).' },
          { id: 'step_4', text: 'd = 875 ÷ 2 = ___ metres', is_blank: true, answer: '437.5', explain_correct: '875 ÷ 2 = 437.5 — we divide by 2 because the echo is a return journey.', explain_wrong: 'Do not forget to divide by 2. The sound travels to the cliff AND back, so the one-way distance is half the total.' },
        ],
        word_bank: ['250', '437.5', '875', '125', '350'],
        options:   [],
        answer:    '',
      }
      return NextResponse.json({ success: true, question: mock, creditsUsed: STEPWISE_CREDIT_COST })
    }

    const prompt = buildStepwisePrompt({ topic: topic.trim(), subject, classLevel, difficulty, curriculum, useCase })

    let rawText = ''
    try {
      const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, topK: 40, topP: 0.95, maxOutputTokens: 4096 },
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        const status  = errData?.error?.status || ''
        if (status === 'RESOURCE_EXHAUSTED') return NextResponse.json({ error: 'Generation limit reached. Try again in a moment.' }, { status: 503 })
        if (status === 'INVALID_ARGUMENT')   return NextResponse.json({ error: 'Could not generate for this topic. Try a different description.' }, { status: 422 })
        return NextResponse.json({ error: `Generation failed (${response.status})` }, { status: 502 })
      }

      const data = await response.json()
      rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      if (!rawText) return NextResponse.json({ error: 'No content returned from AI. Try again.' }, { status: 502 })
    } catch (fetchErr) {
      console.error('[generate/stepwise] Gemini fetch error:', fetchErr)
      return NextResponse.json({ error: 'Network error reaching AI service.' }, { status: 502 })
    }

    let question
    try {
      question = parseStepwiseResponse(rawText)
    } catch (parseErr) {
      console.error('[generate/stepwise] Parse error:', parseErr.message, '\nRaw:', rawText.slice(0, 500))
      return NextResponse.json({ error: 'AI returned an unexpected format. Please try again.' }, { status: 422 })
    }

    // Deduct credits AFTER successful generation
    await deductCredits(user.id, STEPWISE_CREDIT_COST, `Stepwise question: ${topic.slice(0, 60)}`, 'stepwise_generation')

    return NextResponse.json({ success: true, question, creditsUsed: STEPWISE_CREDIT_COST })
  } catch (err) {
    console.error('[generate/stepwise] Unexpected error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}