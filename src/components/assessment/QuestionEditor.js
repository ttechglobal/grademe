'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUESTION_TYPES = [
  { value: 'mcq',       label: 'Multiple Choice (MCQ)' },
  { value: 'fill',      label: 'Fill in the Answer' },
  { value: 'truefalse', label: 'True / False' },
]

function QuestionCard({ question, index, onChange, onRemove }) {
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

      {/* Card body */}
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-4 border-t border-border">
          <div className="pt-4">
            <Select
              label="Question Type"
              options={QUESTION_TYPES}
              value={question.type}
              onChange={(e) => onChange('type', e.target.value)}
            />
          </div>

          <Input
            label="Question"
            placeholder="Type your question here..."
            value={question.text}
            onChange={(e) => onChange('text', e.target.value)}
          />

          {/* MCQ Options */}
          {question.type === 'mcq' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-ink-2">Answer Options</label>
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
          )}

          {/* Fill / True-False answer */}
          {(question.type === 'fill' || question.type === 'truefalse') && (
            question.type === 'truefalse' ? (
              <div className="flex gap-3">
                {['True', 'False'].map((val) => (
                  <button
                    key={val}
                    onClick={() => onChange('answer', val)}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                      question.answer === val
                        ? 'bg-brand-800 text-white border-brand-800'
                        : 'bg-white text-ink-3 border-border hover:border-brand-400'
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                label="Correct Answer"
                placeholder="Type the correct answer..."
                value={question.answer}
                onChange={(e) => onChange('answer', e.target.value)}
              />
            )
          )}

          {/* Hint */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-ink-2">Hint (optional)</label>
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

const blankQuestion = () => ({
  type:    'mcq',
  text:    '',
  options: ['', '', '', ''],
  answer:  '',
  hint:    '',
})

export default function QuestionEditor({ questions, onChange }) {

  const addQuestion = () => {
    onChange([...questions, blankQuestion()])
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

      {questions.map((q, i) => (
        <QuestionCard
          key={i}
          index={i}
          question={q}
          onChange={(field, value) => updateQuestion(i, field, value)}
          onRemove={() => removeQuestion(i)}
        />
      ))}

      <button
        onClick={addQuestion}
        className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-brand-200 rounded-2xl text-brand-500 text-sm font-semibold hover:border-brand-400 hover:bg-brand-50 transition-colors"
      >
        <Plus size={16} />
        Add Question
      </button>
    </div>
  )
}