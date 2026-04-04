'use client'

import { useState } from 'react'
import {
  CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, ArrowLeft,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import MathRenderer from '@/components/ui/MathRenderer'
import { cn } from '@/lib/utils'

function isMathSubject(subject) {
  const mathSubjects = ['mathematics', 'physics', 'chemistry', 'further mathematics', 'further maths']
  return mathSubjects.includes((subject ?? '').toLowerCase())
}

// Splits explanation into strict line-by-line blocks
function parseExplanationLines(text) {
  if (!text) return []

  const lines = []

  // First split on explicit newlines
  const rawLines = text.split(/\n/)

  rawLines.forEach((rawLine) => {
    const trimmed = rawLine.trim()
    if (!trimmed) return

    // Further split on sentences within a line (full stops, colons)
    const subLines = trimmed
      .split(/(?<=[.:])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)

    subLines.forEach((line) => {
      // Detect line type
      const isStepHeader = /^step\s*\d+/i.test(line)
      const isAnswer     = /^(✓\s*)?answer:/i.test(line) || line.startsWith('✓')
      const isWrongNote  = /^where you went wrong/i.test(line)
      const isMathExpr   = /=/.test(line) && !/^step/i.test(line) && !/^[A-Za-z\s]{10,}$/.test(line)

      if (isStepHeader)  lines.push({ type: 'step-header', text: line })
      else if (isAnswer) lines.push({ type: 'answer',      text: line })
      else if (isWrongNote) lines.push({ type: 'wrong',    text: line })
      else if (isMathExpr)  lines.push({ type: 'math',     text: line })
      else                  lines.push({ type: 'text',     text: line })
    })
  })

  return lines
}

// Maths explanation — strict line by line with alignment
function MathStepExplanation({ text }) {
  const lines = parseExplanationLines(text)

  if (lines.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      {lines.map((line, i) => {
        if (line.type === 'step-header') {
          return (
            <p
              key={i}
              className="text-base font-bold text-brand-800 mt-3 first:mt-0"
            >
              {line.text}
            </p>
          )
        }

        if (line.type === 'math') {
          // Split on = to align
          const parts = line.text.split('=')
          return (
            <div
              key={i}
              className="font-mono text-base text-brand-800 pl-4 py-0.5 flex items-center gap-2"
            >
              {parts.map((part, pi) => (
                <span key={pi} className="flex items-center gap-2">
                  {pi > 0 && (
                    <span className="text-brand-600 font-bold mx-1">=</span>
                  )}
                  <MathRenderer text={part.trim()} />
                </span>
              ))}
            </div>
          )
        }

        if (line.type === 'answer') {
          return (
            <div
              key={i}
              className="flex items-center gap-2 bg-success-light border border-success/30 rounded-xl px-4 py-3 mt-2"
            >
              <span className="text-success font-bold text-base">
                <MathRenderer text={line.text.replace(/^✓\s*/, '')} />
              </span>
            </div>
          )
        }

        if (line.type === 'wrong') {
          return (
            <p key={i} className="text-base font-semibold text-danger mt-1">
              {line.text}
            </p>
          )
        }

        // Regular text
        return (
          <p key={i} className="text-base text-brand-700 leading-relaxed pl-1">
            <MathRenderer text={line.text} />
          </p>
        )
      })}
    </div>
  )
}

// Non-maths explanation — clean structured paragraphs
function ProseExplanation({ text }) {
  if (!text) return null

  const lines = text.split('\n').filter((l) => l.trim().length > 0)

  return (
    <div className="flex flex-col gap-3">
      {lines.map((line, i) => {
        const isStep   = /^step\s*\d+/i.test(line)
        const isBullet = line.trim().startsWith('-') || line.trim().startsWith('•')
        return (
          <p
            key={i}
            className={cn(
              'text-base leading-relaxed',
              isStep   ? 'font-bold text-brand-800 mt-1' :
              isBullet ? 'text-brand-700 pl-3' :
                         'text-brand-700'
            )}
          >
            {line.replace(/^[-•]\s*/, '')}
          </p>
        )
      })}
    </div>
  )
}

// MCQ option row
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
      {isAnswer  && (
        <span className="text-sm font-bold ml-auto flex-shrink-0 whitespace-nowrap">
          ✓ Correct
        </span>
      )}
      {!isAnswer && isStudent && (
        <span className="text-sm font-bold ml-auto flex-shrink-0 whitespace-nowrap">
          Your answer
        </span>
      )}
    </div>
  )
}

export default function ReviewScreen({ results, assessment, onDone }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const current   = results[currentIndex]
  const { question, studentAns, isCorrect } = current
  const isLast    = currentIndex === results.length - 1
  const isFirst   = currentIndex === 0
  const isMaths   = isMathSubject(assessment.subject)

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
            isCorrect
              ? 'bg-success-light text-success'
              : 'bg-danger-light text-danger'
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

          {/* MCQ options */}
          {question.type === 'mcq' && question.options?.length > 0 && (
            <div className="flex flex-col gap-2">
              {question.options.map((opt, oi) => {
                const letter    = String.fromCharCode(65 + oi)
                const optLetter = opt.charAt(0)
                const isAnswer  = optLetter === question.answer || letter === question.answer
                const isStudent = optLetter === studentAns      || letter === studentAns
                return (
                  <OptionRow
                    key={oi}
                    opt={opt}
                    index={oi}
                    isAnswer={isAnswer}
                    isStudent={isStudent}
                  />
                )
              })}
            </div>
          )}

          {/* Fill/TF */}
          {(question.type === 'fill' || question.type === 'truefalse') && (
            <div className="flex flex-col gap-2">
              <div className={cn(
                'px-4 py-3.5 rounded-xl border-2 text-base',
                isCorrect
                  ? 'border-success bg-success-light text-success'
                  : 'border-danger bg-danger-light text-danger'
              )}>
                Your answer: <strong>{studentAns || '(no answer)'}</strong>
              </div>
              {!isCorrect && (
                <div className="px-4 py-3.5 rounded-xl border-2 border-success bg-success-light text-success text-base">
                  Correct answer: <strong>{question.answer}</strong>
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          {question.explanation ? (
            <div className="bg-brand-50 border border-brand-200 rounded-2xl px-5 py-5">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-600 mb-4">
                📖 Explanation
              </p>
              {isMaths ? (
                <MathStepExplanation text={question.explanation} />
              ) : (
                <ProseExplanation text={question.explanation} />
              )}
            </div>
          ) : isCorrect ? (
            <div className="bg-success-light border border-success/20 rounded-2xl px-5 py-4 text-base text-success font-medium">
              ✓ Great job! You got this one right.
            </div>
          ) : null}

        </div>
      </div>

      {/* Bottom nav */}
      <div className="bg-white border-t border-border px-4 py-4 flex-shrink-0">
        <div className="max-w-xl mx-auto flex gap-3">
          {!isFirst && (
            <Button
              variant="secondary"
              onClick={() => setCurrentIndex((i) => i - 1)}
              className="flex-1"
            >
              <ChevronLeft size={15} />
              Previous
            </Button>
          )}
          {!isLast ? (
            <Button
              variant="primary"
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="flex-1"
            >
              Next
              <ChevronRight size={15} />
            </Button>
          ) : (
            <Button
              variant="amber"
              onClick={onDone}
              className="flex-1"
            >
              Done ✓
            </Button>
          )}
        </div>
      </div>

    </div>
  )
}