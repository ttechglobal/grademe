'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient }  from '@/lib/supabase/client'
import Link              from 'next/link'
import {
  Plus, ExternalLink, Trash2, Copy, CheckCheck,
  X, Eye, EyeOff, RotateCcw, Clock, Users, AlertCircle,
} from 'lucide-react'
import { cn }            from '@/lib/utils'
import { useToast }      from '@/components/ui/ToastProvider'

// ── Helpers ────────────────────────────────────────────────────────────────
const AUTO_DEACTIVATE_DAYS = 14

function relativeTime(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  <  1)  return 'just now'
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days  <  7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function subjectColor(subject = '') {
  const s = subject.toLowerCase()
  if (s.includes('math'))   return 'bg-brand-500'
  if (s.includes('english')) return 'bg-blue-500'
  if (s.includes('bio'))    return 'bg-emerald-500'
  if (s.includes('chem'))   return 'bg-brand-500'
  if (s.includes('phys'))   return 'bg-sky-500'
  if (s.includes('gov'))    return 'bg-orange-500'
  if (s.includes('econ'))   return 'bg-rose-500'
  return 'bg-brand-400'
}

// ── Delete confirmation modal ──────────────────────────────────────────────
function DeleteModal({ assessment, onConfirm, onCancel, deleting }) {
  const [deleteData, setDeleteData] = useState(false)
  const [showWarn,   setShowWarn]   = useState(false)

  const handleCheck = (checked) => {
    setDeleteData(checked)
    setShowWarn(checked)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink mb-1">Delete Assessment?</h2>
            <p className="text-sm text-ink-3 leading-relaxed">
              <strong>&ldquo;{assessment.title}&rdquo;</strong> and its shareable link will be permanently removed.
            </p>
          </div>
          <button onClick={onCancel}
            className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-border transition-colors flex-shrink-0">
            <X size={15} />
          </button>
        </div>

        {/* Checkbox option */}
        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border-2 border-border hover:border-brand-200 transition-colors">
          <input
            type="checkbox"
            checked={deleteData}
            onChange={(e) => handleCheck(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-danger cursor-pointer"
          />
          <div>
            <p className="text-sm font-semibold text-ink">Also delete student submission data</p>
            <p className="text-xs text-ink-4 mt-0.5 leading-relaxed">
              Uncheck to keep student records and performance history.
            </p>
          </div>
        </label>

        {/* Warning when data deletion is checked */}
        {showWarn && (
          <div className="flex items-start gap-2 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>This will permanently delete all student results for this assessment. This cannot be undone.</span>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(deleteData)}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-danger text-white text-sm font-semibold hover:bg-danger/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {deleting
              ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              : <Trash2 size={14} />}
            {deleting ? 'Deleting…' : 'Delete Assessment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Assessment card ────────────────────────────────────────────────────────
function AssessmentCard({
  assessment, onDelete, onToggleActive, onCopy,
  copying, toggling,
}) {
  const {
    id, title, subject, class_level, slug, is_active,
    submission_count = 0, last_submission_at, created_at,
  } = assessment

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/t/${slug}`

  return (
    <div className={cn(
      'bg-white border rounded-2xl p-5 flex flex-col gap-4 transition-all',
      is_active ? 'border-border' : 'border-border opacity-75'
    )}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className={cn('w-2 h-full min-h-[3rem] rounded-full flex-shrink-0 self-stretch', subjectColor(subject))} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
              is_active
                ? 'bg-success-light text-success'
                : 'bg-surface text-ink-4 border border-border'
            )}>
              {is_active ? 'Active' : 'Inactive'}
            </span>
            {subject && (
              <span className="text-xs text-ink-4 capitalize">
                {subject.replace(/_/g, ' ')}
              </span>
            )}
            {class_level && (
              <span className="text-xs text-ink-4 uppercase">{class_level.replace(/_/g, ' ')}</span>
            )}
          </div>
          <h3 className="font-display font-bold text-ink text-base leading-tight truncate">
            {title}
          </h3>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-ink-4">
        <div className="flex items-center gap-1.5">
          <Users size={12} />
          <span>
            {submission_count > 0
              ? `${submission_count} submission${submission_count !== 1 ? 's' : ''}`
              : 'No submissions yet'}
          </span>
        </div>
        {last_submission_at && (
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>Last {relativeTime(last_submission_at)}</span>
          </div>
        )}
        {!last_submission_at && (
          <span className="text-ink-4">Not taken yet</span>
        )}
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
        <Link href={`/dashboard/assessments/${id}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100 transition-colors">
          View Results
        </Link>

        <button
          onClick={() => onCopy(shareUrl, id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface text-ink text-xs font-semibold hover:bg-border transition-colors">
          {copying === id ? <CheckCheck size={12} /> : <Copy size={12} />}
          {copying === id ? 'Copied!' : 'Copy Link'}
        </button>

        <a href={`/t/${slug}?preview=1`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface text-ink text-xs font-semibold hover:bg-border transition-colors">
          <ExternalLink size={12} /> Preview
        </a>

        {/* Activate / Deactivate toggle */}
        <button
          onClick={() => onToggleActive(id, is_active)}
          disabled={toggling === id}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50',
            is_active
              ? 'bg-surface text-ink-3 hover:bg-danger-light hover:text-danger'
              : 'bg-success-light text-success hover:bg-success hover:text-white'
          )}>
          {toggling === id
            ? <span className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
            : is_active ? <EyeOff size={12} /> : <RotateCcw size={12} />}
          {is_active ? 'Deactivate' : 'Reactivate'}
        </button>

        <button
          onClick={() => onDelete(assessment)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface text-ink-3 text-xs font-semibold hover:bg-danger-light hover:text-danger transition-colors ml-auto">
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function AssessmentSkeleton() {
  return (
    <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-2 h-14 bg-surface rounded-full flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-3 w-16 bg-surface rounded-full" />
          <div className="h-5 w-3/4 bg-surface rounded-lg" />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="h-3 w-24 bg-surface rounded-full" />
        <div className="h-3 w-20 bg-surface rounded-full" />
      </div>
      <div className="flex gap-2 pt-1 border-t border-border">
        {[1,2,3,4].map((i) => (
          <div key={i} className="h-8 w-20 bg-surface rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AssessmentsPage() {
  const { toast } = useToast()
  const [assessments,   setAssessments]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [deleting,      setDeleting]      = useState(false)
  const [copying,       setCopying]       = useState(null)
  const [toggling,      setToggling]      = useState(null)
  const [autoDeactBanner, setAutoDeactBanner] = useState(false)
  const [statusFilter,    setStatusFilter]    = useState('all')   // 'all' | 'active' | 'inactive'
  const [subFilter,       setSubFilter]       = useState('all')   // 'all' | 'has' | 'none' | 'recent'

  // ── Fetch + auto-deactivate ─────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data, error } = await supabase
        .from('assessments')
        .select(`
          id, title, subject, class_level, slug, is_active,
          created_at, assessment_type,
          submissions(id)
        `)
        .eq('teacher_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) { setLoading(false); return }

      // Auto-deactivate assessments older than 14 days
      const cutoff   = new Date(Date.now() - AUTO_DEACTIVATE_DAYS * 86400000)
      const toDeact  = (data ?? []).filter(
        (a) => a.is_active && new Date(a.created_at) < cutoff
      )

      if (toDeact.length > 0) {
        await supabase
          .from('assessments')
          .update({ is_active: false })
          .in('id', toDeact.map((a) => a.id))
        setAutoDeactBanner(true)
      }

      // Normalise submission count and flag auto-deactivated ones
      const normalised = (data ?? []).map((a) => ({
        ...a,
        is_active:        toDeact.some((d) => d.id === a.id) ? false : a.is_active,
        submission_count: a.submissions?.length ?? 0,
      }))

      setAssessments(normalised)
      setLoading(false)
    }
    load()
  }, [])

  // ── Copy link ───────────────────────────────────────────────────────────
  const handleCopy = useCallback((url, id) => {
    navigator.clipboard.writeText(url)
    setCopying(id)
    setTimeout(() => setCopying(null), 2000)
  }, [])

  // ── Toggle active ───────────────────────────────────────────────────────
  const handleToggleActive = useCallback(async (id, currentlyActive) => {
    setToggling(id)
    const supabase = createClient()
    const { error } = await supabase
      .from('assessments')
      .update({ is_active: !currentlyActive })
      .eq('id', id)

    if (!error) {
      setAssessments((prev) =>
        prev.map((a) => a.id === id ? { ...a, is_active: !currentlyActive } : a)
      )
      toast({ message: currentlyActive ? 'Assessment deactivated.' : 'Assessment reactivated!' })
    }
    setToggling(null)
  }, [toast])

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (deleteStudentData) => {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()

    if (deleteStudentData) {
      // Delete submissions first (FK constraint), then assessment
      await supabase.from('submissions').delete().eq('assessment_id', deleteTarget.id)
    }

    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', deleteTarget.id)

    if (!error) {
      setAssessments((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      toast({ message: 'Assessment deleted.' })
    } else {
      toast({ message: 'Could not delete. Please try again.', type: 'error' })
    }

    setDeleting(false)
    setDeleteTarget(null)
  }, [deleteTarget, toast])

  // ── Filter logic ────────────────────────────────────────────────────────
  const sevenDaysAgo = Date.now() - 7 * 86400000

  const filtered = assessments.filter((a) => {
    // Status filter
    if (statusFilter === 'active'   && !a.is_active) return false
    if (statusFilter === 'inactive' &&  a.is_active) return false

    // Submission activity filter
    const count = a.submission_count ?? 0
    if (subFilter === 'has'    && count === 0) return false
    if (subFilter === 'none'   && count  >  0) return false
    if (subFilter === 'recent') {
      const lastSub = a.last_submission_at
      if (!lastSub || new Date(lastSub).getTime() < sevenDaysAgo) return false
    }

    return true
  })

  const hasActiveFilters = statusFilter !== 'all' || subFilter !== 'all'

  const clearFilters = () => { setStatusFilter('all'); setSubFilter('all') }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Assessments</h1>
          <p className="text-sm text-ink-3 mt-0.5">
            {loading ? 'Loading…' : `${assessments.length} assessment${assessments.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/dashboard/assessments/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-900 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors">
          <Plus size={16} /> New Assessment
        </Link>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Status filters */}
          <span className="text-xs font-semibold text-ink-4 mr-1">Status:</span>
          {[
            { id: 'all',      label: 'All'      },
            { id: 'active',   label: 'Active'   },
            { id: 'inactive', label: 'Inactive' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                statusFilter === f.id
                  ? 'bg-brand-900 text-white border-brand-900'
                  : 'bg-white text-ink-3 border-border hover:border-brand-300 hover:text-ink'
              )}
            >
              {f.label}
            </button>
          ))}

          <span className="text-ink-4 mx-1">·</span>

          {/* Activity filters */}
          <span className="text-xs font-semibold text-ink-4 mr-1">Activity:</span>
          {[
            { id: 'all',    label: 'All'           },
            { id: 'has',    label: 'Has submissions' },
            { id: 'none',   label: 'No submissions'  },
            { id: 'recent', label: 'Recent (7d)'     },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSubFilter(f.id)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                subFilter === f.id
                  ? 'bg-brand-900 text-white border-brand-900'
                  : 'bg-white text-ink-3 border-border hover:border-brand-300 hover:text-ink'
              )}
            >
              {f.label}
            </button>
          ))}

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-danger border border-danger/20 bg-danger-light hover:bg-danger hover:text-white transition-all"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Filter result count */}
        {hasActiveFilters && !loading && (
          <p className="text-xs text-ink-4">
            Showing {filtered.length} of {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Auto-deactivation banner */}
      {autoDeactBanner && (
        <div className="flex items-start gap-3 bg-amber-light border border-amber/20 rounded-2xl px-5 py-4">
          <AlertCircle size={16} className="text-amber flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-amber leading-relaxed">
            Some of your older assessments have been automatically deactivated after {AUTO_DEACTIVATE_DAYS} days.
            You can reactivate any of them manually at any time.
          </div>
          <button onClick={() => setAutoDeactBanner(false)}
            className="text-amber/60 hover:text-amber flex-shrink-0">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => <AssessmentSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && assessments.length === 0 && (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <div className="text-5xl">📋</div>
          <h2 className="font-display text-xl font-bold text-ink">No assessments yet</h2>
          <p className="text-sm text-ink-3 max-w-sm">
            Create your first assessment and share the link with your students.
          </p>
          <Link href="/dashboard/assessments/new"
            className="flex items-center gap-2 px-6 py-3 bg-brand-900 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors mt-2">
            <Plus size={16} /> Create Assessment
          </Link>
        </div>
      )}

      {/* List */}
      {!loading && assessments.length > 0 && (
        <div className="flex flex-col gap-4">
          {filtered.length === 0 && !loading && (
            <div className="text-center py-12 text-sm text-ink-4">
              No assessments match the current filters.{' '}
              <button onClick={clearFilters} className="text-brand-500 font-semibold hover:text-brand-400">
                Clear filters
              </button>
            </div>
          )}
          {filtered.map((a) => (
            <AssessmentCard
              key={a.id}
              assessment={a}
              onDelete={setDeleteTarget}
              onToggleActive={handleToggleActive}
              onCopy={handleCopy}
              copying={copying}
              toggling={toggling}
            />
          ))}
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          assessment={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  )
}