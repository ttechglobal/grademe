'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import MathRenderer from '@/components/ui/MathRenderer'
import { Search, CheckSquare, Square } from 'lucide-react'

const TYPE_LABELS   = { mcq: 'MCQ', fill: 'Fill in', truefalse: 'True/False' }
const TYPE_VARIANTS = { mcq: 'brand', fill: 'amber', truefalse: 'blue' }

export default function QuestionPicker({ selected, onToggle, onSelectAll }) {
  const [questions,     setQuestions]     = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterClass,   setFilterClass]   = useState('')
  const [filterTopic,   setFilterTopic]   = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data, error } = await supabase
        .from('questions')
        .select('id, type, text, options, answer, hint, explanation, subject, class_level, topic, order_index, assessment_id')
        .eq('teacher_id', session.user.id)
        .order('created_at', { ascending: false })

      if (!error) setQuestions(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const subjects = [...new Set(questions.map((q) => q.subject).filter(Boolean))]
  const classes  = [...new Set(questions.map((q) => q.class_level).filter(Boolean))]

  // Topics filtered by current subject + class selection
  const topics = [...new Set(
    questions
      .filter((q) => {
        const matchSubject = !filterSubject || q.subject     === filterSubject
        const matchClass   = !filterClass   || q.class_level === filterClass
        return matchSubject && matchClass && q.topic
      })
      .map((q) => q.topic)
  )]

  const filtered = questions.filter((q) => {
    const matchSearch  = !search        || q.text.toLowerCase().includes(search.toLowerCase())
    const matchSubject = !filterSubject || q.subject     === filterSubject
    const matchClass   = !filterClass   || q.class_level === filterClass
    const matchTopic   = !filterTopic   || q.topic       === filterTopic
    return matchSearch && matchSubject && matchClass && matchTopic
  })

  const allSelected = filtered.length > 0 && filtered.every((q) => selected.has(q.id))

  // Reset topic filter when subject/class changes
  const handleSubjectChange = (val) => {
    setFilterSubject(val)
    setFilterTopic('')
  }

  const handleClassChange = (val) => {
    setFilterClass(val)
    setFilterTopic('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-6 h-6" />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 bg-surface border border-dashed border-border rounded-2xl">
        <p className="text-3xl mb-3">📚</p>
        <p className="font-semibold text-ink mb-1">Your question bank is empty</p>
        <p className="text-sm text-ink-3 max-w-xs mx-auto">
          Add questions via <strong>Question Bank → Add Questions</strong> or{' '}
          <strong>Import Questions</strong> first.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-2">
        <Search size={14} className="text-ink-4 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search questions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none text-ink placeholder:text-ink-4"
        />
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-3 gap-2">
        <select
          value={filterSubject}
          onChange={(e) => handleSubjectChange(e.target.value)}
          className="px-3 py-2 border border-border rounded-xl text-sm text-ink bg-white outline-none focus:border-brand-500"
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={filterClass}
          onChange={(e) => handleClassChange(e.target.value)}
          className="px-3 py-2 border border-border rounded-xl text-sm text-ink bg-white outline-none focus:border-brand-500"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>{c.toUpperCase()}</option>
          ))}
        </select>

        <select
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
          className="px-3 py-2 border border-border rounded-xl text-sm text-ink bg-white outline-none focus:border-brand-500"
          disabled={topics.length === 0}
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Select all */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => onSelectAll(filtered, !allSelected)}
          className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors"
        >
          {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          {allSelected ? 'Deselect all' : `Select all ${filtered.length}`}
        </button>
        <span className="text-xs text-ink-4">
          {selected.size} selected · {filtered.length} shown
        </span>
      </div>

      {/* Questions list */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card max-h-[400px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-4">
            No questions match your filters.
          </div>
        ) : (
          filtered.map((q) => {
            const isSelected = selected.has(q.id)
            return (
              <button
                key={q.id}
                onClick={() => onToggle(q)}
                className={cn(
                  'w-full flex items-start gap-4 px-5 py-4 text-left',
                  'border-b border-border last:border-none transition-colors',
                  isSelected ? 'bg-brand-50' : 'hover:bg-surface'
                )}
              >
                {/* Checkbox */}
                <div className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                  isSelected ? 'bg-brand-700 border-brand-700' : 'border-border bg-white'
                )}>
                  {isSelected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink leading-relaxed text-left">
                    <MathRenderer text={q.text} />
                  </p>

                  {/* MCQ options preview */}
                  {q.type === 'mcq' && q.options?.length > 0 && (
                    <div className="mt-1.5 flex flex-col gap-0.5">
                      {q.options.map((opt, oi) => {
                        const letter   = opt.charAt(0)
                        const isAnswer = letter === q.answer
                        return (
                          <p key={oi} className={cn(
                            'text-xs px-2 py-0.5 rounded text-left',
                            isAnswer ? 'text-success font-semibold' : 'text-ink-4'
                          )}>
                            <MathRenderer text={opt} /> {isAnswer && '✓'}
                          </p>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {q.subject && (
                      <span className="text-[10px] font-medium text-ink-4 bg-surface border border-border px-2 py-0.5 rounded-full">
                        {q.subject}
                      </span>
                    )}
                    {q.class_level && (
                      <span className="text-[10px] font-medium text-ink-4 bg-surface border border-border px-2 py-0.5 rounded-full">
                        {q.class_level.toUpperCase()}
                      </span>
                    )}
                    {q.topic && (
                      <span className="text-[10px] font-medium text-ink-4 bg-surface border border-border px-2 py-0.5 rounded-full">
                        {q.topic}
                      </span>
                    )}
                    {q.hint && <span className="text-[10px] text-amber">💡 Hint</span>}
                  </div>
                </div>

                <Badge variant={TYPE_VARIANTS[q.type] ?? 'grey'}>
                  {TYPE_LABELS[q.type] ?? q.type}
                </Badge>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}