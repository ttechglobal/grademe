'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Plus, ChevronRight, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EditQuestionModal from '@/components/assessment/EditQuestionModal'
import { cn } from '@/lib/utils'

const TYPE_LABELS   = { mcq: 'MCQ', fill: 'Fill in', truefalse: 'True/False' }
const TYPE_VARIANTS = { mcq: 'brand', fill: 'amber', truefalse: 'blue' }

function TopicGroup({ topic, questions, onEdit, onDelete }) {
  const [open, setOpen] = useState(false) // collapsed by default

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">

      {/* Topic header — click to expand/collapse */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-surface hover:bg-brand-50 transition-colors border-b border-border"
      >
        <div className="flex items-center gap-2">
          {open
            ? <ChevronDown size={14} className="text-ink-4 flex-shrink-0" />
            : <ChevronRight size={14} className="text-ink-4 flex-shrink-0" />
          }
          <span className="text-sm font-semibold text-ink">{topic}</span>
          <span className="text-xs text-ink-4">
            · {questions.length} question{questions.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-xs text-ink-4">{open ? 'Collapse' : 'Expand'}</span>
      </button>

      {/* Questions — only shown when open */}
      {open && (
        <div>
          {questions
            .sort((a, b) => a.order_index - b.order_index)
            .map((q, i) => (
              <div
                key={q.id}
                className="flex items-start gap-4 px-5 py-4 border-b border-border last:border-none hover:bg-surface/30 transition-colors group"
              >
                {/* Number */}
                <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink leading-relaxed">{q.text}</p>

                  {/* MCQ options */}
                  {q.type === 'mcq' && q.options?.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {q.options.map((opt, oi) => {
                        const letter   = String.fromCharCode(65 + oi)
                        const optLetter = opt.charAt(0)
                        const isAnswer  = optLetter === q.answer || letter === q.answer
                        return (
                          <p
                            key={oi}
                            className={cn(
                              'text-xs px-2 py-1 rounded',
                              isAnswer
                                ? 'bg-success-light text-success font-semibold'
                                : 'text-ink-4'
                            )}
                          >
                            {opt} {isAnswer && '✓'}
                          </p>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {q.type !== 'mcq' && (
                      <p className="text-xs text-ink-4">
                        Answer:{' '}
                        <span className="font-semibold text-success">{q.answer}</span>
                      </p>
                    )}
                    {q.hint && (
                      <span className="text-[11px] text-amber">💡 Hint</span>
                    )}
                    {q.explanation && (
                      <span className="text-[11px] text-brand-500">📖 Explanation</span>
                    )}
                    {q.assessment_id ? (
                      <span className="text-[10px] bg-brand-50 border border-brand-200 text-brand-600 px-1.5 py-0.5 rounded-full font-medium">
                        From assessment
                      </span>
                    ) : (
                      <span className="text-[10px] bg-surface border border-border text-ink-4 px-1.5 py-0.5 rounded-full font-medium">
                        Standalone
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge variant={TYPE_VARIANTS[q.type] ?? 'grey'}>
                    {TYPE_LABELS[q.type] ?? q.type}
                  </Badge>
                  {/* Edit — always visible on mobile, hover on desktop */}
                  <button
                    onClick={() => onEdit(q)}
                    className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center hover:border-brand-400 hover:text-brand-600 transition-colors md:opacity-0 md:group-hover:opacity-100"
                    title="Edit question"
                  >
                    <Pencil size={13} />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => onDelete(q.id)}
                    className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center hover:border-danger hover:text-danger transition-colors md:opacity-0 md:group-hover:opacity-100"
                    title="Delete question"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default function QuestionsPage() {
  const [questions,       setQuestions]       = useState([])
  const [loading,         setLoading]         = useState(true)
  const [editingQuestion, setEditingQuestion] = useState(null)

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

    if (error) console.error('Questions fetch error:', error)
    setQuestions(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  const handleDelete = async (id) => {
    if (!confirm('Delete this question? This cannot be undone.')) return
    const supabase = createClient()
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (!error) loadQuestions()
  }

  // Build Subject → Class → Topic hierarchy
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
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={22} className="text-brand-500" />
              <h1 className="font-display text-3xl font-bold text-ink">Question Bank</h1>
            </div>
            <p className="text-ink-3 text-sm">
              {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} across all subjects
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/ai-import"
              className="inline-flex items-center gap-2 bg-white border border-border text-ink-2 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-surface transition-colors shadow-card"
            >
              ✨ Import
            </Link>
            <Link
              href="/dashboard/questions/new"
              className="inline-flex items-center gap-2 bg-brand-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors"
            >
              <Plus size={15} />
              Add Questions
            </Link>
          </div>
        </div>

        {/* Empty state */}
        {totalQuestions === 0 && (
          <div className="bg-white border border-dashed border-border rounded-2xl p-12 text-center">
            <p className="text-4xl mb-3">📚</p>
            <p className="font-semibold text-ink mb-1">No questions yet</p>
            <p className="text-sm text-ink-3 mb-6 max-w-sm mx-auto">
              Add questions manually or import them from worksheets and past papers.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/dashboard/questions/new"
                className="inline-flex items-center gap-2 bg-brand-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors"
              >
                <Plus size={15} /> Add Questions
              </Link>
              <Link
                href="/dashboard/ai-import"
                className="inline-flex items-center gap-2 bg-white border border-border text-ink-2 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-surface transition-colors"
              >
                ✨ Import Questions
              </Link>
            </div>
          </div>
        )}

        {/* Subject → Class → Topic hierarchy */}
        {Object.entries(hierarchy).map(([subject, classes]) => (
          <div key={subject} className="flex flex-col gap-4">

            {/* Subject divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-bold uppercase tracking-widest text-ink-3 px-2">
                {subject}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {Object.entries(classes).map(([cls, topics]) => {
              const classTotal = Object.values(topics).reduce(
                (s, qs) => s + qs.length, 0
              )
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
                    />
                  ))}
                </div>
              )
            })}
          </div>
        ))}

      </div>

      {/* Edit modal */}
      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSaved={() => {
            setEditingQuestion(null)
            loadQuestions()
          }}
        />
      )}
    </>
  )
}