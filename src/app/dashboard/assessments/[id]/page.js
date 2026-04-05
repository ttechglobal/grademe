'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import EditQuestionModal from '@/components/assessment/EditQuestionModal'
import MathRenderer from '@/components/ui/MathRenderer'
import {
  ArrowLeft, ExternalLink, BookOpen, Users,
  BarChart2, Trash2, Pencil, Copy, CheckCheck,
  ChevronDown, ChevronRight, Check, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_LABELS = { mcq: 'MCQ', fill: 'Fill in', truefalse: 'True/False' }

function scoreVariant(score) {
  if (score === null || score === undefined) return 'grey'
  if (score >= 75) return 'green'
  if (score >= 50) return 'amber'
  return 'red'
}
function scoreLabel(score) {
  if (score === null || score === undefined) return 'Pending'
  if (score >= 75) return 'Excellent'
  if (score >= 50) return 'Average'
  return 'Needs Help'
}

function SubmissionModal({ submission, questions, onClose }) {
  const correct = questions.filter((q, i) => {
    const ans = submission.answers?.[i] ?? ''
    return ans.trim().toLowerCase() === q.answer?.trim().toLowerCase()
  }).length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar name={submission.student_name} size="md" />
            <div>
              <h2 className="font-display text-lg font-bold text-ink">{submission.student_name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={scoreVariant(submission.score)}>
                  {submission.score}% — {correct}/{questions.length} correct
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-border transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-3 bg-surface border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  (submission.score ?? 0) >= 75 ? 'bg-success' :
                  (submission.score ?? 0) >= 50 ? 'bg-amber'   : 'bg-danger'
                )}
                style={{ width: `${submission.score ?? 0}%` }}
              />
            </div>
            <span className="text-sm font-bold text-ink">{submission.score ?? 0}%</span>
          </div>
          <div className="flex items-center gap-4 mt-1.5">
            <span className="text-xs text-success">✓ {correct} correct</span>
            <span className="text-xs text-danger">✗ {questions.length - correct} incorrect</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
          {questions.map((q, i) => {
            const studentAns = submission.answers?.[i] ?? ''
            const isCorrect  = studentAns.trim().toLowerCase() === q.answer?.trim().toLowerCase()
            return (
              <div
                key={q.id}
                className={cn('rounded-xl border-2 overflow-hidden', isCorrect ? 'border-success/30' : 'border-danger/30')}
              >
                <div className={cn('flex items-start gap-3 px-4 py-3', isCorrect ? 'bg-success-light/40' : 'bg-danger-light/40')}>
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', isCorrect ? 'bg-success text-white' : 'bg-danger text-white')}>
                    {isCorrect ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-ink-4 mr-2">Q{i + 1}</span>
                    <span className="text-sm font-medium text-ink">
                      <MathRenderer text={q.text} />
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3 bg-white flex flex-col gap-1.5">
                  {q.type === 'mcq' && q.options?.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {q.options.map((opt, oi) => {
                        const letter    = String.fromCharCode(65 + oi)
                        const optLetter = opt.charAt(0)
                        const isAnswer  = optLetter === q.answer || letter === q.answer
                        const isStudent = optLetter === studentAns || letter === studentAns
                        return (
                          <div
                            key={oi}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
                              isAnswer && isStudent  ? 'border-success bg-success-light text-success font-semibold' :
                              isAnswer && !isStudent ? 'border-success bg-success-light text-success' :
                              !isAnswer && isStudent ? 'border-danger bg-danger-light text-danger' :
                                                       'border-border text-ink-4'
                            )}
                          >
                            <span className="font-bold w-5 flex-shrink-0">{letter}</span>
                            <span className="flex-1"><MathRenderer text={opt.replace(/^[A-D]\.\s*/, '')} /></span>
                            {isAnswer && <span className="text-xs font-bold ml-auto">✓ Correct</span>}
                            {!isAnswer && isStudent && <span className="text-xs font-bold ml-auto">Student&apos;s answer</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {(q.type === 'fill' || q.type === 'truefalse') && (
                    <div className="flex flex-col gap-1.5">
                      <div className={cn('px-3 py-2 rounded-lg border text-sm', isCorrect ? 'border-success bg-success-light text-success' : 'border-danger bg-danger-light text-danger')}>
                        Student answered: <strong>{studentAns || '(no answer)'}</strong>
                      </div>
                      {!isCorrect && (
                        <div className="px-3 py-2 rounded-lg border border-success bg-success-light text-success text-sm">
                          Correct answer: <strong>{q.answer}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AssessmentDetailPage({ params }) {
  const { id }    = use(params)
  const router    = useRouter()
  const { toast } = useToast()

  const [assessment,        setAssessment]        = useState(null)
  const [loading,           setLoading]           = useState(true)
  const [deleting,          setDeleting]          = useState(false)
  const [editingQ,          setEditingQ]          = useState(null)
  const [copied,            setCopied]            = useState(false)
  const [shareUrl,          setShareUrl]          = useState('')
  const [qOpen,             setQOpen]             = useState(true)
  const [editingTitle,      setEditingTitle]      = useState(false)
  const [titleValue,        setTitleValue]        = useState('')
  const [savingTitle,       setSavingTitle]       = useState(false)
  const [viewingSubmission, setViewingSubmission] = useState(null)

  const loadAssessment = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('assessments')
      .select(`*, questions(id,type,text,options,answer,hint,explanation,order_index), submissions(id,student_name,score,total,completed_at,answers)`)
      .eq('id', id)
      .single()

    if (error || !data) {
      toast({ message: 'Assessment not found.', type: 'error' })
      router.push('/dashboard/assessments')
      return
    }

    data.questions.sort((a, b)  => a.order_index - b.order_index)
    data.submissions.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    setAssessment(data)
    setTitleValue(data.title)
    setShareUrl(`${window.location.origin}/t/${data.slug}`)
    setLoading(false)
  }

  useEffect(() => {
    if (!id) return
    loadAssessment()
    const supabase = createClient()
    const channel  = supabase
      .channel(`assessment-detail-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions', filter: `assessment_id=eq.${id}` }, () => loadAssessment())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [id])

  const handleDeleteAssessment = async () => {
    if (!confirm('Delete this assessment? All submissions will also be deleted.')) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('assessments').delete().eq('id', id)
    if (error) { toast({ message: 'Failed to delete.', type: 'error' }); setDeleting(false) }
    else { toast({ message: 'Assessment deleted.', type: 'success' }); router.push('/dashboard/assessments') }
  }

  const handleDeleteQuestion = async (qid) => {
    if (!confirm('Delete this question?')) return
    const supabase = createClient()
    const { error } = await supabase.from('questions').delete().eq('id', qid)
    if (!error) { toast({ message: 'Question deleted.', type: 'success' }); loadAssessment() }
  }

  const handleSaveTitle = async () => {
    if (!titleValue.trim()) return
    setSavingTitle(true)
    const supabase = createClient()
    const { error } = await supabase.from('assessments').update({ title: titleValue.trim() }).eq('id', id)
    if (error) { toast({ message: 'Failed to update title.', type: 'error' }) }
    else { toast({ message: 'Title updated!', type: 'success' }); setEditingTitle(false); loadAssessment() }
    setSavingTitle(false)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast({ message: 'Link copied!', type: 'success' })
    setTimeout(() => setCopied(false), 2500)
  }

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
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

  return (
    <>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">

        <Link href="/dashboard/assessments" className="inline-flex items-center gap-2 text-sm text-ink-3 hover:text-ink transition-colors self-start">
          <ArrowLeft size={15} /> Back to Assessments
        </Link>

        {/* Header */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-1">
                {assessment.subject?.replace(/_/g, ' ')} · {assessment.class_level?.replace(/_/g, ' ')?.toUpperCase()}
                {assessment.assessment_type && <span className="ml-2 capitalize">· {assessment.assessment_type}</span>}
              </p>
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle() }}
                    className="flex-1 font-display text-2xl font-bold text-ink border-b-2 border-brand-500 outline-none bg-transparent"
                    autoFocus
                  />
                  <button onClick={handleSaveTitle} disabled={savingTitle} className="text-success hover:text-success/80">
                    <Check size={18} />
                  </button>
                  <button onClick={() => { setEditingTitle(false); setTitleValue(assessment.title) }} className="text-ink-4 hover:text-danger">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold text-ink">{assessment.title}</h1>
                  <button onClick={() => setEditingTitle(true)} className="text-ink-4 hover:text-brand-600">
                    <Pencil size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Actions — stack on mobile */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <a
                href={`/t/${assessment.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-brand-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-colors"
              >
                <ExternalLink size={14} /> Open as Student
              </a>
              <button
                onClick={copyLink}
                className="inline-flex items-center justify-center gap-2 bg-white border border-border text-ink-2 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-surface transition-colors"
              >
                {copied ? <CheckCheck size={14} className="text-success" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <Button variant="danger" size="sm" onClick={handleDeleteAssessment} loading={deleting}>
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-brand-500 mb-1">
                <BookOpen size={15} />
                <span className="text-xs font-semibold uppercase tracking-wide">Questions</span>
              </div>
              <p className="font-display text-3xl font-bold text-ink">{assessment.questions.length}</p>
            </div>
            <div className="text-center border-x border-border">
              <div className="flex items-center justify-center gap-1.5 text-brand-500 mb-1">
                <Users size={15} />
                <span className="text-xs font-semibold uppercase tracking-wide">Responses</span>
              </div>
              <p className="font-display text-3xl font-bold text-ink">{assessment.submissions.length}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-brand-500 mb-1">
                <BarChart2 size={15} />
                <span className="text-xs font-semibold uppercase tracking-wide">Avg Score</span>
              </div>
              <p className="font-display text-3xl font-bold text-ink">
                {avgScore !== null ? `${avgScore}%` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div>
          <button onClick={() => setQOpen(!qOpen)} className="w-full flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-ink">
              Questions ({assessment.questions.length})
            </h2>
            {qOpen ? <ChevronDown size={15} className="text-ink-4" /> : <ChevronRight size={15} className="text-ink-4" />}
          </button>

          {qOpen && (
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
              {assessment.questions.length === 0 ? (
                <div className="p-8 text-center text-sm text-ink-4">No questions yet.</div>
              ) : (
                assessment.questions.map((q, i) => (
                  <div key={q.id} className="flex flex-col gap-3 px-5 py-4 border-b border-border last:border-none hover:bg-surface/30 transition-colors">
                    {/* Question content */}
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink leading-relaxed">
                          <MathRenderer text={q.text} />
                        </p>
                        {q.type === 'mcq' && q.options?.length > 0 && (
                          <div className="mt-2 flex flex-col gap-1">
                            {q.options.map((opt, oi) => {
                              const letter    = String.fromCharCode(65 + oi)
                              const optLetter = opt.charAt(0)
                              const isAnswer  = optLetter === q.answer || letter === q.answer
                              return (
                                <p key={oi} className={cn('text-xs px-2 py-1 rounded', isAnswer ? 'bg-success-light text-success font-semibold' : 'text-ink-4')}>
                                  <MathRenderer text={opt} /> {isAnswer && '✓'}
                                </p>
                              )
                            })}
                          </div>
                        )}
                        <p className="text-xs text-ink-4 mt-1">
                          Answer: <span className="font-semibold text-success">{q.answer}</span>
                          {q.hint && <span className="ml-3 text-amber">💡 Hint</span>}
                        </p>
                      </div>
                    </div>

                    {/* Actions row — always below question, works on all screen sizes */}
                    <div className="flex items-center gap-2 pl-10">
                      <Badge variant="grey">{TYPE_LABELS[q.type] ?? q.type}</Badge>
                      <button
                        onClick={() => setEditingQ(q)}
                        className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-500 px-2.5 py-1.5 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-danger hover:text-danger/80 px-2.5 py-1.5 bg-danger-light rounded-lg transition-colors"
                      >
                        <Trash2 size={12} /> Delete
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
          <h2 className="font-display text-lg font-bold text-ink mb-3">
            Submissions ({assessment.submissions.length})
          </h2>
          {assessment.submissions.length === 0 ? (
            <div className="bg-white border border-dashed border-border rounded-2xl p-8 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm font-medium text-ink mb-1">No submissions yet</p>
              <p className="text-sm text-ink-3">Share the link with students</p>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4">Student</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden md:table-cell">Submitted</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4">Score</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden lg:table-cell">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4 text-center">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {assessment.submissions.map((sub) => (
                    <tr key={sub.id} className="border-t border-border hover:bg-surface transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={sub.student_name} size="sm" />
                          <span className="font-medium text-ink">{sub.student_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-ink-4 text-xs hidden md:table-cell">
                        {new Date(sub.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-border rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={cn('h-full rounded-full', (sub.score ?? 0) >= 75 ? 'bg-success' : (sub.score ?? 0) >= 50 ? 'bg-amber' : 'bg-danger')}
                              style={{ width: `${sub.score ?? 0}%` }}
                            />
                          </div>
                          <span className="font-semibold text-ink">{sub.score ?? 0}%</span>
                          <span className="text-ink-4 text-xs hidden sm:inline">
                            ({Math.round(((sub.score ?? 0) / 100) * sub.total)}/{sub.total})
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <Badge variant={scoreVariant(sub.score)}>{scoreLabel(sub.score)}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setViewingSubmission(sub)}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-500 transition-colors px-3 py-1.5 bg-brand-50 rounded-lg hover:bg-brand-100 whitespace-nowrap"
                        >
                          View answers →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-ink-4 px-5 py-3 border-t border-border">
                Click &quot;View answers&quot; to see each student&apos;s full submission
              </p>
            </div>
          )}
        </div>

      </div>

      {editingQ && (
        <EditQuestionModal
          question={editingQ}
          onClose={() => setEditingQ(null)}
          onSaved={() => { setEditingQ(null); loadAssessment(); toast({ message: 'Question updated.', type: 'success' }) }}
        />
      )}

      {viewingSubmission && (
        <SubmissionModal
          submission={viewingSubmission}
          questions={assessment.questions}
          onClose={() => setViewingSubmission(null)}
        />
      )}
    </>
  )
}