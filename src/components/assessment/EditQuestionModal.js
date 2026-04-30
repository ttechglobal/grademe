'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { X, Save, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUESTION_TYPES = [
  { value: 'mcq',       label: 'Multiple Choice (MCQ)' },
  { value: 'fill',      label: 'Fill in the Answer'    },
  { value: 'truefalse', label: 'True / False'          },
]

export default function EditQuestionModal({ question, onClose, onSaved }) {
  const router    = useRouter()
  const { toast } = useToast()

  const [type,        setType]        = useState(question.type)
  const [text,        setText]        = useState(question.text)
  const [options,     setOptions]     = useState(
    question.options?.length ? question.options : ['', '', '', '']
  )
  const [answer,      setAnswer]      = useState(question.answer)
  const [hint,        setHint]        = useState(question.hint ?? '')
  const [explanation, setExplanation] = useState(question.explanation ?? '')
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const updateOption = (i, val) => {
    const next = [...options]
    next[i] = val
    setOptions(next)
  }

  const handleSave = async () => {
    if (!text.trim() || !answer.trim()) {
      toast({ message: 'Question and answer are required.', type: 'error' })
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('questions')
      .update({ type, text, options, answer, hint, explanation })
      .eq('id', question.id)

    if (error) {
      toast({ message: 'Failed to save. Try again.', type: 'error' })
    } else {
      toast({ message: 'Question updated!', type: 'success' })
      onSaved()
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setConfirmDelete(false)
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', question.id)

    if (error) {
      toast({ message: 'Failed to delete.', type: 'error' })
    } else {
      toast({ message: 'Question deleted.', type: 'success' })
      onClose()
      router.refresh()
    }
    setDeleting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="font-display text-lg font-bold text-ink">Edit Question</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-border transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <Select
            label="Question Type"
            options={QUESTION_TYPES}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-2">Question</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-sm border border-border rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
            />
          </div>

          {/* MCQ options */}
          {type === 'mcq' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-ink-2">Options</label>
              {options.map((opt, i) => {
                const letter   = String.fromCharCode(65 + i)
                const isAnswer = letter === answer
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-xs font-bold text-ink-4 flex-shrink-0">
                      {letter}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${letter}`}
                      className={cn(
                        'flex-1 px-3 py-2 text-sm border rounded-xl outline-none',
                        'border-border focus:border-brand-500',
                        isAnswer && 'border-success bg-success-light'
                      )}
                    />
                    <button
                      onClick={() => setAnswer(letter)}
                      className={cn(
                        'text-xs px-3 py-2 rounded-xl border font-medium transition-colors whitespace-nowrap',
                        isAnswer
                          ? 'bg-success-light text-success border-success'
                          : 'bg-surface text-ink-4 border-border hover:border-brand-400'
                      )}
                    >
                      {isAnswer ? '✓ Correct' : 'Correct?'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* True/False */}
          {type === 'truefalse' && (
            <div className="flex gap-3">
              {['True', 'False'].map((val) => (
                <button
                  key={val}
                  onClick={() => setAnswer(val)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                    answer === val
                      ? 'bg-brand-800 text-white border-brand-800'
                      : 'bg-white text-ink-3 border-border hover:border-brand-400'
                  )}
                >
                  {val}
                </button>
              ))}
            </div>
          )}

          {/* Fill answer */}
          {type === 'fill' && (
            <Input
              label="Correct Answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type the correct answer"
            />
          )}

          {/* Hint */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-2">
              Hint <span className="text-ink-4 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="A helpful nudge without giving away the answer"
              className="w-full px-4 py-3 text-sm border border-border rounded-xl outline-none focus:border-brand-500"
            />
          </div>

          {/* Explanation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-2">
              Explanation <span className="text-ink-4 font-normal">(optional)</span>
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={4}
              placeholder="Step-by-step explanation shown to students after submission"
              className="w-full px-4 py-3 text-sm border border-border rounded-xl outline-none focus:border-brand-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between sticky bottom-0 bg-white">
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            loading={deleting}
          >
            <Trash2 size={14} />
            {confirmDelete ? 'Confirm delete?' : 'Delete'}
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              loading={saving}
            >
              <Save size={14} />
              Save Changes
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}