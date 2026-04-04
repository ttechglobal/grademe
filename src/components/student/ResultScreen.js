'use client'

import { ChevronRight, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

function ScoreRing({ score }) {
  const radius = 44
  const circ   = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="10"
        />
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke={score >= 75 ? '#4db8b8' : score >= 50 ? '#f5a623' : '#e5534b'}
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold text-white leading-none">
          {score}%
        </span>
        <span className="text-xs text-white/50 mt-1">Score</span>
      </div>
    </div>
  )
}

function getGrade(score) {
  if (score >= 90) return { emoji: '🏆', label: 'Outstanding!',    sub: 'You nailed it. Excellent work!' }
  if (score >= 75) return { emoji: '🎉', label: 'Excellent!',      sub: 'Great understanding of this topic.' }
  if (score >= 50) return { emoji: '💪', label: 'Good effort!',    sub: 'A bit more practice and you\'ll ace it.' }
  if (score >= 30) return { emoji: '📚', label: 'Keep going!',     sub: 'Review the explanations to improve.' }
  return                   { emoji: '🌱', label: 'Don\'t give up!', sub: 'Everyone improves with practice.' }
}

export default function ResultScreen({
  assessment,
  studentName,
  answers,
  submitError,
  onReview,
  onDone,
}) {
  const questions = assessment.questions

  const results = questions.map((q, i) => {
    const studentAns = answers[i] ?? ''
    const isCorrect  = studentAns.trim().toLowerCase() === q.answer.trim().toLowerCase()
    return { question: q, studentAns, isCorrect, index: i }
  })

  const correct   = results.filter((r) => r.isCorrect).length
  const incorrect = results.filter((r) => !r.isCorrect).length
  const score     = Math.round((correct / questions.length) * 100)
  const grade     = getGrade(score)

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 px-6 pt-12 pb-8 flex flex-col items-center gap-5">
        <ScoreRing score={score} />

        <div className="text-center">
          <p className="text-4xl mb-1">{grade.emoji}</p>
          <p className="font-display text-2xl font-bold text-white">{grade.label}</p>
          <p className="text-sm text-white/60 mt-1 max-w-xs">{grade.sub}</p>
        </div>

        <div className="flex items-center gap-0 w-full max-w-xs">
          <div className="flex-1 text-center py-3 bg-white/10 rounded-l-xl">
            <p className="font-display text-2xl font-bold text-white">{correct}</p>
            <p className="text-xs text-white/50 mt-0.5">Correct</p>
          </div>
          <div className="flex-1 text-center py-3 bg-white/10 border-x border-white/10">
            <p className="font-display text-2xl font-bold text-white">{incorrect}</p>
            <p className="text-xs text-white/50 mt-0.5">Incorrect</p>
          </div>
          <div className="flex-1 text-center py-3 bg-white/10 rounded-r-xl">
            <p className="font-display text-2xl font-bold text-white">{questions.length}</p>
            <p className="text-xs text-white/50 mt-0.5">Total</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 max-w-xl mx-auto w-full flex flex-col gap-5">

        {/* Submit error */}
        {submitError && (
          <div className="bg-amber-light border border-amber/30 rounded-2xl px-5 py-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber">
                Note: Your result could not be saved to the server
              </p>
              <p className="text-xs text-amber/80 mt-0.5 leading-relaxed">
                Your score is shown below. Please inform your teacher and try again if needed.
              </p>
            </div>
          </div>
        )}

        {/* Quick summary grid */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
          <p className="font-display text-base font-bold text-ink mb-3">Quick Summary</p>
          <div className="flex flex-wrap gap-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold',
                  r.isCorrect
                    ? 'bg-success-light text-success'
                    : 'bg-danger-light text-danger'
                )}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-ink-3">
              <div className="w-3 h-3 rounded bg-success-light border border-success/30" />
              Correct
            </div>
            <div className="flex items-center gap-1.5 text-xs text-ink-3">
              <div className="w-3 h-3 rounded bg-danger-light border border-danger/30" />
              Incorrect
            </div>
          </div>
        </div>

        {/* Callout for wrong answers */}
        {incorrect > 0 && (
          <div className="bg-amber-light border border-amber/30 rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <div>
              <p className="text-sm font-semibold text-amber">
                {incorrect} question{incorrect !== 1 ? 's' : ''} to review
              </p>
              <p className="text-xs text-amber/80 mt-0.5 leading-relaxed">
                Tap <strong>Review Answers</strong> to see step-by-step explanations
                for every question you missed.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-2">
          <Button
            variant="primary"
            size="full"
            onClick={() => onReview(results)}
          >
            Review Answers
            <ChevronRight size={16} />
          </Button>
          <Button
            variant="secondary"
            size="full"
            onClick={onDone}
          >
            Done
          </Button>
        </div>

      </div>
    </div>
  )
}