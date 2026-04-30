'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen, Plus, ChevronRight, ChevronDown,
  Pencil, Trash2, CheckSquare, Square, Wand2, X,
} from 'lucide-react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EditQuestionModal from '@/components/assessment/EditQuestionModal'
import MathRenderer from '@/components/ui/MathRenderer'
import AIGenerate from '@/components/assessment/AIGenerate'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/ToastProvider'

const TYPE_LABELS   = { mcq: 'MCQ', fill: 'Fill in', truefalse: 'True/False', true_false: 'True/False' }
const TYPE_VARIANTS = { mcq: 'brand', fill: 'amber', truefalse: 'green', true_false: 'green' }

function TopicGroup({ topic, questions, onEdit, onDelete, selectedIds, onToggle, onToggleAll }) {
  const [open, setOpen] = useState(false)

  const allSelected  = questions.length > 0 && questions.every((q) => selectedIds.has(q.id))
  const someSelected = questions.some((q) => selectedIds.has(q.id))

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
      <div className="flex items-center border-b border-border">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleAll(questions, !allSelected) }}
          className="pl-4 pr-2 py-3.5 text-ink-4 hover:text-brand-600 transition-colors flex-shrink-0"
        >
          {allSelected
            ? <CheckSquare size={16} className="text-brand-600" />
            : someSelected
            ? <CheckSquare size={16} className="opacity-50" />
            : <Square size={16} />
          }
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-center justify-between px-3 py-3.5 hover:bg-surface/50 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            {open ? <ChevronDown size={14} className="text-ink-4" /> : <ChevronRight size={14} className="text-ink-4" />}
            <span className="text-sm font-semibold text-ink">{topic}</span>
            <span className="text-xs text-ink-4">
              · {questions.length} question{questions.length !== 1 ? 's' : ''}
            </span>
          </div>
          <span className="text-xs text-ink-4 pr-2">{open ? 'Collapse' : 'Expand'}</span>
        </button>
      </div>

      {open && questions
        .sort((a, b) => a.order_index - b.order_index)
        .map((q, i) => {
          const isSelected = selectedIds.has(q.id)
          return (
            <div
              key={q.id}
              className={cn(
                'flex flex-col gap-3 px-4 py-4 border-b border-border last:border-none transition-colors',
                isSelected ? 'bg-brand-50' : 'hover:bg-surface/30'
              )}
            >
              {/* Top row — checkbox + number + question */}
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onToggle(q.id)}
                  className="mt-0.5 flex-shrink-0 text-ink-4 hover:text-brand-600"
                >
                  {isSelected ? <CheckSquare size={16} className="text-brand-600" /> : <Square size={16} />}
                </button>
                <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink leading-relaxed">
                    <MathRenderer text={q.text} />
                  </p>
                  {q.type === 'mcq' && q.options?.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {q.options.map((opt, oi) => {
                        const letter    = String.fromCharCode(65 + oi)
                        const optLetter = opt.charAt(0)
                        const isAnswer  = optLetter === q.answer || letter === q.answer
                        return (
                          <p key={oi} className={cn(
                            'text-xs px-2 py-1 rounded',
                            isAnswer ? 'bg-success-light text-success font-semibold' : 'text-ink-4'
                          )}>
                            <MathRenderer text={opt} /> {isAnswer && '✓'}
                          </p>
                        )
                      })}
                    </div>
                  )}
                  {q.type !== 'mcq' && (
                    <p className="text-xs text-ink-4 mt-1">
                      Answer: <span className="font-semibold text-success">{q.answer}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {q.hint        && <span className="text-[11px] text-amber">💡 Hint</span>}
                    {q.explanation && <span className="text-[11px] text-brand-500">📖 Explanation</span>}
                  </div>
                </div>
              </div>

              {/* Bottom row — type badge + actions — always visible, below on mobile */}
              <div className="flex items-center justify-between pl-9">
                <Badge variant={TYPE_VARIANTS[q.type] ?? TYPE_VARIANTS[q.question_type] ?? 'grey'}>
                  {TYPE_LABELS[q.type] ?? TYPE_LABELS[q.question_type] ?? q.type}
                </Badge>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(q)}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-500 px-2.5 py-1.5 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => onDelete([q.id])}
                    className="flex items-center gap-1 text-xs font-semibold text-danger hover:text-danger/80 px-2.5 py-1.5 bg-danger-light rounded-lg hover:bg-danger-light/80 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}

// AI Generate modal for question bank
function AIGenerateModal({ onClose, onSave }) {
  const { toast } = useToast()
  const [questions,   setQuestions]   = useState([])
  const [subject,     setSubject]     = useState('')
  const [classLevel,  setClassLevel]  = useState('')
  const [topic,       setTopic]       = useState('')
  const [saving,      setSaving]      = useState(false)

  const handleImport = (qs) => setQuestions(qs)

  const handleSave = async () => {
    if (!subject || !classLevel || !topic.trim()) {
      toast({ message: 'Please fill in subject, class and topic.', type: 'warning' })
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const rows = questions.map((q, i) => ({
      assessment_id: null,
      teacher_id:    session.user.id,
      type:          q.type,
      text:          q.text,
      options:       Array.isArray(q.options) ? q.options : [],
      answer:        q.answer,
      hint:          q.hint        || '',
      explanation:   q.explanation || '',
      order_index:   i,
      subject,
      class_level:   classLevel,
      topic,
    }))

    const { error } = await supabase.from('questions').insert(rows)
    if (error) {
      toast({ message: 'Failed to save.', type: 'error' })
    } else {
      toast({ message: `${questions.length} questions saved to Question Bank!`, type: 'success' })
      onSave()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-display text-lg font-bold text-ink">Generate Questions via AI</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-border">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {/* Classify */}
          {questions.length > 0 && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-brand-800">Save to Question Bank — add details</p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-brand-500 bg-white"
                />
                <input
                  type="text"
                  placeholder="Class / Grade"
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-brand-500 bg-white"
                />
                <input
                  type="text"
                  placeholder="Topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="px-3 py-2 text-sm border border-border rounded-xl outline-none focus:border-brand-500 bg-white"
                />
              </div>
            </div>
          )}

          <AIGenerate
            setupData={null}
            onImport={handleImport}
            saveToBank
          />
        </div>

        {questions.length > 0 && (
          <div className="px-6 py-4 border-t border-border flex-shrink-0 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : `Save ${questions.length} Questions to Bank`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function QuestionsPage() {
  const { toast }                             = useToast()
  const [questions,       setQuestions]       = useState([])
  const [loading,         setLoading]         = useState(true)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [selectedIds,     setSelectedIds]     = useState(new Set())
  const [deleting,        setDeleting]        = useState(false)
  const [showAIGenerate,  setShowAIGenerate]  = useState(false)
  const [confirmDeleteIds, setConfirmDeleteIds] = useState(null)

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { data, error } = await supabase
      .from('questions')
      .select('id, type, text, options, answer, hint, explanation, order_index, subject, class_level, topic, assessment_id, teacher_id')
      .eq('teacher_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    setQuestions(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  const handleDelete = async (ids) => {
    const count = ids.length
    window.__deleteConfirmed = false
    if (!confirmDeleteIds) { setConfirmDeleteIds(ids); return }
    setConfirmDeleteIds(null)
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('questions').delete().in('id', ids)
    if (error) {
      toast({ message: 'Failed to delete.', type: 'error' })
    } else {
      toast({ message: `${count} question${count !== 1 ? 's' : ''} deleted.`, type: 'success' })
      setSelectedIds(new Set())
      loadQuestions()
    }
    setDeleting(false)
  }

  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleGroup = (groupQs, selectAll) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      groupQs.forEach((q) => selectAll ? next.add(q.id) : next.delete(q.id))
      return next
    })
  }

  const toggleAll = () => {
    setSelectedIds(
      selectedIds.size === questions.length
        ? new Set()
        : new Set(questions.map((q) => q.id))
    )
  }

  // Build hierarchy
  const hierarchy = {}
  for (const q of questions) {
    const subject = q.subject     ?? 'Uncategorised'
    const cls     = q.class_level ? q.class_level.toUpperCase() : '—'
    const topic   = q.topic       ?? 'General'
    if (!hierarchy[subject])             hierarchy[subject] = {}
    if (!hierarchy[subject][cls])        hierarchy[subject][cls] = {}
    if (!hierarchy[subject][cls][topic]) hierarchy[subject][cls][topic] = []
    hierarchy[subject][cls][topic].push(q)
  }

  const totalQuestions = questions.length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={22} className="text-brand-500" />
                <h1 className="font-display text-3xl font-bold text-ink">Question Bank</h1>
              </div>
              <p className="text-ink-3 text-sm">
                {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Action buttons — stacked on mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Link
              href="/dashboard/ai-import"
              className="flex items-center justify-center gap-2 bg-white border border-border text-ink-2 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-surface transition-colors shadow-card"
            >
              ✨ Import Questions
            </Link>
            <button
              onClick={() => setShowAIGenerate(true)}
              className="flex items-center justify-center gap-2 bg-amber text-ink text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-amber/90 transition-colors"
            >
              <Wand2 size={15} />
              Generate Questions via AI
            </button>
            <Link
              href="/dashboard/questions/new"
              className="flex items-center justify-center gap-2 bg-brand-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors"
            >
              <Plus size={15} />
              Add Questions
            </Link>
          </div>
        </div>

        {/* Bulk actions */}
        {totalQuestions > 0 && (
          <div className="flex items-center gap-3 bg-white border border-border rounded-2xl px-5 py-3 shadow-card flex-wrap">
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm font-medium text-ink-3 hover:text-brand-600 transition-colors"
            >
              {selectedIds.size === totalQuestions
                ? <CheckSquare size={16} className="text-brand-600" />
                : <Square size={16} />
              }
              {selectedIds.size === totalQuestions ? 'Deselect all' : 'Select all'}
            </button>

            {selectedIds.size > 0 && (
              <>
                <span className="text-sm text-ink-4">{selectedIds.size} selected</span>
                <button
                  onClick={() => handleDelete([...selectedIds])}
                  disabled={deleting}
                  className={cn(
                    'ml-auto flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-colors',
                    confirmDeleteIds
                      ? 'bg-danger text-white hover:bg-danger/90'
                      : 'text-danger bg-danger-light hover:bg-danger-light/80'
                  )}
                >
                  <Trash2 size={14} />
                  {confirmDeleteIds ? `Confirm delete ${selectedIds.size}?` : `Delete ${selectedIds.size} selected`}
                </button>
              </>
            )}
          </div>
        )}

        {/* Empty state */}
        {totalQuestions === 0 && (
          <div className="bg-white border border-dashed border-border rounded-2xl p-12 text-center">
            <p className="text-4xl mb-3">📚</p>
            <p className="font-semibold text-ink mb-1">No questions yet</p>
            <p className="text-sm text-ink-3 mb-6 max-w-sm mx-auto">
              Add questions manually, generate them with AI, or import from a worksheet.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setShowAIGenerate(true)}
                className="flex items-center gap-2 bg-amber text-ink text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-amber/90 transition-colors"
              >
                <Wand2 size={15} /> Generate via AI
              </button>
              <Link
                href="/dashboard/questions/new"
                className="flex items-center gap-2 bg-brand-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors"
              >
                <Plus size={15} /> Add Questions
              </Link>
            </div>
          </div>
        )}

        {/* Hierarchy */}
        {Object.entries(hierarchy).map(([subject, classes]) => (
          <div key={subject} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-bold uppercase tracking-widest text-ink-3 px-2">
                {subject}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {Object.entries(classes).map(([cls, topics]) => {
              const classTotal = Object.values(topics).reduce((s, qs) => s + qs.length, 0)
              return (
                <div key={cls} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-1">
                    <Badge variant="brand">{cls}</Badge>
                    <span className="text-xs text-ink-4">
                      {classTotal} question{classTotal !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {Object.entries(topics).map(([topic, qs]) => (
                    <TopicGroup
                      key={topic}
                      topic={topic}
                      questions={qs}
                      onEdit={setEditingQuestion}
                      onDelete={handleDelete}
                      selectedIds={selectedIds}
                      onToggle={toggleOne}
                      onToggleAll={toggleGroup}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        ))}

      </div>

      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSaved={() => { setEditingQuestion(null); loadQuestions() }}
        />
      )}

      {showAIGenerate && (
        <AIGenerateModal
          onClose={() => setShowAIGenerate(false)}
          onSave={() => { setShowAIGenerate(false); loadQuestions() }}
        />
      )}
    </>
  )
}