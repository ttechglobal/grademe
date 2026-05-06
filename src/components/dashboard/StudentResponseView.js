'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import MathRenderer from '@/components/ui/MathRenderer'
import { MathExplanation } from '@/components/ui/MathRenderer'
import { cn } from '@/lib/utils'

function scoreVariant(score) {
  if (score >= 75) return 'green'
  if (score >= 50) return 'amber'
  return 'red'
}

// ── Resolve student answer: supports both array[i] and {questionId} formats ──
function resolveAnswer(answers, question, index) {
  if (!answers) return undefined
  // Prefer UUID lookup (new format)
  if (question?.id && answers[question.id] !== undefined) return answers[question.id]
  // Fall back to numeric index (legacy submissions)
  return answers[index]
}

// ── Render a calculation answer's box values ───────────────────────────────
function CalcAnswerDisplay({ studentAnswer, question }) {
  const template = question?.answer_template
  const boxValues = (typeof studentAnswer === 'object' && studentAnswer !== null)
    ? studentAnswer
    : {}

  if (!template?.structure?.length) {
    return (
      <div className="text-sm text-ink-3 italic">
        {Object.keys(boxValues).length > 0
          ? JSON.stringify(boxValues)
          : '(no answer submitted)'}
      </div>
    )
  }

  // Determine per-box correctness
  const boxResults = {}
  let allCorrect = true
  for (const item of template.structure) {
    const studentVal = (boxValues[item.id] ?? '').trim().toLowerCase()
    const accepted   = (item.accepted || [item.answer]).map((a) => String(a).trim().toLowerCase())
    const ok         = accepted.includes(studentVal)
    boxResults[item.id] = ok
    if (!ok) allCorrect = false
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {template.structure.map((item) => {
          const val = boxValues[item.id] ?? ''
          const ok  = boxResults[item.id]
          return (
            <div key={item.id} className="flex flex-col gap-0.5">
              {item.label && (
                <span className="text-xs text-ink-4 font-medium">{item.label}</span>
              )}
              <div className={cn(
                'px-3 py-1.5 rounded-lg border text-sm font-semibold min-w-[48px] text-center',
                ok
                  ? 'border-success bg-success-light text-success'
                  : 'border-danger bg-danger-light text-danger'
              )}>
                {val || <span className="italic opacity-50">—</span>}
              </div>
              <div className="flex items-center gap-1 justify-center">
                {ok
                  ? <CheckCircle2 size={11} className="text-success" />
                  : <XCircle size={11} className="text-danger" />
                }
                {!ok && (
                  <span className="text-xs text-ink-4">
                    expected: <strong>{item.answer}</strong>
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function QuestionResult({ question, index, studentAnswer }) {
  const [open, setOpen] = useState(false)

  const isCalc = question?.question_type === 'calculation' || question?.type === 'calculation'

  // Determine correctness
  let isCorrect = false
  if (isCalc) {
    const template  = question?.answer_template
    const boxValues = (typeof studentAnswer === 'object' && studentAnswer !== null) ? studentAnswer : {}
    if (template?.structure?.length) {
      isCorrect = template.structure.every((item) => {
        const sv       = (boxValues[item.id] ?? '').trim().toLowerCase()
        const accepted = (item.accepted || [item.answer]).map((a) => String(a).trim().toLowerCase())
        return accepted.includes(sv)
      })
    }
  } else {
    isCorrect = (studentAnswer ?? '').toString().trim().toLowerCase()
      === (question.answer ?? '').trim().toLowerCase()
  }

  return (
    <div className={cn(
      'rounded-xl border-2 overflow-hidden transition-all',
      isCorrect ? 'border-success/30' : 'border-danger/30'
    )}>
      {/* Question header */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
          isCorrect ? 'bg-success-light/50 hover:bg-success-light' : 'bg-danger-light/50 hover:bg-danger-light'
        )}
      >
        {isCorrect
          ? <CheckCircle2 size={16} className="text-success flex-shrink-0" />
          : <XCircle size={16} className="text-danger flex-shrink-0" />
        }
        <span className="text-xs font-bold text-ink-4 flex-shrink-0">Q{index + 1}</span>
        <span className="flex-1 text-sm font-medium text-ink text-left line-clamp-1">
          <MathRenderer text={question.text ?? question.question_text ?? ''} />
        </span>
        {open
          ? <ChevronUp size={14} className="text-ink-4 flex-shrink-0" />
          : <ChevronDown size={14} className="text-ink-4 flex-shrink-0" />
        }
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 py-4 bg-white flex flex-col gap-3 border-t border-border">
          {/* Full question */}
          <p className="text-sm font-medium text-ink leading-relaxed">
            <MathRenderer text={question.text ?? question.question_text ?? ''} />
          </p>

          {/* MCQ options */}
          {!isCalc && question.type === 'mcq' && question.options?.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {question.options.map((opt, oi) => {
                const letter    = String.fromCharCode(65 + oi)
                const optLetter = opt.charAt(0)
                const isAnswer  = optLetter === question.answer || letter === question.answer
                const isStu     = optLetter === studentAnswer   || letter === studentAnswer
                return (
                  <div
                    key={oi}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
                      isAnswer && isStu  ? 'border-success bg-success-light text-success font-semibold' :
                      isAnswer && !isStu ? 'border-success/40 bg-success-light/50 text-success' :
                      isStu  && !isAnswer ? 'border-danger bg-danger-light text-danger font-semibold' :
                      'border-border text-ink-3'
                    )}
                  >
                    <span className="font-bold w-4">{letter}.</span>
                    <MathRenderer text={opt.replace(/^[A-D]\.\s*/, '')} />
                    {isAnswer && <span className="ml-auto text-xs font-bold">✓ Correct</span>}
                    {isStu && !isAnswer && <span className="ml-auto text-xs font-bold">✗ Student</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Calculation answer boxes */}
          {isCalc && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-4">
                Student's answer
              </p>
              <CalcAnswerDisplay studentAnswer={studentAnswer} question={question} />
            </div>
          )}

          {/* Simple answer display for True/False */}
          {!isCalc && question.type !== 'mcq' && (
            <div className="flex flex-col gap-1.5">
              <div className={cn(
                'px-3 py-2 rounded-lg border text-sm',
                isCorrect ? 'border-success bg-success-light text-success' : 'border-danger bg-danger-light text-danger'
              )}>
                Student answered: <strong>{studentAnswer || '(no answer)'}</strong>
              </div>
              {!isCorrect && (
                <div className="px-3 py-2 rounded-lg border border-success bg-success-light text-success text-sm">
                  Correct answer: <strong>{question.answer}</strong>
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-2">
                📖 Explanation
              </p>
              <MathExplanation text={question.explanation} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Full student submission modal
export function SubmissionDetailModal({ submission, questions, onClose }) {
  const correct = questions.filter((q, i) => {
    const ans = resolveAnswer(submission.answers, q, i)
    if (q?.question_type === 'calculation' || q?.type === 'calculation') {
      const template  = q?.answer_template
      const boxValues = (typeof ans === 'object' && ans !== null) ? ans : {}
      return template?.structure?.every((item) => {
        const sv       = (boxValues[item.id] ?? '').trim().toLowerCase()
        const accepted = (item.accepted || [item.answer]).map((a) => String(a).trim().toLowerCase())
        return accepted.includes(sv)
      }) ?? false
    }
    return (ans ?? '').toString().trim().toLowerCase()
      === (q.answer ?? '').trim().toLowerCase()
  }).length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <p className="text-xs font-semibold text-ink-4 uppercase tracking-wide mb-0.5">
              Submission detail
            </p>
            <h2 className="font-display text-lg font-bold text-ink">
              {submission.student_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface transition-colors text-ink-3"
          >
            ✕
          </button>
        </div>

        {/* Score summary */}
        <div className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  submission.score >= 75 ? 'bg-success' :
                  submission.score >= 50 ? 'bg-amber'   : 'bg-danger'
                )}
                style={{ width: `${submission.score}%` }}
              />
            </div>
            <span className="text-sm font-bold text-ink flex-shrink-0">
              {submission.score}%
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-success">
              <CheckCircle2 size={12} /> {correct} correct
            </span>
            <span className="flex items-center gap-1.5 text-xs text-danger">
              <XCircle size={12} /> {questions.length - correct} incorrect
            </span>
          </div>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-4">
            Question by Question
          </p>
          {questions.map((q, i) => (
            <QuestionResult
              key={q.id}
              question={q}
              index={i}
              studentAnswer={resolveAnswer(submission.answers, q, i)}
            />
          ))}
        </div>

      </div>
    </div>
  )
}

// Compact submission row for the table
export default function StudentResponseTable({ submissions, questions, onViewDetail }) {
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface border-b border-border">
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4">Student</th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden md:table-cell">Submitted</th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4">Score</th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden lg:table-cell">Correct</th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4">View</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub) => {
            const correct = questions.filter((q, i) => {
              const ans = resolveAnswer(sub.answers, q, i)
              if (q?.question_type === 'calculation' || q?.type === 'calculation') {
                const template  = q?.answer_template
                const boxValues = (typeof ans === 'object' && ans !== null) ? ans : {}
                return template?.structure?.every((item) => {
                  const sv       = (boxValues[item.id] ?? '').trim().toLowerCase()
                  const accepted = (item.accepted || [item.answer]).map((a) => String(a).trim().toLowerCase())
                  return accepted.includes(sv)
                }) ?? false
              }
              return (ans ?? '').toString().trim().toUpperCase() === (q.answer ?? '').trim().toUpperCase()
            }).length

            return (
              <tr
                key={sub.id}
                className="border-t border-border hover:bg-surface transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={sub.student_name} size="sm" />
                    <span className="font-medium text-ink">{sub.student_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-ink-4 hidden md:table-cell text-xs">
                  {new Date(sub.completed_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden hidden sm:block">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          sub.score >= 75 ? 'bg-success' :
                          sub.score >= 50 ? 'bg-amber'   : 'bg-danger'
                        )}
                        style={{ width: `${sub.score}%` }}
                      />
                    </div>
                    <Badge variant={scoreVariant(sub.score)}>{sub.score}%</Badge>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  <span className="text-sm text-ink">{correct}/{questions.length}</span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <button
                    onClick={() => onViewDetail(sub)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-500 transition-colors px-3 py-1.5 bg-brand-50 rounded-lg hover:bg-brand-100"
                  >
                    View answers →
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-xs text-ink-4 px-5 py-3 border-t border-border">
        Click &quot;View answers&quot; to see exactly what each student submitted
      </p>
    </div>
  )
}