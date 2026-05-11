// NEW: Stepwise feature — does not affect existing MCQ functionality
'use client'

import { useState, useCallback } from 'react'
import { Check, X } from 'lucide-react'
import MathRenderer from '@/components/ui/MathRenderer'
import { cn } from '@/lib/utils'

// ── Pure grading function — exported for submit route and StudentAssessment ──
export function gradeStepwise(steps, filled) {
  const blanks = (steps ?? []).filter((s) => s.is_blank)
  if (!blanks.length) return { results: [], correctCount: 0, totalBlanks: 0, allCorrect: false }
  const vals = (typeof filled === 'object' && filled !== null) ? filled : {}
  let correctCount = 0
  const results = blanks.map((step) => {
    const student = (vals[step.id] ?? '').trim().toLowerCase()
    const correct = (step.answer ?? '').trim().toLowerCase()
    const ok      = student.length > 0 && student === correct
    if (ok) correctCount++
    return { stepId: step.id, correct: ok, explain: ok ? step.explain_correct : step.explain_wrong }
  })
  return { results, correctCount, totalBlanks: blanks.length, allCorrect: correctCount === blanks.length }
}

function WordChip({ word, isUsed, isCorrect, isWrong, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-3 py-1.5 rounded-xl border-2 text-sm font-semibold transition-all',
        isCorrect  ? 'border-success bg-success-light text-success cursor-default' :
        isWrong    ? 'border-danger bg-danger-light text-danger cursor-default' :
        isUsed     ? 'border-border bg-surface text-ink-4 opacity-40 cursor-not-allowed' :
                     'border-border bg-white text-ink hover:border-brand-400 hover:bg-brand-50 cursor-pointer active:scale-95'
      )}
    >
      {word}
    </button>
  )
}

function StepRow({ step, stepNumber, filled, gradeResult, checked, onFocus, focused }) {
  const value    = filled?.[step.id] ?? ''
  const hasBlank = step.is_blank
  const parts    = step.text.split('___')

  return (
    <div className={cn(
      'rounded-2xl border-2 overflow-hidden transition-all',
      !checked || !hasBlank       ? 'border-border bg-white' :
      gradeResult?.correct        ? 'border-success/30 bg-success-light/10' :
                                    'border-danger/30 bg-danger-light/10'
    )}>
      <div className={cn(
        'flex items-start gap-3 px-4 py-3',
        checked && hasBlank && gradeResult?.correct  ? 'bg-success-light/20' :
        checked && hasBlank && !gradeResult?.correct ? 'bg-danger-light/20' : ''
      )}>
        {/* Step number / result icon */}
        <div className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
          !checked || !hasBlank ? 'bg-surface text-ink-4 border border-border' :
          gradeResult?.correct  ? 'bg-success text-white' : 'bg-danger text-white'
        )}>
          {checked && hasBlank
            ? (gradeResult?.correct ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />)
            : stepNumber}
        </div>

        {/* Step text */}
        <p className="flex-1 text-sm font-medium text-ink leading-relaxed flex flex-wrap items-center gap-x-1 gap-y-1.5">
          {parts[0] && <span><MathRenderer text={parts[0].trimEnd()} /></span>}

          {hasBlank && (
            <button
              type="button"
              onClick={() => !checked && onFocus(step.id)}
              className={cn(
                'inline-flex items-center justify-center min-w-[80px] px-3 py-1 rounded-xl border-2',
                'text-sm font-bold mx-0.5 transition-all',
                checked && gradeResult?.correct  ? 'border-success bg-success-light text-success cursor-default' :
                checked && !gradeResult?.correct ? 'border-danger bg-danger-light text-danger cursor-default' :
                focused                          ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-sm' :
                value                            ? 'border-brand-400 bg-brand-50 text-brand-800 hover:border-danger' :
                                                   'border-dashed border-ink-3 bg-surface text-ink-4 hover:border-brand-400 hover:bg-brand-50'
              )}
            >
              {value || <span className="opacity-40 text-xs">tap to fill</span>}
            </button>
          )}

          {parts[1] && <span><MathRenderer text={parts[1].trimStart()} /></span>}
        </p>
      </div>

      {/* Explanation after checking */}
      {checked && hasBlank && gradeResult?.explain && (
        <div className={cn(
          'mx-3 mb-3 px-4 py-3 rounded-xl border text-sm leading-relaxed',
          gradeResult.correct
            ? 'bg-brand-50 border-brand-200/70 text-brand-800'
            : 'bg-danger-light/40 border-danger/20 text-danger'
        )}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1.5">
            {gradeResult.correct ? '📖 Why this is correct' : '💡 What went wrong'}
          </p>
          <MathRenderer text={gradeResult.explain} />
          {!gradeResult.correct && (
            <p className="mt-2 text-xs font-semibold text-ink-3">
              Correct answer: <span className="text-success font-bold">{step.answer}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function StepwiseQuestion({ question, readOnly = false, onComplete }) {
  const steps    = question?.steps     ?? []
  const wordBank = question?.word_bank ?? []
  const qText    = question?.question_text || question?.text || ''
  const blanks   = steps.filter((s) => s.is_blank)

  const [filled,      setFilled]      = useState({})
  const [focusedId,   setFocusedId]   = useState(blanks[0]?.id ?? null)
  const [checked,     setChecked]     = useState(false)
  const [gradeResult, setGradeResult] = useState(null)

  const usedWords = Object.values(filled)
  const allFilled = blanks.every((s) => filled[s.id])

  const handleWordClick = useCallback((word) => {
    if (checked || readOnly || !focusedId) return
    setFilled((prev) => ({ ...prev, [focusedId]: word }))
    // Advance to next empty blank
    const currentIdx = blanks.findIndex((s) => s.id === focusedId)
    const remaining  = [...blanks.slice(currentIdx + 1), ...blanks.slice(0, currentIdx)]
    const next       = remaining.find((s) => s.id !== focusedId && !filled[s.id] && s.id !== focusedId)
    setFocusedId(next?.id ?? null)
  }, [checked, readOnly, focusedId, blanks, filled])

  const handleFocus = useCallback((stepId) => {
    if (checked || readOnly) return
    // If already has a value — clicking it clears it
    if (filled[stepId]) {
      setFilled((prev) => { const n = { ...prev }; delete n[stepId]; return n })
    }
    setFocusedId(stepId)
  }, [checked, readOnly, filled])

  const handleCheck = () => {
    if (!allFilled || checked) return
    const result = gradeStepwise(steps, filled)
    setGradeResult(result)
    setChecked(true)
    onComplete?.(filled, result)
  }

  const handleReset = () => {
    setFilled({})
    setFocusedId(blanks[0]?.id ?? null)
    setChecked(false)
    setGradeResult(null)
  }

  const resultMap = {}
  if (gradeResult) gradeResult.results.forEach((r) => { resultMap[r.stepId] = r })

  if (!steps.length) {
    return (
      <div className="bg-amber-light border border-amber/25 rounded-xl px-4 py-3 text-sm text-amber">
        This stepwise question has no steps. Please regenerate it.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Question */}
      {qText && (
        <div className="bg-white border border-border rounded-2xl px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3">Question</p>
          <p className="text-lg font-semibold text-ink leading-relaxed">
            <MathRenderer text={qText} />
          </p>
        </div>
      )}

      {/* Instruction */}
      {!checked && !readOnly && blanks.length > 0 && (
        <p className="text-xs text-ink-4 text-center">
          Tap a blank (___) in the steps below to focus it, then click a word from the bank to fill it
        </p>
      )}

      {/* Steps */}
      <div className="flex flex-col gap-2.5">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-4">Solution steps</p>
        {steps.map((step, i) => (
          <StepRow
            key={step.id}
            step={step}
            stepNumber={i + 1}
            filled={filled}
            gradeResult={resultMap[step.id] ?? null}
            checked={checked}
            onFocus={handleFocus}
            focused={focusedId === step.id && !checked}
          />
        ))}
      </div>

      {/* Word bank */}
      {!readOnly && wordBank.length > 0 && (
        <div className={cn(
          'rounded-2xl px-5 py-4 border-2 transition-all',
          focusedId && !checked ? 'border-brand-300 bg-brand-50/50' : 'border-border bg-surface'
        )}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-4">Word Bank</p>
            {focusedId && !checked && (
              <p className="text-xs text-brand-600 font-semibold">
                ← click a word to fill the selected blank
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {wordBank.map((word, i) => {
              const usedInStep = blanks.find((s) => filled[s.id] === word)
              const stepResult = usedInStep ? resultMap[usedInStep.id] : null
              return (
                <WordChip
                  key={i}
                  word={word}
                  isUsed={!checked && usedWords.includes(word)}
                  isCorrect={checked && !!usedInStep && stepResult?.correct === true}
                  isWrong={checked && !!usedInStep && stepResult?.correct === false}
                  onClick={() => {
                    if (checked) return
                    if (usedWords.includes(word)) return
                    handleWordClick(word)
                  }}
                  disabled={checked || usedWords.includes(word)}
                />
              )
            })}
          </div>
          {!checked && (
            <p className="text-xs text-ink-4 mt-2.5">
              Click a filled blank to remove it and place a different word
            </p>
          )}
        </div>
      )}

      {/* Result summary */}
      {checked && gradeResult && (
        <div className={cn(
          'rounded-2xl px-5 py-4 border-2 flex items-center gap-4',
          gradeResult.allCorrect ? 'bg-success-light border-success/30' : 'bg-danger-light/30 border-danger/30'
        )}>
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            gradeResult.allCorrect ? 'bg-success' : 'bg-danger'
          )}>
            {gradeResult.allCorrect
              ? <Check size={20} className="text-white" strokeWidth={3} />
              : <X     size={20} className="text-white" strokeWidth={3} />}
          </div>
          <div>
            <p className={cn('text-base font-bold', gradeResult.allCorrect ? 'text-success' : 'text-danger')}>
              {gradeResult.allCorrect ? 'All blanks correct!' : `${gradeResult.correctCount} of ${gradeResult.totalBlanks} correct`}
            </p>
            <p className="text-sm text-ink-3 mt-0.5">
              {gradeResult.allCorrect
                ? 'You understood every step of the solution.'
                : 'Review the explanations above for each incorrect blank.'}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      {!readOnly && (
        <div className="flex gap-3">
          {!checked ? (
            <button
              type="button"
              onClick={handleCheck}
              disabled={!allFilled}
              className={cn(
                'flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all',
                allFilled
                  ? 'bg-brand-800 text-white hover:bg-brand-700 active:scale-[0.98]'
                  : 'bg-border text-ink-4 cursor-not-allowed'
              )}
            >
              {allFilled
                ? 'Check Answers →'
                : `Fill ${blanks.length - Object.keys(filled).length} more blank${blanks.length - Object.keys(filled).length !== 1 ? 's' : ''}`}
            </button>
          ) : (
            <button
              type="button"
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