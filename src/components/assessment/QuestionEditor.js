'use client';

import { Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// ─── MCQ EDITOR ───────────────────────────────────────────────────────────────

function MCQEditor({ question, index, onChange, onDelete }) {
  const [expanded, setExpanded] = useState(true);

  const updateOption = (optIndex, value) => {
    const newOptions = [...(question.options || ['', '', '', ''])];
    newOptions[optIndex] = value;
    onChange({ ...question, options: newOptions });
  };

  const options = question.options || ['', '', '', ''];
  const labels = ['A', 'B', 'C', 'D'];

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-border">
        <GripVertical className="h-4 w-4 text-ink-4 cursor-grab shrink-0" />
        <span className="text-xs font-semibold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded">
          Q{index + 1} · MCQ
        </span>
        <span className="flex-1 text-sm text-ink-3 truncate">
          {question.question || 'Untitled question'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-ink-4 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete question"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-ink-4 hover:text-ink hover:bg-surface transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Question text */}
          <div>
            <label className="block text-xs font-semibold text-ink-3 mb-1">Question</label>
            <textarea
              value={question.question || ''}
              onChange={(e) => onChange({ ...question, question: e.target.value })}
              rows={2}
              placeholder="Enter your question..."
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-ink-3">Options</label>
            {labels.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...question, correct_answer: label, answer: label })}
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    question.correct_answer === label
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface text-ink-3 hover:bg-brand-500/10 hover:text-brand-500 border border-border'
                  )}
                  title={`Mark ${label} as correct`}
                >
                  {label}
                </button>
                <input
                  type="text"
                  value={options[i] || ''}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${label}`}
                  className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand-500"
                />
              </div>
            ))}
            <p className="text-xs text-ink-4">Click a letter to mark it as the correct answer.</p>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold text-ink-3 mb-1">Explanation</label>
            <textarea
              value={question.explanation || ''}
              onChange={(e) => onChange({ ...question, explanation: e.target.value })}
              rows={2}
              placeholder="Why is this the correct answer?"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Hint */}
          <div>
            <label className="block text-xs font-semibold text-ink-3 mb-1">Hint (optional)</label>
            <input
              type="text"
              value={question.hint || ''}
              onChange={(e) => onChange({ ...question, hint: e.target.value })}
              placeholder="A clue for students who are stuck..."
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TRUE/FALSE EDITOR ────────────────────────────────────────────────────────

function TrueFalseEditor({ question, index, onChange, onDelete }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-border">
        <GripVertical className="h-4 w-4 text-ink-4 cursor-grab shrink-0" />
        <span className="text-xs font-semibold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded">
          Q{index + 1} · T/F
        </span>
        <span className="flex-1 text-sm text-ink-3 truncate">
          {question.question || 'Untitled statement'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-ink-4 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-ink-4 hover:text-ink hover:bg-surface transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Statement */}
          <div>
            <label className="block text-xs font-semibold text-ink-3 mb-1">Statement</label>
            <textarea
              value={question.question || ''}
              onChange={(e) => onChange({ ...question, question: e.target.value })}
              rows={2}
              placeholder="Enter a true or false statement..."
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Correct answer */}
          <div>
            <label className="block text-xs font-semibold text-ink-3 mb-2">Correct Answer</label>
            <div className="flex gap-3">
              {['True', 'False'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChange({ ...question, correct_answer: val, answer: val })}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors',
                    question.correct_answer === val
                      ? val === 'True'
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-red-500 border-red-500 text-white'
                      : 'border-border bg-white text-ink-3 hover:border-brand-500 hover:text-brand-500'
                  )}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold text-ink-3 mb-1">Explanation</label>
            <textarea
              value={question.explanation || ''}
              onChange={(e) => onChange({ ...question, explanation: e.target.value })}
              rows={2}
              placeholder="Why is this statement true or false?"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Hint */}
          <div>
            <label className="block text-xs font-semibold text-ink-3 mb-1">Hint (optional)</label>
            <input
              type="text"
              value={question.hint || ''}
              onChange={(e) => onChange({ ...question, hint: e.target.value })}
              placeholder="A clue for students..."
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CALCULATION ANSWER PREVIEW ───────────────────────────────────────────────
// Read-only preview of what the student will see

function AnswerTemplatePreview({ template }) {
  if (!template) return null;

  const { type, structure = [], unit } = template;

  const boxClass =
    'inline-flex items-center justify-center min-w-[3rem] min-h-[2.5rem] px-2 rounded-lg border-2 border-brand-500 bg-brand-500/5 text-brand-500 font-bold text-sm';

  const labelClass = 'text-xs font-semibold text-ink-3 mr-1';

  const renderBox = (item) => (
    <span key={item.id} className="inline-flex items-center gap-1">
      {item.label && item.label !== 'Answer' && (
        <span className={labelClass}>{item.label} =</span>
      )}
      <span className={boxClass}>{item.answer}</span>
    </span>
  );

  if (type === 'fraction') {
    const num = structure.find((s) => s.id === 'num') || structure[0];
    const den = structure.find((s) => s.id === 'den') || structure[1];
    return (
      <div className="inline-flex flex-col items-center gap-0.5">
        <span className={boxClass}>{num?.answer}</span>
        <div className="w-full h-px bg-brand-500" />
        <span className={boxClass}>{den?.answer}</span>
      </div>
    );
  }

  if (type === 'power') {
    const base = structure[0];
    const exp = structure[1];
    return (
      <div className="inline-flex items-start gap-0.5">
        <span className={boxClass}>{base?.answer}</span>
        <sup>
          <span className={cn(boxClass, 'text-xs min-w-[1.75rem] min-h-[1.75rem]')}>
            {exp?.answer}
          </span>
        </sup>
      </div>
    );
  }

  if (type === 'scientific') {
    const coeff = structure[0];
    const exp = structure[1];
    return (
      <div className="inline-flex items-center gap-1">
        <span className={boxClass}>{coeff?.answer}</span>
        <span className="text-sm font-semibold text-ink">× 10</span>
        <sup>
          <span className={cn(boxClass, 'text-xs min-w-[1.75rem] min-h-[1.75rem]')}>
            {exp?.answer}
          </span>
        </sup>
      </div>
    );
  }

  if (type === 'surd') {
    const coeff = structure[0];
    const rad = structure[1];
    return (
      <div className="inline-flex items-center gap-1">
        <span className={boxClass}>{coeff?.answer}</span>
        <span className="text-sm font-semibold text-ink">√</span>
        <span className={boxClass}>{rad?.answer}</span>
      </div>
    );
  }

  if (type === 'coordinates') {
    const x = structure[0];
    const y = structure[1];
    return (
      <div className="inline-flex items-center gap-1">
        <span className="text-ink font-semibold">(</span>
        <span className={boxClass}>{x?.answer}</span>
        <span className="text-ink font-semibold">,</span>
        <span className={boxClass}>{y?.answer}</span>
        <span className="text-ink font-semibold">)</span>
      </div>
    );
  }

  if (type === 'percentage') {
    const item = structure[0];
    return (
      <div className="inline-flex items-center gap-1">
        <span className={boxClass}>{item?.answer}</span>
        <span className="text-ink font-semibold">%</span>
      </div>
    );
  }

  if (type === 'angle') {
    const item = structure[0];
    return (
      <div className="inline-flex items-center gap-1">
        <span className={boxClass}>{item?.answer}</span>
        <span className="text-ink font-semibold">°</span>
      </div>
    );
  }

  if (type === 'units') {
    const item = structure[0];
    return (
      <div className="inline-flex items-center gap-1">
        <span className={boxClass}>{item?.answer}</span>
        <span className="text-ink-3 text-sm font-semibold">{unit}</span>
      </div>
    );
  }

  if (type === 'ratio') {
    return (
      <div className="inline-flex items-center gap-1">
        {structure.map((item, i) => (
          <span key={item.id} className="inline-flex items-center gap-1">
            {i > 0 && <span className="text-ink font-semibold">:</span>}
            <span className={boxClass}>{item.answer}</span>
          </span>
        ))}
      </div>
    );
  }

  // Default: simultaneous, two_roots, number, decimal — label + box
  return (
    <div className="inline-flex flex-wrap gap-3">
      {structure.map((item) => renderBox(item))}
    </div>
  );
}

// ─── CALCULATION EDITOR ───────────────────────────────────────────────────────

function CalculationEditor({ question, index, onChange, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  const template = question.answer_template;

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface border-b border-border">
        <GripVertical className="h-4 w-4 text-ink-4 cursor-grab shrink-0" />
        <span className="text-xs font-semibold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded">
          Q{index + 1} · Calc
        </span>
        <span className="flex-1 text-sm text-ink-3 truncate">
          {question.question || 'Untitled calculation'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-ink-4 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-ink-4 hover:text-ink hover:bg-surface transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Question text */}
          <div>
            <label className="block text-xs font-semibold text-ink-3 mb-1">Question</label>
            <textarea
              value={question.question || ''}
              onChange={(e) => onChange({ ...question, question: e.target.value })}
              rows={2}
              placeholder="Enter the calculation question..."
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Answer template preview */}
          {template ? (
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs font-semibold text-ink-3 mb-3">
                Answer Template Preview
                <span className="ml-2 text-ink-4 font-normal">(AI-generated · read-only)</span>
              </p>

              {/* Visual preview */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-ink-4">Student will see:</span>
                <AnswerTemplatePreview template={template} />
              </div>

              {/* Correct answers list */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-ink-3">Correct Answers</p>
                {template.structure?.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="text-xs text-ink-4 w-20 shrink-0">
                      {item.label}:
                    </span>
                    <span className="text-sm font-bold text-ink">{item.answer}</span>
                    <span className="text-xs text-ink-4">
                      (also accepts: {item.accepted?.filter((a) => a !== item.answer).join(', ') || '—'})
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-ink-4 mt-3">
                Template type: <strong className="text-ink-3">{template.type}</strong>
                {template.unit ? ` · Unit: ${template.unit}` : ''}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-surface p-4 text-center">
              <p className="text-sm text-ink-4">
                No answer template yet. Generate this question with AI to get a structured answer template.
              </p>
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold text-ink-3 mb-1">
              Step-by-step Explanation
            </label>
            <textarea
              value={question.explanation || ''}
              onChange={(e) => onChange({ ...question, explanation: e.target.value })}
              rows={3}
              placeholder="Show the full working step by step..."
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          {/* Hint */}
          <div>
            <label className="block text-xs font-semibold text-ink-3 mb-1">Hint (optional)</label>
            <input
              type="text"
              value={question.hint || ''}
              onChange={(e) => onChange({ ...question, hint: e.target.value })}
              placeholder="A clue without giving away the answer..."
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

/**
 * QuestionEditor — renders the correct editor based on question_type.
 * Supports: mcq, true_false, calculation.
 */
export default function QuestionEditor({ question, index, onChange, onDelete }) {
  const type = question?.question_type || question?.type;

  if (type === 'calculation') {
    return (
      <CalculationEditor
        question={question}
        index={index}
        onChange={onChange}
        onDelete={onDelete}
      />
    );
  }

  if (type === 'true_false' || type === 'truefalse') {
    return (
      <TrueFalseEditor
        question={question}
        index={index}
        onChange={onChange}
        onDelete={onDelete}
      />
    );
  }

  // Default: MCQ
  return (
    <MCQEditor
      question={question}
      index={index}
      onChange={onChange}
      onDelete={onDelete}
    />
  );
}