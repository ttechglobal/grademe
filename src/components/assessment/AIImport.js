'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Copy, CheckCheck, Sparkles, AlertCircle, GripVertical, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const PROMPT = `You are an expert question extractor and educator. Extract ALL questions from the content I give you and return them as a JSON array.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array — no introduction, no explanation, no markdown, no code blocks
- The array must start with [ and end with ]
- Every question MUST have 4 answer options (A, B, C, D)

QUESTION FORMAT:
[
  {
    "question": "The full question text exactly as written",
    "type": "mcq",
    "options": ["A. first option", "B. second option", "C. third option", "D. fourth option"],
    "answer": "A",
    "hint": "A short nudge that helps without giving away the answer",
    "explanation": "Step 1: ...\nStep 2: ...\nAnswer: ..."
  }
]

EXPLANATION FORMATTING (critical):
- Each step on its own line using \\n
- For maths: show every calculation step
- Use plain text: write x^2 not symbols
- End with: Answer: [final answer]
- Do NOT write paragraphs

GOOD MATHS EXPLANATION:
"Step 1: Write the equation: 2x + 5 = 13\nStep 2: Subtract 5 from both sides: 2x = 8\nStep 3: Divide by 2: x = 4\nAnswer: x = 4"

OPTIONS RULES:
- Always provide exactly 4 options: A, B, C, D
- For fill-in: correct answer = one option, create 3 plausible wrong answers
- For true/false: A. True  B. False  C. Cannot be determined  D. None of the above
- "answer" field must be ONLY the letter: A, B, C, or D

Extract EVERY question. Return ONLY the JSON array.

Content to extract from:`

export default function AIImport({ onImport }) {
  const [pasted,    setPasted]    = useState('')
  const [copied,    setCopied]    = useState(false)
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [parsed,    setParsed]    = useState([])
  const [selected,  setSelected]  = useState(new Set())
  const [shuffled,  setShuffled]  = useState(false)
  const [confirmed, setConfirmed] = useState(false)
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
      const clean = pasted
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim()

      const match = clean.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('No JSON array found')

      const result = JSON.parse(match[0])
      if (!Array.isArray(result) || result.length === 0) throw new Error('Empty array')

      const mapped = result
        .map((q) => ({
          id:          Math.random().toString(36).slice(2),
          type:        'mcq', // always MCQ
          text:        q.question || q.text || '',
          options:     Array.isArray(q.options) && q.options.length === 4
                         ? q.options
                         : ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'],
          answer:      q.answer || 'A',
          hint:        q.hint || '',
          explanation: q.explanation || '',
        }))
        .filter((q) => q.text.trim().length > 0)

      if (mapped.length === 0) throw new Error('No valid questions')

      setParsed(mapped)
      setSelected(new Set(mapped.map((q) => q.id)))
    } catch {
      setError('Could not parse the response. Make sure you copied the full JSON from the AI.')
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
    setSelected(selected.size === parsed.length
      ? new Set()
      : new Set(parsed.map((q) => q.id))
    )
  }

  const handleShuffle = () => {
    setParsed([...parsed].sort(() => Math.random() - 0.5))
    setShuffled(true)
    setTimeout(() => setShuffled(false), 1500)
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
    setConfirmed(true)
  }

  // Step 1 — paste
  if (parsed.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 flex flex-col gap-3">
          <p className="font-semibold text-brand-800 text-sm">How it works</p>
          {[
            '① Open ChatGPT, Gemini, or Claude',
            '② Upload your image / PDF OR paste your questions text',
            '③ Paste the prompt below at the end of your message',
            '④ Copy the AI JSON response and paste below',
          ].map((s, i) => (
            <p key={i} className="text-xs text-brand-700 leading-relaxed">{s}</p>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-ink-2">Step 1 — Copy this prompt</label>
            <Button variant="secondary" size="sm" onClick={copyPrompt}>
              {copied
                ? <><CheckCheck size={13} className="text-success" /> Copied!</>
                : <><Copy size={13} /> Copy Prompt</>
              }
            </Button>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-xs font-mono text-ink-3 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
            {PROMPT}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-ink-2">Step 2 — Paste AI response here</label>
          <textarea
            value={pasted}
            onChange={(e) => { setPasted(e.target.value); setError('') }}
            placeholder={'[\n  {\n    "question": "...",\n    "type": "mcq",\n    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],\n    "answer": "A",\n    "hint": "...",\n    "explanation": "Step 1: ...\\nStep 2: ...\\nAnswer: ..."\n  }\n]'}
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

        <Button variant="primary" onClick={handleParse} loading={loading} disabled={!pasted.trim()}>
          <Sparkles size={15} />
          Parse Questions
        </Button>
      </div>
    )
  }

  // Step 2 — Review, select, reorder
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
          <button
            onClick={handleShuffle}
            className={cn(
              'text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors',
              shuffled ? 'bg-success-light text-success border-success' : 'bg-surface border-border text-ink-3 hover:border-brand-400'
            )}
          >
            {shuffled ? '✓ Shuffled!' : '🔀 Shuffle'}
          </button>
          <button
            onClick={toggleAll}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-surface text-ink-3 hover:border-brand-400 transition-colors"
          >
            {selected.size === parsed.length ? 'Deselect all' : 'Select all'}
          </button>
          <button
            onClick={() => { setParsed([]); setPasted(''); setSelected(new Set()) }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-surface text-ink-3 hover:border-danger transition-colors"
          >
            Re-paste
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
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

              <button
                onClick={() => toggleSelect(q.id)}
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                  isSelected ? 'bg-brand-700 border-brand-700' : 'border-border bg-white'
                )}
              >
                {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
              </button>

              <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink leading-relaxed">{q.text}</p>

                {/* Always show MCQ options */}
                {q.options?.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {q.options.map((opt, oi) => {
                      const letter   = opt.charAt(0)
                      const isAnswer = letter === q.answer
                      return (
                        <p
                          key={oi}
                          className={cn(
                            'text-xs px-2 py-1 rounded',
                            isAnswer ? 'bg-success-light text-success font-semibold' : 'text-ink-4'
                          )}
                        >
                          {opt} {isAnswer && '✓'}
                        </p>
                      )
                    })}
                  </div>
                )}

                {q.hint && (
                  <p className="text-xs text-amber mt-1.5">💡 {q.hint}</p>
                )}

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-surface border border-border rounded px-1.5 py-0.5 text-ink-4">mcq</span>
                  {q.explanation && <span className="text-[10px] text-brand-500">📖 Explanation</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-sm text-ink-4">{selected.size} of {parsed.length} selected</p>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={selected.size === 0 || confirmed}
        >
          <Sparkles size={15} />
          Use {selected.size} Question{selected.size !== 1 ? 's' : ''} →
        </Button>
      </div>
    </div>
  )
}