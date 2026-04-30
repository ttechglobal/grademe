/**
 * src/lib/parseAIResponse.js
 *
 * Shared utility for parsing AI-generated question JSON.
 * Used by both AIImport and AIGenerate.
 *
 * Features:
 *  - Auto-fixes common issues silently (no error shown to user)
 *  - Returns friendly human messages, never technical errors
 *  - Reports partial success when some questions parse and some don't
 */

// ── Friendly error messages — no technical language ───────────────────────
export const PARSE_ERRORS = {
  UNREADABLE:
    "Something went wrong reading the response. Please copy the prompt again, paste it into ChatGPT or Gemini, and copy back the full response. Then try pasting it here again.",
  WRONG_FORMAT:
    "The response looks a little different from what we expected. Try copying the prompt again and getting a fresh response from ChatGPT or Gemini.",
  EMPTY:
    "The response didn't contain any questions. Try getting a new response from ChatGPT or Gemini.",
}

// ── Auto-fix the raw pasted text before parsing ───────────────────────────
function autofix(raw) {
  if (!raw) return ''
  return raw
    // Strip markdown code fences
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    // Convert smart/curly quotes to straight quotes
    .replace(/[\u201C\u201D]/g, '"')   // " "
    .replace(/[\u2018\u2019]/g, "'")   // ' '
    // Normalise whitespace
    .trim()
}

// ── Extract the first JSON array from a string ────────────────────────────
function extractArray(text) {
  // Try to match [...] allowing for any surrounding text
  const match = text.match(/\[[\s\S]*\]/)
  return match ? match[0] : null
}

// ── Map a raw AI question object to our internal format ───────────────────
// questionType is an optional caller-supplied hint ('mcq' | 'true_false').
// When provided it overrides auto-detection — useful when the AI forgets to
// include question_type in its output.
function mapQuestion(raw, questionType = null) {
  const text = (raw.question ?? raw.text ?? '').trim()
  if (!text) return null

  // ── True/False detection ────────────────────────────────────────────────
  // Checks (in priority order):
  //   1. Caller says it's true_false (most reliable)
  //   2. question_type field on the object
  //   3. correct_answer field is "True" or "False"
  //   4. answer field is literally "True" or "False" (not a letter)
  //   5. Options array has exactly 2 entries that look like True/False
  const callerSaysTF  = questionType === 'true_false'
  const fieldSaysTF   = raw.question_type === 'true_false'
  const correctAnsVal = String(raw.correct_answer ?? '').trim()
  const answerVal     = String(raw.answer ?? '').trim()
  const correctAnsTF  = correctAnsVal && /^(true|false)$/i.test(correctAnsVal)
  const answerIsTF    = /^(true|false)$/i.test(answerVal)          // not "A","B","C","D"
  const optionsTF     = (
    Array.isArray(raw.options) && raw.options.length === 2 &&
    raw.options.every((o) => /^(true|false)/i.test(String(o).replace(/^[AB]\.\s*/i, '')))
  )

  const isTrueFalse = callerSaysTF || fieldSaysTF || correctAnsTF || answerIsTF || optionsTF

  if (isTrueFalse) {
    // Normalise answer: "true" / "TRUE" / "True" → "True", etc.
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

  // ── MCQ question (default) ──────────────────────────────────────────────
  return {
    id:          Math.random().toString(36).slice(2),
    type:        'mcq',
    question_type: 'mcq',
    text,
    options:     Array.isArray(raw.options) && raw.options.length >= 2
                   ? raw.options.slice(0, 4)
                   : ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'],
    answer:      (raw.answer ?? 'A').toString().trim().charAt(0).toUpperCase(),
    hint:        (raw.hint        ?? '').trim(),
    explanation: (raw.explanation ?? '').trim(),
  }
}

/**
 * parseAIResponse(rawText, questionType?)
 *
 * @param {string} rawText     - The raw pasted text from the AI
 * @param {string} [questionType] - 'mcq' | 'true_false' — used as a hint when
 *   the AI omits question_type from its response. Defaults to auto-detection.
 *
 * Returns:
 *   { ok: true,  questions: [...], partialMessage: string|null }
 *   { ok: false, errorMessage: string }
 */
export function parseAIResponse(rawText, questionType = null) {
  // Step 1 — auto-fix silently
  const fixed = autofix(rawText)

  if (!fixed) {
    return { ok: false, errorMessage: PARSE_ERRORS.EMPTY }
  }

  // Step 2 — extract JSON array
  const arrayStr = extractArray(fixed)
  if (!arrayStr) {
    return { ok: false, errorMessage: PARSE_ERRORS.UNREADABLE }
  }

  // Step 3 — parse JSON
  let parsed
  try {
    parsed = JSON.parse(arrayStr)
  } catch {
    return { ok: false, errorMessage: PARSE_ERRORS.UNREADABLE }
  }

  // Step 4 — validate structure
  if (!Array.isArray(parsed)) {
    return { ok: false, errorMessage: PARSE_ERRORS.WRONG_FORMAT }
  }

  if (parsed.length === 0) {
    return { ok: false, errorMessage: PARSE_ERRORS.EMPTY }
  }

  // Step 5 — map questions, counting failures
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

  // Step 6 — partial success message if some failed
  const partialMessage = failed > 0
    ? `We imported ${questions.length} question${questions.length !== 1 ? 's' : ''} successfully. ${failed} question${failed !== 1 ? 's' : ''} had formatting issues and ${failed !== 1 ? 'were' : 'was'} skipped. You can add ${failed !== 1 ? 'those' : 'it'} manually if needed.`
    : null

  return { ok: true, questions, partialMessage }
}