// NEW: Stepwise feature — does not affect existing MCQ functionality
// src/app/api/generate/stepwise/route.js

import { NextResponse }       from 'next/server'
import { createClient }       from '@/lib/supabase/server'
import { validateCredits, deductCredits } from '@/lib/creditService'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent'

// Cost: 1 credit per stepwise question (same as one MCQ)
const STEPWISE_CREDIT_COST = 1

function buildStepwisePrompt({ topic, subject, classLevel, difficulty, curriculum, useCase }) {
  const difficultyRules = {
    easy:   'Blank ONLY the final answer step or one single key term. All other steps are fully visible. Students need to recall just one thing.',
    medium: 'Blank 2 to 3 key steps — the most important reasoning steps. Leave the setup and final answer visible.',
    hard:   'Blank most steps (4 or more). Leave only 1 to 2 anchor steps visible so students can follow the logic. This makes students reconstruct the full solution.',
  }

  const calcSubjects = ['mathematics', 'maths', 'math', 'physics', 'chemistry', 'statistics', 'further mathematics']
  const isSTEM = calcSubjects.some((s) => (subject ?? '').toLowerCase().includes(s))

  const stepGuide = isSTEM
    ? 'For this STEM topic, structure steps as: identify what is given → write the formula → substitute values → simplify/calculate → state the final answer. Each step must show the working, not just describe it. Use $...$ for all mathematical notation.'
    : 'For this conceptual topic, structure steps as: state the premise → explain the mechanism/process → give the effect or conclusion. Each step must be a complete, standalone sentence.'

  return `You are an expert educational content creator for ${useCase === 'university' ? 'university-level' : 'school-level'} students.

Generate ONE stepwise question for:
Topic: ${topic}
Subject: ${subject || 'General'}
Level: ${classLevel || 'General'}
Difficulty: ${difficulty}
${curriculum ? `Curriculum: ${curriculum}` : ''}

WHAT IS A STEPWISE QUESTION:
A problem is presented and its full solution is broken into ordered steps.
Some steps have a blank (marked as ___) that students fill by choosing from a word bank.
The word bank contains the correct answers plus 2 to 4 decoy options.

DIFFICULTY RULE FOR THIS QUESTION:
${difficultyRules[difficulty] || difficultyRules.medium}

STEP STRUCTURE GUIDE:
${stepGuide}

RULES:
1. Write 4 to 7 steps total. Each step must be a complete, self-contained statement.
2. Blanks go where a student must actually think — never on articles, prepositions, or trivial words.
3. The blank ___ replaces exactly ONE word or short phrase (max 4 words).
4. word_bank must include ALL correct answers plus 2 to 4 plausible wrong options.
5. explain_correct: 1 to 2 sentences explaining WHY this is the correct step (reinforce understanding).
6. explain_wrong: 1 to 2 sentences correcting the likely misconception a student had.
7. For non-blank steps, set is_blank to false and answer, explain_correct, explain_wrong to null.
8. question_text must be a clear, well-posed question — not just a topic title.
9. All mathematical expressions must use LaTeX syntax: $x^2 + 3x = 10$ not x^2+3x=10.

Respond ONLY with valid JSON — no markdown, no backticks, no extra text:

{
  "question_text": "string — a clear question asking the student to solve something",
  "subject": "string",
  "difficulty": "${difficulty}",
  "steps": [
    {
      "id": "step_1",
      "text": "step text — use ___ to mark exactly one blank, or write the full step if no blank",
      "is_blank": true,
      "answer": "correct word or phrase that fills the blank",
      "explain_correct": "why this answer is right — reinforce the concept",
      "explain_wrong": "what the student likely misunderstood and the correct thinking"
    },
    {
      "id": "step_2",
      "text": "full step with no blank",
      "is_blank": false,
      "answer": null,
      "explain_correct": null,
      "explain_wrong": null
    }
  ],
  "word_bank": ["correct answer 1", "correct answer 2", "decoy 1", "decoy 2", "decoy 3"]
}`
}

function parseStepwiseResponse(rawText) {
  let cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim()

  // Find the object boundaries
  const start = cleaned.indexOf('{')
  const end   = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in response')
  cleaned = cleaned.slice(start, end + 1)

  const parsed = JSON.parse(cleaned)

  // Validate required fields
  if (!parsed.question_text || typeof parsed.question_text !== 'string') {
    throw new Error('Missing or invalid question_text')
  }
  if (!Array.isArray(parsed.steps) || parsed.steps.length < 2) {
    throw new Error('steps must be an array with at least 2 items')
  }
  if (!Array.isArray(parsed.word_bank) || parsed.word_bank.length < 2) {
    throw new Error('word_bank must be an array with at least 2 items')
  }

  // Validate and normalise each step
  const steps = parsed.steps.map((s, i) => {
    if (!s.id)   s.id   = `step_${i + 1}`
    if (!s.text) throw new Error(`Step ${i + 1} is missing text`)
    return {
      id:              String(s.id),
      text:            String(s.text).trim(),
      is_blank:        Boolean(s.is_blank),
      answer:          s.answer   ? String(s.answer).trim()          : null,
      explain_correct: s.explain_correct ? String(s.explain_correct).trim() : null,
      explain_wrong:   s.explain_wrong   ? String(s.explain_wrong).trim()   : null,
    }
  })

  // Ensure blank steps have answers
  for (const step of steps) {
    if (step.is_blank && !step.answer) {
      throw new Error(`Step ${step.id} is marked as blank but has no answer`)
    }
  }

  // Ensure all correct answers are in word_bank
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
    // ── Auth ───────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Input validation ───────────────────────────────────────────────────
    const body = await request.json()
    const { topic, subject, classLevel, difficulty = 'medium', curriculum, useCase = 'k12_tutor' } = body

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
    }

    // ── Credit validation ──────────────────────────────────────────────────
    const validation = await validateCredits(user.id, STEPWISE_CREDIT_COST)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please top up to generate stepwise questions.' },
        { status: 402 }
      )
    }

    // ── Mock mode (no API key) ─────────────────────────────────────────────
    if (!process.env.GEMINI_API_KEY) {
      const mockQuestion = {
        question_text:  `[MOCK] What happens during ${topic || 'photosynthesis'}?`,
        question_type:  'stepwise',
        type:           'stepwise',
        text:           `[MOCK] What happens during ${topic || 'photosynthesis'}?`,
        subject:        subject || 'General',
        difficulty,
        steps: [
          { id: 'step_1', text: 'Plants absorb ___ from sunlight', is_blank: true,  answer: 'energy', explain_correct: 'Sunlight provides the energy needed to drive photosynthesis.', explain_wrong: 'Plants do not absorb the sun itself — they absorb the energy in the light.' },
          { id: 'step_2', text: 'Carbon dioxide enters the leaf through the stomata', is_blank: false, answer: null, explain_correct: null, explain_wrong: null },
          { id: 'step_3', text: 'Water is absorbed by the ___ and travels up to the leaves', is_blank: true, answer: 'roots', explain_correct: 'Roots absorb water from the soil through osmosis.', explain_wrong: 'Leaves absorb carbon dioxide, not water. Water comes up from the roots.' },
          { id: 'step_4', text: 'Glucose is produced and oxygen is released as a by-product', is_blank: false, answer: null, explain_correct: null, explain_wrong: null },
        ],
        word_bank: ['energy', 'roots', 'heat', 'leaves', 'stem'],
        options: [],
        answer:  '',
      }
      return NextResponse.json({ success: true, question: mockQuestion, creditsUsed: STEPWISE_CREDIT_COST })
    }

    // ── Build prompt ───────────────────────────────────────────────────────
    const prompt = buildStepwisePrompt({ topic: topic.trim(), subject, classLevel, difficulty, curriculum, useCase })

    // ── Call Gemini ────────────────────────────────────────────────────────
    let rawText = ''
    try {
      const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.65,
            topK: 40, topP: 0.95,
            maxOutputTokens: 4096,
          },
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

    // ── Parse response ─────────────────────────────────────────────────────
    let question
    try {
      question = parseStepwiseResponse(rawText)
    } catch (parseErr) {
      console.error('[generate/stepwise] Parse error:', parseErr.message, '\nRaw:', rawText.slice(0, 500))
      return NextResponse.json(
        { error: 'AI returned an unexpected format. Please try again.' },
        { status: 422 }
      )
    }

    // ── Deduct credits AFTER successful generation ─────────────────────────
    await deductCredits(
      user.id,
      STEPWISE_CREDIT_COST,
      `Stepwise question generated: ${topic.slice(0, 60)}`,
      'stepwise_generation',
    )

    return NextResponse.json({ success: true, question, creditsUsed: STEPWISE_CREDIT_COST })

  } catch (err) {
    console.error('[generate/stepwise] Unexpected error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}