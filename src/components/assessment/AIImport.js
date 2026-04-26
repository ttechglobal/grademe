'use client'

import { useState } from 'react'
import MathRenderer from '@/components/ui/MathRenderer'
import { Copy, CheckCheck, Sparkles, AlertCircle, GripVertical, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── AI extraction prompt ───────────────────────────────────────────────────
// Instructs the AI to produce explanations in the rich structured format
// that ExplanationRenderer knows how to display.
const PROMPT = `You are an expert question extractor and educator. Extract ALL questions from the content I give you and return a JSON array.

CRITICAL RULES:
- Return ONLY a valid JSON array — no text before or after, no markdown, no code blocks
- Every question MUST have exactly 4 answer options (A, B, C, D)
- SHUFFLE option positions — correct answer should NOT always be A
- The "answer" field must be the letter ONLY: "A", "B", "C", or "D"

FORMAT (follow exactly):
[
  {
    "question": "Full question text",
    "type": "mcq",
    "options": ["A. option", "B. option", "C. option", "D. option"],
    "answer": "B",
    "hint": "One sentence that helps the student think — does NOT give away the answer",
    "explanation": "see format rules below"
  }
]

OPTIONS RULES:
- Always exactly 4 options: A, B, C, D
- For fill-in questions: convert to MCQ — correct answer + 3 plausible wrong answers
- For true/false: A. True  B. False  C. Cannot be determined  D. None of the above

MATHS/CALCULATION EXPLANATION FORMAT:
Use this exact structure, parts separated by \\n:

1. "Key Formula: [formula in plain text]"  ← only if a formula applies
2. Variable definitions — one per line: "[symbol] = [value and meaning]"
3. Numbered steps — CRITICAL FORMAT:
   Step label: SHORT (3–5 words, NOT a sentence)
   Working:    one operation per line BENEATH the label

CORRECT FORMAT:
Step 1: Find GCF
GCF of 16 and 100 = 4
Step 2: Factor out GCF
16x^2 - 100 = 4(4x^2 - 25)
Step 3: Write answer
4(2x - 5)(2x + 5)
Answer: 4(2x - 5)(2x + 5)

WRONG FORMAT (never do this — full sentences inside step labels):
Step 1: Look for the biggest number that goes into both 16 and 100. That number is 4.
Step 2: Take the 4 out to get 4(4x^2 - 25).

GOOD EXAMPLE for area:
"Key Formula: Area = length x width\\nStep 1: Identify values\\nlength = 8 cm\\nwidth = 5 cm\\nStep 2: Substitute\\nArea = 8 x 5\\nStep 3: Calculate\\nArea = 40 cm^2\\nAnswer: Area = 40 cm^2"

MATHS NOTATION — wrap all mathematical expressions in $...$:
  Use $\\frac{8}{5}$ not 8/5 | Use $8 \\times 5$ not 8*5 or 8x5
  Use $x^2$ not x^2 | Use $d_1$ not d1 | Use $m\\,s^{-1}$ not m/s
  Use $\\sqrt{9}$ not sqrt(9) | Use $\\pi$ not pi | Use $\\pm$ not +-



CONCEPT/LANGUAGE EXPLANATION FORMAT (English, History, Biology, Economics, etc.):
Use this exact structure (parts separated by \\n):
1. One sentence saying WHY the correct answer is right
2. Two or three sentences of supporting context
3. "Key Concept: [the rule or idea to remember]"
4. For each WRONG option — one line per option:
   "A. [why option A is wrong]"
   "C. [why option C is wrong]"
   "D. [why option D is wrong]"
(skip the correct answer letter — only list the wrong ones)

GOOD CONCEPT EXAMPLE:
"Photosynthesis occurs in the chloroplasts because that is where chlorophyll is found.\\nChlorophyll absorbs light energy and uses it to convert CO2 and water into glucose and oxygen.\\nKey Concept: Chloroplasts are the site of photosynthesis in plant cells.\\nA. The mitochondria is where respiration occurs, not photosynthesis.\\nC. The nucleus controls cell activity — it is not involved in photosynthesis.\\nD. The vacuole stores water and dissolved substances only."

Extract EVERY question. Return ONLY the JSON array.`

export default function AIImport({ onImport }) {
  const [pasted,    setPasted]    = useState('')
  const [copied,    setCopied]    = useState(false)
  const [error,     setError]     = useState('')
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
    setLoading(true)
    try {
      const clean  = pasted.replace(/```json/gi, '').replace(/```/g, '').trim()
      const match  = clean.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('No JSON array found')

      const result = JSON.parse(match[0])
      if (!Array.isArray(result) || result.length === 0) throw new Error('Empty or invalid response')

      const mapped = result
        .map((q) => ({
          id:          Math.random().toString(36).slice(2),
          type:        'mcq',
          text:        q.question || q.text || '',
          options:     Array.isArray(q.options) && q.options.length === 4
                         ? q.options
                         : ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'],
          answer:      q.answer      || 'A',
          hint:        q.hint        || '',
          explanation: q.explanation || '',
        }))
        .filter((q) => q.text.trim().length > 0)

      if (mapped.length === 0) throw new Error('No valid questions found')
      setParsed(mapped)
      setSelected(new Set(mapped.map((q) => q.id)))
    } catch (err) {
      setError(`Could not parse: ${err.message}. Make sure you copied the full JSON array.`)
    }
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
            onChange={(e) => { setPasted(e.target.value); setError('') }}
            placeholder={'[\n  {\n    "question": "...",\n    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],\n    "answer": "B",\n    "explanation": "..."\n  }\n]'}
            rows={10}
            className="w-full px-4 py-3 text-sm font-mono bg-white border border-border rounded-xl outline-none focus:border-brand-500 resize-none placeholder:text-ink-4"
          />
          {error && (
            <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger flex items-start gap-2">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <p>{error}</p>
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