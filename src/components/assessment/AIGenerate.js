'use client'

import { useState, useEffect } from 'react'
import { parseAIResponse } from '@/lib/parseAIResponse'
import { createClient } from '@/lib/supabase/client'
import MathRenderer from '@/components/ui/MathRenderer'
import {
  Copy, CheckCheck, Sparkles,
  AlertCircle, GripVertical, Check, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FLAGS } from '@/lib/featureFlags'

// ── Generation method selector ────────────────────────────────────────────
function GenerationMethodSelector() {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-ink-2">How would you like to generate?</p>

      {/* Copy & Paste — active */}
      <div className="flex items-start gap-3 p-4 rounded-2xl border-2 border-brand-500 bg-brand-50 cursor-default">
        <div className="w-4 h-4 rounded-full border-2 border-brand-600 bg-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-ink">Copy &amp; Paste</p>
          <p className="text-xs text-ink-3 mt-0.5 leading-relaxed">
            Generate using ChatGPT or Gemini — copy the prompt, paste the response
          </p>
        </div>
      </div>

      {/* Generate In-App — coming soon */}
      <div
        className="flex items-start gap-3 p-4 rounded-2xl border-2 border-border bg-surface cursor-not-allowed relative"
        onClick={() => setShowTooltip((v) => !v)}
      >
        <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-500 border border-brand-100">
          ✨ Coming Soon
        </span>
        <div className="w-4 h-4 rounded-full border-2 border-border bg-white flex-shrink-0 mt-0.5 opacity-50" />
        <div className="opacity-50">
          <p className="text-sm font-bold text-ink-3">Generate In-App</p>
          <p className="text-xs text-ink-4 mt-0.5 leading-relaxed">
            Generate instantly with credits — no copy-pasting needed
          </p>
        </div>
      </div>

      {showTooltip && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 text-sm text-brand-700 leading-relaxed">
          In-app generation with credits is coming soon. You'll be able to generate
          questions instantly — no copy-pasting needed.{' '}
          <a href="/dashboard/credits" className="font-semibold underline underline-offset-2 hover:text-brand-500">
            Learn more →
          </a>
        </div>
      )}
    </div>
  )
}

// ── Curriculum context ─────────────────────────────────────────────────────
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

// ── Grade-level reference ──────────────────────────────────────────────────
function gradeContext(classLevel) {
  const g = (classLevel ?? '').toLowerCase().replace(/_/g, ' ')
  if (/university|tertiary|degree|undergraduate/i.test(g))
    return { band: 'University', desc: 'Advanced vocabulary, critical thinking, professional terminology.' }
  if (/year 1[0-3]\b|grade 1[0-2]\b|\bss [1-3]\b|form [4-6]|a[.-]level|gcse/i.test(g))
    return { band: 'Grade 10–12', desc: 'Subject-appropriate vocabulary, analytical thinking, exam-standard questions.' }
  if (/\bgrade [1-3]\b|year [1-3]\b|class [1-3]\b|ks1|primary [1-3]/i.test(g))
    return { band: 'Grade 1–3', desc: 'Very simple words, short sentences, basic everyday concepts. No technical terms at all.' }
  if (/\bgrade [4-6]\b|year [4-6]\b|class [4-6]\b|primary [4-6]/i.test(g))
    return { band: 'Grade 4–6', desc: 'Simple vocabulary, familiar school topics, slightly longer sentences. Explain any term used.' }
  if (/\bgrade [7-9]\b|year [7-9]\b|class [7-9]\b|\bjss\b|form [1-3]/i.test(g))
    return { band: 'Grade 7–9', desc: 'Moderate vocabulary, multi-step thinking, curriculum-standard concepts. Keep sentences clear.' }
  return { band: g || 'the selected class', desc: 'Match the expected curriculum level for this class.' }
}

// ── Prompt builder ─────────────────────────────────────────────────────────
function buildPrompt({ topic, description, subject, classLevel, assessmentType, numQuestions, curriculum, questionType = 'mcq' }) {
  const currContext  = CURRICULUM_CONTEXT[curriculum]  ?? CURRICULUM_CONTEXT.other
  const typeContext  = ASSESSMENT_TYPE_CONTEXT[assessmentType] ?? ASSESSMENT_TYPE_CONTEXT.quiz
  const classDisplay = classLevel?.replace(/_/g, ' ')?.toUpperCase() ?? 'the class'
  const subjDisplay  = subject?.replace(/_/g, ' ') ?? 'the subject'
  const grade        = gradeContext(classLevel)

  const descriptionLine = description?.trim()
    ? `\nAdditional context: "${description.trim()}"\n`
    : ''

  const calcSubjects = ['mathematics', 'maths', 'math', 'physics', 'chemistry',
    'statistics', 'further mathematics', 'further_mathematics']
  const isCalcSubject = calcSubjects.some((s) => subjDisplay.toLowerCase().includes(s))

  // ── Explanation format ─────────────────────────────────────────────────
  const explanationFormat = isCalcSubject
    ? `EXPLANATION FORMAT — CALCULATION SUBJECT:

You are writing this explanation for a ${grade.band} student who just got this question wrong.
Your goal: a student who has NEVER seen this topic before should read this and fully understand it.

ASSUME NOTHING. Do not skip any step. Do not explain a term without defining it first.

LANGUAGE RULES:
- Maximum 15 words per sentence. If longer, split it.
- Never use: "therefore", "hence", "thus". Use "so", "because", "this means".
- Every sentence and every line of working gets its own line (use \\n between EVERY line)
- Wrap ALL maths in $...$: $\\frac{7}{10}$ not 7/10, $250 \\times 3.5$ not 250*3.5

MATHEMATICAL WORKING RULES:
RULE 1: SHOW the calculation — never just DESCRIBE it.
BAD: "We subtract 3 from 7 to get 4"
GOOD: $7 - 3 = 4$

RULE 2: Show every transformation on its own line.
Never jump from the question to the answer.

RULE 3: One operation per line. Never combine two steps on one line.

STRUCTURE — follow this EXACTLY:
Step 1: [What are we trying to find? — one sentence]\\n
[Write the formula or rule — explain each variable]\\n
Step 2: [Short label — 3 to 4 words]\\n
[Substitute numbers in — show every step]\\n
Step 3 (and so on until final answer)\\n
✅ The answer is [answer] because [one clear sentence]\\n
💡 Remember: [one rule — max 10 words]`
    : `EXPLANATION FORMAT — NON-STEM:
Write short clear paragraphs. One idea per paragraph.
Explain WHY the correct answer is right.
End with: ✅ The answer is [answer] because [one sentence]
Then: 💡 Remember: [one memorable tip — max 10 words]`

  // ── Output format — branched by question type ──────────────────────────
  const isTrueFalse   = questionType === 'true_false'
  const isCalculation = questionType === 'calculation'

  let outputFormat

  if (isCalculation) {
    outputFormat = `OUTPUT FORMAT — return ONLY a valid JSON array, nothing else:
[
  {
    "question_text": "Full question text — written for ${grade.band}",
    "answer_template": {
      "type": "number|decimal|fraction|power|simultaneous|coordinates|percentage|ratio|angle|scientific|surd|two_roots|units",
      "structure": [
        {
          "id": "unique_box_id",
          "label": "x",
          "answer": "correct answer as string",
          "accepted": ["3", "3.0"]
        }
      ]
    },
    "explanation": "see explanation format below",
    "hint": "a helpful hint without giving away the answer"
  }
]

ANSWER TEMPLATE RULES — pick the type that matches the question's answer:
- "number"       → single numerical answer: one box, id="ans"
- "decimal"      → single decimal answer: one box, id="ans"
- "fraction"     → answer is a fraction: id="num" for numerator, id="den" for denominator
- "power"        → answer as base^exponent: id="base" and id="exp"
- "simultaneous" → two variables (x and y): one box per variable, label = variable name
- "coordinates"  → answer is a point (x, y): id="x" and id="y"
- "percentage"   → answer is a percentage: one box, no % symbol in answer value
- "ratio"        → answer is a ratio a:b: two boxes
- "angle"        → answer in degrees: one box, no ° symbol in answer value
- "scientific"   → scientific notation: id="coeff" for coefficient, id="exp" for exponent
- "surd"         → surd form a√b: id="coeff" and id="rad"
- "two_roots"    → quadratic two roots: id="x1" and id="x2"
- "units"        → answer with a unit — add "unit": "m/s" at the template level, id="ans"

accepted[] rules:
- Include ALL valid string forms of the answer
- e.g. answer "3" → accepted ["3", "3.0"]
- e.g. answer "0.5" → accepted ["0.5", ".5"]
- e.g. negative "-4" → accepted ["-4", "- 4"]

Generate exactly ${numQuestions} calculation questions.
Return ONLY the JSON array — no markdown, no preamble, no extra text.`

  } else if (isTrueFalse) {
    outputFormat = `OUTPUT FORMAT — return ONLY a valid JSON array, nothing else:
[
  {
    "question": "Full statement text — written for ${grade.band}",
    "question_type": "true_false",
    "correct_answer": "True",
    "hint": "One sentence nudge — does NOT give away the answer",
    "explanation": "see explanation format below"
  }
]

QUESTION RULES:
- Generate exactly ${numQuestions} true or false statements
- Each statement must be DEFINITIVELY true or false — never ambiguous
- DO NOT include statements where "it depends" could be a valid answer
- Mix true and false answers — do not always make the answer the same
- Statements should be clear, specific, and test genuine understanding
- Return ONLY the JSON array — no markdown, no preamble, no extra text`

  } else {
    // MCQ (default)
    outputFormat = `OUTPUT FORMAT — return ONLY a valid JSON array, nothing else:
[
  {
    "question": "Full question text — written for ${grade.band}",
    "type": "mcq",
    "options": ["A. first option", "B. second option", "C. third option", "D. fourth option"],
    "answer": "B",
    "hint": "One sentence nudge — does NOT give away the answer — appropriate for ${grade.band}",
    "explanation": "see explanation format below"
  }
]

QUESTION RULES:
- Generate exactly ${numQuestions} questions
- Every question MUST have exactly 4 options: A, B, C, D
- SHUFFLE the correct answer — do not always put it as A or B
- Questions must genuinely test understanding, not just recall
- Return ONLY the JSON array — no markdown, no preamble, no extra text`
  }

  return `You are an expert ${subjDisplay} teacher.
You are creating ${typeContext} questions for ${classDisplay} students following the ${currContext}.

═══════════════════════════════════════════
GRADE LEVEL: ${grade.band}
${grade.desc}
═══════════════════════════════════════════

GRADE-LEVEL RULES — NON-NEGOTIABLE:
- Every question must be written for a ${grade.band} student — not younger, not older
- Vocabulary: use only words a ${grade.band} student would know
- Sentence length: match the reading level of ${grade.band}
- Concepts: stay within the ${grade.band} curriculum — never introduce higher-grade concepts
- Numbers and values: appropriate complexity for ${grade.band}
- Examples and contexts: relatable to a ${grade.band} student's life and experience

TOPIC: "${topic}"${descriptionLine}

${outputFormat}

${explanationFormat}
`
}


export default function AIGenerate({ setupData = null, onImport, questionType = 'mcq' }) {
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
  const [partialMsg,   setPartialMsg]   = useState('')
  const [loading,      setLoading]      = useState(false)
  const [parsed,       setParsed]       = useState([])
  const [selected,     setSelected]     = useState(new Set())
  const [dragIndex,    setDragIndex]    = useState(null)
  const [curriculum,   setCurriculum]   = useState(safeSetup.curriculum || 'uk')

  const [standaloneSubject, setStandaloneSubject] = useState(safeSetup.subject)
  const [standaloneClass,   setStandaloneClass]   = useState(safeSetup.classLevel)

  const isStandalone = !setupData

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

  const effectiveSubject    = isStandalone ? standaloneSubject : safeSetup.subject
  const effectiveClassLevel = isStandalone ? standaloneClass   : safeSetup.classLevel
  const effectiveType       = safeSetup.assessmentType || 'quiz'

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
        questionType,
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
    setPartialMsg('')
    setLoading(true)

    const result = parseAIResponse(pasted, questionType)

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

  // ── Step 1: configure + generate prompt ───────────────────────────────
  if (parsed.length === 0) {
    const questionTypeLabel =
      questionType === 'true_false'   ? '✅ True or False' :
      questionType === 'calculation'  ? '🔢 Calculation' :
                                        '🔘 Multiple Choice'

    const pastePlaceholder =
      questionType === 'calculation'
        ? '[\n  {\n    "question_text": "...",\n    "answer_template": {\n      "type": "number",\n      "structure": [{ "id": "ans", "label": "Answer", "answer": "42", "accepted": ["42"] }]\n    },\n    "explanation": "...",\n    "hint": "..."\n  }\n]'
        : '[\n  {\n    "question": "...",\n    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],\n    "answer": "B"\n  }\n]'

    return (
      <div className="flex flex-col gap-5">

        {/* Assessment context badge strip */}
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
              <span className="text-xs bg-white border border-brand-200 text-brand-700 px-2 py-1 rounded-lg">
                {questionTypeLabel}
              </span>
            </div>
          </div>
        )}

        {/* Standalone: tutor enters subject + class + curriculum manually */}
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
              <div className="relative">
                <select
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 pr-9 border-2 border-border rounded-xl text-sm text-ink bg-white outline-none cursor-pointer focus:border-brand-500 focus:ring-2 focus:ring-brand-100 hover:border-brand-300 transition-colors"
                >
                  {Object.entries(CURRICULUM_CONTEXT).map(([k, v]) => (
                    <option key={k} value={k}>{v.split(' (')[0]}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <ChevronDown size={15} className="text-ink-4" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Topic */}
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

        {/* Description */}
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
                onChange={(e) => { setPasted(e.target.value); setError(''); setPartialMsg('') }}
                placeholder={pastePlaceholder}
                rows={8}
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
                  isSelected ? 'border-brand-500 bg-brand-500' : 'border-border bg-white'
                )}
              >
                {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink leading-snug">
                  <MathRenderer text={q.text || q.question || q.question_text || ''} />
                </p>
                {q.answer_template && (
                  <p className="text-xs text-brand-500 mt-1 font-semibold">
                    Answer type: {q.answer_template.type}
                  </p>
                )}
                {q.options && q.options.length > 0 && (
                  <div className="mt-2 flex flex-col gap-0.5">
                    {q.options.map((opt, oi) => (
                      <p key={oi} className={cn(
                        'text-xs',
                        opt.startsWith(q.answer) ? 'text-success font-semibold' : 'text-ink-3'
                      )}>
                        {opt}
                      </p>
                    ))}
                  </div>
                )}
                {(q.type === 'truefalse' || q.question_type === 'true_false') && (
                  <p className="text-xs text-success font-semibold mt-1">
                    Answer: {q.answer}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          type="button"
          onClick={() => { setParsed([]); setPasted('') }}
          className="text-xs font-semibold text-ink-3 hover:text-ink transition-colors"
        >
          ← Start over
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selected.size === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-800 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add {selected.size} Question{selected.size !== 1 ? 's' : ''} →
        </button>
      </div>
    </div>
  )
}