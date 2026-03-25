'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { Lightbulb } from 'lucide-react'

function OptionButton({ letter, text, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border-2 text-left',
        'text-sm font-medium transition-all duration-150',
        selected
          ? 'border-brand-600 bg-brand-50 text-brand-800'
          : 'border-border bg-white text-ink hover:border-brand-300 hover:bg-brand-50/50'
      )}
    >
      <span className={cn(
        'w-7 h-7 rounded-full border-2 flex items-center justify-center',
        'text-xs font-bold flex-shrink-0 transition-colors',
        selected
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-ink-4 text-ink-4'
      )}>
        {letter}
      </span>
      {text}
    </button>
  )
}

export default function TestScreen({ assessment, studentName, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showHint, setShowHint] = useState(false)

  const questions = assessment.questions
  const current = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const selected = answers[currentIndex]
  const progress = Math.round(((currentIndex) / questions.length) * 100)

  const selectAnswer = (answer) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: answer }))
  }

  const goNext = () => {
    setShowHint(false)
    if (isLast) {
      onFinish(answers)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  const goPrev = () => {
    setShowHint(false)
    setCurrentIndex((i) => i - 1)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* Top bar */}
      <div className="bg-white border-b border-border px-5 py-4 flex-shrink-0">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-ink-4 font-medium">
                {assessment.subject} · {assessment.classLevel?.toUpperCase()}
              </p>
              <p className="text-sm font-semibold text-ink">{studentName}</p>
            </div>
            <span className="text-sm font-bold text-brand-700">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-start justify-center p-5 pt-8">
        <div className="w-full max-w-xl flex flex-col gap-5">

          {/* Question card */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500 mb-3">
              Question {currentIndex + 1}
            </p>
            <p className="text-base font-medium text-ink leading-relaxed">
              {current.text}
            </p>

            {/* Hint */}
            {current.hint && (
              <div className="mt-4">
                {!showHint ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber hover:text-amber/80 transition-colors"
                  >
                    <Lightbulb size={13} />
                    Show hint
                  </button>
                ) : (
                  <div className="bg-amber-light rounded-xl px-4 py-3 text-xs text-amber leading-relaxed">
                    💡 <strong>Hint:</strong> {current.hint}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2.5">
            {current.type === 'mcq' && current.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i)
              return (
                <OptionButton
                  key={i}
                  letter={letter}
                  text={opt}
                  selected={selected === letter}
                  onClick={() => selectAnswer(letter)}
                />
              )
            })}

            {current.type === 'truefalse' && ['True', 'False'].map((val) => (
              <OptionButton
                key={val}
                letter={val[0]}
                text={val}
                selected={selected === val}
                onClick={() => selectAnswer(val)}
              />
            ))}

            {current.type === 'fill' && (
              <input
                type="text"
                placeholder="Type your answer here..."
                value={selected || ''}
                onChange={(e) => selectAnswer(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-border rounded-xl text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 bg-white"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {currentIndex > 0 && (
              <Button variant="secondary" onClick={goPrev} className="flex-1">
                ← Previous
              </Button>
            )}
            <Button
              variant={isLast ? 'amber' : 'primary'}
              onClick={goNext}
              disabled={!selected}
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