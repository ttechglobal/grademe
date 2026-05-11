// src/lib/generationService.js
// Server-only — never import this in client components.
// Generation order is always: validate → generate → deduct. Never changes.

import { validateCredits, deductCredits } from './creditService'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent'

// ─── STEM DETECTION ───────────────────────────────────────────────────────────

const STEM_SUBJECTS = [
  'math', 'maths', 'mathematics', 'further mathematics', 'additional mathematics',
  'physics', 'chemistry', 'biology', 'statistics', 'computer science',
  'accounting', 'economics', 'engineering',
]

function isStem(subject = '') {
  const s = subject.toLowerCase()
  return STEM_SUBJECTS.some((stem) => s.includes(stem))
}

// ─── PROFILE CONTEXT BLOCKS ───────────────────────────────────────────────────

function buildK12Block(classLevel, curriculum) {
  return [
    `Target audience: K-12 students${classLevel ? ` — ${classLevel}` : ''}.`,
    `Curriculum: ${curriculum || 'general'}.`,
    `Language: Grade-appropriate. Simple and clear. Avoid jargon.`,
  ].join('\n')
}

function buildUniversityBlock(academicStyle) {
  const styleNotes = {
    cambridge:    'Use an analytical, scenario-based approach. Favour application and structured reasoning.',
    oxford:       'Favour critical thinking, evaluation, and depth of understanding over breadth.',
    harvard:      'Use case-based, practical application. Real-world contexts and professional relevance.',
    professional: 'Use precise technical terminology consistent with industry certification standards.',
  }
  const note = styleNotes[academicStyle] || ''
  return [
    `Target audience: University / higher education students.`,
    `Maintain academic rigour appropriate for tertiary level.`,
    note ? note : '',
  ].filter(Boolean).join('\n')
}

// ─── DIFFICULTY INSTRUCTION ───────────────────────────────────────────────────

function buildDifficultyInstruction(difficultyMix, count) {
  const mix = Array.isArray(difficultyMix) && difficultyMix.length > 0
    ? difficultyMix
    : ['medium']

  if (mix.length === 1) {
    const guides = {
      easy:   'Foundation level — tests recall and basic understanding. Single-concept, straightforward questions.',
      medium: 'Standard level — tests comprehension and application. May involve multi-step thinking.',
      hard:   'Challenging level — tests analysis and evaluation. Complex reasoning or multi-step working required.',
    }
    return `Difficulty: ${mix[0]} — ${guides[mix[0]] || ''}`
  }

  const perLevel  = Math.floor(count / mix.length)
  const remainder = count % mix.length
  const dist      = mix.map((d, i) => `${perLevel + (i === 0 ? remainder : 0)} ${d}`).join(', ')
  return `Difficulty: Mixed — distribute as: ${dist}. Spread throughout the array, do not group by difficulty.`
}

// ─── EXPLANATION FORMAT SPECIFICATION ────────────────────────────────────────

function buildExplanationSpec(isSTEM) {
  if (isSTEM) {
    return `
EXPLANATION FORMAT — STEM SUBJECTS — FOLLOW EXACTLY. NO EXCEPTIONS.

For every calculation or STEM question, write the explanation in this EXACT structure:

Step 1: [One sentence: what are we trying to find?]

Step 2: [Write the formula or rule. Then define EVERY variable.]
        Formula: [write the formula clearly]
        Where: [variable] = [plain English meaning]
        [Repeat for every variable in the formula]

Step 3: [List the known values — one per line]
        [variable] = [value with units]
        [variable] = [value with units]
        [Continue for all known values]

Step 4: [Substitute values into the formula — write the full substitution]
        [Show the formula with numbers replacing variables]
        [Then show EVERY arithmetic operation on its own line]
        [Line 1 of calculation]
        [Line 2 of calculation]
        [Continue until you reach the final number]

Step 5: [State the final answer with units]

✅ **The answer is [CORRECT ANSWER] because [one clear reason in plain language]**

💡 Remember: [One rule or tip for next time — maximum 12 words]

CRITICAL RULES FOR STEM — VIOLATIONS ARE NOT ACCEPTABLE:
1. ALWAYS write the formula FIRST — then substitute numbers BELOW it on the next line
   WRONG: "d = (250 × 3.5) ÷ 2 = 437.5"
   RIGHT: First line: "d = (v × t) ÷ 2" — Next line: "d = (250 × 3.5) ÷ 2"
2. ALWAYS list what each variable equals BEFORE doing any calculation
3. ALWAYS break multiplication and division into separate lines
   WRONG: "250 × 3.5 ÷ 2 = 437.5"
   RIGHT: "250 × 3.5 = 875" on one line, then "875 ÷ 2 = 437.5" on the next
4. NEVER jump from a formula to a final answer — show every intermediate step
5. For fraction questions: show the fraction as written, then simplify step by step
6. For algebra: every rearrangement gets its own line
7. A student who has never seen this topic must be able to follow every line
8. Use blank lines between steps
`
  }

  return `
EXPLANATION FORMAT — NON-STEM SUBJECTS — FOLLOW EXACTLY. NO EXCEPTIONS.

Write the explanation in clean, short paragraphs — one idea per paragraph:

[Paragraph 1: One sentence stating what the correct answer IS and the core concept]

[Paragraph 2: One sentence explaining WHY it is correct — the reasoning]

[Paragraph 3: One sentence giving context, contrast with wrong options, or a memory aid]

✅ **The answer is [CORRECT ANSWER] because [one clear reason in plain language]**

💡 Remember: [One tip the student can use next time — maximum 12 words]

CRITICAL RULES FOR NON-STEM:
1. No numbered steps — clean short paragraphs only
2. One idea per paragraph — blank line between each
3. Language must match the grade level — no jargon
4. Never write more than 3 sentences before the ✅ line
5. The ✅ line and 💡 line must ALWAYS be present — never omit them
6. Bold the ✅ line using **bold**
`
}

// ─── UNIVERSAL FORMATTING RULES ───────────────────────────────────────────────

const UNIVERSAL_FORMAT_RULES = `
CRITICAL FORMATTING RULES — THESE OVERRIDE EVERYTHING ELSE:
- Every sentence is on its own line
- Blank line between every step or paragraph
- NEVER write a wall of text — no paragraph longer than 2 sentences
- NEVER combine two steps or two ideas in one block
- The ✅ answer line is ALWAYS the second-to-last line
- The 💡 Remember line is ALWAYS the last line
- These two lines are NEVER missing from any explanation
- Bold the ✅ line: **✅ The answer is...**
`

// ─── PROMPT BUILDERS ──────────────────────────────────────────────────────────

function buildMCQPrompt({ subject, topic, classLevel, count, curriculum, useCase, academicStyle, difficultyMix, additionalContext }) {
  const stem          = isStem(subject)
  const profileBlock  = useCase === 'university'
    ? buildUniversityBlock(academicStyle)
    : buildK12Block(classLevel, curriculum)
  const diffBlock     = buildDifficultyInstruction(difficultyMix, count)
  const explSpec      = buildExplanationSpec(stem)
  const contextBlock  = additionalContext?.trim()
    ? `\nAdditional context from the teacher — follow these instructions closely:\n${additionalContext.trim()}\n`
    : ''

  return `You are an expert assessment creator for teachers.
${profileBlock}

Generate exactly ${count} multiple choice question${count > 1 ? 's' : ''} about "${topic}" in the subject "${subject}".

${diffBlock}
${contextBlock}
QUESTION RULES:
- Each question must have exactly 4 options labelled A, B, C, D
- Only one option is correct
- correct_answer must be exactly one of: A, B, C, D
- Questions must be clear, unambiguous, and appropriate for the level
- Always include a one-sentence hint (gives a clue without revealing the answer)
${explSpec}
${UNIVERSAL_FORMAT_RULES}

Return ONLY a valid JSON array. No preamble, no markdown fences, no extra text.

[
  {
    "question": "Question text here?",
    "options": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],
    "correct_answer": "A",
    "explanation": "Full explanation here following the exact format above",
    "hint": "One-sentence hint here"
  }
]`
}

function buildTrueFalsePrompt({ subject, topic, classLevel, count, curriculum, useCase, academicStyle, difficultyMix, additionalContext }) {
  const stem         = isStem(subject)
  const profileBlock = useCase === 'university'
    ? buildUniversityBlock(academicStyle)
    : buildK12Block(classLevel, curriculum)
  const diffBlock    = buildDifficultyInstruction(difficultyMix, count)
  const explSpec     = buildExplanationSpec(stem)
  const contextBlock = additionalContext?.trim()
    ? `\nAdditional context from the teacher:\n${additionalContext.trim()}\n`
    : ''

  return `You are an expert assessment creator for teachers.
${profileBlock}

Generate exactly ${count} true/false question${count > 1 ? 's' : ''} about "${topic}" in the subject "${subject}".

${diffBlock}
${contextBlock}
QUESTION RULES:
- Each question must be a clear, factual statement
- correct_answer must be exactly "True" or "False" (capitalised, nothing else)
- Avoid trick questions, double negatives, and ambiguous phrasing
- Always include a one-sentence hint
${explSpec}
${UNIVERSAL_FORMAT_RULES}

Return ONLY a valid JSON array. No preamble, no markdown fences.

[
  {
    "question": "The statement to evaluate.",
    "correct_answer": "True",
    "explanation": "Full explanation here following the exact format above",
    "hint": "One-sentence hint here"
  }
]`
}

function buildCalculationPrompt({ subject, topic, classLevel, count, curriculum, useCase, academicStyle, difficultyMix, additionalContext }) {
  const profileBlock = useCase === 'university'
    ? buildUniversityBlock(academicStyle)
    : buildK12Block(classLevel, curriculum)
  const diffBlock    = buildDifficultyInstruction(difficultyMix, count)
  const contextBlock = additionalContext?.trim()
    ? `\nAdditional context from the teacher:\n${additionalContext.trim()}\n`
    : ''

  // Calculation questions always get the STEM explanation spec
  const explSpec = buildExplanationSpec(true)

  return `You are an expert mathematics and science assessment creator.
${profileBlock}

Generate exactly ${count} calculation question${count > 1 ? 's' : ''} about "${topic}" in the subject "${subject}".

${diffBlock}
${contextBlock}
These are fill-in-the-answer questions — NOT multiple choice. Students type answers into structured boxes.

ANSWER TEMPLATE TYPES — choose the one that best fits each answer:
- "number"        → single whole number answer
- "decimal"       → single decimal answer (e.g. 3.14)
- "fraction"      → a fraction: numerator box + denominator box
- "power"         → base to a power: base box + exponent box
- "simultaneous"  → two variables (e.g. x and y): two labelled boxes
- "coordinates"   → a coordinate pair (x, y): two boxes
- "percentage"    → a percentage value: one box + % sign
- "ratio"         → a ratio a:b: two boxes
- "angle"         → angle in degrees: one box + ° symbol
- "scientific"    → scientific notation: coefficient box + exponent box
- "surd"          → surd form a√b: coefficient box + radicand box
- "two_roots"     → quadratic with two roots x₁ and x₂: two labelled boxes
- "units"         → number with a unit: one box + unit string

ACCEPTED ANSWERS:
- accepted[] must include every valid string form of the correct answer
- e.g. for 3: accepted = ["3", "3.0"]
- e.g. for 0.5: accepted = ["0.5", ".5"] — and "1/2" too if fraction form is acceptable
- e.g. for -3: accepted = ["-3", "-3.0"]
${explSpec}
${UNIVERSAL_FORMAT_RULES}

Return ONLY a valid JSON array. No preamble, no markdown fences.

[
  {
    "question": "Solve: 2x + y = 7 and x - y = 2. Find x and y.",
    "answer_template": {
      "type": "simultaneous",
      "structure": [
        { "id": "x", "label": "x", "answer": "3", "accepted": ["3", "3.0"] },
        { "id": "y", "label": "y", "answer": "1", "accepted": ["1", "1.0"] }
      ]
    },
    "explanation": "Full step-by-step explanation following the STEM format above",
    "hint": "One-sentence hint here"
  }
]`
}

// ─── RESPONSE NORMALISATION ───────────────────────────────────────────────────

function normaliseQuestion(q, questionType) {
  let correct = (q.correct_answer ?? q.answer ?? '').toString().trim()
  if (questionType === 'mcq') {
    correct = correct.toUpperCase().charAt(0)
    if (!['A', 'B', 'C', 'D'].includes(correct)) correct = 'A'
  } else if (questionType === 'true_false') {
    correct = /^true/i.test(correct) ? 'True' : 'False'
  }
  return {
    question:       q.question || q.question_text || '',
    question_type:  questionType,
    type:           questionType === 'true_false' ? 'truefalse' : questionType,
    options:        Array.isArray(q.options) ? q.options : [],
    answer:         correct,
    correct_answer: correct,
    explanation:    q.explanation || '',
    hint:           q.hint || '',
  }
}

function normaliseCalculationQuestion(q) {
  return {
    question:        q.question || q.question_text || '',
    question_type:   'calculation',
    type:            'calculation',
    options:         [],
    answer:          null,
    correct_answer:  null,
    answer_template: q.answer_template || null,
    explanation:     q.explanation || '',
    hint:            q.hint || '',
  }
}

// ─── JSON PARSER ──────────────────────────────────────────────────────────────

function parseGenerationResponse(rawText, questionType) {
  let cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim()

  const start = cleaned.indexOf('[')
  const end   = cleaned.lastIndexOf(']')
  if (start === -1 || end === -1) throw new Error('No JSON array found in response')
  cleaned = cleaned.slice(start, end + 1)

  const parsed = JSON.parse(cleaned)
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Empty or invalid array')

  if (questionType === 'calculation') {
    return parsed.map(normaliseCalculationQuestion).filter((q) => q.question)
  }
  return parsed.map((q) => normaliseQuestion(q, questionType)).filter((q) => q.question)
}

// ─── MOCK QUESTIONS ───────────────────────────────────────────────────────────

function getMockQuestions(questionType, count) {
  if (questionType === 'calculation') {
    return Array.from({ length: count }, (_, i) => ({
      question:       `[MOCK] Solve: ${i + 2}x + ${i + 1} = ${3 * (i + 2) + (i + 1)}`,
      question_type:  'calculation',
      type:           'calculation',
      options:        [],
      answer:         null,
      correct_answer: null,
      answer_template: {
        type:      'number',
        structure: [{ id: 'ans', label: 'x', answer: '3', accepted: ['3', '3.0'] }],
      },
      explanation: `Step 1: We need to find the value of x.\n\nStep 2: Start with the equation:\n        ${i + 2}x + ${i + 1} = ${3 * (i + 2) + (i + 1)}\n\nStep 3: Subtract ${i + 1} from both sides:\n        ${i + 2}x = ${3 * (i + 2)}\n\nStep 4: Divide both sides by ${i + 2}:\n        x = 3\n\n✅ **The answer is x = 3 because dividing both sides by ${i + 2} isolates x.**\n\n💡 Remember: To isolate x, move constants to one side first, then divide by the coefficient.`,
      hint: '[MOCK] Isolate x by moving constants to the right-hand side first.',
    }))
  }

  if (questionType === 'true_false') {
    return Array.from({ length: count }, (_, i) => ({
      question:       `[MOCK] Statement ${i + 1}: The Earth orbits the Sun once every 365 days.`,
      question_type:  'true_false',
      type:           'truefalse',
      options:        [],
      answer:         'True',
      correct_answer: 'True',
      explanation:    `The Earth takes approximately 365.25 days to complete one orbit around the Sun.\n\nThis is why we have a leap year every four years — the extra quarter day accumulates.\n\nAll other planets in our solar system have different orbital periods.\n\n✅ **The answer is True because the Earth's orbital period is approximately 365 days.**\n\n💡 Remember: Earth's orbit = 365 days (or 366 in a leap year).`,
      hint:           '[MOCK] Think about how many days are in a regular calendar year.',
    }))
  }

  return Array.from({ length: count }, (_, i) => ({
    question:       `[MOCK] Question ${i + 1}: Which of the following best describes photosynthesis?`,
    question_type:  'mcq',
    type:           'mcq',
    options:        ['A. The process by which plants make food using sunlight', 'B. The process by which animals digest food', 'C. The process by which cells release energy', 'D. The process by which water evaporates from leaves'],
    answer:         'A',
    correct_answer: 'A',
    explanation:    `Photosynthesis is the process used by plants to convert light energy into chemical energy.\n\nThe plant absorbs sunlight, water from the soil, and carbon dioxide from the air — and uses these to produce glucose and oxygen.\n\nOptions B, C, and D describe respiration, cellular respiration, and transpiration respectively — not photosynthesis.\n\n✅ **The answer is A because photosynthesis is defined as the process by which plants make food using sunlight.**\n\n💡 Remember: Photo = light, synthesis = making — plants make food using light.`,
    hint:           '[MOCK] The word "photo" relates to light — think about what plants need from the sun.',
  }))
}

// ─── CREDIT HELPERS ───────────────────────────────────────────────────────────

function getCreditCost(questionType, count) {
  return count // 1 credit per question regardless of type
}

function getCreditAction(questionType) {
  const map = {
    mcq:         'mcq_generation',
    true_false:  'true_false_generation',
    calculation: 'calculation_generation',
  }
  return map[questionType] || 'mcq_generation'
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

/**
 * generateQuestions
 *
 * Order is always: validate credits → generate → deduct credits.
 * Credits are ONLY deducted after a successful parse. Never before.
 */
export async function generateQuestions(params) {
  const {
    tutorId,
    subject,
    topic,
    classLevel,
    questionType    = 'mcq',
    count           = 5,
    curriculum,
    useCase         = 'k12_tutor',
    academicStyle,
    difficulty      = 'medium',
    difficultyMix   = null,
    additionalContext,
  } = params

  const creditCost   = getCreditCost(questionType, count)
  const creditAction = getCreditAction(questionType)

  // Resolve difficulty array
  const resolvedMix = Array.isArray(difficultyMix) && difficultyMix.length > 0
    ? difficultyMix
    : [difficulty]

  // ── 1. Validate credits ────────────────────────────────────────────────────
  const validation = await validateCredits(tutorId, creditCost)
  if (!validation.valid) {
    return { success: false, error: validation.error || 'Insufficient credits', questions: [] }
  }

  // ── 2. Mock mode ──────────────────────────────────────────────────────────
  if (!process.env.GEMINI_API_KEY) {
    console.log('[generationService] No GEMINI_API_KEY — returning mock questions')
    return { success: true, questions: getMockQuestions(questionType, count), creditsUsed: creditCost }
  }

  // ── 3. Build prompt ────────────────────────────────────────────────────────
  const promptParams = { subject, topic, classLevel, count, curriculum, useCase, academicStyle, difficultyMix: resolvedMix, additionalContext }
  let prompt
  if (questionType === 'calculation') {
    prompt = buildCalculationPrompt(promptParams)
  } else if (questionType === 'true_false') {
    prompt = buildTrueFalsePrompt(promptParams)
  } else {
    prompt = buildMCQPrompt(promptParams)
  }

  // ── 4. Call Gemini ─────────────────────────────────────────────────────────
  let rawText
  try {
    const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents:         [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.65, topK: 40, topP: 0.95, maxOutputTokens: 8192 },
      }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      const status  = errData?.error?.status || ''
      if (status === 'RESOURCE_EXHAUSTED') return { success: false, error: 'Generation limit reached. Try again in a moment.',               questions: [] }
      if (status === 'INVALID_ARGUMENT')   return { success: false, error: 'Could not generate for this topic. Try a different description.', questions: [] }
      if (status === 'INTERNAL')           return { success: false, error: 'Generation temporarily unavailable. Try again.',                  questions: [] }
      return { success: false, error: `Generation failed (${response.status})`, questions: [] }
    }

    const data = await response.json()
    rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (!rawText) return { success: false, error: 'No content returned from AI. Try again.', questions: [] }
  } catch (fetchErr) {
    console.error('[generationService] Gemini fetch error:', fetchErr)
    return { success: false, error: 'Network error reaching AI service. Try again.', questions: [] }
  }

  // ── 5. Parse response ──────────────────────────────────────────────────────
  let questions
  try {
    questions = parseGenerationResponse(rawText, questionType)
  } catch (parseErr) {
    console.error('[generationService] Parse error:', parseErr.message, '\nRaw text:', rawText.slice(0, 500))
    return { success: false, error: 'Could not parse AI response. Please try generating again.', questions: [] }
  }

  // ── 6. Deduct credits ONLY after successful generation ────────────────────
  try {
    await deductCredits(
      tutorId,
      creditCost,
      `Generated ${count} ${questionType} question${count > 1 ? 's' : ''}`,
      creditAction,
    )
  } catch (deductErr) {
    // Log but do NOT fail — questions were generated successfully
    console.error('[generationService] Credit deduction failed after generation:', deductErr)
  }

  return { success: true, questions, creditsUsed: creditCost }
}

export function calculateGenerationCost(questionType, count) {
  return getCreditCost(questionType, count)
}