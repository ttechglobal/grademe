'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import MathRenderer from '@/components/ui/MathRenderer'
import { cn } from '@/lib/utils'
import { Lightbulb } from 'lucide-react'

function MCQOption({ letter, text, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-4 py-4 rounded-xl border-2 text-left',
        'transition-all duration-150',
        selected
          ? 'border-brand-600 bg-brand-50 text-brand-800'
          : 'border-border bg-white text-ink hover:border-brand-300 hover:bg-brand-50/50'
      )}
    >
      <span className={cn(
        'w-9 h-9 rounded-full border-2 flex items-center justify-center',
        'text-base font-bold flex-shrink-0 transition-colors',
        selected
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-ink-4 text-ink-4'
      )}>
        {letter}
      </span>
      <span className="flex-1 text-base leading-relaxed">
        <MathRenderer text={text.replace(/^[A-D]\.\s*/, '')} />
      </span>
    </button>
  )
}

export default function TestScreen({ assessment, studentName, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers,      setAnswers]      = useState({})
  const [showHint,     setShowHint]     = useState(false)
  const [fillValue,    setFillValue]    = useState('')

  const questions    = assessment.questions
  const current      = questions[currentIndex]
  const isLast       = currentIndex === questions.length - 1
  const questionMode = assessment.question_mode || 'mcq'
  const selected     = answers[currentIndex]
  const progress     = Math.round((currentIndex / questions.length) * 100)

  const selectAnswer = (answer) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: answer }))
  }

  const goNext = () => {
    const updatedAnswers = { ...answers }
    if (questionMode === 'fill' && fillValue.trim()) {
      updatedAnswers[currentIndex] = fillValue.trim()
      setAnswers(updatedAnswers)
    }
    setShowHint(false)

    if (isLast) {
      const finalAnswers = { ...updatedAnswers }
      onFinish(finalAnswers)
    } else {
      const nextVal = updatedAnswers[currentIndex + 1] ?? ''
      setFillValue(nextVal)
      setCurrentIndex((i) => i + 1)
    }
  }

  const goPrev = () => {
    const updatedAnswers = { ...answers }
    if (questionMode === 'fill' && fillValue.trim()) {
      updatedAnswers[currentIndex] = fillValue.trim()
      setAnswers(updatedAnswers)
    }
    setShowHint(false)
    const prevVal = updatedAnswers[currentIndex - 1] ?? ''
    setFillValue(prevVal)
    setCurrentIndex((i) => i - 1)
  }

  const canContinue = questionMode === 'fill'
    ? fillValue.trim().length > 0 || (answers[currentIndex] ?? '').length > 0
    : !!selected

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* GradeMee brand bar */}
      <div className="bg-brand-900 px-5 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber flex items-center justify-center">
            <span className="font-display font-bold text-brand-900 text-xs">G</span>
          </div>
          <span className="font-display font-bold text-white text-sm">GradeMee</span>
        </div>
        <span className="text-xs text-white/40 hidden sm:block">{assessment.title}</span>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-border px-5 py-4 flex-shrink-0">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-ink-4 font-medium capitalize">
                {assessment.subject} · {assessment.class_level?.toUpperCase()}
              </p>
              <p className="text-sm font-semibold text-ink">{studentName}</p>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-brand-700">
                {currentIndex + 1} / {questions.length}
              </span>
              <p className="text-xs text-ink-4 mt-0.5">
                {questionMode === 'mcq' ? '🔘 Multiple Choice' : '✏️ Fill in'}
              </p>
            </div>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-start justify-center p-5 pt-6">
        <div className="w-full max-w-xl flex flex-col gap-5">

          {/* Question card */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3">
              Question {currentIndex + 1}
            </p>
            <p className="text-xl font-medium text-ink leading-relaxed">
              <MathRenderer text={current.text} />
            </p>

            {current.hint && (
              <div className="mt-4">
                {!showHint ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-amber hover:text-amber/80 transition-colors"
                  >
                    <Lightbulb size={14} />
                    Show hint
                  </button>
                ) : (
                  <div className="bg-amber-light rounded-xl px-4 py-3 text-base text-amber leading-relaxed mt-2">
                    💡 <strong>Hint:</strong> {current.hint}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MCQ */}
          {questionMode === 'mcq' && (
            <div className="flex flex-col gap-3">
              {current.options?.map((opt, i) => {
                const letter    = String.fromCharCode(65 + i)
                const optLetter = opt.charAt(0)
                const isSelected = selected === letter || selected === optLetter
                return (
                  <MCQOption
                    key={i}
                    letter={letter}
                    text={opt}
                    selected={isSelected}
                    onClick={() => selectAnswer(letter)}
                  />
                )
              })}
            </div>
          )}

          {/* Fill-in */}
          {questionMode === 'fill' && (
            <div className="flex flex-col gap-2">
              <label className="text-base font-medium text-ink-2">
                Your answer:
              </label>
              <input
                type="text"
                value={fillValue}
                onChange={(e) => setFillValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && canContinue) goNext() }}
                placeholder="Type your answer here…"
                autoFocus
                className="w-full px-4 py-4 border-2 border-border rounded-xl text-lg outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 bg-white"
              />
              <p className="text-sm text-ink-4">
                💡 Don&apos;t worry about exact wording — we check your meaning intelligently
              </p>
            </div>
          )}

          {/* Nav */}
          <div className="flex gap-3 pt-2 pb-4">
            {currentIndex > 0 && (
              <Button variant="secondary" onClick={goPrev} className="flex-1">
                ← Previous
              </Button>
            )}
            <Button
              variant={isLast ? 'amber' : 'primary'}
              onClick={goNext}
              disabled={!canContinue}
              className="flex-1"
            >
              {isLast ? 'Submit Assessment →' : 'Next →'}
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}