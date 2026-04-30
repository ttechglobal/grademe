'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Trash2, Plus, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── True/False question card ───────────────────────────────────────────────
function TrueFalseCard({ question, index, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">

      {/* Card header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-amber-light text-amber text-xs font-bold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <p className="text-sm font-medium text-ink truncate max-w-xs">
            {question.text || <span className="text-ink-4 italic">Untitled statement</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="text-ink-4 hover:text-danger transition-colors p-1"
          >
            <Trash2 size={15} />
          </button>
          {expanded ? <ChevronUp size={16} className="text-ink-4" /> : <ChevronDown size={16} className="text-ink-4" />}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-4 border-t border-border">
          {/* Statement */}
          <div className="pt-4">
            <Input
              label="Statement"
              placeholder="e.g. The mitochondria is the powerhouse of the cell."
              value={question.text}
              onChange={(e) => onChange('text', e.target.value)}
            />
            <p className="text-xs text-ink-4 mt-1.5 px-0.5">
              Write a clear statement that is definitively true or false — avoid ambiguous statements.
            </p>
          </div>

          {/* True / False toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-ink-2">Correct Answer</label>
            <div className="grid grid-cols-2 gap-3">
              {['True', 'False'].map((val) => {
                const isSelected = question.answer === val
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onChange('answer', val)}
                    className={cn(
                      'flex items-center justify-center gap-2.5 py-4 rounded-2xl border-2 text-base font-bold transition-all',
                      isSelected
                        ? val === 'True'
                          ? 'bg-success-light border-success text-success'
                          : 'bg-danger-light border-danger text-danger'
                        : 'bg-white border-border text-ink-3 hover:border-brand-300'
                    )}
                  >
                    {val === 'True'
                      ? <CheckCircle2 size={20} className={isSelected ? 'text-success' : 'text-ink-4'} />
                      : <XCircle size={20} className={isSelected ? 'text-danger' : 'text-ink-4'} />
                    }
                    {val}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Explanation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-2">
              Explanation <span className="text-ink-4 font-normal">(shown to students after submission)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Explain why the statement is true or false, with supporting details…"
              value={question.explanation ?? ''}
              onChange={(e) => onChange('explanation', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border-2 rounded-xl outline-none border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
            />
          </div>

          {/* Hint */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-ink-2">Hint (optional)</label>
              <button
                onClick={() => onChange('hint', question.hint ? '' : ' ')}
                className={cn(
                  'text-xs px-3 py-1 rounded-full border font-medium transition-colors',
                  question.hint
                    ? 'bg-amber-light text-amber border-amber'
                    : 'bg-surface text-ink-4 border-border hover:border-amber'
                )}
              >
                {question.hint ? 'Hint on' : 'Add hint'}
              </button>
            </div>
            {question.hint !== undefined && question.hint !== '' && (
              <Input
                placeholder="e.g. Think about where the cell gets its energy."
                value={question.hint}
                onChange={(e) => onChange('hint', e.target.value)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── MCQ question card (unchanged) ─────────────────────────────────────────
function MCQCard({ question, index, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(true)

  const updateOption = (i, value) => {
    const options = [...question.options]
    options[i] = value
    onChange('options', options)
  }

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">

      {/* Card header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <p className="text-sm font-medium text-ink truncate max-w-xs">
            {question.text || <span className="text-ink-4 italic">Untitled question</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="text-ink-4 hover:text-danger transition-colors p-1"
          >
            <Trash2 size={15} />
          </button>
          {expanded ? <ChevronUp size={16} className="text-ink-4" /> : <ChevronDown size={16} className="text-ink-4" />}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-4 border-t border-border">
          <div className="pt-4">
            <Input
              label="Question"
              placeholder="Type your question here..."
              value={question.text}
              onChange={(e) => onChange('text', e.target.value)}
            />
          </div>

          {/* MCQ Options */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-ink-2">Answer Options</label>
            {question.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-xs font-bold text-ink-4 flex-shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  type="text"
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  className={cn(
                    'flex-1 px-3 py-2 text-sm border rounded-xl outline-none',
                    'border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
                    question.answer === String.fromCharCode(65 + i) && 'border-success bg-success-light'
                  )}
                />
                <button
                  onClick={() => onChange('answer', String.fromCharCode(65 + i))}
                  className={cn(
                    'text-xs px-3 py-2 rounded-xl border font-medium transition-colors',
                    question.answer === String.fromCharCode(65 + i)
                      ? 'bg-success-light text-success border-success'
                      : 'bg-surface text-ink-4 border-border hover:border-brand-400'
                  )}
                >
                  {question.answer === String.fromCharCode(65 + i) ? '✓ Correct' : 'Correct?'}
                </button>
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink-2">
              Explanation <span className="text-ink-4 font-normal">(shown to students after submission)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Explain the correct answer step by step…"
              value={question.explanation ?? ''}
              onChange={(e) => onChange('explanation', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border-2 rounded-xl outline-none border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
            />
          </div>

          {/* Hint */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-ink-2">Hint (optional)</label>
              <button
                onClick={() => onChange('hint', question.hint ? '' : ' ')}
                className={cn(
                  'text-xs px-3 py-1 rounded-full border font-medium transition-colors',
                  question.hint
                    ? 'bg-amber-light text-amber border-amber'
                    : 'bg-surface text-ink-4 border-border hover:border-amber'
                )}
              >
                {question.hint ? 'Hint on' : 'Add hint'}
              </button>
            </div>
            {question.hint !== undefined && question.hint !== '' && (
              <Input
                placeholder="e.g. Substitute x = 5 directly into the equation"
                value={question.hint}
                onChange={(e) => onChange('hint', e.target.value)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Blank question factories ───────────────────────────────────────────────
const blankMCQ = () => ({
  type:        'mcq',
  text:        '',
  options:     ['', '', '', ''],
  answer:      '',
  hint:        '',
  explanation: '',
})

const blankTrueFalse = () => ({
  type:          'truefalse',
  question_type: 'true_false',
  text:          '',
  options:       [],
  answer:        '',
  hint:          '',
  explanation:   '',
})

// ── Main editor — branched by questionType prop ───────────────────────────
/**
 * @param {object[]} questions   - Current question list
 * @param {Function} onChange    - Setter for the full question list
 * @param {string}  questionType - 'mcq' | 'true_false'  (from wizard step 0)
 */
export default function QuestionEditor({ questions, onChange, questionType = 'mcq' }) {
  const isTrueFalse = questionType === 'true_false'

  const addQuestion = () => {
    onChange([...questions, isTrueFalse ? blankTrueFalse() : blankMCQ()])
  }

  const removeQuestion = (i) => {
    onChange(questions.filter((_, idx) => idx !== i))
  }

  const updateQuestion = (i, field, value) => {
    const updated = questions.map((q, idx) =>
      idx === i ? { ...q, [field]: value } : q
    )
    onChange(updated)
  }

  return (
    <div className="flex flex-col gap-4">
      {questions.length === 0 && (
        <div className="text-center py-12 text-ink-4 text-sm bg-white border border-dashed border-border rounded-2xl">
          No questions yet. Click the button below to add your first one.
        </div>
      )}

      {questions.map((q, i) => {
        const isQTrueFalse = q.type === 'truefalse' || q.question_type === 'true_false' || isTrueFalse
        return isQTrueFalse ? (
          <TrueFalseCard
            key={i}
            index={i}
            question={q}
            onChange={(field, value) => updateQuestion(i, field, value)}
            onRemove={() => removeQuestion(i)}
          />
        ) : (
          <MCQCard
            key={i}
            index={i}
            question={q}
            onChange={(field, value) => updateQuestion(i, field, value)}
            onRemove={() => removeQuestion(i)}
          />
        )
      })}

      <button
        onClick={addQuestion}
        className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-brand-200 rounded-2xl text-brand-500 text-sm font-semibold hover:border-brand-400 hover:bg-brand-50 transition-colors"
      >
        <Plus size={16} />
        Add {isTrueFalse ? 'True/False Statement' : 'Question'}
      </button>
    </div>
  )
}