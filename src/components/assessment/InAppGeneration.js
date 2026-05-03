'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Zap, ChevronDown } from 'lucide-react'
import { useCredits } from '@/hooks/useCredits'
import { cn } from '@/lib/utils'
import Link from 'next/link'

function calcCost(questionType, count) { return count }

const QUESTION_COUNTS = [3, 5, 10, 15, 20]
const DIFFICULTIES    = ['easy', 'medium', 'hard']

const ACADEMIC_STYLES = [
  { id: 'standard',     label: 'Standard Academic',       desc: 'Rigorous and balanced — suitable for most university examinations' },
  { id: 'cambridge',    label: 'Cambridge Style',         desc: 'Analytical and structured — favours application and scenario-based thinking' },
  { id: 'oxford',       label: 'Oxford Style',            desc: 'Critical thinking focus — tests depth of understanding and reasoning' },
  { id: 'harvard',      label: 'Harvard Style',           desc: 'Case-based and applied — practical scenarios and real-world application' },
  { id: 'professional', label: 'Professional / Industry', desc: 'Certification-style — precise technical knowledge testing' },
]

export default function InAppGeneration({
  onImport,
  setupData    = {},
  questionType = 'mcq',
  useCase      = 'k12_tutor',
}) {
  const { credits, loading: creditsLoading, refresh: refreshCredits } = useCredits()
  const isUniversity = useCase === 'university'

  const [topic,         setTopic]         = useState('')
  const [count,         setCount]         = useState(5)
  const [difficulty,    setDifficulty]    = useState('medium')
  const [extraContext,  setExtraContext]   = useState('')
  const [academicStyle, setAcademicStyle] = useState('standard')
  const [showAdvanced,  setShowAdvanced]  = useState(false)
  const [generating,    setGenerating]    = useState(false)
  const [error,         setError]         = useState('')
  const [showBuyHint,   setShowBuyHint]   = useState(false)

  const cost        = calcCost(questionType, count)
  const canAfford   = creditsLoading || credits >= cost
  const canGenerate = topic.trim().length > 0 && !creditsLoading && credits >= cost && !generating

  const questionTypeLabel =
    questionType === 'true_false'  ? 'True/False' :
    questionType === 'calculation' ? 'Calculation' :
                                     'MCQ'

  const handleGenerate = async () => {
    if (!canGenerate) return
    setGenerating(true)
    setError('')
    setShowBuyHint(false)

    try {
      const res = await fetch('/api/generate/questions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionType,
          subject:           setupData.subject   || 'General',
          topic:             topic.trim(),
          gradeLevel:        setupData.classLevel || setupData.gradeLevel || 'General',
          curriculum:        setupData.curriculum,
          difficulty,
          numberOfQuestions: count,
          additionalContext: extraContext.trim()  || undefined,
          useCase,
          academicStyle:     isUniversity ? academicStyle : 'standard',
        }),
      })

      const data = await res.json()

      if (data.success && data.questions?.length > 0) {
        await refreshCredits()
        onImport?.(data.questions)
      } else if (data.errorCode === 'INSUFFICIENT_CREDITS') {
        setShowBuyHint(true)
        setError(data.error)
      } else {
        setError(data.error || 'Generation failed. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setGenerating(false)
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-amber" />
          <h2 className="font-display text-xl font-bold text-ink">Generate with AI</h2>
        </div>
        <p className="text-sm text-ink-3">
          Describe a topic and AI will build {count} {questionTypeLabel} question{count !== 1 ? 's' : ''} instantly.
        </p>
      </div>

      {/* Credits indicator */}
      {!creditsLoading && (
        <div className={cn(
          'flex items-center justify-between px-4 py-3 rounded-xl border',
          canAfford ? 'bg-brand-50 border-brand-200' : 'bg-danger-light border-danger/30'
        )}>
          <div className="flex items-center gap-2">
            <Zap size={14} className={canAfford ? 'text-brand-600' : 'text-danger'} />
            <span className={cn('text-sm font-semibold', canAfford ? 'text-brand-700' : 'text-danger')}>
              {credits} credit{credits !== 1 ? 's' : ''} available
            </span>
          </div>
          <span className={cn('text-xs', canAfford ? 'text-brand-500' : 'text-danger')}>
            This will use {cost} credit{cost !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Topic */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-ink-2">Topic <span className="text-danger">*</span></label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={isUniversity
            ? 'e.g. Central Dogma of Molecular Biology, Keynesian Economics…'
            : 'e.g. Quadratic equations, Photosynthesis, World War 2…'}
          className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 hover:border-brand-300 transition-all"
        />
      </div>

      {/* Question count */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-ink-2">Number of questions</label>
        <div className="flex gap-2 flex-wrap">
          {QUESTION_COUNTS.map((n) => (
            <button key={n} type="button" onClick={() => setCount(n)}
              className={cn('px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all',
                count === n ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-border bg-white text-ink hover:border-brand-200')}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-ink-2">Difficulty</label>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button key={d} type="button" onClick={() => setDifficulty(d)}
              className={cn('flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all capitalize',
                difficulty === d
                  ? 'border-brand-600 bg-brand-50 text-brand-800'
                  : 'border-border bg-white text-ink hover:border-brand-200')}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Academic style — university only */}
      {isUniversity && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-ink-2">Academic Style</label>
          <div className="flex flex-col gap-2">
            {ACADEMIC_STYLES.map((s) => (
              <button key={s.id} type="button" onClick={() => setAcademicStyle(s.id)}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
                  academicStyle === s.id
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-border bg-white hover:border-brand-200'
                )}>
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors',
                  academicStyle === s.id ? 'border-brand-600 bg-brand-600' : 'border-border'
                )} />
                <div>
                  <p className={cn('text-sm font-semibold', academicStyle === s.id ? 'text-brand-800' : 'text-ink')}>
                    {s.label}
                  </p>
                  <p className="text-xs text-ink-3 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced options */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink-3 hover:text-ink transition-colors"
        >
          <ChevronDown size={15} className={cn('transition-transform', showAdvanced && 'rotate-180')} />
          Advanced options
        </button>
        {showAdvanced && (
          <div className="mt-3 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-2">
              Extra context <span className="text-ink-4 font-normal">(optional)</span>
            </label>
            <textarea
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              placeholder="Any specific focus, subtopics, or instructions for the AI…"
              rows={3}
              className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 resize-none"
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Buy hint */}
      {showBuyHint && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 text-sm text-brand-700 leading-relaxed">
          You need more credits to generate questions.{' '}
          <Link href="/dashboard/credits" className="font-bold underline underline-offset-2">
            Buy credits →
          </Link>
        </div>
      )}

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate}
        className={cn(
          'flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all',
          canGenerate
            ? 'bg-brand-800 text-white hover:bg-brand-700 active:scale-[0.98]'
            : 'bg-border text-ink-4 cursor-not-allowed'
        )}
      >
        {generating
          ? <><Loader2 size={16} className="animate-spin" /> Generating…</>
          : <><Sparkles size={16} /> Generate {count} {questionTypeLabel} Question{count !== 1 ? 's' : ''} ({cost} credit{cost !== 1 ? 's' : ''})</>
        }
      </button>
    </div>
  )
}