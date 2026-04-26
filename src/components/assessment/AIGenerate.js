'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import MathRenderer from '@/components/ui/MathRenderer'
import {
  Copy, CheckCheck, Sparkles,
  AlertCircle, GripVertical, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Curriculum AI context ──────────────────────────────────────────────────
const CURRICULUM_CONTEXT = {
  uk:            'UK curriculum (GCSE/A-Level standard)',
  us:            'US curriculum (Common Core standard)',
  canadian:      'Canadian curriculum (provincial K–12 standards)',
  nigerian:      'Nigerian curriculum (WAEC/NECO standard)',
  international: 'International Baccalaureate (IB) curriculum',
  india:         'Indian curriculum (CBSE/ICSE standard)',
  other:         'general curriculum',
}

const ASSESSMENT_TYPE_CONTEXT = {
  assignment: 'a take-home assignment (questions should encourage thinking and working through problems step by step)',
  quiz:       'a quick in-class quiz (questions should be concise and test immediate understanding)',
  test:       'a formal test or exam (questions should vary in difficulty — some straightforward, some challenging)',
}

function buildPrompt({ topic, description, subject, classLevel, assessmentType, numQuestions, curriculum }) {
  const currContext  = CURRICULUM_CONTEXT[curriculum]  ?? CURRICULUM_CONTEXT.other
  const typeContext  = ASSESSMENT_TYPE_CONTEXT[assessmentType] ?? ASSESSMENT_TYPE_CONTEXT.quiz
  const classDisplay = classLevel?.replace(/_/g, ' ')?.toUpperCase() ?? 'the class'
  const subjDisplay  = subject?.replace(/_/g, ' ') ?? 'the subject'

  const descriptionLine = description?.trim()
    ? `\nAdditional context: "${description.trim()}"\n`
    : ''

  // Classify subject type
  const calcSubjects = ['mathematics', 'maths', 'math', 'physics', 'chemistry', 'statistics',
    'further mathematics', 'further_mathematics']
  const isCalc = calcSubjects.some((s) => subjDisplay.toLowerCase().includes(s))

  const explanationFormat = isCalc
    ? `EXPLANATION FORMAT — CALCULATION SUBJECT (${subjDisplay}):

Use \\n between EVERY line. The explanation field is one JSON string — use \\n for line breaks.

STRUCTURE (in order):
1. ONE intro sentence — plain English, no maths
2. "Key Formula: [formula]"  ← only if a formula applies
3. Variable definitions, one per line: "[symbol] = [value and meaning]"
4. Numbered steps — follow the STEP FORMAT below exactly
5. "Answer: [final answer with units]"

STEP FORMAT — THIS IS CRITICAL:
Each step has TWO parts:
  Part A — "Step N: [SHORT LABEL — 4 words max]"
  Part B — The working, one operation per line beneath it

CORRECT EXAMPLE (short label, working below):
Step 1: Find GCF
GCF of 16 and 100 = 4

Step 2: Factor out GCF
16x^2 - 100 = 4(4x^2 - 25)

Step 3: Difference of squares
4x^2 - 25 = (2x)^2 - 5^2 = (2x - 5)(2x + 5)

Step 4: Write final answer
4(2x - 5)(2x + 5)
Answer: 4(2x - 5)(2x + 5)

WRONG — NEVER DO THIS:
Step 1: Look for the biggest number that goes into both 16 and 100. That number is 4.
Step 2: Take the 4 out to get 4(4x^2 - 25).
(These step titles are sentences with the working inside them — wrong format)

FULL EXAMPLE for a distance/echo question:
"Use the echo formula — the sound travels to the cliff and back.\\nKey Formula: d = v*t/2\\nv = speed of sound = 250 m/s\\nt = time for echo to return\\nStep 1: First echo (t = 3.5 s)\\nd = 250*3.5/2\\nd = 875/2\\nd = 437.5 m\\nStep 2: Second echo (t = 2.5 s)\\nd = 250*2.5/2\\nd = 625/2\\nd = 312.5 m\\nStep 3: How much closer\\n437.5 - 312.5 = 125\\nAnswer: The cliff is 125 m closer"

RULES:
- Step label: SHORT (3–5 words only, NOT a full sentence)
- Working lines: one operation per line
- Show EVERY substitution — never skip a calculation step
- MATHS: wrap ALL mathematical expressions in $...$ so they render correctly
  Use: $\\frac{875}{2}$ not 875/2 | $250 \\times 3.5$ not 250*3.5
  Use: $x^2$ not x^2 | $d_1$ not d1 | $m\\,s^{-1}$ not m/s
  Use: $\\sqrt{9}$ not sqrt(9) | $\\pi$ not pi | $\\pm$ not +-`
    : `EXPLANATION FORMAT — CONCEPT/LANGUAGE SUBJECT (${subjDisplay}):

The explanation field must follow this EXACT structure. Each part on its own line using \\n.

REQUIRED STRUCTURE:
1. ONE clear opening sentence that directly states why the correct answer is right — no preamble
2. TWO to THREE sentences of supporting context that help the student genuinely understand
3. If the question tests a specific term or concept, add:
   "Key Concept: [the concept or rule in one sentence]"
4. For each WRONG option, add a line in this format:
   "A. [why option A is wrong — one sentence]"
   "C. [why option C is wrong — one sentence]"
   "D. [why option D is wrong — one sentence]"
   (skip the correct answer letter — only list the wrong ones)

STRICT RULES:
- Open with the WHY, not "The correct answer is..."
- Keep every sentence short enough for a student who got the question wrong to follow
- The "Key Concept" line should be the one thing they walk away remembering
- Wrong option explanations should feel educational, not critical

GOOD EXAMPLE (follow this exactly):
"Photosynthesis occurs in the chloroplasts because that is where chlorophyll is found, the pigment that absorbs light energy.\\nChlorophyll captures sunlight and uses it to convert carbon dioxide and water into glucose and oxygen.\\nKey Concept: Chloroplasts are the site of photosynthesis in plant cells.\\nA. The mitochondria is where respiration occurs, not photosynthesis.\\nC. The nucleus controls cell activity but is not involved in photosynthesis.\\nD. The vacuole stores water and dissolved substances — it plays no role in photosynthesis."

BAD EXAMPLE (never do this):
"The answer is B. Photosynthesis happens in the chloroplasts."`

  return `You are an expert ${subjDisplay} teacher creating ${typeContext} for ${classDisplay} students following the ${currContext}.

Generate exactly ${numQuestions} multiple choice questions on the topic: "${topic}"${descriptionLine}

STRICT OUTPUT FORMAT — return ONLY a valid JSON array, nothing else:
[
  {
    "question": "Full question text",
    "type": "mcq",
    "options": ["A. first option", "B. second option", "C. third option", "D. fourth option"],
    "answer": "B",
    "hint": "One sentence that helps the student think — does NOT give away the answer",
    "explanation": "see format rules below"
  }
]

${explanationFormat}

QUESTION RULES:
- Generate exactly ${numQuestions} questions
- Every question MUST have exactly 4 options: A, B, C, D
- SHUFFLE the correct answer — do not always put it as option A
- Match difficulty level appropriately for ${classDisplay}
- Return ONLY the JSON array — no markdown, no preamble, no extra text`
}

export default function AIGenerate({ setupData = null, onImport }) {
  // ── Null-safe defaults — works both from wizard (setupData set) ──────────
  // and from Question Bank standalone (setupData = null)
  const safeSetup = {
    subject:        setupData?.subject        ?? '',
    classLevel:     setupData?.classLevel     ?? '',
    assessmentType: setupData?.assessmentType ?? '',
    curriculum:     setupData?.curriculum     ?? '',
  }

  const [topic,        setTopic]        = useState('')
  const [description,  setDescription]  = useState('')
  const [numQuestions, setNumQuestions] = useState(10)
  const [copied,       setCopied]       = useState(false)
  const [pasted,       setPasted]       = useState('')
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [parsed,       setParsed]       = useState([])
  const [selected,     setSelected]     = useState(new Set())
  const [dragIndex,    setDragIndex]    = useState(null)
  const [curriculum,   setCurriculum]   = useState(safeSetup.curriculum || 'uk')

  // Standalone mode: let tutor pick subject + class themselves
  const [standaloneSubject, setStandaloneSubject] = useState(safeSetup.subject)
  const [standaloneClass,   setStandaloneClass]   = useState(safeSetup.classLevel)

  const isStandalone = !setupData  // true when opened from Question Bank

  // Load teacher's curriculum from their profile
  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return
        const { data: p } = await supabase
          .from('profiles')
          .select('curriculum')
          .eq('id', session.user.id)
          .single()
        if (p?.curriculum && !safeSetup.curriculum) {
          setCurriculum(p.curriculum)
        }
      } catch { /* fail silently */ }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Effective values — use wizard data if available, else standalone inputs
  const effectiveSubject     = isStandalone ? standaloneSubject : safeSetup.subject
  const effectiveClassLevel  = isStandalone ? standaloneClass   : safeSetup.classLevel
  const effectiveType        = safeSetup.assessmentType || 'quiz'

  const canGeneratePrompt = topic.trim().length > 0

  const prompt = canGeneratePrompt
    ? buildPrompt({
        topic,
        description,
        subject:        effectiveSubject,
        classLevel:     effectiveClassLevel,
        assessmentType: effectiveType,
        numQuestions,
        curriculum,
      })
    : ''

  const copyPrompt = () => {
    if (!prompt) return
    navigator.clipboard.writeText(prompt)
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
      if (!Array.isArray(result) || result.length === 0) throw new Error('Empty array')

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

  // ── Step 1: configure + generate prompt ───────────────────────────────
  if (parsed.length === 0) {
    return (
      <div className="flex flex-col gap-5">

        {/* Assessment context — from wizard if available */}
        {!isStandalone && (effectiveSubject || effectiveClassLevel || effectiveType) && (
          <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-brand-700 mb-2">
              Assessment context (from setup)
            </p>
            <div className="flex flex-wrap gap-2">
              {effectiveSubject && (
                <span className="text-xs bg-white border border-brand-200 text-brand-700 px-2 py-1 rounded-lg">
                  📚 {effectiveSubject.replace(/_/g, ' ')}
                </span>
              )}
              {effectiveClassLevel && (
                <span className="text-xs bg-white border border-brand-200 text-brand-700 px-2 py-1 rounded-lg">
                  🎓 {effectiveClassLevel.replace(/_/g, ' ').toUpperCase()}
                </span>
              )}
              {effectiveType && (
                <span className="text-xs bg-white border border-brand-200 text-brand-700 px-2 py-1 rounded-lg capitalize">
                  📋 {effectiveType}
                </span>
              )}
              <span className="text-xs bg-white border border-brand-200 text-brand-700 px-2 py-1 rounded-lg">
                🌍 {CURRICULUM_CONTEXT[curriculum]?.split(' (')[0] ?? 'General'}
              </span>
            </div>
          </div>
        )}

        {/* Standalone: let tutor enter subject + class + curriculum manually */}
        {isStandalone && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink-2">Subject</label>
                <input
                  type="text"
                  value={standaloneSubject}
                  onChange={(e) => setStandaloneSubject(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl text-sm text-ink bg-white outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink-2">Class / Grade</label>
                <input
                  type="text"
                  value={standaloneClass}
                  onChange={(e) => setStandaloneClass(e.target.value)}
                  placeholder="e.g. SS2 / Year 10"
                  className="w-full px-3 py-2.5 border-2 border-border rounded-xl text-sm text-ink bg-white outline-none focus:border-brand-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink-2">Curriculum</label>
              <select
                value={curriculum}
                onChange={(e) => setCurriculum(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-border rounded-xl text-sm text-ink bg-white outline-none focus:border-brand-500 cursor-pointer"
              >
                {Object.entries(CURRICULUM_CONTEXT).map(([k, v]) => (
                  <option key={k} value={k}>{v.split(' (')[0]}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Topic — required */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-2">
            Topic <span className="text-danger text-xs">*</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Simultaneous Equations, The Water Cycle, World War II"
            className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <p className="text-xs text-ink-4 px-0.5">
            Be specific — the more precise the topic, the better the questions.
          </p>
        </div>

        {/* Description — optional */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-2">
            Description{' '}
            <span className="text-ink-4 font-normal">(Optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you want the questions to be about. The more specific, the better and more accurate your questions will be."
            rows={3}
            className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
          />
          <p className="text-xs text-ink-4 px-0.5 leading-relaxed">
            💡 Tip: Include the difficulty level, specific subtopics, or any areas you want focused on.
          </p>
        </div>

        {/* Number of questions */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink-2">Number of questions</label>
          <div className="flex items-center gap-3">
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNumQuestions(n)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all',
                  numQuestions === n
                    ? 'border-brand-600 bg-brand-50 text-brand-800'
                    : 'border-border bg-white text-ink-3 hover:border-brand-200'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Generated prompt */}
        {canGeneratePrompt && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-ink-2">
                Your AI prompt — ready to copy
              </label>
              <button
                type="button"
                onClick={copyPrompt}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                  copied
                    ? 'bg-success-light text-success'
                    : 'bg-brand-800 text-white hover:bg-brand-700'
                )}
              >
                {copied
                  ? <><CheckCheck size={12} /> Copied!</>
                  : <><Copy size={12} /> Copy Prompt</>}
              </button>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 text-xs font-mono text-ink-3 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
              {prompt}
            </div>
            <div className="bg-amber-light border border-amber/20 rounded-xl px-4 py-3 text-xs text-amber leading-relaxed">
              <strong>Next:</strong> Copy this prompt → open ChatGPT, Gemini, or Claude → paste and send → copy the JSON response → paste it below
            </div>
          </div>
        )}

        {/* Paste area */}
        {canGeneratePrompt && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink-2">Paste the AI response here</label>
              <textarea
                value={pasted}
                onChange={(e) => { setPasted(e.target.value); setError('') }}
                placeholder={'[\n  {\n    "question": "...",\n    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],\n    "answer": "B"\n  }\n]'}
                rows={8}
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
        )}

        {!canGeneratePrompt && (
          <div className="bg-surface border border-border rounded-xl px-4 py-4 text-center">
            <p className="text-sm text-ink-4">Enter a topic above to generate your AI prompt.</p>
          </div>
        )}
      </div>
    )
  }

  // ── Step 2: review + select ────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-semibold text-ink text-sm">
            {parsed.length} question{parsed.length !== 1 ? 's' : ''} generated
          </p>
          <p className="text-xs text-ink-4 mt-0.5">Select the ones you want · drag to reorder</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-surface text-ink-3 hover:border-brand-400 transition-colors"
          >
            {selected.size === parsed.length ? 'Deselect all' : 'Select all'}
          </button>
          <button
            type="button"
            onClick={() => { setParsed([]); setPasted('') }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-surface text-ink-3 hover:border-danger transition-colors"
          >
            Regenerate
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
              <button
                type="button"
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