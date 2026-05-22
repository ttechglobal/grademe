// src/lib/parseAIResponse.js
// Robust JSON parser for AI-generated question responses.
// Handles: markdown fences, smart quotes, trailing commas,
// truncated responses, and extra text before/after the array.

export function parseAIResponse(raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, questions: [], errorMessage: 'Nothing pasted — please copy the full response from the AI and try again.' }
  }

  // ── 1. Clean smart quotes, dashes, and whitespace ──────────────────────
  let text = raw
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')   // all double smart quotes
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")   // all single smart quotes
    .replace(/[\u00AB\u00BB]/g, '"')                            // guillemets
    .replace(/[\u2013\u2014]/g, '-')                            // en/em dashes
    .trim()

  // ── 2. Strip markdown code fences ──────────────────────────────────────
  text = text
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im,     '')
    .replace(/\s*```\s*$/im,  '')
    .trim()

  // ── 3. Find the JSON array boundaries ─────────────────────────────────
  const start = text.indexOf('[')
  const end   = text.lastIndexOf(']')

  if (start === -1 || end === -1 || end <= start) {
    return {
      ok: false, questions: [],
      errorMessage: "We couldn't find a question list in what you pasted. Make sure you copied the full response — it should start with [ and end with ].",
    }
  }

  let json = text.slice(start, end + 1)

  // ── 4. Fix common JSON issues ──────────────────────────────────────────
  json = json
    .replace(/,\s*\]/g, ']')     // trailing comma before ]
    .replace(/,\s*\}/g, '}')     // trailing comma before }

  // ── 5. Try to parse ─────────────────────────────────────────────────────
  let parsed
  try {
    parsed = JSON.parse(json)
  } catch (firstErr) {
    // ── 5a. Try recovering a partial response ──────────────────────────
    const lastObj = json.lastIndexOf('},')
    if (lastObj > 0) {
      try {
        parsed = JSON.parse(json.slice(0, lastObj + 1) + ']')
        // Partial parse succeeded
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validated = normaliseQuestions(parsed)
          if (validated.length > 0) {
            return {
              ok: true, questions: validated,
              partialMessage: `Recovered ${validated.length} question${validated.length !== 1 ? 's' : ''} — the response may have been cut off.`,
            }
          }
        }
      } catch { /* fall through */ }
    }

    // ── 5b. Nothing worked — give a genuinely helpful error ───────────
    return {
      ok: false, questions: [],
      errorMessage: [
        "We couldn't read the pasted content.",
        '',
        'Most common causes:',
        '• The response was copied only partially — try selecting all (Ctrl+A) then copy',
        '• ChatGPT/Gemini added extra text before the [ bracket — delete any text above it',
        '• The AI used formatting that broke the JSON — try asking it to re-send just the JSON',
        '',
        `Technical detail: ${firstErr.message}`,
      ].join('\n'),
    }
  }

  // ── 6. Validate and normalise ─────────────────────────────────────────
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { ok: false, questions: [], errorMessage: 'No questions found in the pasted content.' }
  }

  const questions = normaliseQuestions(parsed)
  if (questions.length === 0) {
    return {
      ok: false, questions: [],
      errorMessage: 'Found content but none of it looked like questions. Try copying the response again.',
    }
  }

  return { ok: true, questions, partialMessage: null }
}

// Normalise raw question objects into a consistent shape
function normaliseQuestions(raw) {
  const out = []
  for (const q of raw) {
    const text    = (q.question || q.question_text || q.text || '').trim()
    const answer  = (q.correct_answer || q.answer || '').toString().trim()
    const options = Array.isArray(q.options) ? q.options : null

    if (!text) continue
    // MCQ needs at least 2 options
    if (options && options.length < 2) continue

    // Normalise true/false answer capitalisation
    const normAnswer = /^true$/i.test(answer)  ? 'True'
                     : /^false$/i.test(answer) ? 'False'
                     : answer.toUpperCase().charAt(0) || answer

    out.push({
      question:      text,
      question_type: options ? 'mcq' : 'true_false',
      type:          options ? 'mcq' : 'truefalse',
      options:       options ?? [],
      answer:        normAnswer,
      correct_answer: normAnswer,
      explanation:   (q.explanation || '').trim(),
      hint:          (q.hint || '').trim(),
    })
  }
  return out
}