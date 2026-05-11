'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import EditQuestionModal from '@/components/assessment/EditQuestionModal'
import MathRenderer from '@/components/ui/MathRenderer'
import {
  ArrowLeft, Eye, BookOpen, Users, BarChart2,
  Trash2, Pencil, Copy, CheckCheck, Check, X,
  ChevronDown, ChevronUp, ChevronsDownUp, ChevronsUpDown,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Score helpers ──────────────────────────────────────────────────────────

function scoreColor(score) {
  if (score >= 75) return 'text-success'
  if (score >= 50) return 'text-amber'
  return 'text-danger'
}

function scoreBg(score) {
  if (score >= 75) return 'bg-success-light text-success'
  if (score >= 50) return 'bg-amber-light text-amber'
  return 'bg-danger-light text-danger'
}

// ── Question type detection ────────────────────────────────────────────────

function getType(q) {
  const t = q?.question_type || q?.type || ''
  if (t === 'calculation')                     return 'calculation'
  if (t === 'true_false' || t === 'truefalse') return 'true_false'
  if (t === 'stepwise')                        return 'stepwise'
  return 'mcq'
}

// ── Answer resolution ──────────────────────────────────────────────────────
// Handles all storage formats submissions may use:
//   1. UUID-keyed:  { [questionId]: value }  — current format
//   2. Index-keyed: { "0": value }            — legacy
//   3. Array:       [ value, value ]          — oldest legacy

function resolveAnswer(answers, question, index) {
  if (!answers) return undefined
  if (question?.id && answers[question.id] !== undefined) return answers[question.id]
  if (answers[index]         !== undefined) return answers[index]
  if (answers[String(index)] !== undefined) return answers[String(index)]
  return undefined
}

// ── Score one question correctly by type ──────────────────────────────────

function scoreOne(q, sa) {
  const typ = getType(q)

  if (typ === 'calculation') {
    const template  = q.answer_template
    const boxValues = (typeof sa === 'object' && sa !== null) ? sa : {}
    if (!template?.structure?.length) return false
    return template.structure.every((item) => {
      const sv       = (boxValues[item.id] ?? '').trim().toLowerCase()
      const accepted = (item.accepted || [item.answer]).map((a) => String(a).trim().toLowerCase())
      return accepted.includes(sv)
    })
  }

  if (typ === 'true_false') {
    if (!sa) return false
    const correct = /^true/i.test(q.answer || '') ? 'true' : 'false'
    const student  = /^true/i.test(String(sa))    ? 'true' : 'false'
    return correct === student
  }

  if (typ === 'stepwise') {
    const steps  = q.steps ?? []
    const blanks = steps.filter((s) => s.is_blank)
    if (!blanks.length) return false
    const filled = (typeof sa === 'object' && sa !== null) ? sa : {}
    return blanks.every((s) => {
      const sv = (filled[s.id] ?? '').trim().toLowerCase()
      return sv === (s.answer ?? '').trim().toLowerCase()
    })
  }

  return (sa ?? '').toString().trim().toUpperCase() === (q.answer ?? '').trim().toUpperCase()
}

// ── Expandable question card (questions list — teacher view) ───────────────

function QuestionDetailCard({ q }) {
  const [open, setOpen] = useState(false)
  const typ = getType(q)

  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-ink leading-relaxed">
        <MathRenderer text={q.text} />
      </p>

      {/* MCQ options */}
      {typ === 'mcq' && q.options?.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {q.options.map((opt, oi) => {
            const letter   = String.fromCharCode(65 + oi)
            const isAnswer = opt.trim().charAt(0) === q.answer || letter === q.answer
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

      {/* Stepwise blank count */}
      {typ === 'stepwise' && q.steps?.length > 0 && (
        <p className="text-xs text-ink-4 mt-1">
          {q.steps.filter((s) => s.is_blank).length} blank{q.steps.filter((s) => s.is_blank).length !== 1 ? 's' : ''} · {q.steps.length} steps
        </p>
      )}

      {/* Answer pill + hint + explanation toggle */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {q.answer && typ !== 'stepwise' && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success-light px-2.5 py-1 rounded-lg border border-success/20">
            ✓ {q.answer}
          </span>
        )}
        {q.hint?.trim() && (
          <span className="text-xs text-amber font-medium bg-amber-light px-2 py-0.5 rounded-lg">
            💡 {q.hint}
          </span>
        )}
        {q.explanation?.trim() && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-500 transition-colors ml-auto"
          >
            {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {open ? 'Hide explanation' : 'Show explanation'}
          </button>
        )}
      </div>

      {/* Collapsible explanation */}
      {open && q.explanation?.trim() && (
        <div className="mt-3 bg-brand-50 border border-brand-200/70 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2">📖 Explanation</p>
          <p className="text-sm text-brand-800 leading-relaxed">
            <MathRenderer text={q.explanation} />
          </p>
        </div>
      )}
    </div>
  )
}

// ── Per-question answer display (inside student rows) — no explanation ─────

function QuestionAnswerCard({ q, index, sa, isCorrect }) {
  const typ  = getType(q)
  const text = q?.text || q?.question_text || ''

  return (
    <div className={cn(
      'rounded-2xl border-2 overflow-hidden bg-white',
      isCorrect ? 'border-success/25' : 'border-danger/25'
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-start gap-3 px-4 py-3',
        isCorrect ? 'bg-success-light/30' : 'bg-danger-light/30'
      )}>
        <div className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white',
          isCorrect ? 'bg-success' : 'bg-danger'
        )}>
          {isCorrect ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-ink-4 mr-2">Q{index + 1}</span>
          <span className={cn(
            'text-xs font-semibold px-1.5 py-0.5 rounded mr-2',
            typ === 'stepwise'    ? 'bg-purple-100 text-purple-700' :
            typ === 'calculation' ? 'bg-brand-50 text-brand-600' :
            typ === 'true_false'  ? 'bg-amber/10 text-amber' : 'bg-surface text-ink-4'
          )}>
            {typ === 'stepwise' ? 'Stepwise' : typ === 'calculation' ? 'Fill-in' : typ === 'true_false' ? 'True/False' : 'MCQ'}
          </span>
          <span className="text-sm font-semibold text-ink leading-relaxed">
            <MathRenderer text={text} />
          </span>
        </div>
      </div>

      {/* Answer body — student answer only, no explanation */}
      <div className="px-4 py-3">

        {/* MCQ */}
        {typ === 'mcq' && q.options?.length > 0 && (
          <div className="flex flex-col gap-2">
            {q.options.map((opt, oi) => {
              const letter    = String.fromCharCode(65 + oi)
              const optLetter = opt.trim().charAt(0)
              const isAns     = optLetter === q.answer || letter === q.answer
              const isStu     = sa ? (optLetter === String(sa).trim() || letter === String(sa).trim()) : false
              let rowCls = 'border-border bg-white text-ink-4'
              let label  = null
              if (isAns && isStu)  { rowCls = 'border-success bg-success-light text-success font-semibold'; label = '✓ Correct' }
              else if (isAns)      { rowCls = 'border-success/60 bg-success-light/60 text-success'; label = '✓ Correct answer' }
              else if (isStu)      { rowCls = 'border-danger bg-danger-light text-danger font-semibold'; label = '✗ Student chose' }
              return (
                <div key={oi} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-sm', rowCls)}>
                  <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                    isAns ? 'bg-success text-white' : isStu ? 'bg-danger text-white' : 'bg-surface text-ink-4')}>
                    {letter}
                  </span>
                  <span className="flex-1 leading-relaxed"><MathRenderer text={opt.replace(/^[A-D]\.\s*/, '')} /></span>
                  {label && <span className="text-xs font-bold ml-auto flex-shrink-0 whitespace-nowrap">{label}</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* True / False */}
        {typ === 'true_false' && (
          <div className="flex gap-3">
            {['True', 'False'].map((val) => {
              const isAns = /^true/i.test(q.answer || '') ? val === 'True' : val === 'False'
              const isStu = sa ? (/^true/i.test(String(sa)) ? val === 'True' : val === 'False') : false
              return (
                <div key={val} className={cn(
                  'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-semibold',
                  isAns && isStu  ? 'border-success bg-success-light text-success' :
                  isAns && !isStu ? 'border-success/40 bg-success-light/50 text-success' :
                  isStu && !isAns ? 'border-danger bg-danger-light text-danger' : 'border-border text-ink-4'
                )}>
                  <span className="text-lg">{val === 'True' ? '✅' : '❌'}</span>
                  <span>{val}</span>
                  {isAns && isStu  && <span className="text-xs font-bold">✓ Correct</span>}
                  {isStu && !isAns && <span className="text-xs font-bold">✗ Student</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* Fill-in / Calculation */}
        {typ === 'calculation' && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-ink-4 uppercase tracking-wide">Student's answer</p>
            {q.answer_template?.structure?.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {q.answer_template.structure.map((item) => {
                  const val      = (typeof sa === 'object' && sa) ? (sa[item.id] ?? '') : ''
                  const accepted = (item.accepted || [item.answer]).map((a) => String(a).trim().toLowerCase())
                  const ok       = accepted.includes(val.trim().toLowerCase())
                  return (
                    <div key={item.id} className="flex flex-col items-center gap-1">
                      {item.label && <span className="text-xs text-ink-4">{item.label}</span>}
                      <div className={cn('px-4 py-2 rounded-xl border-2 text-sm font-bold min-w-[52px] text-center',
                        ok ? 'border-success/40 bg-success-light text-success' : 'border-danger/40 bg-danger-light text-danger')}>
                        {val || '—'}
                      </div>
                      {!ok && val && <span className="text-xs text-ink-4">expected: <strong>{item.answer}</strong></span>}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-ink-4 italic">
                {sa ? (typeof sa === 'object' ? JSON.stringify(sa) : String(sa)) : 'No answer recorded'}
              </p>
            )}
          </div>
        )}

        {/* Stepwise */}
        {typ === 'stepwise' && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-ink-4 uppercase tracking-wide">Student's filled blanks</p>
            {(q.steps ?? []).filter((s) => s.is_blank).length > 0 ? (
              <div className="flex flex-col gap-2">
                {(q.steps ?? []).filter((s) => s.is_blank).map((step, si) => {
                  const filled  = (typeof sa === 'object' && sa) ? (sa[step.id] ?? '') : ''
                  const correct = filled.trim().toLowerCase() === (step.answer ?? '').trim().toLowerCase()
                  return (
                    <div key={step.id} className={cn(
                      'flex items-start gap-3 px-3 py-2.5 rounded-xl border-2 text-sm',
                      correct ? 'border-success/40 bg-success-light/50 text-success' : 'border-danger/40 bg-danger-light/50 text-danger'
                    )}>
                      <span className="text-xs font-bold flex-shrink-0 mt-0.5 w-12">Step {si + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-ink-4 mb-1">{step.text.replace('___', `[${filled || '—'}]`)}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('px-2 py-0.5 rounded-lg text-xs font-bold border',
                            correct ? 'border-success/40 bg-success-light text-success' : 'border-danger/40 bg-danger-light text-danger')}>
                            {filled || '—'}
                          </span>
                          {!correct && (
                            <span className="text-xs text-ink-4">expected: <strong className="text-success">{step.answer}</strong></span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold flex-shrink-0">{correct ? '✓' : '✗'}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-ink-4 italic">No blanks recorded.</p>
            )}
          </div>
        )}

        {/* MCQ fallback — no options stored */}
        {typ === 'mcq' && (!q.options || q.options.length === 0) && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-ink-4">Student answered</span>
              <span className={cn('text-sm font-bold px-3 py-1.5 rounded-xl border-2',
                isCorrect ? 'border-success/40 bg-success-light text-success' : 'border-danger/40 bg-danger-light text-danger')}>
                {sa ? String(sa) : '—'}
              </span>
            </div>
            {!isCorrect && q.answer && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-ink-4">Correct answer</span>
                <span className="text-sm font-bold px-3 py-1.5 rounded-xl border-2 border-success/40 bg-success-light text-success">
                  {q.answer}
                </span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// ── Submission row ─────────────────────────────────────────────────────────

function SubmissionRow({ submission, questions, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  const answers = submission.answers ?? {}
  const correct = questions.filter((q, i) => scoreOne(q, resolveAnswer(answers, q, i))).length
  const pct     = submission.score ?? Math.round((correct / Math.max(questions.length, 1)) * 100)
  const date    = new Date(submission.completed_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className={cn('border-b border-border last:border-none transition-colors', open ? 'bg-surface/30' : 'hover:bg-surface/20')}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-4 px-5 py-4 text-left">
        <Avatar name={submission.student_name} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm truncate">{submission.student_name}</p>
          <p className="text-xs text-ink-4 mt-0.5">{date}</p>
        </div>
        <div className={cn('px-3 py-1.5 rounded-xl text-sm font-bold flex-shrink-0', scoreBg(pct))}>{pct}%</div>
        <span className="text-xs text-ink-4 hidden sm:block flex-shrink-0">{correct}/{questions.length} correct</span>
        {submission.tab_violations > 0 && (
          <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-amber bg-amber-light px-2 py-1 rounded-full flex-shrink-0">
            <AlertTriangle size={10} />
            {submission.tab_violations} tab switch{submission.tab_violations !== 1 ? 'es' : ''}
          </span>
        )}
        <ChevronDown size={16} className={cn('text-ink-4 flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="px-5 pb-5 flex flex-col gap-3">
          <div className="flex items-center gap-3 py-2 px-4 bg-white rounded-xl border border-border">
            <div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full transition-all duration-700',
                pct >= 75 ? 'bg-success' : pct >= 50 ? 'bg-amber' : 'bg-danger')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={cn('text-sm font-bold flex-shrink-0', scoreColor(pct))}>{pct}%</span>
            <span className="text-xs text-ink-4 flex-shrink-0">{correct} of {questions.length} correct</span>
          </div>
          {questions.map((q, i) => {
            const sa        = resolveAnswer(answers, q, i)
            const isCorrect = scoreOne(q, sa)
            return <QuestionAnswerCard key={q.id ?? i} q={q} index={i} sa={sa} isCorrect={isCorrect} />
          })}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AssessmentDetailPage({ params }) {
  const { id }    = use(params)
  const router    = useRouter()
  const { toast } = useToast()

  const [assessment,    setAssessment]   = useState(null)
  const [loading,       setLoading]      = useState(true)
  const [deleting,      setDeleting]     = useState(false)
  const [editingQ,      setEditingQ]     = useState(null)
  const [copied,        setCopied]       = useState(false)
  const [shareUrl,      setShareUrl]     = useState('')
  const [qOpen,         setQOpen]        = useState(true)
  const [editTitle,     setEditTitle]    = useState(false)
  const [titleVal,      setTitleVal]     = useState('')
  const [savingTitle,   setSavingTitle]  = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [allExpanded,   setAllExpanded]  = useState(false)

  const loadAssessment = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        *,
        questions (
          id, type, question_type, text, options, answer,
          hint, explanation, order_index, answer_template
        ),
        submissions (
          id, student_name, score, total, completed_at, answers, tab_violations
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      toast({ message: 'Assessment not found.', type: 'error' })
      router.push('/dashboard/assessments')
      return
    }

    data.questions.sort((a, b) => a.order_index - b.order_index)
    data.submissions.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))

    setAssessment(data)
    setTitleVal(data.title)
    setShareUrl(`${window.location.origin}/t/${data.slug}`)
    setLoading(false)
  }, [id, router, toast])

  useEffect(() => {
    if (!id) return
    loadAssessment()

    const supabase = createClient()
    const channel  = supabase
      .channel(`assessment-detail-${id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'submissions',
        filter: `assessment_id=eq.${id}`,
      }, () => loadAssessment())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [id, loadAssessment])

  const handleDeleteAssessment = async () => {
    if (confirmDelete !== 'assessment') { setConfirmDelete('assessment'); return }
    setConfirmDelete(null)
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('assessments').delete().eq('id', id)
    if (error) { toast({ message: 'Failed to delete.', type: 'error' }); setDeleting(false) }
    else { toast({ message: 'Assessment deleted.', type: 'success' }); router.push('/dashboard/assessments') }
  }

  const handleDeleteQuestion = async (qid) => {
    if (!confirmDelete || confirmDelete?.qid !== qid) { setConfirmDelete({ qid }); return }
    setConfirmDelete(null)
    const supabase = createClient()
    const { error } = await supabase.from('questions').delete().eq('id', qid)
    if (!error) { toast({ message: 'Question deleted.', type: 'success' }); loadAssessment() }
  }

  const handleSaveTitle = async () => {
    if (!titleVal.trim()) return
    setSavingTitle(true)
    const supabase = createClient()
    const { error } = await supabase.from('assessments').update({ title: titleVal.trim() }).eq('id', id)
    if (error) { toast({ message: 'Failed to update title.', type: 'error' }) }
    else { toast({ message: 'Title updated!', type: 'success' }); setEditTitle(false); loadAssessment() }
    setSavingTitle(false)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast({ message: 'Link copied!', type: 'success' })
    setTimeout(() => setCopied(false), 2500)
  }

  const openPreview = () => window.open(`/t/${assessment.slug}?preview=1`, '_blank')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="w-8 h-8" />
          <p className="text-sm text-ink-4">Loading assessment…</p>
        </div>
      </div>
    )
  }

  const scores   = assessment.submissions.filter((s) => s.score !== null).map((s) => s.score)
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

  return (
    <>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">

        <Link href="/dashboard/assessments"
          className="inline-flex items-center gap-2 text-sm text-ink-3 hover:text-ink transition-colors self-start">
          <ArrowLeft size={15} /> Back to Assessments
        </Link>

        {/* Header card */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-1">
                {assessment.subject} · {assessment.class_level?.toUpperCase()}
                {assessment.assessment_type && ` · ${assessment.assessment_type}`}
              </p>
              {editTitle ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={titleVal} onChange={(e) => setTitleVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle() }}
                    className="flex-1 font-display text-2xl font-bold text-ink border-b-2 border-brand-500 outline-none bg-transparent"
                    autoFocus />
                  <button onClick={handleSaveTitle} disabled={savingTitle} className="text-success hover:text-success/80"><Check size={18} /></button>
                  <button onClick={() => { setEditTitle(false); setTitleVal(assessment.title) }} className="text-ink-4 hover:text-danger"><X size={18} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold text-ink">{assessment.title}</h1>
                  <button onClick={() => setEditTitle(true)} className="text-ink-4 hover:text-brand-600 transition-colors" title="Edit title">
                    <Pencil size={15} />
                  </button>
                </div>
              )}
              {assessment.topic && <p className="text-sm text-ink-3 mt-1">{assessment.topic}</p>}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={openPreview}
                className="inline-flex items-center gap-2 bg-surface border border-border text-ink text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-border transition-colors">
                <Eye size={14} /> Preview
              </button>
              <a href={`/t/${assessment.slug}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-colors">
                Share Link
              </a>
              <button onClick={handleDeleteAssessment} disabled={deleting}
                className={cn('inline-flex items-center gap-2 border text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50',
                  confirmDelete === 'assessment' ? 'bg-danger text-white border-danger' : 'bg-white border-danger/30 text-danger hover:bg-danger-light')}>
                <Trash2 size={14} />
                {deleting ? 'Deleting…' : confirmDelete === 'assessment' ? 'Confirm delete?' : 'Delete'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            {[
              { icon: BookOpen,  label: 'Questions', value: assessment.questions.length },
              { icon: Users,     label: 'Responses', value: assessment.submissions.length },
              { icon: BarChart2, label: 'Avg Score',  value: avgScore !== null ? `${avgScore}%` : '—' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="flex items-center justify-center gap-1.5 text-brand-500 mb-1">
                  <s.icon size={14} />
                  <span className="text-xs font-semibold uppercase tracking-wide">{s.label}</span>
                </div>
                <p className={cn('font-display text-3xl font-bold',
                  s.label === 'Avg Score' && avgScore !== null ? scoreColor(avgScore) : 'text-ink')}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 -mt-3">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <p className="text-xs text-ink-4">Live — updates automatically when students submit</p>
        </div>

        {/* Share link */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3">
          <p className="text-sm font-semibold text-ink">Share Link</p>
          <div className="flex items-center gap-2 bg-surface rounded-xl px-4 py-3 border border-border">
            <span className="flex-1 text-sm text-brand-600 font-medium truncate">{shareUrl}</span>
            <button onClick={copyLink}
              className="flex items-center gap-1.5 bg-brand-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors flex-shrink-0">
              {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-ink-4">Edits to questions reflect on the live link immediately.</p>
        </div>

        {/* Questions list */}
        <div>
          <button onClick={() => setQOpen(!qOpen)} className="w-full flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-ink">Questions ({assessment.questions.length})</h2>
            {qOpen ? <ChevronUp size={16} className="text-ink-4" /> : <ChevronDown size={16} className="text-ink-4" />}
          </button>

          {qOpen && (
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
              {assessment.questions.length === 0 ? (
                <div className="p-8 text-center text-sm text-ink-4">No questions yet.</div>
              ) : (
                assessment.questions.map((q, i) => (
                  <div key={q.id}
                    className="flex items-start gap-4 px-5 py-4 border-b border-border last:border-none hover:bg-surface/20 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <QuestionDetailCard q={q} />
                    <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                      <button onClick={() => setEditingQ(q)}
                        className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center hover:border-brand-400 hover:text-brand-600 transition-colors"
                        title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDeleteQuestion(q.id)}
                        className={cn('w-7 h-7 rounded-lg border flex items-center justify-center transition-colors',
                          confirmDelete?.qid === q.id ? 'bg-danger border-danger text-white' : 'bg-surface border-border hover:border-danger hover:text-danger')}
                        title={confirmDelete?.qid === q.id ? 'Confirm?' : 'Delete'}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Submissions */}
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <h2 className="font-display text-lg font-bold text-ink">Submissions ({assessment.submissions.length})</h2>
            {assessment.submissions.length > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setAllExpanded(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-3 hover:text-ink border border-border bg-white px-3 py-2 rounded-xl transition-colors">
                  <ChevronsUpDown size={13} /> Expand All
                </button>
                <button onClick={() => setAllExpanded(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-3 hover:text-ink border border-border bg-white px-3 py-2 rounded-xl transition-colors">
                  <ChevronsDownUp size={13} /> Collapse All
                </button>
              </div>
            )}
          </div>

          {assessment.submissions.length === 0 ? (
            <div className="bg-white border border-dashed border-border rounded-2xl p-8 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm font-medium text-ink mb-1">No submissions yet</p>
              <p className="text-sm text-ink-3">Share the link — this page updates automatically when students submit</p>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
              {assessment.submissions.map((sub) => (
                <SubmissionRow
                  key={`${sub.id}-${allExpanded}`}
                  submission={sub}
                  questions={assessment.questions}
                  defaultOpen={allExpanded}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {editingQ && (
        <EditQuestionModal
          question={editingQ}
          onClose={() => setEditingQ(null)}
          onSaved={() => {
            setEditingQ(null)
            loadAssessment()
            toast({ message: 'Question updated — live link reflects change immediately.', type: 'success' })
          }}
        />
      )}
    </>
  )
}