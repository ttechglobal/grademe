'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Sparkles, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

// ── AI Explanation fetcher ──────────────────────────────────────────────────
async function fetchAIExplanation(question, studentAnswer, correctAnswer, subject) {
  const prompt = `You are a patient, encouraging tutor. A student just answered a ${subject || 'exam'} question incorrectly.

Question: ${question}
Student's answer: ${studentAnswer || '(no answer given)'}
Correct answer: ${correctAnswer}

Your job: Help them understand WHY the correct answer is right and WHERE they went wrong.

FORMAT RULES (follow exactly):
- Use simple, clear language — explain like to a 14-year-old
- Be encouraging, never make them feel bad
- Keep it SHORT — maximum 6 lines
- For maths/calculations: show each step on a NEW LINE
- Start each step with "Step 1:", "Step 2:" etc
- End with "✓ Answer: [correct answer]"
- Do NOT write long paragraphs
- Do NOT be wordy

GOOD EXAMPLE FORMAT (for maths):
Where you went wrong: You subtracted instead of adding.

Step 1: Start with 2x + 5 = 13
Step 2: Subtract 5 from both sides → 2x = 8
Step 3: Divide both sides by 2 → x = 4

✓ Answer: x = 4

Now write the explanation:`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    return data.content?.[0]?.text ?? null
  } catch {
    return null
  }
}

// ── Explanation renderer ────────────────────────────────────────────────────
function ExplanationBlock({ text, loading }) {
  if (loading) {
    return (
      <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-5 flex flex-col items-center gap-3">
        <Spinner className="w-5 h-5 text-brand-500" />
        <p className="text-xs text-brand-500 font-medium">
          Generating personalised explanation…
        </p>
      </div>
    )
  }

  if (!text) return null

  const lines = text.split('\n').filter((l) => l.trim().length > 0)

  return (
    <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={13} className="text-brand-500" />
        <p className="text-xs font-bold uppercase tracking-wide text-brand-600">
          AI Explanation
        </p>
      </div>
      {lines.map((line, i) => {
        const isAnswer  = line.startsWith('✓') || line.toLowerCase().startsWith('answer:')
        const isStep    = /^step\s*\d+:/i.test(line)
        const isWrong   = line.toLowerCase().startsWith('where you went wrong')
        return (
          <p
            key={i}
            className={cn(
              'text-sm leading-relaxed',
              isAnswer ? 'font-bold text-success mt-1'     :
              isStep   ? 'text-brand-800 font-medium'      :
              isWrong  ? 'text-danger font-medium'         :
                         'text-brand-700'
            )}
          >
            {line}
          </p>
        )
      })}
    </div>
  )
}

// ── Static explanation renderer (from stored explanation field) ─────────────
function StoredExplanation({ text }) {
  if (!text) return null

  const lines = text.split('\n').filter((l) => l.trim().length > 0)

  return (
    <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-4 flex flex-col gap-1.5">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-1">
        📖 Explanation
      </p>
      {lines.map((line, i) => {
        const isAnswer = line.toLowerCase().startsWith('answer:') || line.startsWith('✓')
        const isStep   = /^step\s*\d+:/i.test(line)
        return (
          <p
            key={i}
            className={cn(
              'text-sm leading-relaxed',
              isAnswer ? 'font-bold text-success mt-1' :
              isStep   ? 'text-brand-800 font-medium'  :
                         'text-brand-700'
            )}
          >
            {line}
          </p>
        )
      })}
    </div>
  )
}

// ── Option row ──────────────────────────────────────────────────────────────
function OptionRow({ opt, index, isAnswer, isStudent }) {
  let cls = 'border-border bg-white text-ink-3'
  if (isAnswer && isStudent)  cls = 'border-success bg-success-light text-success'
  if (isAnswer && !isStudent) cls = 'border-success bg-success-light text-success'
  if (!isAnswer && isStudent) cls = 'border-danger bg-danger-light text-danger'

  const display = typeof opt === 'string' && opt.length > 2 && /^[A-D]\.\s/.test(opt)
    ? opt
    : `${String.fromCharCode(65 + index)}. ${opt}`

  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm', cls)}>
      <span className="font-bold flex-shrink-0">{String.fromCharCode(65 + index)}</span>
      <span className="flex-1">{opt.length > 2 ? opt.replace(/^[A-D]\.\s*/, '') : opt}</span>
      {isAnswer  && <span className="text-xs font-bold ml-auto flex-shrink-0">✓ Correct</span>}
      {!isAnswer && isStudent && <span className="text-xs font-bold ml-auto flex-shrink-0">Your answer</span>}
    </div>
  )
}

// ── Main ReviewScreen ───────────────────────────────────────────────────────
export default function ReviewScreen({ results, assessment, onDone }) {
  const [currentIndex,   setCurrentIndex]   = useState(0)
  const [aiExplanations, setAiExplanations] = useState({})
  const [loadingAI,      setLoadingAI]      = useState({})

  const current      = results[currentIndex]
  const { question, studentAns, isCorrect } = current
  const isLast       = currentIndex === results.length - 1
  const isFirst      = currentIndex === 0

  // Auto-fetch AI explanation for wrong answers
  useEffect(() => {
    if (isCorrect) return
    if (aiExplanations[currentIndex] !== undefined) return
    if (loadingAI[currentIndex]) return

    setLoadingAI((prev) => ({ ...prev, [currentIndex]: true }))

    fetchAIExplanation(
      question.text,
      studentAns,
      question.answer,
      assessment.subject
    ).then((explanation) => {
      setAiExplanations((prev) => ({ ...prev, [currentIndex]: explanation ?? '' }))
      setLoadingAI((prev) => ({ ...prev, [currentIndex]: false }))
    })
  }, [currentIndex, isCorrect])

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
              className="h-full bg-brand-600 rounded-full transition-all duration-400"
              style={{ width: `${((currentIndex + 1) / results.length) * 100}%` }}
            />
          </div>

          {/* Correct / incorrect pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-bold transition-all border-2',
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

      {/* Question content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 py-5 flex flex-col gap-4">

          {/* Status badge */}
          <div className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold self-start',
            isCorrect
              ? 'bg-success-light text-success'
              : 'bg-danger-light text-danger'
          )}>
            {isCorrect
              ? <><CheckCircle2 size={15} /> Correct</>
              : <><XCircle size={15} /> Incorrect</>
            }
          </div>

          {/* Question */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-2">
              Question {currentIndex + 1}
            </p>
            <p className="text-base font-medium text-ink leading-relaxed">
              {question.text}
            </p>
            {question.hint && (
              <div className="mt-3 bg-amber-light rounded-xl px-3 py-2 text-xs text-amber">
                💡 {question.hint}
              </div>
            )}
          </div>

          {/* Answer options */}
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

          {/* Fill / TrueFalse */}
          {(question.type === 'fill' || question.type === 'truefalse') && (
            <div className="flex flex-col gap-2">
              <div className={cn(
                'px-4 py-3 rounded-xl border-2 text-sm',
                isCorrect
                  ? 'border-success bg-success-light text-success'
                  : 'border-danger bg-danger-light text-danger'
              )}>
                Your answer: <strong>{studentAns || '(no answer)'}</strong>
              </div>
              {!isCorrect && (
                <div className="px-4 py-3 rounded-xl border-2 border-success bg-success-light text-success text-sm">
                  Correct answer: <strong>{question.answer}</strong>
                </div>
              )}
            </div>
          )}

          {/* Explanation section */}
          {isCorrect ? (
            /* Correct — show stored explanation if available */
            question.explanation ? (
              <StoredExplanation text={question.explanation} />
            ) : (
              <div className="bg-success-light border border-success/20 rounded-xl px-4 py-3 text-sm text-success font-medium">
                ✓ Great job! You got this one right.
              </div>
            )
          ) : (
            /* Wrong — show stored explanation OR AI-generated one */
            question.explanation ? (
              <StoredExplanation text={question.explanation} />
            ) : (
              <ExplanationBlock
                text={aiExplanations[currentIndex]}
                loading={!!loadingAI[currentIndex]}
              />
            )
          )}

        </div>
      </div>

      {/* Bottom navigation */}
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