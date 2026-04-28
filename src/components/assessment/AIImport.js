'use client'

import { useState } from 'react'
import { parseAIResponse } from '@/lib/parseAIResponse'
import MathRenderer from '@/components/ui/MathRenderer'
import { Copy, CheckCheck, Sparkles, AlertCircle, GripVertical, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── AI extraction prompt ───────────────────────────────────────────────────
// Instructs the AI to produce explanations in the rich structured format
// that ExplanationRenderer knows how to display.
const PROMPT = `You are an expert question extractor and educator.
Extract ALL questions from the content I give you and return them as a JSON array.

CRITICAL OUTPUT RULES:
- Return ONLY a valid JSON array — no text before, no text after, no markdown
- Every question MUST have exactly 4 options: A, B, C, D
- The "answer" field must be the letter ONLY: "A", "B", "C", or "D"
- For fill-in questions: convert to MCQ — use the correct answer + 3 plausible wrong answers
- For true/false: A. True  B. False  C. Cannot be determined  D. None of the above

FORMAT (follow exactly):
[
  {
    "question": "Full question text",
    "type": "mcq",
    "options": ["A. option", "B. option", "C. option", "D. option"],
    "answer": "B",
    "hint": "One sentence nudge — does NOT give away the answer",
    "explanation": "see explanation format below"
  }
]

EXPLANATION FORMAT FOR CALCULATION SUBJECTS (Maths, Physics, Chemistry):

Write for a ${grade.band} student who just got this wrong and may not know the topic.
Use \\n between every single line. Maximum 15 words per sentence.

MOST IMPORTANT RULES — SHOW THE WORKING, DO NOT JUST DESCRIBE IT:
BAD: "We subtract 3 from 7 to get 4"   GOOD: $7 - 3 = 4$
BAD: "Multiplying gives 875"             GOOD: $250 \\times 3.5 = 875$

Show every transformation on its own line. Never jump from question to answer.
Every line of working must be wrapped in $...$

STRUCTURE:
Step 1: [What are we finding — one simple sentence]\\n
[Write the formula — explain what each letter means]\\n
Step 2: [Short label — 3 to 4 words]\\n
[Show the numbers substituted in — one line]\\n
[Each calculation on its own line — never skip]\\n
Step 3: [Short label — 3 to 4 words]\\n
[Continue until final answer]\\n
✅ The answer is [CORRECT ANSWER] because [one simple sentence]\\n
💡 Remember: [One rule for next time — maximum 10 words]

GOOD CALC EXAMPLE:
"Step 1: We need to find the area of the rectangle.\\nStep 2: Write the formula\\n$Area = length \\times width$\\nLength = 8 cm. Width = 5 cm.\\nStep 3: Substitute and calculate\\n$Area = 8 \\times 5$\\n$Area = 40$ cm²\\n✅ The answer is 40 cm² because we multiply length by width to find area.\\n💡 Remember: Area of a rectangle = length × width."

EXPLANATION FORMAT FOR CONCEPT SUBJECTS (English, History, Biology, Geography, etc.):

Write for a student who just got this wrong. Simple words. Short sentences. Assume nothing.
Use \\n between every single line.

STRUCTURE:
[What the correct answer IS — plain language, one sentence]\\n
[WHY it is correct — simplest possible reason, one sentence]\\n
Key Concept: [The one thing to remember — one sentence]\\n
[For each wrong option: "A. Why option A is wrong — one short sentence"]\\n
✅ The answer is [CORRECT ANSWER] because [one simple sentence]\\n
💡 Remember: [One rule for next time — maximum 10 words]

GOOD CONCEPT EXAMPLE:
"Photosynthesis happens in the chloroplasts.\\nChloroplasts contain chlorophyll which captures light energy.\\nKey Concept: Chloroplasts are where plants make food using light.\\nA. The mitochondria releases energy — it does not make food.\\nC. The nucleus controls the cell but is not involved in photosynthesis.\\nD. The vacuole stores water only.\\n✅ The answer is B because only chloroplasts carry out photosynthesis.\\n💡 Remember: Chloroplasts do photosynthesis — mitochondria do respiration."

Extract EVERY question. Return ONLY the JSON array.`

export default function AIImport({ onImport }) {
  const [pasted,    setPasted]    = useState('')
  const [copied,    setCopied]    = useState(false)
  const [error,     setError]     = useState('')
  const [partialMsg, setPartialMsg] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [parsed,    setParsed]    = useState([])
  const [selected,  setSelected]  = useState(new Set())
  const [dragIndex, setDragIndex] = useState(null)

  const copyPrompt = () => {
    navigator.clipboard.writeText(PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleParse = () => {
    setError('')
    setPartialMsg('')
    setLoading(true)

    const result = parseAIResponse(pasted)

    if (!result.ok) {
      setError(result.errorMessage)
      setLoading(false)
      return
    }

    setParsed(result.questions)
    setSelected(new Set(result.questions.map((q) => q.id)))
    if (result.partialMessage) setPartialMsg(result.partialMessage)
    setLoading(false)
  }

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(
      selected.size === parsed.length
        ? new Set()
        : new Set(parsed.map((q) => q.id))
    )
  }

  const handleDragStart = (i) => setDragIndex(i)
  const handleDragOver  = (e, i) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === i) return
    const next = [...parsed]
    const [item] = next.splice(dragIndex, 1)
    next.splice(i, 0, item)
    setParsed(next)
    setDragIndex(i)
  }
  const handleDragEnd = () => setDragIndex(null)

  const handleConfirm = () => {
    const finalQuestions = parsed
      .filter((q) => selected.has(q.id))
      .map(({ id, ...rest }) => rest)
    onImport(finalQuestions)
  }

  // ── Step 1: copy prompt ────────────────────────────────────────────────
  if (parsed.length === 0) {
    return (
      <div className="flex flex-col gap-5">

        {/* Instructions */}
        <div className="bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4 flex flex-col gap-3">
          <p className="text-sm font-bold text-brand-900">How to use AI-Assisted Import</p>
          <ol className="flex flex-col gap-2">
            {[
              'Copy the prompt below',
              'Open ChatGPT, Claude, or Gemini',
              'Paste the prompt, then paste your worksheet/questions after it',
              'Copy the full JSON response back here',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-brand-700">
                <span className="w-5 h-5 rounded-full bg-brand-800 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Prompt */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-ink-2">AI Extraction Prompt</label>
            <button
              type="button"
              onClick={copyPrompt}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                copied ? 'bg-success-light text-success' : 'bg-brand-800 text-white hover:bg-brand-700'
              )}
            >
              {copied ? <><CheckCheck size={12} /> Copied!</> : <><Copy size={12} /> Copy Prompt</>}
            </button>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4 text-xs font-mono text-ink-3 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
            {PROMPT.slice(0, 400)}…
          </div>
        </div>

        {/* Paste area */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-ink-2">Paste AI Response Here</label>
          <textarea
            value={pasted}
            onChange={(e) => { setPasted(e.target.value); setError(''); setPartialMsg('') }}
            placeholder={'[\n  {\n    "question": "...",\n    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],\n    "answer": "B",\n    "explanation": "..."\n  }\n]'}
            rows={10}
            className="w-full px-4 py-3 text-sm font-mono bg-white border border-border rounded-xl outline-none focus:border-brand-500 resize-none placeholder:text-ink-4"
          />
          {error && (
            <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
              <button
                type="button"
                onClick={() => { setPasted(''); setError('') }}
                className="self-start text-xs font-bold text-danger underline hover:no-underline"
              >
                Try Again
              </button>
            </div>
          )}
          {partialMsg && !error && (
            <div className="bg-amber-light border border-amber/20 rounded-xl px-4 py-3 text-sm text-amber">
              {partialMsg}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleParse}
          disabled={loading || !pasted.trim()}
          className="flex items-center justify-center gap-2 w-full py-3 bg-brand-800 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Extracting…' : <><Sparkles size={15} /> Extract Questions</>}
        </button>
      </div>
    )
  }

  // ── Step 2: review + select ────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-semibold text-ink text-sm">
            {parsed.length} question{parsed.length !== 1 ? 's' : ''} extracted
          </p>
          <p className="text-xs text-ink-4 mt-0.5">Select the ones you want · drag to reorder</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleAll}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-surface text-ink-3 hover:border-brand-400 transition-colors">
            {selected.size === parsed.length ? 'Deselect all' : 'Select all'}
          </button>
          <button type="button" onClick={() => { setParsed([]); setPasted('') }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-surface text-ink-3 hover:border-danger transition-colors">
            Try again
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
        {parsed.map((q, i) => {
          const isSelected = selected.has(q.id)
          return (
            <div
              key={q.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing',
                isSelected ? 'border-brand-400 bg-brand-50' : 'border-border bg-white opacity-60'
              )}
            >
              <GripVertical size={16} className="text-ink-4 flex-shrink-0 mt-0.5" />
              <button type="button" onClick={() => toggleSelect(q.id)}
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                  isSelected ? 'bg-brand-700 border-brand-700' : 'border-border bg-white'
                )}>
                {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
              </button>
              <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink leading-relaxed">
                  <MathRenderer text={q.text} />
                </p>
                {q.options?.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {q.options.map((opt, oi) => {
                      const letter   = opt.charAt(0)
                      const isAnswer = letter === q.answer
                      return (
                        <p key={oi} className={cn(
                          'text-xs px-2 py-1 rounded',
                          isAnswer ? 'bg-success-light text-success font-semibold' : 'text-ink-4'
                        )}>
                          <MathRenderer text={opt} /> {isAnswer && '✓'}
                        </p>
                      )
                    })}
                  </div>
                )}
                {q.hint && <p className="text-xs text-amber mt-1.5">💡 {q.hint}</p>}
                {q.explanation && (
                  <p className="text-xs text-brand-500 mt-1">📖 Explanation included</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-sm text-ink-4">{selected.size} of {parsed.length} selected</p>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selected.size === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-800 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles size={15} />
          Use {selected.size} Question{selected.size !== 1 ? 's' : ''} →
        </button>
      </div>
    </div>
  )
}