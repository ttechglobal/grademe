/**
 * src/lib/parseAIResponse.js
 *
 * Shared utility for parsing AI-generated question JSON.
 * Used by both AIImport and AIGenerate.
 */

export const PARSE_ERRORS = {
  UNREADABLE:
    "Something went wrong reading the response. Please copy the prompt again, paste it into ChatGPT or Gemini, and copy back the full response. Then try pasting it here again.",
  WRONG_FORMAT:
    "The response looks a little different from what we expected. Try copying the prompt again and getting a fresh response from ChatGPT or Gemini.",
  EMPTY:
    "The response didn't contain any questions. Try getting a new response from ChatGPT or Gemini.",
}

function autofix(raw) {
  if (!raw) return ''
  return raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim()
}

function extractArray(text) {
  const match = text.match(/\[[\s\S]*\]/)
  return match ? match[0] : null
}

function mapQuestion(raw, questionType = null) {
  // ── Calculation detection ──────────────────────────────────────────────
  // Detect if this is a calculation question before anything else.
  // Either the caller tells us (questionType === 'calculation'), or the
  // object has an answer_template field (which only calculation questions have).
  const callerSaysCalc = questionType === 'calculation'
  const hasTemplate    = raw.answer_template && typeof raw.answer_template === 'object'

  if (callerSaysCalc || hasTemplate) {
    // The calculation prompt uses "question_text" as the key, not "question"
    const qText = (raw.question_text || raw.question || raw.text || '').trim()
    if (!qText) return null

    return {
      id:             Math.random().toString(36).slice(2),
      type:           'calculation',
      question_type:  'calculation',
      text:           qText,
      question:       qText,
      options:        [],
      answer:         null,
      correct_answer: null,
      answer_template: raw.answer_template || null,
      hint:           (raw.hint        ?? '').trim(),
      explanation:    (raw.explanation ?? '').trim(),
    }
  }

  // ── Extract question text for MCQ / True/False ─────────────────────────
  const text = (raw.question ?? raw.text ?? '').trim()
  if (!text) return null

  // ── True/False detection ───────────────────────────────────────────────
  const callerSaysTF  = questionType === 'true_false'
  const fieldSaysTF   = raw.question_type === 'true_false'
  const correctAnsVal = String(raw.correct_answer ?? '').trim()
  const answerVal     = String(raw.answer ?? '').trim()
  const correctAnsTF  = correctAnsVal && /^(true|false)$/i.test(correctAnsVal)
  const answerIsTF    = /^(true|false)$/i.test(answerVal)
  const optionsTF     = (
    Array.isArray(raw.options) && raw.options.length === 2 &&
    raw.options.every((o) => /^(true|false)/i.test(String(o).replace(/^[AB]\.\s*/i, '')))
  )

  const isTrueFalse = callerSaysTF || fieldSaysTF || correctAnsTF || answerIsTF || optionsTF

  if (isTrueFalse) {
    const rawAnswer = correctAnsVal || answerVal || 'True'
    const answer    = /^true/i.test(rawAnswer) ? 'True' : 'False'

    return {
      id:            Math.random().toString(36).slice(2),
      type:          'truefalse',
      question_type: 'true_false',
      text,
      options:       [],
      answer,
      hint:          (raw.hint        ?? '').trim(),
      explanation:   (raw.explanation ?? '').trim(),
    }
  }

  // ── MCQ (default) ──────────────────────────────────────────────────────
  return {
    id:            Math.random().toString(36).slice(2),
    type:          'mcq',
    question_type: 'mcq',
    text,
    options:       Array.isArray(raw.options) && raw.options.length >= 2
                     ? raw.options.slice(0, 4)
                     : ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'],
    answer:        (raw.answer ?? 'A').toString().trim().charAt(0).toUpperCase(),
    hint:          (raw.hint        ?? '').trim(),
    explanation:   (raw.explanation ?? '').trim(),
  }
}

/**
 * parseAIResponse(rawText, questionType?)
 *
 * @param {string} rawText        - The raw pasted text from the AI
 * @param {string} [questionType] - 'mcq' | 'true_false' | 'calculation'
 *
 * Returns:
 *   { ok: true,  questions: [...], partialMessage: string|null }
 *   { ok: false, errorMessage: string }
 */
export function parseAIResponse(rawText, questionType = null) {
  const fixed = autofix(rawText)

  if (!fixed) {
    return { ok: false, errorMessage: PARSE_ERRORS.EMPTY }
  }

  const arrayStr = extractArray(fixed)
  if (!arrayStr) {
    return { ok: false, errorMessage: PARSE_ERRORS.UNREADABLE }
  }

  let parsed
  try {
    parsed = JSON.parse(arrayStr)
  } catch {
    return { ok: false, errorMessage: PARSE_ERRORS.UNREADABLE }
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, errorMessage: PARSE_ERRORS.WRONG_FORMAT }
  }

  if (parsed.length === 0) {
    return { ok: false, errorMessage: PARSE_ERRORS.EMPTY }
  }

  const questions = []
  let   failed    = 0

  for (const raw of parsed) {
    const q = mapQuestion(raw, questionType)
    if (q) {
      questions.push(q)
    } else {
      failed++
    }
  }

  if (questions.length === 0) {
    return { ok: false, errorMessage: PARSE_ERRORS.WRONG_FORMAT }
  }

  const partialMessage = failed > 0
    ? `We imported ${questions.length} question${questions.length !== 1 ? 's' : ''} successfully. ${failed} question${failed !== 1 ? 's' : ''} had formatting issues and ${failed !== 1 ? 'were' : 'was'} skipped. You can add ${failed !== 1 ? 'those' : 'it'} manually if needed.`
    : null

  return { ok: true, questions, partialMessage }
}