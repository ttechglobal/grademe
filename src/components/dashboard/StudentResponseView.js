'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, X } from 'lucide-react'
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

function QuestionResult({ question, index, studentAnswer }) {
  const [open, setOpen] = useState(false)

  const isCorrect = studentAnswer?.trim().toLowerCase() === question.answer?.trim().toLowerCase()

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
          <MathRenderer text={question.text} />
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
            <MathRenderer text={question.text} />
          </p>

          {/* MCQ options */}
          {question.type === 'mcq' && question.options?.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {question.options.map((opt, oi) => {
                const letter    = String.fromCharCode(65 + oi)
                const optLetter = opt.charAt(0)
                const isAnswer  = optLetter === question.answer || letter === question.answer
                const isStudent = optLetter === studentAnswer   || letter === studentAnswer

                return (
                  <div
                    key={oi}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
                      isAnswer && isStudent  ? 'border-success bg-success-light text-success font-semibold' :
                      isAnswer && !isStudent ? 'border-success bg-success-light text-success' :
                      !isAnswer && isStudent ? 'border-danger bg-danger-light text-danger' :
                                               'border-border text-ink-4'
                    )}
                  >
                    <span className="font-bold w-5 flex-shrink-0">{letter}</span>
                    <span className="flex-1">
                      <MathRenderer text={opt.replace(/^[A-D]\.\s*/, '')} />
                    </span>
                    {isAnswer  && <span className="text-xs font-bold ml-auto flex-shrink-0">✓ Correct</span>}
                    {!isAnswer && isStudent && <span className="text-xs font-bold ml-auto flex-shrink-0">Student&apos;s answer</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* True/False */}
          {(question.type === 'truefalse' || question.question_type === 'true_false') && (
            <div className="grid grid-cols-2 gap-2">
              {['True', 'False'].map((val) => {
                const isCorrect = val.toLowerCase() === (question.answer ?? '').toLowerCase()
                const isStudent = val.toLowerCase() === (studentAnswer ?? '').toLowerCase()
                return (
                  <div
                    key={val}
                    className={cn(
                      'flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-semibold',
                      isCorrect && isStudent  ? 'border-success bg-success-light text-success' :
                      isCorrect && !isStudent ? 'border-success/50 bg-success-light/50 text-success' :
                      !isCorrect && isStudent ? 'border-danger bg-danger-light text-danger' :
                                                'border-border text-ink-4'
                    )}
                  >
                    <span className="text-xl">{val === 'True' ? '✅' : '❌'}</span>
                    <span>{val}</span>
                    {isCorrect && <span className="text-[10px] font-bold">✓ Correct</span>}
                    {!isCorrect && isStudent && <span className="text-[10px] font-bold">Student&apos;s</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Fill-in answer (legacy) */}
          {question.type === 'fill' && (
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
    const ans = submission.answers?.[i] ?? ''
    return ans.trim().toLowerCase() === q.answer?.trim().toLowerCase()
  }).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar name={submission.student_name} size="md" />
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                {submission.student_name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={scoreVariant(submission.score)}>
                  {submission.score}% — {correct}/{questions.length} correct
                </Badge>
                <span className="text-xs text-ink-4">
                  {new Date(submission.completed_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-border transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Score summary bar */}
        <div className="px-6 py-3 bg-surface border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
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
              studentAnswer={submission.answers?.[i]}
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
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4">
              Student
            </th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden md:table-cell">
              Submitted
            </th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4">
              Score
            </th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden lg:table-cell">
              Correct
            </th>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4">
              View
            </th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub) => {
            const correct = questions.filter((q, i) => {
              const ans = sub.answers?.[i] ?? ''
              return ans.trim().toLowerCase() === q.answer?.trim().toLowerCase()
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
                    <Badge variant={scoreVariant(sub.score)}>
                      {sub.score}%
                    </Badge>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  <span className="text-sm text-ink">
                    {correct}/{questions.length}
                  </span>
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