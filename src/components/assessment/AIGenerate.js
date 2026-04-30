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
// UI-only teaser for the upcoming in-app credits generation.
// Copy & Paste is always the active method — in-app is locked.
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
        {/* Coming Soon badge */}
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

      {/* Inline tooltip on tap */}
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

// ── Grade-level reference used in prompt ──────────────────────────────────
function gradeContext(classLevel) {
  const g = (classLevel ?? '').toLowerCase().replace(/_/g, ' ')
  // University — check first
  if (/university|tertiary|degree|undergraduate/i.test(g))
    return { band: 'University', desc: 'Advanced vocabulary, critical thinking, professional terminology.' }
  // Grade 10-12: SS (Senior Secondary), Year/Grade 10+, A-Level, GCSE
  // Must come before Grade 1-3 to avoid "year 10" matching "year [1-3]"
  if (/year 1[0-3]\b|grade 1[0-2]\b|\bss [1-3]\b|form [4-6]|a[.-]level|gcse/i.test(g))
    return { band: 'Grade 10–12', desc: 'Subject-appropriate vocabulary, analytical thinking, exam-standard questions.' }
  // Grade 1-3
  if (/\bgrade [1-3]\b|year [1-3]\b|class [1-3]\b|ks1|primary [1-3]/i.test(g))
    return { band: 'Grade 1–3', desc: 'Very simple words, short sentences, basic everyday concepts. No technical terms at all.' }
  // Grade 4-6
  if (/\bgrade [4-6]\b|year [4-6]\b|class [4-6]\b|primary [4-6]/i.test(g))
    return { band: 'Grade 4–6', desc: 'Simple vocabulary, familiar school topics, slightly longer sentences. Explain any term used.' }
  // Grade 7-9: JSS (Junior Secondary), Year/Grade 7-9
  if (/\bgrade [7-9]\b|year [7-9]\b|class [7-9]\b|\bjss\b|form [1-3]/i.test(g))
    return { band: 'Grade 7–9', desc: 'Moderate vocabulary, multi-step thinking, curriculum-standard concepts. Keep sentences clear.' }
  // Default fallback
  return { band: g || 'the selected class', desc: 'Match the expected curriculum level for this class.' }
}

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
  const isCalc = calcSubjects.some((s) => subjDisplay.toLowerCase().includes(s))

  // ── Explanation format — full spec ──────────────────────────────────────
  const explanationFormat = isCalc
    ? `EXPLANATION FORMAT — CALCULATION SUBJECT:

You are writing this explanation for a ${grade.band} student who just got this question wrong.
Your goal: a student who has NEVER seen this topic before should read this and fully understand it.

ASSUME NOTHING. Do not skip any step. Do not explain a term without defining it first.

LANGUAGE RULES:
- Maximum 15 words per sentence. If longer, split it.
- Never use: "therefore", "hence", "thus". Use "so", "because", "this means".
- Every sentence and every line of working gets its own line (use \\n between EVERY line)
- Wrap ALL maths in $...$: $\\frac{7}{10}$ not 7/10, $250 \\times 3.5$ not 250*3.5

MATHEMATICAL WORKING RULES — THESE ARE THE MOST IMPORTANT RULES:

RULE 1: SHOW the calculation — never just DESCRIBE it.
BAD: "We subtract 3 from 7 to get 4"
GOOD: $7 - 3 = 4$

BAD: "Multiplying 250 by 3.5 gives 875"
GOOD: $250 \\times 3.5 = 875$

RULE 2: Show every transformation on its own line.
Never jump from the question to the answer.
Each line must show the expression changing from one form to the next.
Example for $\\frac{7}{10} - \\frac{3}{10}$:
$\\frac{7}{10} - \\frac{3}{10}$        ← starting expression\\n
$= \\frac{7 - 3}{10}$                ← show what we are doing\\n
$= \\frac{4}{10}$                     ← show the result\\n

RULE 3: One operation per line. Never combine two steps on one line.

RULE 4: A student must be able to follow the numbers alone.
Cover the text labels — the working lines must still tell the complete story.

STRUCTURE — follow this EXACTLY:

Step 1: [What are we trying to find? — one simple sentence]\\n
[Write the formula or rule. Explain what each letter/symbol means.]\\n
Step 2: [Short label — 3 to 4 words]\\n
[Show the expression with numbers substituted in — one line]\\n
[Show each calculation — one operation per line, never skip any]\\n
Step 3: [Short label — 3 to 4 words]\\n
[Continue until final answer — one operation per line]\\n
✅ The answer is [CORRECT ANSWER] because [one simple sentence]\\n
💡 Remember: [One rule for next time — maximum 10 words]

GOOD EXAMPLE — fraction subtraction:
"Step 1: We need to subtract two fractions with the same bottom number.\\nStep 2: Write the starting expression\\n$\\frac{7}{10} - \\frac{3}{10}$\\nThe bottom numbers (denominators) are the same.\\nSo we only subtract the top numbers.\\nStep 3: Subtract\\n$= \\frac{7 - 3}{10}$\\n$= \\frac{4}{10}$\\n✅ The answer is $\\frac{4}{10}$ because we subtracted the top numbers and kept the same denominator.\\n💡 Remember: Same denominator — only subtract the top numbers."

GOOD EXAMPLE — distance/time:
"Step 1: We need to find the distance to the cliff.\\nStep 2: Write the formula\\n$d = \\frac{v \\times t}{2}$\\n$v$ = speed = 250 m/s. $t$ = time = 3.5 s.\\nWe divide by 2 because sound travels TO the cliff AND back.\\nStep 3: Substitute the numbers\\n$d = \\frac{250 \\times 3.5}{2}$\\n$d = \\frac{875}{2}$\\n$d = 437.5$ m\\n✅ The answer is 437.5 m because the sound took 3.5 s at 250 m/s to travel there and back.\\n💡 Remember: Divide by 2 in echo questions — sound makes a return trip."`
    : `EXPLANATION FORMAT — CONCEPT/LANGUAGE SUBJECT:

You are writing this explanation for a ${grade.band} student who just got this question wrong.
Your goal: a student who has NEVER studied this topic should read this and fully understand it.

ASSUME NOTHING. Explain every term. Never skip the reason.

USE THESE EXACT RULES:
- Maximum 15 words per sentence. If longer, split into two sentences.
- Never use: "therefore", "hence", "thus". Use "so", "because", "this means".
- Every sentence is its own line (use \\n between every single line)
- Simple words always — if a simpler word exists, use it

STRUCTURE — follow this EXACTLY:

[What IS the correct answer? State it in plain language — one sentence]\\n
[WHY is it correct? Give the simplest possible reason — one sentence]\\n
[Help them remember: a context, example, or memory tip — one sentence]\\n
Key Concept: [The one rule or definition to remember — one sentence]\\n
[For each WRONG option, one line: "A. [Why option A is wrong — one short sentence]"]\\n
✅ The answer is [CORRECT ANSWER] because [one simple sentence]\\n
💡 Remember: [One simple rule for next time — maximum 10 words]

GOOD EXAMPLE (use this quality as your standard):
"Photosynthesis happens in the chloroplasts.\\nChloroplasts contain chlorophyll — the green pigment that captures light.\\nThink of chloroplasts as the plant's solar panels.\\nKey Concept: Chloroplasts are where plants make their food using light.\\nA. The mitochondria releases energy from food — it does not make food.\\nC. The nucleus controls the cell but is not involved in photosynthesis.\\nD. The vacuole stores water and has no role in photosynthesis.\\n✅ The answer is B because chloroplasts are the only organelle that carries out photosynthesis.\\n💡 Remember: Chloroplasts do photosynthesis — mitochondria do respiration."`

  const isTrueFalse = questionType === 'true_false'

  const outputFormat = isTrueFalse
    ? `OUTPUT FORMAT — return ONLY a valid JSON array, nothing else:
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
    : `OUTPUT FORMAT — return ONLY a valid JSON array, nothing else:
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
  const [partialMsg,    setPartialMsg]    = useState('')
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
        topic: topic,
        description: description,
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
              <span className="text-xs bg-white border border-brand-200 text-brand-700 px-2 py-1 rounded-lg">
                {questionType === 'true_false' ? '✅ True or False' : '🔘 Multiple Choice'}
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

        {/* Generation method selector — credits teaser */}
        {FLAGS.CREDITS_COMING_SOON_UI && <GenerationMethodSelector />}

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
                onChange={(e) => { setPasted(e.target.value); setError(''); setPartialMsg('') }}
                placeholder={'[\n  {\n    "question": "...",\n    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],\n    "answer": "B"\n  }\n]'}
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