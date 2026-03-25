'use client'

import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

function ScoreRing({ score }) {
  const radius = 40
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg width="112" height="112" className="-rotate-90">
        <circle
          cx="56" cy="56" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="10"
        />
        <circle
          cx="56" cy="56" r={radius}
          fill="none"
          stroke={score >= 75 ? '#4db8b8' : score >= 50 ? '#f5a623' : '#e5534b'}
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-white">{score}%</span>
      </div>
    </div>
  )
}

function ReviewCard({ question, index, studentAnswer, isCorrect }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface transition-colors"
      >
        {isCorrect
          ? <CheckCircle2 size={18} className="text-success flex-shrink-0" />
          : <XCircle size={18} className="text-danger flex-shrink-0" />
        }
        <span className="flex-1 text-sm font-medium text-ink truncate">
          Q{index + 1}: {question.text}
        </span>
        {open
          ? <ChevronUp size={16} className="text-ink-4 flex-shrink-0" />
          : <ChevronDown size={16} className="text-ink-4 flex-shrink-0" />
        }
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border flex flex-col gap-3 pt-4">

          {/* Options */}
          {question.type === 'mcq' && (
            <div className="flex flex-col gap-2">
              {question.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i)
                const isAnswer  = letter === question.answer
                const isStudent = letter === studentAnswer
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm',
                      isAnswer && isStudent && 'border-success bg-success-light text-success',
                      isAnswer && !isStudent && 'border-success bg-success-light text-success',
                      !isAnswer && isStudent && 'border-danger bg-danger-light text-danger',
                      !isAnswer && !isStudent && 'border-border text-ink-3'
                    )}
                  >
                    <span className="font-bold w-5 flex-shrink-0">{letter}</span>
                    <span className="flex-1">{opt}</span>
                    {isAnswer  && <span className="text-xs font-bold">✓ Correct</span>}
                    {!isAnswer && isStudent && <span className="text-xs font-bold">Your answer</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Fill / TrueFalse */}
          {(question.type === 'fill' || question.type === 'truefalse') && (
            <div className="flex flex-col gap-2 text-sm">
              <div className={cn(
                'px-4 py-3 rounded-xl border-2',
                isCorrect
                  ? 'border-success bg-success-light text-success'
                  : 'border-danger bg-danger-light text-danger'
              )}>
                Your answer: <strong>{studentAnswer || '(no answer)'}</strong>
              </div>
              {!isCorrect && (
                <div className="px-4 py-3 rounded-xl border-2 border-success bg-success-light text-success">
                  Correct answer: <strong>{question.answer}</strong>
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 text-sm text-brand-800 leading-relaxed">
              <p className="font-semibold mb-1 text-brand-700">📖 Explanation</p>
              {question.explanation}
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function getGrade(score) {
  if (score >= 75) return { label: 'Excellent work! 🎉',  color: 'text-success' }
  if (score >= 50) return { label: 'Good effort! Keep going 💪', color: 'text-amber' }
  return { label: 'Keep practising — you\'ll get there! 📚', color: 'text-danger' }
}

export default function ResultScreen({ assessment, studentName, answers, onRetry }) {
  const questions = assessment.questions

  const correct = questions.filter((q, i) => {
    const studentAns = answers[i]
    if (!studentAns) return false
    return studentAns.trim().toLowerCase() === q.answer.trim().toLowerCase()
  }).length

  const score = Math.round((correct / questions.length) * 100)
  const grade = getGrade(score)

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* Hero result banner */}
      <div className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 px-6 py-10 flex flex-col items-center gap-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Assessment Complete
        </p>
        <ScoreRing score={score} />
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-white">{studentName}</p>
          <p className={cn('text-sm font-medium mt-1', grade.color === 'text-success' ? 'text-brand-200' : 'text-white/70')}>
            {grade.label}
          </p>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="text-center">
            <p className="font-display text-3xl font-bold text-white">{correct}</p>
            <p className="text-xs text-white/50 mt-0.5">Correct</p>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <p className="font-display text-3xl font-bold text-white">{questions.length - correct}</p>
            <p className="text-xs text-white/50 mt-0.5">Incorrect</p>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <p className="font-display text-3xl font-bold text-white">{questions.length}</p>
            <p className="text-xs text-white/50 mt-0.5">Total</p>
          </div>
        </div>
      </div>

      {/* Review section */}
      <div className="flex-1 max-w-xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        <h2 className="font-display text-xl font-bold text-ink">
          Review Answers
        </h2>

        {questions.map((q, i) => {
          const studentAnswer = answers[i]
          const isCorrect = studentAnswer?.trim().toLowerCase() === q.answer.trim().toLowerCase()
          return (
            <ReviewCard
              key={i}
              index={i}
              question={q}
              studentAnswer={studentAnswer}
              isCorrect={isCorrect}
            />
          )
        })}

        <Button
          variant="secondary"
          size="full"
          onClick={onRetry}
          className="mt-2"
        >
          ← Try Again
        </Button>
      </div>

    </div>
  )
}