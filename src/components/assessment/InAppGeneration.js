'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Zap, Check, Trash2, ChevronDown, ChevronUp, RefreshCw, Info } from 'lucide-react'
import { useCredits } from '@/hooks/useCredits'
import MathRenderer from '@/components/ui/MathRenderer'
import { cn } from '@/lib/utils'
import Link from 'next/link'

function calcCost(questionType, count) { return count }

const QUESTION_COUNTS = [3, 5, 10, 15, 20]

const DIFFICULTY_OPTIONS = [
  { id: 'easy',   label: 'Easy',   emoji: '🟢', desc: 'Foundation — recall and basic understanding' },
  { id: 'medium', label: 'Medium', emoji: '🟡', desc: 'Standard — comprehension and application' },
  { id: 'hard',   label: 'Hard',   emoji: '🔴', desc: 'Challenging — analysis and higher-order thinking' },
]

const ACADEMIC_STYLES = [
  { id: 'standard',     label: 'Standard Academic' },
  { id: 'cambridge',    label: 'Cambridge Style'   },
  { id: 'oxford',       label: 'Oxford Style'      },
  { id: 'harvard',      label: 'Harvard Style'     },
  { id: 'professional', label: 'Professional'      },
]

// ── Writing animation loading screen ──────────────────────────────────────
function GeneratingScreen({ count, questionType }) {
  const [msgIdx, setMsgIdx] = useState(0)
  const [dots,   setDots]   = useState('')
  const [secs,   setSecs]   = useState(0)

  const label    = questionType === 'true_false' ? 'True/False' : questionType === 'calculation' ? 'Fill-in' : 'MCQ'
  const messages = [
    `Crafting ${count} ${label} question${count !== 1 ? 's' : ''}`,
    'Writing clear explanations',
    'Adding hints and feedback',
    'Checking grade-level language',
    'Almost ready',
  ]

  // Cycle messages every 2 seconds
  useEffect(() => {
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % messages.length), 2000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line

  // Animate dots
  useEffect(() => {
    const id = setInterval(() => setDots((d) => d.length >= 3 ? '' : d + '.'), 400)
    return () => clearInterval(id)
  }, [])

  // Track seconds for timeout warning
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      {/* Animated writing lines */}
      <div className="flex flex-col gap-2.5 w-56">
        {[
          { delay: '0s',    width: '100%' },
          { delay: '0.15s', width: '100%' },
          { delay: '0.3s',  width: '100%' },
          { delay: '0.45s', width: '65%'  },
        ].map((line, i) => (
          <div
            key={i}
            style={{
              height: '10px',
              width: line.width,
              borderRadius: '99px',
              background: 'linear-gradient(90deg, #d8ecec 0%, #217070 50%, #d8ecec 100%)',
              backgroundSize: '200% 100%',
              animation: `writingSweep 1.5s ease-in-out ${line.delay} infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes writingSweep {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Cycling message */}
      <div style={{ minHeight: '24px' }}>
        <p className="text-base font-semibold text-ink">
          {messages[msgIdx]}{dots}
        </p>
      </div>

      <p className="text-xs text-ink-4 max-w-xs leading-relaxed">
        Your credits will only be charged if generation succeeds
      </p>

      {/* Timeout warning after 20 seconds */}
      {secs >= 20 && (
        <div className="flex items-start gap-2 bg-amber-light border border-amber/25 rounded-xl px-4 py-3 text-sm text-amber max-w-sm text-left">
          <Info size={14} className="flex-shrink-0 mt-0.5" />
          <span>Taking longer than usual. If questions don't appear, your credits have not been charged.</span>
        </div>
      )}
    </div>
  )
}

// ── Question preview card ──────────────────────────────────────────────────
function QuestionPreviewCard({ question, index, onRemove, questionType }) {
  const [showExplanation, setShowExplanation] = useState(false)
  const isCalc = questionType === 'calculation'
  const isTF   = questionType === 'true_false'

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3 bg-surface border-b border-border">
        <span className="w-6 h-6 rounded-full bg-brand-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
          {index + 1}
        </span>
        <p className="flex-1 text-sm font-semibold text-ink leading-relaxed">
          <MathRenderer text={question.question || question.text || ''} />
        </p>
        <button type="button" onClick={() => onRemove(index)}
          className="p-1 rounded-lg text-ink-4 hover:text-danger hover:bg-danger-light transition-colors flex-shrink-0"
          title="Remove">
          <Trash2 size={14} />
        </button>
      </div>

      {!isTF && !isCalc && question.options?.length > 0 && (
        <div className="px-4 py-3 flex flex-col gap-1.5">
          {question.options.map((opt, oi) => {
            const letter   = String.fromCharCode(65 + oi)
            const isAnswer = opt.trim().charAt(0) === question.answer || letter === question.answer
            return (
              <div key={oi} className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm border',
                isAnswer ? 'border-success/40 bg-success-light text-success font-semibold' : 'border-border text-ink-3'
              )}>
                <span className={cn('w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0',
                  isAnswer ? 'bg-success text-white' : 'bg-surface text-ink-4')}>{letter}</span>
                <span className="flex-1"><MathRenderer text={opt.replace(/^[A-D]\.\s*/, '')} /></span>
                {isAnswer && <span className="text-xs font-bold">✓</span>}
              </div>
            )
          })}
        </div>
      )}

      {isTF && (
        <div className="px-4 py-3 flex items-center gap-2">
          <span className="text-xs text-ink-4">Correct:</span>
          <span className={cn('px-3 py-1 rounded-lg text-sm font-bold border',
            question.answer === 'True'
              ? 'border-success/40 bg-success-light text-success'
              : 'border-danger/40 bg-danger-light text-danger')}>
            {question.answer === 'True' ? '✅ True' : '❌ False'}
          </span>
        </div>
      )}

      {isCalc && (
        <div className="px-4 py-2 text-xs text-ink-4">
          Fill-in · {question.answer_template?.structure?.length ?? 0} answer box{(question.answer_template?.structure?.length ?? 0) !== 1 ? 'es' : ''}
        </div>
      )}

      {question.hint && (
        <div className="px-4 pb-2">
          <span className="text-xs text-amber font-medium bg-amber-light px-2 py-0.5 rounded-lg">💡 {question.hint}</span>
        </div>
      )}

      {question.explanation && (
        <div className="border-t border-border">
          <button type="button" onClick={() => setShowExplanation(!showExplanation)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors">
            <span>📖 Explanation</span>
            {showExplanation ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showExplanation && (
            <div className="px-4 pb-3 bg-brand-50/50 border-t border-brand-100">
              <p className="text-sm text-brand-800 leading-relaxed whitespace-pre-line mt-2">
                <MathRenderer text={question.explanation} />
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
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
  const [difficulties,  setDifficulties]  = useState(['medium'])
  const [extraContext,  setExtraContext]   = useState('')
  const [academicStyle, setAcademicStyle] = useState('standard')

  // Flow: 'input' | 'generating' | 'review'
  const [flowStep,    setFlowStep]    = useState('input')
  const [questions,   setQuestions]   = useState([])
  const [creditsUsed, setCreditsUsed] = useState(0)
  const [error,       setError]       = useState('')
  const [showBuyHint, setShowBuyHint] = useState(false)
  const [lastParams,  setLastParams]  = useState(null)

  const cost        = calcCost(questionType, count)
  const canAfford   = creditsLoading || credits >= cost
  const canGenerate = topic.trim().length > 0 && !creditsLoading && credits >= cost

  const questionTypeLabel =
    questionType === 'true_false'  ? 'True/False' :
    questionType === 'calculation' ? 'Fill-in'    : 'MCQ'

  const toggleDifficulty = (id) => {
    setDifficulties((prev) => {
      if (prev.includes(id)) return prev.length === 1 ? prev : prev.filter((d) => d !== id)
      return [...prev, id]
    })
  }

  const buildParams = () => ({
    questionType,
    subject:           setupData.subject   || 'General',
    topic:             topic.trim(),
    gradeLevel:        setupData.classLevel || setupData.gradeLevel || 'General',
    curriculum:        setupData.curriculum,
    difficulty:        difficulties,
    numberOfQuestions: count,
    additionalContext: extraContext.trim() || undefined,
    useCase,
    academicStyle:     isUniversity ? academicStyle : 'standard',
  })

  const runGeneration = async (params) => {
    setFlowStep('generating')
    setError('')
    setShowBuyHint(false)
    setLastParams(params)

    try {
      const res  = await fetch('/api/generate/questions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      })
      const data = await res.json()

      if (data.success && data.questions?.length > 0) {
        setQuestions(data.questions)
        setCreditsUsed(data.creditsUsed ?? params.numberOfQuestions)
        setFlowStep('review')
        await refreshCredits()
      } else if (typeof data.error === 'string' && data.error.toLowerCase().includes('insufficient')) {
        setShowBuyHint(true)
        setError(data.error)
        setFlowStep('input')
      } else {
        setError(data.error || 'Generation failed. Please try again.')
        setFlowStep('input')
      }
    } catch (err) {
      console.error('[InAppGeneration]', err)
      setError('Network error. Please try again.')
      setFlowStep('input')
    }
  }

  const handleGenerate   = () => { if (canGenerate) runGeneration(buildParams()) }
  const handleRegenerate = () => { if (lastParams)  { setQuestions([]); runGeneration(lastParams) } }
  const handleRemove     = (i) => setQuestions((prev) => prev.filter((_, idx) => idx !== i))
  const handleUse        = ()  => { if (questions.length > 0) onImport?.(questions) }

  // ── GENERATING ────────────────────────────────────────────────────────────
  if (flowStep === 'generating') {
    return <GeneratingScreen count={count} questionType={questionType} />
  }

  // ── REVIEW ────────────────────────────────────────────────────────────────
  if (flowStep === 'review') {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-bold text-ink">Review Generated Questions</h3>
            <p className="text-sm text-ink-3 mt-0.5">
              {questions.length} question{questions.length !== 1 ? 's' : ''} — review then add to your assessment
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success-light border border-success/20 rounded-xl">
            <Zap size={13} className="text-success" />
            <span className="text-xs font-semibold text-success">
              {creditsUsed} credit{creditsUsed !== 1 ? 's' : ''} used · {credits} remaining
            </span>
          </div>
        </div>

        {questions.length > 0 ? (
          <div className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <QuestionPreviewCard key={i} question={q} index={i} onRemove={handleRemove} questionType={questionType} />
            ))}
          </div>
        ) : (
          <div className="bg-amber-light border border-amber/25 rounded-xl px-4 py-3 text-sm text-amber">
            All questions removed. Regenerate to get new ones.
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
          <button type="button" onClick={handleRegenerate}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors">
            <RefreshCw size={14} /> Regenerate
          </button>
          <button type="button" onClick={handleUse} disabled={questions.length === 0}
            className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all',
              questions.length > 0
                ? 'bg-brand-800 text-white hover:bg-brand-700 active:scale-[0.98]'
                : 'bg-border text-ink-4 cursor-not-allowed')}>
            <Check size={15} />
            Use {questions.length} Question{questions.length !== 1 ? 's' : ''} →
          </button>
        </div>
      </div>
    )
  }

  // ── INPUT (default) ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-amber" />
          <h2 className="font-display text-xl font-bold text-ink">Generate with AI</h2>
        </div>
        <p className="text-sm text-ink-3">
          Describe a topic — AI builds {count} {questionTypeLabel} question{count !== 1 ? 's' : ''} with explanations.
        </p>
      </div>

      {/* Credits */}
      {!creditsLoading && (
        <div className={cn('flex items-center justify-between px-4 py-3 rounded-xl border',
          canAfford ? 'bg-brand-50 border-brand-200' : 'bg-danger-light border-danger/30')}>
          <div className="flex items-center gap-2">
            <Zap size={14} className={canAfford ? 'text-brand-600' : 'text-danger'} />
            <span className={cn('text-sm font-semibold', canAfford ? 'text-brand-700' : 'text-danger')}>
              {credits} credit{credits !== 1 ? 's' : ''} available
            </span>
          </div>
          <span className={cn('text-xs', canAfford ? 'text-brand-500' : 'text-danger')}>
            {cost} credit{cost !== 1 ? 's' : ''} for this generation
          </span>
        </div>
      )}

      {/* Topic */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-ink-2">Topic <span className="text-danger">*</span></label>
        <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && canGenerate) handleGenerate() }}
          placeholder={isUniversity
            ? 'e.g. Keynesian Economics, Central Dogma of Molecular Biology…'
            : 'e.g. Quadratic equations, Photosynthesis, World War 2…'}
          className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 hover:border-brand-300 transition-all"
        />
      </div>

      {/* Count */}
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

      {/* Difficulty — multi-select */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-ink-2">Difficulty</label>
          <span className="text-xs text-ink-4">select one or mix</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTY_OPTIONS.map((d) => {
            const sel = difficulties.includes(d.id)
            return (
              <button key={d.id} type="button" onClick={() => toggleDifficulty(d.id)}
                className={cn('flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl border-2 text-left transition-all',
                  sel ? 'border-brand-600 bg-brand-50' : 'border-border bg-white hover:border-brand-200')}>
                <div className="flex items-center gap-1.5 w-full">
                  <span className="text-sm">{d.emoji}</span>
                  <span className={cn('text-sm font-bold flex-1', sel ? 'text-brand-800' : 'text-ink')}>{d.label}</span>
                  {sel && <span className="w-4 h-4 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0"><Check size={9} className="text-white" strokeWidth={3} /></span>}
                </div>
                <span className="text-xs text-ink-4 leading-snug">{d.desc}</span>
              </button>
            )
          })}
        </div>
        {difficulties.length > 1 && (
          <p className="text-xs text-brand-600 font-medium">✨ Mixed — {difficulties.join(' + ')} questions</p>
        )}
      </div>

      {/* University academic style */}
      {isUniversity && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-ink-2">Academic Style</label>
          <div className="flex flex-col gap-1.5">
            {ACADEMIC_STYLES.map((s) => (
              <button key={s.id} type="button" onClick={() => setAcademicStyle(s.id)}
                className={cn('flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-left transition-all',
                  academicStyle === s.id ? 'border-brand-600 bg-brand-50' : 'border-border bg-white hover:border-brand-200')}>
                <div className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors',
                  academicStyle === s.id ? 'border-brand-600 bg-brand-600' : 'border-border')} />
                <span className={cn('text-sm font-semibold', academicStyle === s.id ? 'text-brand-800' : 'text-ink')}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Context — always visible */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-ink-2">Additional context</label>
          <span className="text-xs text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded-full">Recommended</span>
        </div>
        <div className="flex items-start gap-2 bg-amber/8 border border-amber/25 rounded-xl px-3 py-2.5 mb-1">
          <Info size={13} className="text-amber flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber leading-relaxed">More context = better questions. Tell the AI what subtopics to focus on, what students have covered, or any specific examples to use.</p>
        </div>
        <textarea value={extraContext} onChange={(e) => setExtraContext(e.target.value)}
          placeholder={isUniversity
            ? 'e.g. Focus on enzyme kinetics. Students covered lecture 4 but not inhibitors yet.'
            : 'e.g. Focus on factorisation. Students have not covered the quadratic formula yet.'}
          rows={3}
          className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none hover:border-brand-300 transition-all" />
        <p className="text-xs text-ink-4">The more specific, the better.</p>
      </div>

      {error && (
        <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">{error}</div>
      )}
      {showBuyHint && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 text-sm text-brand-700">
          You need more credits.{' '}
          <Link href="/dashboard/credits" className="font-bold underline underline-offset-2">Buy credits →</Link>
        </div>
      )}

      <button type="button" onClick={handleGenerate} disabled={!canGenerate}
        className={cn('flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all',
          canGenerate ? 'bg-brand-800 text-white hover:bg-brand-700 active:scale-[0.98]' : 'bg-border text-ink-4 cursor-not-allowed')}>
        <Sparkles size={16} />
        Generate {count} {questionTypeLabel} Question{count !== 1 ? 's' : ''} ({cost} credit{cost !== 1 ? 's' : ''})
      </button>

    </div>
  )
}