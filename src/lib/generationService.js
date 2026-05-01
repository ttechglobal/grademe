/**
 * lib/generationService.js
 *
 * Server-side only — never import from client components.
 * Called exclusively from /api/generate/questions route.
 *
 * Flow:
 *   1. Validate credits BEFORE any API call (fail fast)
 *   2. Call Gemini API (mock if key not set)
 *   3. Deduct credits ONLY after successful generation
 */

import { validateCredits, deductCredits, CREDIT_COSTS } from '@/lib/creditService'

// ── Academic style prompt additions ───────────────────────────────────────
const ACADEMIC_STYLE_PROMPTS = {
  standard:     '',  // base — no extra instructions needed

  cambridge:    `CAMBRIDGE STYLE REQUIREMENTS:
- Emphasise analytical thinking and structured reasoning
- Include application questions where students apply concepts to new situations
- Use structured scenarios where appropriate
- Favour questions that test understanding over pure recall
- Language must be precise and unambiguous`,

  oxford:       `OXFORD STYLE REQUIREMENTS:
- Challenge students to demonstrate critical thinking and judgement
- Include questions that require evaluation — not just knowledge recall
- Some questions should have nuanced answers requiring careful reasoning
- Favour depth of understanding over breadth`,

  harvard:      `HARVARD STYLE REQUIREMENTS:
- Include case-based questions where students analyse a scenario
- Test practical application of theoretical concepts
- Use real-world professional contexts where relevant
- Some questions should require students to make decisions and justify them`,

  professional: `PROFESSIONAL / CERTIFICATION STYLE REQUIREMENTS:
- Mirror the format of professional certification examinations
- Use precise technical terminology throughout
- Clear, unambiguous correct answers only
- Test specific competencies and professional standards
- No ambiguity in correct answer selection`,
}

// ── STEM subject detection ─────────────────────────────────────────────────
const STEM_KEYWORDS = [
  'math', 'maths', 'mathematics', 'further mathematics', 'physics', 'chemistry',
  'biology', 'statistics', 'computer science', 'accounting', 'economics',
]

function isSTEMSubject(subject = '') {
  const s = subject.toLowerCase()
  return STEM_KEYWORDS.some((k) => s.includes(k))
}

// ── Cost calculator ────────────────────────────────────────────────────────
export function calculateGenerationCost(questionType, numberOfQuestions) {
  const costPerQ =
    questionType === 'true_false' ? CREDIT_COSTS.TRUE_FALSE_GENERATION_PER_QUESTION
                                  : CREDIT_COSTS.MCQ_GENERATION_PER_QUESTION
  return costPerQ * numberOfQuestions
}

// ── Main entry point ───────────────────────────────────────────────────────
export async function generateQuestions(params) {
  const { tutorId, questionType, numberOfQuestions } = params
  const creditCost = calculateGenerationCost(questionType, numberOfQuestions)

  // 1. Validate BEFORE calling API
  const creditCheck = await validateCredits(tutorId, creditCost)
  if (!creditCheck.valid) {
    return {
      success:   false,
      error:     `You need ${creditCost} credit${creditCost !== 1 ? 's' : ''} to generate ${numberOfQuestions} question${numberOfQuestions !== 1 ? 's' : ''}. Your balance is ${creditCheck.balance}.`,
      errorCode: 'INSUFFICIENT_CREDITS',
    }
  }

  // 2. Generate
  let questions
  try {
    questions = await callGenerationAPI(params)
  } catch (err) {
    console.error('[generate] API failed:', err.message)
    return {
      success:   false,
      error:     err.message || 'Question generation failed. Your credits were not charged. Please try again.',
      errorCode: 'GENERATION_FAILED',
    }
  }

  // 3. Deduct ONLY after success
  const deductResult = await deductCredits(
    tutorId,
    creditCost,
    `Generated ${numberOfQuestions} ${questionType === 'mcq' ? 'MCQ' : 'True/False'} question${numberOfQuestions !== 1 ? 's' : ''} on "${params.topic}"`,
    `${questionType}_generation`,
  )

  if (!deductResult.success) {
    console.error('[generate] CREDIT DEDUCTION FAILED after successful generation:', {
      tutorId, creditCost, error: deductResult.error,
    })
    return { success: true, questions, creditsUsed: creditCost, remainingCredits: creditCheck.balance }
  }

  return {
    success:          true,
    questions,
    creditsUsed:      creditCost,
    remainingCredits: deductResult.newBalance,
  }
}

// ── API dispatcher ─────────────────────────────────────────────────────────
async function callGenerationAPI(params) {
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) return await callGeminiAPI(params, geminiKey)
  console.warn('[generate] GEMINI_API_KEY not set — returning mock questions')
  return generateMockQuestions(params)
}

// ── Gemini API call ────────────────────────────────────────────────────────
async function callGeminiAPI(params, apiKey) {
  const prompt = buildGenerationPrompt(params)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents:         [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    }
  )

  if (!response.ok) {
    const errorData  = await response.json().catch(() => ({}))
    const errorCode  = errorData?.error?.status ?? ''
    const KNOWN = {
      RESOURCE_EXHAUSTED: 'Generation limit reached. Please try again in a moment.',
      INVALID_ARGUMENT:   'Could not generate questions for this topic. Try a different description.',
      INTERNAL:           'Generation temporarily unavailable. Please try again.',
    }
    throw new Error(KNOWN[errorCode] || `Generation failed (${response.status}). Please try again.`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) throw new Error('No response from generation service. Please try again.')

  return parseGenerationResponse(text, params.questionType)
}

// ── Prompt builder ─────────────────────────────────────────────────────────
function buildGenerationPrompt(params) {
  const {
    questionType,
    subject       = '',
    topic,
    gradeLevel    = '',
    curriculum,
    difficulty    = 'medium',
    numberOfQuestions,
    additionalContext,
    useCase       = 'k12_tutor',
    academicStyle = 'standard',
  } = params

  const isUniversity = useCase === 'university'
  const stem         = isSTEMSubject(subject)

  // ── Question type instructions ────────────────────────────────────────
  const questionTypeInstructions = questionType === 'mcq'
    ? `Generate exactly ${numberOfQuestions} multiple choice questions.
Each question must have exactly 4 options labeled A, B, C, D.
Only one option is correct.
Return correct_answer as the letter only: "A", "B", "C", or "D".`
    : `Generate exactly ${numberOfQuestions} true or false questions.
Each question must be a clear, unambiguous factual statement.
Avoid trick questions or partially-true statements.
Return correct_answer as exactly "True" or "False".`

  // ── Difficulty instructions ────────────────────────────────────────────
  const difficultyInstructions = {
    easy:   'Test basic recall and simple understanding. Straightforward language. Single-concept questions.',
    medium: 'Test understanding and application. May involve multi-step thinking. Moderate complexity.',
    hard:   'Test analysis, evaluation, and deep understanding. Complex scenarios. Require strong subject knowledge.',
  }[difficulty] ?? ''

  // ── Academic level instructions ────────────────────────────────────────
  const academicInstructions = isUniversity
    ? buildUniversityInstructions(academicStyle)
    : buildK12Instructions(gradeLevel, curriculum)

  // ── Explanation format ─────────────────────────────────────────────────
  const explanationFormat = stem
    ? `EXPLANATION FORMAT — ${subject.toUpperCase()} (STEM):
Write explanations as numbered steps. Show ALL working — never skip a step.
Start with the formula or rule if applicable.
Show each calculation on its own line.
Every sentence on its own line — no walls of text.
End with: ✅ The answer is [answer] because [one clear sentence]
Then add: 💡 Remember: [one simple memorable rule — max 10 words]`
    : `EXPLANATION FORMAT — ${subject.toUpperCase()} (NON-STEM):
Write explanations as short clear paragraphs — one idea per paragraph.
No numbered steps.
Explain WHY the correct answer is right.
Briefly explain why the wrong options are incorrect if helpful.
Every paragraph separated by a blank line.
End with: ✅ The answer is [answer] because [one clear sentence]
Then add: 💡 Remember: [one memorable tip — max 10 words]`

  return `You are an expert educator creating high-quality assessment questions.

SUBJECT: ${subject}
TOPIC: ${topic}
DIFFICULTY: ${difficulty}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

${academicInstructions}

DIFFICULTY REQUIREMENTS:
${difficultyInstructions}

QUESTION REQUIREMENTS:
${questionTypeInstructions}

${explanationFormat}

OUTPUT FORMAT — CRITICAL:
Return ONLY a valid JSON array. No markdown fences. No text before or after.

[
  {
    "question": "Question text here",
    "question_type": "${questionType}",
    ${questionType === 'mcq' ? '"options": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],' : ''}
    "correct_answer": "${questionType === 'mcq' ? 'A' : 'True'}",
    "explanation": "Step 1: ...\\n\\nStep 2: ...\\n\\n✅ The answer is ... because ...\\n\\n💡 Remember: ...",
    "hint": "A helpful hint without revealing the answer"
  }
]

Generate exactly ${numberOfQuestions} questions. Return only the JSON array — nothing else.`
}

function buildK12Instructions(gradeLevel, curriculum) {
  return `GRADE LEVEL: ${gradeLevel}
${curriculum ? `CURRICULUM: ${curriculum}` : ''}

GRADE LEVEL REQUIREMENTS:
- Vocabulary must match what a ${gradeLevel} student would know
- Concepts must be within the ${gradeLevel} curriculum scope
- Do not introduce concepts taught in higher grades
- Questions should feel familiar and relevant to ${gradeLevel} students
- Numbers and values in calculations must be appropriate for ${gradeLevel}`
}

function buildUniversityInstructions(academicStyle) {
  const styleBlock = ACADEMIC_STYLE_PROMPTS[academicStyle] || ''
  return `ACADEMIC LEVEL: University / Higher Education

UNIVERSITY REQUIREMENTS:
- Questions must reflect university-level academic rigour
- Test higher-order thinking: analysis, evaluation, synthesis — not just recall
- Use precise academic and technical terminology appropriate to the discipline
- Depth expected in university examinations
- Explanations should reference underlying principles and academic reasoning
${styleBlock ? `\n${styleBlock}` : ''}`
}

// ── Response parser ────────────────────────────────────────────────────────
function parseGenerationResponse(text, questionType) {
  // Clean common AI artifacts
  let cleaned = text
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim()

  // Find the JSON array boundaries — handles any preamble text
  const arrayStart = cleaned.indexOf('[')
  const arrayEnd   = cleaned.lastIndexOf(']')
  if (arrayStart === -1 || arrayEnd === -1) {
    throw new Error('No questions were generated. Please try again with a different topic.')
  }
  if (arrayStart > 0) cleaned = cleaned.substring(arrayStart, arrayEnd + 1)

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('Could not read the generated questions. Please try again.')
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('No questions were generated. Please try again with a different topic.')
  }

  return parsed.map((q, i) => {
    if (!q.question || !q.correct_answer) {
      throw new Error(`Question ${i + 1} is missing required fields. Please try again.`)
    }

    // Normalise correct_answer
    let answer
    if (questionType === 'true_false') {
      answer = /^true/i.test(String(q.correct_answer)) ? 'True' : 'False'
    } else {
      // MCQ — take first letter, uppercase
      answer = String(q.correct_answer ?? 'A').trim().charAt(0).toUpperCase()
      if (!'ABCD'.includes(answer)) answer = 'A'
    }

    return {
      question:       String(q.question).trim(),
      question_type:  questionType,
      type:           questionType === 'true_false' ? 'truefalse' : 'mcq',
      options:        Array.isArray(q.options) ? q.options : [],
      answer,
      correct_answer: answer,
      explanation:    String(q.explanation ?? '').trim(),
      hint:           String(q.hint ?? '').trim(),
    }
  })
}

// ── Mock questions (development without API key) ───────────────────────────
function generateMockQuestions(params) {
  const { questionType, numberOfQuestions, subject, topic } = params
  return Array.from({ length: numberOfQuestions }, (_, i) => {
    if (questionType === 'mcq') {
      return {
        question:      `[MOCK] ${subject} — Question ${i + 1} about ${topic}?`,
        question_type: 'mcq',
        type:          'mcq',
        options:       ['A. First option', 'B. Second option', 'C. Third option', 'D. Fourth option'],
        answer:        'A',
        correct_answer: 'A',
        explanation:   `Step 1: This is mock question ${i + 1}.\n\nStep 2: Gemini will generate real explanations when your API key is set.\n\n✅ The answer is A because this is mock data.\n\n💡 Remember: Add GEMINI_API_KEY to .env.local to enable real generation.`,
        hint:          `Mock hint for question ${i + 1}`,
      }
    } else {
      const ans = i % 2 === 0 ? 'True' : 'False'
      return {
        question:      `[MOCK] ${subject} statement ${i + 1} about ${topic}.`,
        question_type: 'true_false',
        type:          'truefalse',
        options:       [],
        answer:        ans,
        correct_answer: ans,
        explanation:   `This is mock explanation ${i + 1}.\n\n✅ The answer is ${ans} because this is mock data.\n\n💡 Remember: Add GEMINI_API_KEY to enable real generation.`,
        hint:          `Mock hint ${i + 1}`,
      }
    }
  })
}