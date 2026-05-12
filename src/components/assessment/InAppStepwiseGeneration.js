// NEW: Stepwise feature — does not affect existing MCQ functionality
'use client'

import { useState, useCallback } from 'react'
import { Sparkles, RefreshCw, Check, Loader2, Pencil, RotateCcw, Info } from 'lucide-react'
import MathRenderer from '@/components/ui/MathRenderer'
import { cn } from '@/lib/utils'

// ── STEM detection ────────────────────────────────────────────────────────
const STEM_SUBJECTS = [
  'math', 'maths', 'mathematics', 'further mathematics',
  'physics', 'chemistry', 'biology', 'statistics',
  'computer science', 'accounting', 'economics', 'engineering',
]
function isStemSubject(subject = '') {
  const s = subject.toLowerCase()
  return STEM_SUBJECTS.some((stem) => s.includes(stem))
}

// ── Difficulty options ─────────────────────────────────────────────────────
const DIFFICULTY_OPTIONS = [
  { id: 'easy',   label: 'Easy',   desc: '1–2 blanks — final values only',          blankRange: '1–2' },
  { id: 'medium', label: 'Medium', desc: '2–3 blanks — key values and variables',    blankRange: '2–3' },
  { id: 'hard',   label: 'Hard',   desc: '3–5 blanks — across multiple steps',       blankRange: '3–5' },
]

// ── Tokenise a step's text into words for edit mode ───────────────────────
function tokenizeText(text) {
  // Split on spaces but keep punctuation attached to words
  return text.split(/(\s+)/).filter(Boolean)
}

// ── Word bank chip ────────────────────────────────────────────────────────
function WordChip({ word, isUsed, isFocused, isCorrect, isWrong, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ minHeight: '44px' }}
      className={cn(
        'px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all select-none',
        'font-[Nunito,sans-serif]',
        isCorrect  ? 'border-success bg-success-light text-success cursor-default' :
        isWrong    ? 'border-danger bg-danger-light text-danger line-through opacity-60 cursor-default' :
        isUsed     ? 'border-border bg-surface text-ink-4 line-through opacity-50 cursor-not-allowed' :
        isFocused  ? 'border-brand-600 bg-brand-800 text-white shadow-sm scale-105' :
                     'border-brand-300 bg-white text-brand-900 hover:border-brand-500 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 cursor-pointer'
      )}
    >
      {word}
    </button>
  )
}

// ── Step row for student view ─────────────────────────────────────────────
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
        <div className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
          !checked || !hasBlank ? 'bg-surface text-ink-4 border border-border' :
          gradeResult?.correct  ? 'bg-success text-white' : 'bg-danger text-white'
        )}>
          {checked && hasBlank
            ? (gradeResult?.correct ? <Check size={13} strokeWidth={3} /> : '✗')
            : stepNumber}
        </div>

        <p className="flex-1 text-sm font-medium text-ink leading-relaxed flex flex-wrap items-center gap-x-1 gap-y-1.5">
          {parts[0] && <span><MathRenderer text={parts[0].trimEnd()} /></span>}
          {hasBlank && (
            <button type="button" onClick={() => !checked && onFocus(step.id)}
              style={{ minHeight: '36px' }}
              className={cn(
                'inline-flex items-center justify-center min-w-[72px] px-3 py-1 rounded-xl border-2',
                'text-sm font-bold mx-0.5 transition-all select-none',
                checked && gradeResult?.correct  ? 'border-success bg-success-light text-success cursor-default' :
                checked && !gradeResult?.correct ? 'border-danger bg-danger-light text-danger cursor-default' :
                focused                          ? 'border-brand-500 bg-amber/15 text-brand-800 shadow-sm' :
                value                            ? 'border-brand-400 bg-brand-50 text-brand-800 hover:border-danger' :
                                                   'border-dashed border-ink-3 bg-surface text-ink-4 hover:border-brand-400 hover:bg-brand-50'
              )}>
              {value || <span className="opacity-40 text-xs">tap to fill</span>}
            </button>
          )}
          {parts[1] && <span><MathRenderer text={parts[1].trimStart()} /></span>}
        </p>
      </div>

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

// ── Edit blanks mode ──────────────────────────────────────────────────────
function EditBlanksMode({ steps, originalSteps, subject, difficulty, onDone, onReset }) {
  const isStem   = isStemSubject(subject)
  const blankRange = DIFFICULTY_OPTIONS.find((d) => d.id === difficulty)?.blankRange ?? '2–3'

  // Flatten all step texts into editable word tokens per step
  const [editSteps, setEditSteps] = useState(() =>
    steps.map((step) => ({
      ...step,
      // Keep original text, just track which words are blanked
    }))
  )

  const blankCount = editSteps.filter((s) => s.is_blank).length

  const toggleStepBlank = (stepIdx) => {
    setEditSteps((prev) => prev.map((s, i) => {
      if (i !== stepIdx) return s
      return { ...s, is_blank: !s.is_blank }
    }))
  }

  const handleReset = () => {
    setEditSteps(originalSteps)
    onReset()
  }

  const handleDone = () => {
    onDone(editSteps)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Edit mode header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-light border border-amber/30 rounded-2xl">
        <Pencil size={16} className="text-amber flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-amber">Edit Blanks Mode</p>
          <p className="text-xs text-amber/80">Tap a step to toggle whether it is a blank</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-bold border',
            blankCount > 0 ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-border text-ink-4'
          )}>
            {blankCount} blank{blankCount !== 1 ? 's' : ''} selected
          </span>
        </div>
        <span className="text-xs text-ink-4">Recommended: {blankRange} for {difficulty}</span>
      </div>

      {isStem && (
        <div className="flex items-start gap-2 bg-brand-50 border border-brand-200 rounded-xl px-3 py-2">
          <Info size={13} className="text-brand-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-brand-700">For maths/science: blank steps containing numbers, formulas, or variables — not descriptive steps.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {editSteps.map((step, i) => (
          <button
            key={step.id} type="button"
            onClick={() => toggleStepBlank(i)}
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all',
              step.is_blank
                ? 'border-amber bg-amber-light'
                : 'border-border bg-white hover:border-brand-300'
            )}
          >
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
              step.is_blank ? 'bg-amber text-white' : 'bg-surface text-ink-4 border border-border'
            )}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium leading-relaxed', step.is_blank ? 'text-amber' : 'text-ink')}>
                {step.text}
              </p>
              {step.is_blank && step.answer && (
                <p className="text-xs text-amber/80 mt-1">Answer: <strong>{step.answer}</strong></p>
              )}
            </div>
            <span className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5',
              step.is_blank ? 'bg-amber text-white' : 'bg-surface text-ink-4'
            )}>
              {step.is_blank ? 'BLANK' : 'shown'}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-3 pt-2 border-t border-border">
        <button type="button" onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors">
          <RotateCcw size={13} /> Reset to Original
        </button>
        <button type="button" onClick={handleDone}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-bold hover:bg-brand-700 transition-colors">
          <Check size={14} /> Done Editing →
        </button>
      </div>
    </div>
  )
}

// ── Preview (student-facing view) ────────────────────────────────────────
function StepwisePreview({ question, onApprove, onRegenerate, onEditBlanks, loading }) {
  const steps    = question?.steps     ?? []
  const wordBank = question?.word_bank ?? []
  const qText    = question?.question_text || question?.text || ''

  const [filled,      setFilled]      = useState({})
  const [focusedId,   setFocusedId]   = useState(() => steps.find((s) => s.is_blank)?.id ?? null)
  const [checked,     setChecked]     = useState(false)
  const [gradeResult, setGradeResult] = useState(null)

  const blanks    = steps.filter((s) => s.is_blank)
  const usedWords = Object.values(filled)
  const allFilled = blanks.every((s) => filled[s.id])

  const handleWordClick = useCallback((word) => {
    if (checked || !focusedId) return
    setFilled((prev) => ({ ...prev, [focusedId]: word }))
    const currentIdx = blanks.findIndex((s) => s.id === focusedId)
    const next = blanks.slice(currentIdx + 1).find((s) => !filled[s.id])
       || blanks.find((s) => !filled[s.id] && s.id !== focusedId)
    setFocusedId(next?.id ?? null)
  }, [checked, focusedId, blanks, filled])

  const handleFocus = useCallback((stepId) => {
    if (checked) return
    if (filled[stepId]) {
      setFilled((prev) => { const n = { ...prev }; delete n[stepId]; return n })
    }
    setFocusedId(stepId)
  }, [checked, filled])

  const resultMap = {}
  if (gradeResult) gradeResult.results?.forEach((r) => { resultMap[r.stepId] = r })

  if (!steps.length) {
    return (
      <div className="bg-amber-light border border-amber/25 rounded-xl px-4 py-3 text-sm text-amber">
        No steps generated. Try regenerating.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Question */}
      {qText && (
        <div className="bg-white border border-border rounded-2xl px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3">Question</p>
          <p className="text-base font-semibold text-ink leading-relaxed">
            <MathRenderer text={qText} />
          </p>
        </div>
      )}

      {/* Steps */}
      <div className="flex flex-col gap-2.5">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-4">Solution steps</p>
        {steps.map((step, i) => (
          <StepRow
            key={step.id} step={step} stepNumber={i + 1}
            filled={filled} gradeResult={resultMap[step.id] ?? null}
            checked={checked} onFocus={handleFocus}
            focused={focusedId === step.id && !checked}
          />
        ))}
      </div>

      {/* Word bank — redesigned */}
      {wordBank.length > 0 && (
        <div className={cn(
          'rounded-2xl border-2 px-5 py-4 transition-all',
          focusedId && !checked ? 'border-brand-300 bg-brand-50/30' : 'border-border bg-surface'
        )}>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <p className="text-sm font-bold text-ink">Word Bank</p>
            {focusedId && !checked && (
              <p className="text-xs text-brand-600 font-semibold animate-pulse">
                ← select a word to fill the highlighted blank
              </p>
            )}
          </div>
          <p className="text-xs text-ink-4 mb-3">
            {checked ? 'Words used in your answers' : 'Tap a blank first, then tap a word to fill it'}
          </p>
          <div className="flex flex-wrap gap-2">
            {wordBank.map((word, i) => {
              const usedInStep = blanks.find((s) => filled[s.id] === word)
              const stepResult = usedInStep ? resultMap[usedInStep.id] : null
              return (
                <WordChip
                  key={i} word={word}
                  isUsed={!checked && usedWords.includes(word)}
                  isFocused={false}
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
            <p className="text-xs text-ink-4 mt-3">Tap a filled blank to remove its word and reuse it</p>
          )}
        </div>
      )}

      {/* Teacher actions */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        <p className="text-xs font-semibold text-ink-4 uppercase tracking-wide">Teacher actions</p>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={onEditBlanks} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-border text-xs font-semibold text-ink hover:bg-surface transition-colors disabled:opacity-50">
            <Pencil size={12} /> Edit Blanks
          </button>
          <button type="button" onClick={onRegenerate} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-border text-xs font-semibold text-ink hover:bg-surface transition-colors disabled:opacity-50">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Regenerate
          </button>
          <button type="button" onClick={onApprove} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-success text-white text-sm font-bold hover:bg-success/90 transition-colors disabled:opacity-50">
            <Check size={14} /> Use This Question →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function InAppStepwiseGeneration({ setupData, onImport, refreshCredits }) {
  const [topic,       setTopic]       = useState(setupData?.title || '')
  const [difficulty,  setDifficulty]  = useState('medium')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  // Flow: 'input' | 'generating' | 'preview' | 'editing' | 'approved'
  const [flowStep,       setFlowStep]       = useState('input')
  const [preview,        setPreview]        = useState(null)
  const [editedSteps,    setEditedSteps]    = useState(null)
  const [originalSteps,  setOriginalSteps]  = useState(null)

  const subject    = setupData?.subject    || ''
  const classLevel = setupData?.classLevel || ''
  const isStem     = isStemSubject(subject)
  const canGenerate = topic.trim().length >= 3 && !loading

  const handleGenerate = async () => {
    if (!canGenerate) return
    setFlowStep('generating')
    setError('')
    setPreview(null)
    setEditedSteps(null)

    try {
      const res  = await fetch('/api/generate/stepwise', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic:      topic.trim(),
          subject,
          classLevel,
          difficulty,
          useCase:    setupData?.useCaseProfile ?? 'k12_tutor',
          curriculum: setupData?.curriculum,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Generation failed. Please try again.')
        setFlowStep('input')
        return
      }

      const q = data.question
      if (!q || !q.steps || q.steps.length === 0) {
        setError('AI returned a question with no steps. Please try again.')
        setFlowStep('input')
        return
      }

      setPreview(q)
      setOriginalSteps(q.steps)
      setEditedSteps(q.steps)
      setFlowStep('preview')
      refreshCredits?.()
    } catch (err) {
      setError('Network error. Please try again.')
      setFlowStep('input')
    }
    setLoading(false)
  }

  const handleApprove = () => {
    if (!preview) return
    const stepsToUse = editedSteps ?? preview.steps
    const q = {
      ...preview,
      steps:         stepsToUse,
      word_bank:     stepsToUse.filter((s) => s.is_blank).map((s) => s.answer).concat(
        (preview.word_bank ?? []).filter((w) => !stepsToUse.filter((s) => s.is_blank).map((s) => s.answer).includes(w))
      ),
      id:            Math.random().toString(36).slice(2),
      type:          'stepwise',
      question_type: 'stepwise',
      text:          preview.question_text || preview.text || '',
      options:       [],
      answer:        '',
    }
    onImport?.([q])
    setFlowStep('approved')
  }

  const handleRegenerate = () => {
    setPreview(null)
    setEditedSteps(null)
    handleGenerate()
  }

  const handleEnterEditMode = () => setFlowStep('editing')

  const handleDoneEditing = (newSteps) => {
    setEditedSteps(newSteps)
    setPreview((prev) => ({
      ...prev,
      steps:     newSteps,
      word_bank: [
        ...newSteps.filter((s) => s.is_blank).map((s) => s.answer).filter(Boolean),
        // Keep decoys from original word bank
        ...(prev.word_bank ?? []).filter((w) => !newSteps.filter((s) => s.is_blank).map((s) => s.answer).includes(w)),
      ],
    }))
    setFlowStep('preview')
  }

  const handleResetEditing = () => {
    setEditedSteps(originalSteps)
    setPreview((prev) => ({ ...prev, steps: originalSteps }))
  }

  // ── GENERATING ────────────────────────────────────────────────────────────
  if (flowStep === 'generating') {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
            <Sparkles size={28} className="text-brand-600 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber flex items-center justify-center">
            <Loader2 size={13} className="text-white animate-spin" />
          </div>
        </div>
        <div>
          <p className="text-base font-bold text-ink mb-1">Generating stepwise question…</p>
          <p className="text-sm text-ink-3">Building steps, blanks, word bank and explanations</p>
        </div>
        <div className="flex gap-1.5">
          {[0,1,2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-brand-300 animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />
          ))}
        </div>
      </div>
    )
  }

  // ── EDIT BLANKS ───────────────────────────────────────────────────────────
  if (flowStep === 'editing' && editedSteps) {
    return (
      <div className="flex flex-col gap-4">
        <button type="button" onClick={() => setFlowStep('preview')}
          className="self-start text-sm font-semibold text-ink-3 hover:text-ink transition-colors">
          ← Back to Preview
        </button>
        <EditBlanksMode
          steps={editedSteps}
          originalSteps={originalSteps}
          subject={subject}
          difficulty={difficulty}
          onDone={handleDoneEditing}
          onReset={handleResetEditing}
        />
      </div>
    )
  }

  // ── PREVIEW ───────────────────────────────────────────────────────────────
  if (flowStep === 'preview' && preview) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-ink">Preview</p>
            <p className="text-xs text-ink-4 mt-0.5">
              {(editedSteps ?? preview.steps).filter((s) => s.is_blank).length} blank{(editedSteps ?? preview.steps).filter((s) => s.is_blank).length !== 1 ? 's' : ''} · {(editedSteps ?? preview.steps).length} steps
            </p>
          </div>
        </div>
        <StepwisePreview
          question={{ ...preview, steps: editedSteps ?? preview.steps }}
          onApprove={handleApprove}
          onRegenerate={handleRegenerate}
          onEditBlanks={handleEnterEditMode}
          loading={loading}
        />
      </div>
    )
  }

  // ── APPROVED ──────────────────────────────────────────────────────────────
  if (flowStep === 'approved') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-4 py-3 bg-success-light border border-success/20 rounded-2xl">
          <Check size={18} className="text-success flex-shrink-0" />
          <p className="text-sm font-semibold text-success">
            Stepwise question added! Generate another or continue to the next step.
          </p>
        </div>
        <button type="button" onClick={() => { setFlowStep('input'); setPreview(null); setEditedSteps(null) }}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors">
          <Sparkles size={14} /> Generate Another
        </button>
      </div>
    )
  }

  // ── INPUT ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-base font-bold text-ink">Generate Stepwise Question</h3>
        <p className="text-sm text-ink-3 mt-1">
          AI builds a step-by-step worked solution with blanks for students to fill in.
          {isStem && <span className="text-brand-600 font-semibold"> Blanks will only be placed on numbers and formula variables — not descriptive words.</span>}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-ink-3 mb-1.5">
            Topic <span className="text-danger">*</span>
          </label>
          <input
            type="text" value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canGenerate) handleGenerate() }}
            placeholder={isStem
              ? 'e.g. Solving simultaneous equations, Speed/distance/time, Photosynthesis rates'
              : 'e.g. Causes of World War 1, The water cycle, Parts of speech'}
            className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-3 mb-2">Difficulty</label>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTY_OPTIONS.map((d) => (
              <button key={d.id} type="button" onClick={() => setDifficulty(d.id)}
                className={cn(
                  'flex flex-col gap-1.5 px-3 py-3 rounded-xl border-2 text-left transition-all',
                  difficulty === d.id
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-border bg-white hover:border-brand-300'
                )}>
                <span className={cn('text-sm font-bold', difficulty === d.id ? 'text-brand-800' : 'text-ink')}>{d.label}</span>
                <span className="text-xs text-ink-4 leading-snug">{d.desc}</span>
                <span className={cn('text-[10px] font-bold', difficulty === d.id ? 'text-brand-600' : 'text-ink-4')}>
                  {d.blankRange} blanks
                </span>
              </button>
            ))}
          </div>
        </div>

        <button type="button" onClick={handleGenerate} disabled={!canGenerate}
          className={cn(
            'w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2',
            canGenerate
              ? 'bg-brand-800 text-white hover:bg-brand-700 active:scale-[0.98]'
              : 'bg-border text-ink-4 cursor-not-allowed'
          )}>
          <Sparkles size={15} /> Generate Stepwise Question
        </button>

        {error && (
          <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">{error}</div>
        )}
      </div>
    </div>
  )
}