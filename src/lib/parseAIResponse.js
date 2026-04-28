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
function mapQuestion(raw) {
  const text = (raw.question ?? raw.text ?? '').trim()
  if (!text) return null

  return {
    id:          Math.random().toString(36).slice(2),
    type:        'mcq',
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
 * parseAIResponse(rawText)
 *
 * Returns:
 *   { ok: true,  questions: [...], partialMessage: string|null }
 *   { ok: false, errorMessage: string }
 */
export function parseAIResponse(rawText) {
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
    const q = mapQuestion(raw)
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