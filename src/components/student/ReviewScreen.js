'use client'

import { useState } from 'react'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import MathRenderer        from '@/components/ui/MathRenderer'
import ExplanationRenderer from '@/components/ui/ExplanationRenderer'
import MathAnswerInput     from '@/components/student/MathAnswerInput'
import { cn } from '@/lib/utils'

function isMathSubject(subject) {
  if (!subject) return false
  return /math|physics|chemistry|science|statistics|calcul/i.test(subject)
}

// ── Explanation block ──────────────────────────────────────────────────────
function ExplanationBlock({ explanation, subject }) {
  if (!explanation?.trim()) return null
  return (
    <div className="bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3">Explanation</p>
      <ExplanationRenderer text={explanation} subject={subject} />
    </div>
  )
}

// ── MCQ option row ─────────────────────────────────────────────────────────
function OptionRow({ opt, index, isAnswer, isStudent }) {
  const letter  = String.fromCharCode(65 + index)
  const display = typeof opt === 'string' ? opt.replace(/^[A-D]\.\s*/, '') : opt

  let cls = 'border-border bg-white text-ink-3'
  if (isAnswer && isStudent)  cls = 'border-success bg-success-light text-success font-semibold'
  if (isAnswer && !isStudent) cls = 'border-success bg-success-light text-success'
  if (!isAnswer && isStudent) cls = 'border-danger bg-danger-light text-danger font-semibold'

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-base transition-colors',
      cls
    )}>
      <span className="font-bold w-7 flex-shrink-0">{letter}</span>
      <span className="flex-1 leading-relaxed">
        <MathRenderer text={display} />
      </span>
      {isAnswer && (
        <span className="text-sm font-bold ml-auto flex-shrink-0 whitespace-nowrap">✓ Correct</span>
      )}
      {!isAnswer && isStudent && (
        <span className="text-sm font-bold ml-auto flex-shrink-0 whitespace-nowrap">Your answer</span>
      )}
    </div>
  )
}

// ── Grade a calculation answer (client-side, for display) ─────────────────
function gradeCalcBoxes(boxValues, template) {
  if (!template?.structure?.length) return {}
  const vals = typeof boxValues === 'object' && boxValues ? boxValues : {}
  return Object.fromEntries(
    template.structure.map((item) => {
      const student  = (vals[item.id] ?? '').trim().toLowerCase()
      const accepted = (item.accepted ?? [item.answer]).map(a => String(a).trim().toLowerCase())
      return [item.id, accepted.includes(student) ? 'correct' : 'wrong']
    })
  )
}

export default function ReviewScreen({ results, assessment, onDone }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const current = results[currentIndex]
  const { question, studentAns, isCorrect } = current

  const isCalc = question?.type === 'calculation' || question?.question_type === 'calculation'
  const isTF   = question?.type === 'truefalse'   || question?.question_type === 'true_false'

  // For calculation, compute per-box correct/wrong
  const calcBoxResults = isCalc
    ? gradeCalcBoxes(studentAns, question.answer_template)
    : null

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* Top bar */}
      <div className="bg-white border-b border-border px-4 py-4 flex-shrink-0">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onDone}
              className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink transition-colors"
            >
              <ArrowLeft size={15} />
              Back to results
            </button>
            <span className="text-sm font-bold text-ink">
              {currentIndex + 1} / {results.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / results.length) * 100}%` }}
            />
          </div>

          {/* Question pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  'w-9 h-9 rounded-xl text-sm font-bold transition-all border-2',
                  i === currentIndex
                    ? 'scale-110 border-brand-600 bg-brand-600 text-white'
                    : r.isCorrect
                    ? 'border-success bg-success-light text-success'
                    : 'border-danger bg-danger-light text-danger'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 py-5 flex flex-col gap-5">

          {/* Correct / incorrect badge */}
          <div className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-base font-semibold self-start',
            isCorrect ? 'bg-success-light text-success' : 'bg-danger-light text-danger'
          )}>
            {isCorrect
              ? <><CheckCircle2 size={18} /> Correct — Well done!</>
              : <><XCircle size={18} /> Incorrect</>
            }
          </div>

          {/* Question */}
          <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3">
              Question {currentIndex + 1}
            </p>
            <p className="text-xl font-medium text-ink leading-relaxed">
              <MathRenderer text={question.text} />
            </p>
            {question.hint && (
              <div className="mt-4 bg-amber-light rounded-xl px-4 py-3 text-base text-amber leading-relaxed">
                💡 <strong>Hint:</strong> {question.hint}
              </div>
            )}
          </div>

          {/* ── Answer display — branched by type ────────────────────── */}

          {/* Calculation */}
          {isCalc && (
            <div className="bg-white border border-border rounded-2xl px-5 py-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-ink-3">Your Answer</p>
              <MathAnswerInput
                template={question.answer_template}
                value={typeof studentAns === 'object' ? studentAns : {}}
                readOnly
                result={calcBoxResults}
              />
            </div>
          )}

          {/* True / False */}
          {!isCalc && isTF && (
            <div className="grid grid-cols-2 gap-3">
              {['True', 'False'].map((val) => {
                const isAns = val.toLowerCase() === (question.answer ?? '').toLowerCase()
                const isStu = val.toLowerCase() === (studentAns  ?? '').toLowerCase()
                return (
                  <div key={val} className={cn(
                    'flex flex-col items-center gap-2 py-5 rounded-2xl border-2 text-base font-semibold',
                    isAns && isStu  ? 'border-success bg-success-light text-success' :
                    isAns && !isStu ? 'border-success/50 bg-success-light/50 text-success' :
                    !isAns && isStu ? 'border-danger bg-danger-light text-danger' :
                                      'border-border text-ink-4'
                  )}>
                    <span className="text-2xl">{val === 'True' ? '✅' : '❌'}</span>
                    <span>{val}</span>
                    {isAns  && <span className="text-xs font-bold">✓ Correct</span>}
                    {!isAns && isStu && <span className="text-xs font-bold">Your answer</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* MCQ options */}
          {!isCalc && !isTF && question.type === 'mcq' && question.options?.length > 0 && (
            <div className="flex flex-col gap-2">
              {question.options.map((opt, oi) => {
                const letter    = String.fromCharCode(65 + oi)
                const optLetter = opt.charAt(0)
                const isAnswer  = optLetter === question.answer || letter === question.answer
                const isStudent = optLetter === studentAns      || letter === studentAns
                return (
                  <OptionRow key={oi} opt={opt} index={oi} isAnswer={isAnswer} isStudent={isStudent} />
                )
              })}
            </div>
          )}

          {/* Legacy fill */}
          {!isCalc && !isTF && question.type === 'fill' && (
            <div className="flex flex-col gap-2">
              <div className={cn(
                'px-4 py-3.5 rounded-xl border-2 text-base',
                isCorrect
                  ? 'border-success bg-success-light text-success font-semibold'
                  : 'border-danger bg-danger-light text-danger'
              )}>
                Your answer: {studentAns || '(no answer)'}
              </div>
              {!isCorrect && (
                <div className="px-4 py-3.5 rounded-xl border-2 border-success bg-success-light text-success text-base font-semibold">
                  ✓ Correct answer: {question.answer}
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          <ExplanationBlock explanation={question.explanation} subject={assessment.subject} />

          {/* Nav */}
          <div className="flex justify-between pb-6">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="px-5 py-3 rounded-xl border-2 border-border text-sm font-semibold text-ink-3 hover:border-brand-300 disabled:opacity-40 transition-colors"
            >
              ← Previous
            </button>
            {currentIndex < results.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="px-5 py-3 rounded-xl bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onDone}
                className="px-5 py-3 rounded-xl bg-amber text-brand-900 text-sm font-bold hover:bg-amber/90 transition-colors"
              >
                Done ✓
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}