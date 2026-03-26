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
import {
  ArrowLeft, ExternalLink, BookOpen,
  Users, BarChart2, Trash2, Pencil,
  Copy, CheckCheck, ChevronDown, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_LABELS = { mcq: 'MCQ', fill: 'Fill in', truefalse: 'True/False' }

function scoreVariant(score) {
  if (score >= 75) return 'green'
  if (score >= 50) return 'amber'
  return 'red'
}

function scoreLabel(score) {
  if (score >= 75) return 'Excellent'
  if (score >= 50) return 'Average'
  return 'Needs Help'
}

export default function AssessmentDetailPage({ params }) {
  const { id }    = use(params)
  const router    = useRouter()
  const { toast } = useToast()

  const [assessment, setAssessment] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [deleting,   setDeleting]   = useState(false)
  const [editingQ,   setEditingQ]   = useState(null)
  const [copied,     setCopied]     = useState(false)
  const [shareUrl,   setShareUrl]   = useState('')
  const [qOpen,      setQOpen]      = useState(true)

  const loadAssessment = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        *,
        questions (
          id, type, text, options,
          answer, hint, explanation, order_index
        ),
        submissions (
          id, student_name, score,
          total, completed_at
        )
      `)
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
    setShareUrl(`${window.location.origin}/t/${data.slug}`)
    setLoading(false)
  }

  useEffect(() => { loadAssessment() }, [id])

  const handleDeleteAssessment = async () => {
    if (!confirm('Delete this assessment? All submissions will also be deleted. This cannot be undone.')) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('assessments').delete().eq('id', id)
    if (error) {
      toast({ message: 'Failed to delete assessment.', type: 'error' })
      setDeleting(false)
    } else {
      toast({ message: 'Assessment deleted.', type: 'success' })
      router.push('/dashboard/assessments')
    }
  }

  const handleDeleteQuestion = async (qid) => {
    if (!confirm('Delete this question? This will affect the live assessment link immediately.')) return
    const supabase = createClient()
    const { error } = await supabase.from('questions').delete().eq('id', qid)
    if (!error) {
      toast({ message: 'Question deleted.', type: 'success' })
      loadAssessment()
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast({ message: 'Link copied!', type: 'success' })
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  const scores   = assessment.submissions.filter((s) => s.score !== null).map((s) => s.score)
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null

  return (
    <>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">

        {/* Back */}
        <Link
          href="/dashboard/assessments"
          className="inline-flex items-center gap-2 text-sm text-ink-3 hover:text-ink transition-colors self-start"
        >
          <ArrowLeft size={15} />
          Back to Assessments
        </Link>

        {/* Header card */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-1">
                {assessment.subject} · {assessment.class_level?.toUpperCase()}
              </p>
              <h1 className="font-display text-2xl font-bold text-ink">{assessment.title}</h1>
              <p className="text-sm text-ink-3 mt-1">{assessment.topic}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={`/t/${assessment.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-colors"
              >
                <ExternalLink size={14} />
                Open as Student
              </a>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteAssessment}
                loading={deleting}
              >
                <Trash2 size={14} />
                Delete
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
              <p className="font-display text-3xl font-bold text-ink">
                {assessment.questions.length}
              </p>
            </div>
            <div className="text-center border-x border-border">
              <div className="flex items-center justify-center gap-1.5 text-brand-500 mb-1">
                <Users size={15} />
                <span className="text-xs font-semibold uppercase tracking-wide">Responses</span>
              </div>
              <p className="font-display text-3xl font-bold text-ink">
                {assessment.submissions.length}
              </p>
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

        {/* Share link */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-card flex flex-col gap-3">
          <p className="text-sm font-semibold text-ink">Share Link</p>
          <div className="flex items-center gap-2 bg-surface rounded-xl px-4 py-3 border border-border">
            <span className="flex-1 text-sm text-brand-600 font-medium truncate">
              {shareUrl}
            </span>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 bg-brand-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors flex-shrink-0"
            >
              {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-ink-4">
            Students open this link — no account required.
            Edits to questions reflect on the live link immediately.
          </p>
        </div>

        {/* Questions — collapsible, editable, deletable */}
        <div>
          <button
            onClick={() => setQOpen(!qOpen)}
            className="w-full flex items-center justify-between mb-3 group"
          >
            <h2 className="font-display text-lg font-bold text-ink">
              Questions ({assessment.questions.length})
            </h2>
            <div className="flex items-center gap-2 text-xs text-ink-4">
              <span>Hover to edit or delete</span>
              {qOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </div>
          </button>

          {qOpen && (
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
              {assessment.questions.length === 0 ? (
                <div className="p-8 text-center text-sm text-ink-4">
                  No questions added yet.
                </div>
              ) : (
                assessment.questions.map((q, i) => (
                  <div
                    key={q.id}
                    className="flex items-start gap-4 px-5 py-4 border-b border-border last:border-none hover:bg-surface/30 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink leading-relaxed">{q.text}</p>

                      {/* MCQ options */}
                      {q.type === 'mcq' && q.options?.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1">
                          {q.options.map((opt, oi) => {
                            const optLetter = opt.charAt(0)
                            const letter    = String.fromCharCode(65 + oi)
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

                      <p className="text-xs text-ink-4 mt-1">
                        Answer:{' '}
                        <span className="font-semibold text-success">{q.answer}</span>
                        {q.hint && <span className="ml-3 text-amber">💡 Has hint</span>}
                        {q.explanation && <span className="ml-2 text-brand-500">📖 Explanation</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge variant="grey">{TYPE_LABELS[q.type] ?? q.type}</Badge>
                      <button
                        onClick={() => setEditingQ(q)}
                        className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center hover:border-brand-400 hover:text-brand-600 transition-colors md:opacity-0 md:group-hover:opacity-100"
                        title="Edit question"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center hover:border-danger hover:text-danger transition-colors md:opacity-0 md:group-hover:opacity-100"
                        title="Delete question"
                      >
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
          <h2 className="font-display text-lg font-bold text-ink mb-3">
            Submissions ({assessment.submissions.length})
          </h2>

          {assessment.submissions.length === 0 ? (
            <div className="bg-white border border-dashed border-border rounded-2xl p-8 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm text-ink-3">
                No submissions yet. Share the link with your students.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4">
                      Student
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden md:table-cell">
                      Submitted
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4">
                      Score
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden lg:table-cell">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assessment.submissions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-t border-border hover:bg-surface transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={sub.student_name} size="sm" />
                          <span className="font-medium text-ink">{sub.student_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-ink-4 hidden md:table-cell">
                        {new Date(sub.completed_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-ink">{sub.score}%</span>
                        <span className="text-ink-4 text-xs ml-1">
                          ({sub.score !== null
                            ? Math.round((sub.score / 100) * sub.total)
                            : 0}/{sub.total})
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <Badge variant={scoreVariant(sub.score)}>
                          {scoreLabel(sub.score)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Edit question modal */}
      {editingQ && (
        <EditQuestionModal
          question={editingQ}
          onClose={() => setEditingQ(null)}
          onSaved={() => {
            setEditingQ(null)
            loadAssessment()
            toast({
              message: 'Question updated — live link reflects the change immediately.',
              type:    'success',
            })
          }}
        />
      )}
    </>
  )
}