// NEW: Stepwise feature — does not affect existing MCQ functionality
'use client'

import { useState, useCallback } from 'react'
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import MathRenderer from '@/components/ui/MathRenderer'
import { cn } from '@/lib/utils'

// ── Grade stepwise answers (pure function) ────────────────────────────────
// Exported so submit route and StudentAssessment can reuse it.
export function gradeStepwise(steps, filled) {
  const blanks   = (steps ?? []).filter((s) => s.is_blank)
  let correctCount = 0
  const results  = blanks.map((step) => {
    const student = (filled?.[step.id] ?? '').trim().toLowerCase()
    const correct = (step.answer ?? '').trim().toLowerCase()
    const ok      = student === correct && student.length > 0
    if (ok) correctCount++
    return {
      stepId:  step.id,
      correct: ok,
      explain: ok ? step.explain_correct : step.explain_wrong,
    }
  })
  return {
    results,
    correctCount,
    totalBlanks: blanks.length,
    allCorrect:  correctCount === blanks.length && blanks.length > 0,
  }
}

// ── Word bank chip ────────────────────────────────────────────────────────

function WordChip({ word, used, onClick, checked, correct }) {
  const isUsed = used && !checked

  return (
    <button
      onClick={onClick}
      disabled={isUsed}
      className={cn(
        'px-3 py-1.5 rounded-xl border-2 text-sm font-semibold transition-all',
        checked && correct  ? 'border-success bg-success-light text-success cursor-default' :
        checked && !correct ? 'border-danger bg-danger-light text-danger cursor-default' :
        isUsed              ? 'border-border bg-surface text-ink-4 cursor-not-allowed opacity-50' :
                              'border-border bg-white text-ink hover:border-brand-400 hover:bg-brand-50 cursor-pointer active:scale-95'
      )}
    >
      {word}
    </button>
  )
}

// ── Step row ───────────────────────────────────────────────────────────────

function StepRow({ step, index, filled, result, checked, onBlankClick }) {
  const hasBlank = step.is_blank
  const value    = filled?.[step.id]
  const ok       = result?.correct
  const explain  = result?.explain

  // Split step text around the blank marker ___
  const parts = step.text.split('___')

  return (
    <div className={cn(
      'rounded-2xl border-2 overflow-hidden transition-all',
      !checked                    ? 'border-border bg-white' :
      hasBlank && ok              ? 'border-success/30 bg-success-light/10' :
      hasBlank && !ok             ? 'border-danger/30 bg-danger-light/10' :
                                    'border-border bg-white'
    )}>
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Step number */}
        <div className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
          !checked || !hasBlank ? 'bg-surface text-ink-4' :
          ok                    ? 'bg-success text-white' :
                                  'bg-danger text-white'
        )}>
          {checked && hasBlank
            ? (ok ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />)
            : index + 1
          }
        </div>

        {/* Step content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink leading-relaxed flex flex-wrap items-center gap-1">
            {parts[0] && <MathRenderer text={parts[0]} />}

            {hasBlank && (
              <button
                onClick={() => !checked && onBlankClick(step.id)}
                className={cn(
                  'inline-flex items-center justify-center min-w-[80px] px-3 py-1 rounded-xl border-2 text-sm font-bold mx-1 transition-all',
                  checked && ok       ? 'border-success bg-success-light text-success cursor-default' :
                  checked && !ok      ? 'border-danger bg-danger-light text-danger cursor-default' :
                  value               ? 'border-brand-500 bg-brand-50 text-brand-800 hover:border-danger hover:bg-danger-light' :
                                        'border-dashed border-ink-4 bg-surface text-ink-4 hover:border-brand-400'
                )}
              >
                {value || '___'}
              </button>
            )}

            {parts[1] && <MathRenderer text={parts[1]} />}
          </p>

          {/* Explanation shown after checking */}
          {checked && hasBlank && explain && (
            <div className={cn(
              'mt-3 rounded-xl px-4 py-3 border text-sm leading-relaxed',
              ok ? 'bg-brand-50 border-brand-200 text-brand-800'
                 : 'bg-danger-light border-danger/20 text-danger'
            )}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1.5">
                {ok ? '📖 Why this is correct' : '💡 What went wrong'}
              </p>
              <MathRenderer text={explain} />
              {!ok && (
                <p className="mt-2 text-xs font-semibold">
                  Correct answer: <span className="text-success">{step.answer}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main StepwiseQuestion component ───────────────────────────────────────

export default function StepwiseQuestion({ question, readOnly = false, onComplete }) {
  const { question_text, text, steps = [], word_bank = [] } = question
  const displayText = question_text || text || ''

  const [filled,  setFilled]  = useState({}) // { [stepId]: word }
  const [checked, setChecked] = useState(false)
  const [gradeResult, setGradeResult] = useState(null)
  const [nextBlank, setNextBlank]     = useState(null)

  const blanks      = steps.filter((s) => s.is_blank)
  const usedWords   = Object.values(filled)
  const allFilled   = blanks.every((s) => filled[s.id])
  const firstEmpty  = blanks.find((s) => !filled[s.id])

  // Click word chip → place in focused blank (or first empty)
  const handleWordClick = useCallback((word) => {
    if (checked) return
    const targetId = nextBlank ?? firstEmpty?.id
    if (!targetId) return
    setFilled((prev) => ({ ...prev, [targetId]: word }))
    // Advance focus to next empty blank
    const remainingBlanks = blanks.filter((s) => !filled[s.id] && s.id !== targetId)
    setNextBlank(remainingBlanks[0]?.id ?? null)
  }, [checked, nextBlank, firstEmpty, blanks, filled])

  // Click blank → remove its word, focus it
  const handleBlankClick = useCallback((stepId) => {
    if (checked) return
    setFilled((prev) => {
      const next = { ...prev }
      delete next[stepId]
      return next
    })
    setNextBlank(stepId)
  }, [checked])

  const handleCheck = () => {
    if (!allFilled) return
    const result = gradeStepwise(steps, filled)
    setGradeResult(result)
    setChecked(true)
    onComplete?.(result)
  }

  const handleReset = () => {
    setFilled({})
    setChecked(false)
    setGradeResult(null)
    setNextBlank(null)
  }

  // Build per-step result map for rendering
  const resultMap = {}
  if (gradeResult) {
    gradeResult.results.forEach((r) => { resultMap[r.stepId] = r })
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Question */}
      <div className="bg-white border border-border rounded-2xl px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3">Question</p>
        <p className="text-lg font-semibold text-ink leading-relaxed">
          <MathRenderer text={displayText} />
        </p>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-2.5">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-4">Solution steps</p>
        {steps.map((step, i) => (
          <StepRow
            key={step.id}
            step={step}
            index={i}
            filled={filled}
            result={resultMap[step.id]}
            checked={checked}
            onBlankClick={handleBlankClick}
          />
        ))}
      </div>

      {/* Word bank */}
      {!checked && word_bank.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-3">Word Bank</p>
          <div className="flex flex-wrap gap-2">
            {word_bank.map((word, i) => (
              <WordChip
                key={i}
                word={word}
                used={usedWords.includes(word)}
                onClick={() => handleWordClick(word)}
                checked={false}
                correct={false}
              />
            ))}
          </div>
          <p className="text-xs text-ink-4 mt-3">
            Click a word to place it in the next empty blank · Click a filled blank to remove it
          </p>
        </div>
      )}

      {/* Word bank — post-check (read-only with correct/wrong state) */}
      {checked && word_bank.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-3">Word Bank</p>
          <div className="flex flex-wrap gap-2">
            {word_bank.map((word, i) => {
              const usedInBlank = blanks.find((s) => filled[s.id] === word)
              const res         = usedInBlank ? resultMap[usedInBlank.id] : null
              return (
                <WordChip
                  key={i}
                  word={word}
                  used={!!usedInBlank}
                  onClick={() => {}}
                  checked={!!res}
                  correct={res?.correct ?? false}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Result summary */}
      {checked && gradeResult && (
        <div className={cn(
          'rounded-2xl px-5 py-4 border-2 flex items-center gap-4',
          gradeResult.allCorrect
            ? 'bg-success-light border-success/30'
            : 'bg-danger-light border-danger/30'
        )}>
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            gradeResult.allCorrect ? 'bg-success' : 'bg-danger'
          )}>
            {gradeResult.allCorrect
              ? <Check size={20} className="text-white" strokeWidth={3} />
              : <X     size={20} className="text-white" strokeWidth={3} />
            }
          </div>
          <div>
            <p className={cn('text-base font-bold', gradeResult.allCorrect ? 'text-success' : 'text-danger')}>
              {gradeResult.allCorrect ? 'Perfect! All blanks correct.' : `${gradeResult.correctCount} of ${gradeResult.totalBlanks} blanks correct`}
            </p>
            <p className="text-sm text-ink-3 mt-0.5">
              {gradeResult.allCorrect
                ? 'You understood every step of the solution.'
                : 'Review the explanations above to understand where you went wrong.'}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      {!readOnly && (
        <div className="flex items-center gap-3">
          {!checked ? (
            <button
              onClick={handleCheck}
              disabled={!allFilled}
              className={cn(
                'flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all',
                allFilled
                  ? 'bg-brand-800 text-white hover:bg-brand-700 active:scale-[0.98]'
                  : 'bg-border text-ink-4 cursor-not-allowed'
              )}
            >
              {allFilled ? 'Check Answers →' : `Fill ${blanks.length - Object.keys(filled).length} more blank${blanks.length - Object.keys(filled).length !== 1 ? 's' : ''}`}
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold bg-surface border-2 border-border text-ink hover:bg-border transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  )
}