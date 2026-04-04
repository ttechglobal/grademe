'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import MathRenderer from '@/components/ui/MathRenderer'
import {
  Copy, CheckCheck, Sparkles,
  AlertCircle, GripVertical, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CURRICULUM_CONTEXT = {
  uk:            'UK curriculum (GCSE/A-Level standard)',
  us:            'US curriculum (Common Core standard)',
  nigerian:      'Nigerian curriculum (WAEC/NECO standard)',
  international: 'International Baccalaureate (IB) curriculum',
  india:         'Indian curriculum (CBSE/ICSE standard)',
  other:         'general curriculum',
}

const ASSESSMENT_TYPE_CONTEXT = {
  assignment: 'a take-home assignment (questions should encourage thinking and working through problems step by step — not too easy, requires some effort)',
  quiz:       'a quick in-class quiz (questions should be concise and directly test immediate understanding of the topic)',
  test:       'a formal test or exam (questions should vary in difficulty — include straightforward, moderate, and challenging questions)',
}

function buildPrompt({
  topic, description, subject, classLevel,
  assessmentType, numQuestions, curriculum,
}) {
  const currContext  = CURRICULUM_CONTEXT[curriculum]  ?? CURRICULUM_CONTEXT.other
  const typeContext  = ASSESSMENT_TYPE_CONTEXT[assessmentType] ?? ASSESSMENT_TYPE_CONTEXT.quiz
  const classDisplay = classLevel?.replace(/_/g, ' ')?.toUpperCase() ?? 'the class'
  const subjDisplay  = subject?.replace(/_/g, ' ') ?? 'the subject'

  return `You are an expert ${subjDisplay} teacher creating ${typeContext} for ${classDisplay} students following the ${currContext}.

Topic: "${topic}"

What to test:
${description}

Generate exactly ${numQuestions} multiple choice questions based on the topic and description above.

STRICT OUTPUT FORMAT — return ONLY a valid JSON array, nothing else:
[
  {
    "question": "Full question text",
    "type": "mcq",
    "options": ["A. first option", "B. second option", "C. third option", "D. fourth option"],
    "answer": "B",
    "hint": "A helpful nudge without giving away the answer",
    "explanation": "Step 1: ...\\nStep 2: ...\\nAnswer: ..."
  }
]

RULES:
- Generate exactly ${numQuestions} questions
- Every question MUST have exactly 4 options: A, B, C, D
- SHUFFLE the correct answer — do not always make it A
- Questions must directly reflect the topic and description above
- Difficulty should match: ${typeContext}
- For maths/science: use plain text notation (e.g. x^2 + 3x = 10, 3/4, sqrt(16))
- Explanations: step by step, each step on its own line, end with "Answer: [answer]"
- Keep language appropriate for ${classDisplay} students
- Return ONLY the JSON array — no introduction, no markdown, no extra text`
}

export default function AIGenerate({ setupData, onImport }) {
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
  const [curriculum,   setCurriculum]   = useState('uk')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const { data: p } = await supabase
        .from('profiles')
        .select('curriculum')
        .eq('id', session.user.id)
        .single()
      if (p?.curriculum) setCurriculum(p.curriculum)
    }
    load()
  }, [])

  const canGeneratePrompt = topic.trim().length > 0 && description.trim().length > 0

  const prompt = canGeneratePrompt
    ? buildPrompt({
        topic,
        description,
        subject:        setupData.subject,
        classLevel:     setupData.classLevel,
        assessmentType: setupData.assessmentType,
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
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error('Empty array')
      }

      const mapped = result
        .map((q) => ({
          id:          Math.random().toString(36).slice(2),
          type:        'mcq',
          text:        q.question || q.text || '',
          options:     Array.isArray(q.options) && q.options.length === 4
                         ? q.options
                         : ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'],
          answer:      q.answer   || 'A',
          hint:        q.hint        || '',
          explanation: q.explanation || '',
        }))
        .filter((q) => q.text.trim().length > 0)

      if (mapped.length === 0) throw new Error('No valid questions found')

      setParsed(mapped)
      setSelected(new Set(mapped.map((q) => q.id)))
    } catch {
      setError(
        'Could not parse the AI response. Make sure you copied the full JSON array.'
      )
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

  // ── Step 1: configure + get prompt ──────────────────────────────────────
  if (parsed.length === 0) {
    return (
      <div className="flex flex-col gap-5">

        {/* Pre-filled context */}
        <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-brand-700 mb-2">
            Assessment context (from setup)
          </p>
          <div className="flex flex-wrap gap-2">
            {setupData.subject && (
              <span className="text-xs bg-white border border-brand-200 text-brand-700 px-2 py-1 rounded-lg">
                📚 {setupData.subject.replace(/_/g, ' ')}
              </span>
            )}
            {setupData.classLevel && (
              <span className="text-xs bg-white border border-brand-200 text-brand-700 px-2 py-1 rounded-lg">
                🎓 {setupData.classLevel.replace(/_/g, ' ').toUpperCase()}
              </span>
            )}
            {setupData.assessmentType && (
              <span className="text-xs bg-white border border-brand-200 text-brand-700 px-2 py-1 rounded-lg capitalize">
                📋 {setupData.assessmentType}
              </span>
            )}
          </div>
        </div>

        {/* Topic */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-2">
            Topic <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Simultaneous Equations, Photosynthesis, The Cold War"
            className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-white"
          />
          <p className="text-xs text-ink-4 px-1">
            Be specific — the more precise the topic, the better the questions
          </p>
        </div>

        {/* Description — new required field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-2">
            Description <span className="text-danger">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you want to test the students on. The more specific and detailed you are, the better the questions will be.

For example: 'Students should be able to solve simultaneous equations using the elimination method. Focus on two-variable systems. Include questions where they must choose which method to use. Avoid word problems for now.'"
            rows={5}
            className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-white resize-none"
          />
          <p className="text-xs text-ink-4 px-1">
            Be as descriptive as possible — mention specific concepts, difficulty level, or areas you want to focus on
          </p>
        </div>

        {/* Number of questions */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-ink-2">
            Number of questions
          </label>
          <div className="flex items-center gap-3">
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
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
              <label className="text-sm font-medium text-ink-2">
                Your AI prompt — ready to copy
              </label>
              <Button
                variant={copied ? 'secondary' : 'primary'}
                size="sm"
                onClick={copyPrompt}
              >
                {copied
                  ? <><CheckCheck size={13} className="text-success" /> Copied!</>
                  : <><Copy size={13} /> Copy Prompt</>
                }
              </Button>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 text-xs font-mono text-ink-3 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
              {prompt}
            </div>
            <div className="bg-amber-light border border-amber/20 rounded-xl px-4 py-3 text-xs text-amber leading-relaxed">
              <strong>Next steps:</strong> Copy the prompt above → Open ChatGPT, Gemini, or Claude → Paste and send → Copy the JSON response → Paste it below
            </div>
          </div>
        )}

        {/* Prompt not ready notice */}
        {!canGeneratePrompt && (topic.trim() || description.trim()) && (
          <div className="bg-surface border border-border rounded-xl px-4 py-3 text-sm text-ink-4">
            Fill in both <strong>Topic</strong> and <strong>Description</strong> to generate your prompt
          </div>
        )}

        {/* Paste area — only show when prompt is ready */}
        {canGeneratePrompt && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-ink-2">
                Paste the AI response here
              </label>
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

            <Button
              variant="primary"
              onClick={handleParse}
              loading={loading}
              disabled={!pasted.trim()}
            >
              <Sparkles size={15} />
              Extract Questions
            </Button>
          </>
        )}
      </div>
    )
  }

  // ── Step 2: review + select ──────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-semibold text-ink text-sm">
            {parsed.length} question{parsed.length !== 1 ? 's' : ''} generated
          </p>
          <p className="text-xs text-ink-4 mt-0.5">
            Select the ones you want · drag to reorder
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-surface text-ink-3 hover:border-brand-400 transition-colors"
          >
            {selected.size === parsed.length ? 'Deselect all' : 'Select all'}
          </button>
          <button
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
                isSelected
                  ? 'border-brand-400 bg-brand-50'
                  : 'border-border bg-white opacity-60'
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
                {isSelected && (
                  <Check size={11} className="text-white" strokeWidth={3} />
                )}
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
                        <p
                          key={oi}
                          className={cn(
                            'text-xs px-2 py-1 rounded',
                            isAnswer
                              ? 'bg-success-light text-success font-semibold'
                              : 'text-ink-4'
                          )}
                        >
                          <MathRenderer text={opt} /> {isAnswer && '✓'}
                        </p>
                      )
                    })}
                  </div>
                )}

                {q.hint && (
                  <p className="text-xs text-amber mt-1.5">💡 {q.hint}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-sm text-ink-4">
          {selected.size} of {parsed.length} selected
        </p>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={selected.size === 0}
        >
          <Sparkles size={15} />
          Use {selected.size} Question{selected.size !== 1 ? 's' : ''} →
        </Button>
      </div>
    </div>
  )
}