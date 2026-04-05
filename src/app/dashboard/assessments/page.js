'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { Plus, Copy, CheckCheck, Trash2, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/ToastProvider'

const INITIAL_COUNT = 6

const SUBJECT_COLORS = {
  mathematics: 'bg-brand-400',
  english:     'bg-blue-500',
  biology:     'bg-emerald-500',
  chemistry:   'bg-purple-500',
  physics:     'bg-sky-500',
  government:  'bg-orange-500',
  economics:   'bg-rose-500',
  default:     'bg-brand-400',
}

function DeleteModal({ assessment, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-ink mb-1">Delete Assessment?</h2>
            <p className="text-sm text-ink-3 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong>&quot;{assessment.title}&quot;</strong>?
              This action cannot be undone.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-border transition-colors flex-shrink-0 ml-3"
          >
            <X size={15} />
          </button>
        </div>
        <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
          ⚠️ All student submissions will also be permanently deleted.
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-danger text-white text-sm font-semibold hover:bg-danger/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CopyableLink({ url }) {
  const [copied, setCopied] = useState(false)
  const slug = url.split('/t/')[1] ?? url

  const copy = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-1.5 bg-surface rounded-lg px-2.5 py-1.5 border border-border max-w-full overflow-hidden">
      <span className="text-xs text-ink-4 truncate min-w-0 flex-1">/t/{slug}</span>
      <button
        onClick={copy}
        className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-400 flex-shrink-0"
      >
        {copied ? <CheckCheck size={11} className="text-success" /> : <Copy size={11} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

function AssessmentCard({ assessment, onDelete }) {
  const count = assessment.submission_count ?? 0
  const color = SUBJECT_COLORS[assessment.subject?.toLowerCase()] ?? SUBJECT_COLORS.default
  const url   = `${typeof window !== 'undefined' ? window.location.origin : ''}/t/${assessment.slug}`

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card relative flex flex-col">
      <div className={`h-[3px] w-full ${color}`} />
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-4 mb-1">
              {assessment.subject?.replace(/_/g, ' ')} · {assessment.class_level?.replace(/_/g, ' ')?.toUpperCase()}
              {assessment.assessment_type && (
                <span className="ml-2 capitalize">· {assessment.assessment_type}</span>
              )}
            </p>
            <p className="font-semibold text-ink text-sm leading-snug">{assessment.title}</p>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(assessment) }}
            className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center hover:border-danger hover:text-danger transition-colors flex-shrink-0"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <CopyableLink url={url} />

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-xs text-ink-4">
            {count} response{count !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant={count > 0 ? 'green' : 'grey'}>
              {count > 0 ? 'Active' : 'No responses'}
            </Badge>
            <Link
              href={`/dashboard/assessments/${assessment.id}`}
              className="text-xs font-semibold text-brand-600 hover:text-brand-500 transition-colors"
            >
              Review →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AssessmentsPage() {
  const { toast }                           = useToast()
  const [assessments,  setAssessments]      = useState([])
  const [loading,      setLoading]          = useState(true)
  const [deleteTarget, setDeleteTarget]     = useState(null)
  const [deleting,     setDeleting]         = useState(false)
  const [showAll,      setShowAll]          = useState(false)

  const load = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { data } = await supabase
      .from('assessments')
      .select('id, title, subject, class_level, topic, slug, created_at, assessment_type')
      .eq('teacher_id', session.user.id)
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    const withCounts = await Promise.all(
      data.map(async (a) => {
        const { count } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('assessment_id', a.id)
        return { ...a, submission_count: count ?? 0 }
      })
    )

    setAssessments(withCounts)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('assessments').delete().eq('id', deleteTarget.id)
    if (error) {
      toast({ message: 'Failed to delete.', type: 'error' })
    } else {
      toast({ message: 'Assessment deleted.', type: 'success' })
      setAssessments((prev) => prev.filter((a) => a.id !== deleteTarget.id))
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  const visible = showAll ? assessments : assessments.slice(0, INITIAL_COUNT)
  const hasMore = assessments.length > INITIAL_COUNT

  return (
    <>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">

        {/* Header — stacked on mobile */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Assessments</h1>
            <p className="text-ink-3 text-sm mt-1">
              {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} created
            </p>
          </div>
          {/* Button full-width on mobile, auto on desktop */}
          <Link
            href="/dashboard/assessments/new"
            className="inline-flex items-center justify-center gap-2 bg-brand-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors w-full sm:w-auto self-start"
          >
            <Plus size={15} />
            New Assessment
          </Link>
        </div>

        {/* Empty state */}
        {assessments.length === 0 && (
          <div className="bg-white border border-dashed border-border rounded-2xl p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold text-ink mb-1">No assessments yet</p>
            <p className="text-sm text-ink-3 mb-6">
              Create your first assessment and share the link with your students
            </p>
            <Link
              href="/dashboard/assessments/new"
              className="inline-flex items-center gap-2 bg-brand-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors"
            >
              <Plus size={15} />
              Create Assessment
            </Link>
          </div>
        )}

        {/* Grid */}
        {assessments.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((a) => (
                <AssessmentCard
                  key={a.id}
                  assessment={a}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>

            {hasMore && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-border rounded-2xl text-sm font-semibold text-ink-3 hover:bg-surface hover:text-ink transition-colors shadow-card"
              >
                <ChevronDown
                  size={16}
                  className={showAll ? 'rotate-180 transition-transform' : 'transition-transform'}
                />
                {showAll
                  ? 'Show Less'
                  : `Show ${assessments.length - INITIAL_COUNT} More`
                }
              </button>
            )}
          </div>
        )}

      </div>

      {deleteTarget && (
        <DeleteModal
          assessment={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </>
  )
}