'use client'

import { useState } from 'react'
import { Eye, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import MathRenderer        from '@/components/ui/MathRenderer'
import ExplanationRenderer from '@/components/ui/ExplanationRenderer'
import { cn } from '@/lib/utils'

// ── Hint button (hidden by default) ───────────────────────────────────────
function HintButton({ hint }) {
  const [open, setOpen] = useState(false)
  if (!hint?.trim()) return null
  return open ? (
    <div className="flex items-start gap-2 bg-amber-light border border-amber/25 rounded-xl px-4 py-3">
      <span className="text-sm flex-shrink-0">💡</span>
      <p className="text-sm text-amber leading-relaxed flex-1">{hint}</p>
      <button onClick={() => setOpen(false)} className="text-amber/50 hover:text-amber text-lg leading-none flex-shrink-0">×</button>
    </div>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-2 text-xs font-bold text-amber bg-amber-light border border-amber/25 px-3 py-2 rounded-xl hover:bg-amber/20 transition-colors self-start"
    >
      💡 Show Hint
    </button>
  )
}

/**
 * PreviewMode
 *
 * Renders the assessment exactly as students see it, but:
 *  - No name entry
 *  - Correct answer pre-highlighted green
 *  - Explanation shown immediately (via ExplanationRenderer — fully formatted)
 *  - Hint hidden behind "Show Hint" button
 *  - Submit disabled
 *  - Amber preview banner at the top
 *  - Nothing recorded
 */
export default function PreviewMode({ assessment }) {
  const questions = assessment.questions ?? []
  const [current, setCurrent] = useState(0)

  const q = questions[current]

  if (!q) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
          <p className="text-4xl mb-4">📝</p>
          <h1 className="font-display text-xl font-bold text-ink mb-2">No questions yet</h1>
          <p className="text-sm text-ink-3">Add questions to this assessment first, then preview it.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex flex-col">

      {/* ── Preview banner ────────────────────────────────────────────── */}
      <div className="bg-amber text-brand-900 px-5 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-brand-900/10 flex items-center justify-center flex-shrink-0">
            <Eye size={15} className="text-brand-900" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">Preview Mode</p>
            <p className="text-xs opacity-60 mt-0.5 hidden sm:block">
              This is how your students see this assessment. Nothing is recorded.
            </p>
          </div>
        </div>
        <a
          href="/dashboard/assessments"
          className="flex items-center gap-1.5 text-xs font-bold bg-brand-900/10 hover:bg-brand-900/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ExternalLink size={12} /> Back to Dashboard
        </a>
      </div>

      {/* ── Assessment top bar ────────────────────────────────────────── */}
      <div className="bg-brand-900 px-4 py-3 flex items-center justify-between sticky top-[52px] z-20 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-5 h-5 rounded-full bg-amber flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-brand-900">G</span>
            </div>
            <span className="text-white/60 text-xs font-semibold">GradeMee Assessment</span>
          </div>
          <p className="text-white font-semibold text-sm">{assessment.title}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-white/60 text-xs mb-1">Q{current + 1}/{questions.length}</p>
          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber rounded-full transition-all duration-300"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Question dots ─────────────────────────────────────────────── */}
      <div className="flex gap-1.5 px-4 py-3 overflow-x-auto bg-white border-b border-border">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              'w-8 h-8 rounded-full text-xs font-bold flex-shrink-0 transition-all border-2',
              i === current
                ? 'bg-brand-800 text-white border-brand-800'
                : 'bg-surface text-ink-4 border-border hover:border-brand-300'
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* ── Question body — key forces full remount → resets hint state ─ */}
      <div key={current} className="flex-1 px-4 py-7 max-w-2xl mx-auto w-full">
        <div className="flex flex-col gap-5">

          {/* Question card */}
          <div className="bg-white border border-border rounded-2xl px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-3">
              Question {current + 1} of {questions.length}
            </p>
            <p className="text-lg font-semibold text-ink leading-relaxed">
              <MathRenderer text={q.text} />
            </p>
          </div>

          {/* Hint — hidden behind button */}
          <HintButton hint={q.hint} />

          {/* MCQ options — correct answer pre-highlighted */}
          {q.options?.length > 0 && (
            <div className="flex flex-col gap-3">
              {q.options.map((opt, oi) => {
                const letter    = String.fromCharCode(65 + oi)
                const optLetter = opt.trim().charAt(0)
                const isAnswer  = letter === q.answer || optLetter === q.answer

                return (
                  <div
                    key={oi}
                    className={cn(
                      'flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all',
                      isAnswer
                        ? 'border-success bg-success-light'
                        : 'border-border bg-white opacity-60'
                    )}
                  >
                    <span className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                      isAnswer ? 'bg-success text-white' : 'bg-surface text-ink-4'
                    )}>
                      {letter}
                    </span>
                    <span className={cn(
                      'text-sm leading-relaxed flex-1',
                      isAnswer ? 'text-success font-semibold' : 'text-ink font-medium'
                    )}>
                      <MathRenderer text={opt.replace(/^[A-D]\.\s*/, '')} />
                    </span>
                    {isAnswer && (
                      <span className="text-xs font-bold text-success flex-shrink-0 bg-white/60 px-2 py-1 rounded-lg">
                        ✓ Correct
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Explanation — fully formatted via ExplanationRenderer */}
          {q.explanation?.trim() && (
            <ExplanationRenderer
              explanation={q.explanation}
              hint={null}          /* hint is handled separately above */
              subject={assessment.subject}
              showClosing={false}  /* no encouragement in preview */
            />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3">
            <button
              onClick={() => setCurrent((p) => Math.max(0, p - 1))}
              disabled={current === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink disabled:opacity-40 hover:bg-surface transition-colors"
            >
              <ChevronLeft size={15} /> Previous
            </button>

            {current < questions.length - 1 ? (
              <button
                onClick={() => setCurrent((p) => p + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
              >
                Next <ChevronRight size={15} />
              </button>
            ) : (
              <div className="relative group">
                <button
                  disabled
                  className="px-7 py-2.5 rounded-xl bg-surface border-2 border-border text-sm font-bold text-ink-4 cursor-not-allowed"
                >
                  Submit Assessment
                </button>
                <div className="absolute bottom-full right-0 mb-2 bg-ink text-white text-xs px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-lg">
                  Submit is disabled in Preview Mode
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}