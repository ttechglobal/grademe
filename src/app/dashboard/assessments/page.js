'use client'

/**
 * src/app/dashboard/assessments/page.js
 *
 * Redesigned assessments page with:
 *  - Assessment Series (collapsible folder cards) + Standalone assessments
 *  - New Series button alongside New Assessment
 *  - Search across series names and assessment titles
 *  - Filter tabs: All / Series / Standalone / Archived
 *  - Series tip banner (dismissible, shown once)
 *  - "Add to series" inside every assessment card
 *  - All existing actions preserved (share, toggle, delete)
 *
 * ─── DATABASE MIGRATIONS ─────────────────────────────────────────────────────
 * Run these once in Supabase SQL editor before deploying:
 *
 *   CREATE TABLE IF NOT EXISTS public.assessment_series (
 *     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     teacher_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
 *     name        TEXT NOT NULL,
 *     subject     TEXT,
 *     description TEXT,
 *     created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
 *   );
 *   ALTER TABLE public.assessment_series ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "tutors own series" ON public.assessment_series
 *     FOR ALL USING (teacher_id = auth.uid());
 *
 *   ALTER TABLE public.assessments
 *     ADD COLUMN IF NOT EXISTS series_id    UUID REFERENCES public.assessment_series(id) ON DELETE SET NULL,
 *     ADD COLUMN IF NOT EXISTS series_order INTEGER DEFAULT 0;
 *
 *   -- Then: Supabase Dashboard → Settings → API → Reload schema
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link             from 'next/link'
import {
  Plus, ExternalLink, Trash2, Copy, Eye,
  X, EyeOff, RotateCcw, Clock, Users, AlertCircle,
  ChevronRight, ChevronDown, Search, FolderOpen,
  Layers, FileText, Archive, BookOpen, Lightbulb,
} from 'lucide-react'
import { cn }       from '@/lib/utils'
import { useToast } from '@/components/ui/ToastProvider'

// ─── Constants & helpers ──────────────────────────────────────────────────────
const AUTO_DEACTIVATE_DAYS = 14
const TIP_DISMISS_KEY      = 'gm_series_tip_dismissed'

function relativeTime(dateStr) {
  if (!dateStr) return null
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function subjectAccent(subject = '') {
  const s = subject.toLowerCase()
  if (s.includes('math'))    return 'bg-brand-500'
  if (s.includes('english')) return 'bg-blue-500'
  if (s.includes('bio'))     return 'bg-emerald-500'
  if (s.includes('chem'))    return 'bg-purple-500'
  if (s.includes('phys'))    return 'bg-sky-500'
  if (s.includes('gov'))     return 'bg-orange-500'
  if (s.includes('econ'))    return 'bg-rose-500'
  return 'bg-brand-400'
}

const Q_TYPE_LABELS = {
  mcq:         'Multiple Choice',
  true_false:  'True / False',
  truefalse:   'True / False',
  calculation: 'Fill-in Answer',
}
const A_TYPE_COLORS = {
  quiz:       'bg-brand-100 text-brand-700',
  test:       'bg-amber-light text-amber',
  assignment: 'bg-purple-100 text-purple-700',
}

function displayTitle(a) {
  const topic = (a.topic || '').trim()
  const subj  = (a.subject || '').replace(/_/g, ' ')
  const type  = (a.assessment_type || '').trim()
  if (topic) return type ? `${topic} — ${type}` : topic
  return a.title || [subj, type].filter(Boolean).join(' ') || 'Assessment'
}

// ─── Tip banner ───────────────────────────────────────────────────────────────
function SeriesTipBanner({ onDismiss }) {
  return (
    <div className="flex items-start gap-3 bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4">
      <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Lightbulb size={16} className="text-brand-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-800 mb-0.5">Tip — group related assessments into a series</p>
        <p className="text-xs text-brand-600 leading-relaxed">
          All quizzes under one topic live together so you can track student progress across the whole topic.
          Create a series and drop assessments inside it.
        </p>
      </div>
      <button onClick={onDismiss} className="text-brand-400 hover:text-brand-600 flex-shrink-0 transition-colors mt-0.5" aria-label="Dismiss">
        <X size={15} />
      </button>
    </div>
  )
}

// ─── New Series modal ─────────────────────────────────────────────────────────
function NewSeriesModal({ onClose, onCreate }) {
  const [name,   setName]   = useState('')
  const [subj,   setSubj]   = useState('')
  const [desc,   setDesc]   = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handle = async () => {
    if (!name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setSaving(false); return }
    const { data, error } = await supabase
      .from('assessment_series')
      .insert({ teacher_id: session.user.id, name: name.trim(), subject: subj.trim() || null, description: desc.trim() || null })
      .select().single()
    if (error) {
      toast({ message: 'Could not create series. Run the DB migration first.', type: 'error' })
    } else {
      toast({ message: `Series "${data.name}" created!`, type: 'success' })
      onCreate(data); onClose()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">New Series</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-border"><X size={15} /></button>
        </div>
        <p className="text-sm text-ink-3 -mt-2">Groups related assessments under one topic so you can track progress over time.</p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-3 mb-1.5">Series Name <span className="text-danger">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) handle() }}
              placeholder="e.g. Quadratic Equations, Forces & Motion" autoFocus
              className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-3 mb-1.5">Subject (optional)</label>
            <input type="text" value={subj} onChange={(e) => setSubj(e.target.value)}
              placeholder="e.g. Mathematics, Physics"
              className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-3 mb-1.5">Description (optional)</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
              placeholder="What topics does this series cover?"
              className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface">Cancel</button>
          <button onClick={handle} disabled={!name.trim() || saving}
            className="flex-1 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Layers size={14} />}
            {saving ? 'Creating…' : 'Create Series'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Add-to-series modal ──────────────────────────────────────────────────────
function AddToSeriesModal({ assessment, seriesList, onClose, onSaved }) {
  const [selected, setSelected] = useState(assessment.series_id ?? '')
  const [saving,   setSaving]   = useState(false)
  const { toast } = useToast()

  const handle = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('assessments').update({ series_id: selected || null }).eq('id', assessment.id)
    if (error) {
      toast({ message: 'Could not update series.', type: 'error' })
    } else {
      toast({ message: selected ? 'Added to series!' : 'Removed from series.' })
      onSaved(assessment.id, selected || null); onClose()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink">Add to Series</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-border"><X size={15} /></button>
        </div>
        <p className="text-xs text-ink-4 truncate"><strong className="text-ink">{displayTitle(assessment)}</strong></p>

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {[{ id: '', name: 'No series (standalone)', subject: null }, ...seriesList].map((s) => (
            <label key={s.id} className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors',
              selected === s.id ? 'border-brand-500 bg-brand-50' : 'border-border hover:border-brand-200'
            )}>
              <input type="radio" name="series" value={s.id} checked={selected === s.id} onChange={() => setSelected(s.id)} className="sr-only" />
              <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: selected === s.id ? 'var(--color-brand-500)' : 'var(--color-border)' }}>
                {selected === s.id && <span className="w-2 h-2 rounded-full bg-brand-500" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{s.name}</p>
                {s.subject && <p className="text-xs text-ink-4 capitalize">{s.subject}</p>}
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface">Cancel</button>
          <button onClick={handle} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete assessment modal ──────────────────────────────────────────────────
function DeleteModal({ assessment, onConfirm, onCancel, deleting }) {
  const [deleteData, setDeleteData] = useState(false)
  const [showWarn,   setShowWarn]   = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink mb-1">Delete Assessment?</h2>
            <p className="text-sm text-ink-3"><strong>&ldquo;{assessment.title}&rdquo;</strong> and its link will be permanently removed.</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-border flex-shrink-0"><X size={15} /></button>
        </div>
        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border-2 border-border hover:border-brand-200">
          <input type="checkbox" checked={deleteData} onChange={(e) => { setDeleteData(e.target.checked); setShowWarn(e.target.checked) }} className="mt-0.5 w-4 h-4 accent-danger" />
          <div>
            <p className="text-sm font-semibold text-ink">Also delete student submission data</p>
            <p className="text-xs text-ink-4 mt-0.5">Uncheck to keep student records.</p>
          </div>
        </label>
        {showWarn && (
          <div className="flex items-start gap-2 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>Permanently deletes all student results. Cannot be undone.</span>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface">Cancel</button>
          <button onClick={() => onConfirm(deleteData)} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-danger text-white text-sm font-semibold hover:bg-danger/90 disabled:opacity-60 flex items-center justify-center gap-2">
            {deleting ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Trash2 size={14} />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete series modal ──────────────────────────────────────────────────────
function DeleteSeriesModal({ series, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink mb-1">Delete Series?</h2>
            <p className="text-sm text-ink-3 leading-relaxed">
              <strong>&ldquo;{series.name}&rdquo;</strong> will be deleted. Assessments inside will become
              standalone — they will <strong>not</strong> be deleted.
            </p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center hover:bg-border flex-shrink-0"><X size={15} /></button>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface">Cancel</button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-danger text-white text-sm font-semibold hover:bg-danger/90 disabled:opacity-60 flex items-center justify-center gap-2">
            {deleting ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Trash2 size={14} />}
            {deleting ? 'Deleting…' : 'Delete Series'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Share sheet ──────────────────────────────────────────────────────────────
function ShareSheet({ assessment, shareUrl, tutorName, onClose }) {
  const { toast } = useToast()
  const title = displayTitle(assessment)
  const subj  = (assessment.subject ?? '').replace(/_/g, ' ')
  const type  = assessment.assessment_type ?? 'assessment'

  const copy  = async () => {
    try { await navigator.clipboard.writeText(shareUrl) } catch { /* fallback omitted */ }
    toast({ message: 'Link copied!', type: 'success' })
    onClose()
  }
  const wa = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`📝 *${title}*\n\nYou have a ${subj} ${type} from ${tutorName ?? 'your teacher'}.\n👉 ${shareUrl}\n\nGood luck!`)}`, '_blank')
    onClose()
  }
  const email = () => {
    window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Start here: ${shareUrl}`)}`, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-semibold text-sm text-ink">Share Assessment</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-surface flex items-center justify-center hover:bg-border"><X size={14} /></button>
        </div>
        <div className="px-5 py-3 bg-surface border-b border-border">
          <p className="text-xs text-ink-4 font-medium truncate">{title}</p>
          <p className="text-[10px] text-ink-4 mt-0.5 truncate opacity-60">{shareUrl}</p>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: 'Share via WhatsApp', icon: '💬', fn: wa    },
            { label: 'Share via Email',    icon: '✉️', fn: email },
            { label: 'Copy Link',          icon: '🔗', fn: copy  },
          ].map((o) => (
            <button key={o.label} onClick={o.fn} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface text-left">
              <span className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-base">{o.icon}</span>
              <span className="text-sm font-semibold text-ink">{o.label}</span>
            </button>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border">
          <button onClick={onClose} className="w-full py-3 rounded-xl border-2 border-border text-sm font-semibold text-ink-3 hover:bg-surface">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Assessment row card ──────────────────────────────────────────────────────
function AssessmentRow({ a, onDelete, onToggle, onShare, onAddToSeries, toggling, inSeries = false }) {
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/t/${a.slug}` : `/t/${a.slug}`
  const accent   = subjectAccent(a.subject)
  const title    = displayTitle(a)
  const subs     = a.submission_count ?? 0
  const aType    = a.assessment_type?.toLowerCase()

  return (
    <div className={cn(
      'bg-white border rounded-2xl transition-all overflow-hidden',
      a.is_active ? 'border-border' : 'border-border opacity-70',
      inSeries && 'rounded-xl'
    )}>
      {/* Title row */}
      <Link href={`/dashboard/assessments/${a.id}`}
        className="flex items-start gap-3 px-4 py-4 hover:bg-surface group transition-colors">
        <div className={cn('w-1.5 min-h-[2.5rem] rounded-full flex-shrink-0 self-stretch', accent)} />
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {aType && (
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', A_TYPE_COLORS[aType] ?? 'bg-surface text-ink-4')}>
                {aType}
              </span>
            )}
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
              a.is_active ? 'bg-success-light text-success' : 'bg-surface text-ink-4 border border-border'
            )}>
              {a.is_active ? 'Active' : 'Inactive'}
            </span>
            {a.series_id && !inSeries && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
                <Layers size={9} /> In series
              </span>
            )}
          </div>
          {/* Title */}
          <h3 className="font-display font-bold text-ink text-sm leading-snug group-hover:text-brand-700 transition-colors">
            {title}
          </h3>
          {/* Meta chips */}
          <div className="flex items-center gap-2.5 text-xs text-ink-4 mt-1.5 flex-wrap">
            {a.subject && <span className="capitalize">{a.subject.replace(/_/g, ' ')}</span>}
            {a.class_level && <span className="uppercase">· {a.class_level.replace(/_/g, ' ')}</span>}
            {a.question_type && (
              <span className="bg-surface border border-border px-2 py-0.5 rounded-full text-[10px] font-semibold">
                {Q_TYPE_LABELS[a.question_type] ?? 'MCQ'}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users size={10} />
              {subs > 0 ? `${subs} response${subs !== 1 ? 's' : ''}` : 'No responses'}
            </span>
          </div>
        </div>
        <ChevronRight size={14} className="text-ink-4 flex-shrink-0 mt-1 group-hover:text-brand-500 transition-colors" />
      </Link>

      {/* Action bar */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-t border-border flex-wrap bg-surface/40">
        <a href={shareUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-ink-3 text-xs font-semibold hover:bg-white hover:text-brand-700 transition-colors">
          <Eye size={11} /> Preview
        </a>
        <button onClick={() => onShare(a)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-ink-3 text-xs font-semibold hover:bg-white hover:text-brand-700 transition-colors">
          <ExternalLink size={11} /> Share
        </button>
        <button onClick={() => onToggle(a.id, a.is_active)} disabled={toggling === a.id}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60',
            a.is_active
              ? 'text-ink-3 hover:bg-white hover:text-danger'
              : 'text-success hover:bg-white hover:text-success'
          )}>
          {toggling === a.id
            ? <span className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
            : a.is_active ? <EyeOff size={11} /> : <RotateCcw size={11} />
          }
          {a.is_active ? 'Deactivate' : 'Reactivate'}
        </button>
        <button onClick={() => onAddToSeries(a)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-ink-3 text-xs font-semibold hover:bg-white hover:text-brand-700 transition-colors">
          <Layers size={11} /> {a.series_id ? 'Change series' : 'Add to series'}
        </button>
        <button onClick={() => onDelete(a)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-ink-3 text-xs font-semibold hover:bg-white hover:text-danger transition-colors ml-auto">
          <Trash2 size={11} /> Delete
        </button>
      </div>
    </div>
  )
}

// ─── Series folder card ───────────────────────────────────────────────────────
function SeriesCard({ series, children, onDeleteSeries, onDelete, onToggle, onShare, onAddToSeries, toggling }) {
  const [open, setOpen] = useState(false)
  const accent  = subjectAccent(series.subject ?? '')
  const total   = children.length
  const active  = children.filter((a) => a.is_active).length
  const subs    = children.reduce((n, a) => n + (a.submission_count ?? 0), 0)

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface transition-colors group"
      >
        <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', accent)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <FolderOpen size={14} className="text-brand-500 flex-shrink-0" />
            <h3 className="font-display font-bold text-ink text-base leading-tight truncate group-hover:text-brand-700 transition-colors">
              {series.name}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-4 flex-wrap">
            {series.subject && <span className="capitalize">{series.subject}</span>}
            <span>{total} assessment{total !== 1 ? 's' : ''}</span>
            <span>{active} active</span>
            {subs > 0 && <span className="flex items-center gap-1"><Users size={9} /> {subs}</span>}
            {series.description && <span className="truncate max-w-[200px] hidden sm:inline italic">{series.description}</span>}
          </div>
        </div>
        <ChevronDown size={16} className={cn('text-ink-4 flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-border">
          {children.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-ink-4">
              No assessments in this series yet.{' '}
              <span className="text-brand-500">Use the "Add to series" button on any standalone assessment below.</span>
            </div>
          ) : (
            <div className="p-3 flex flex-col gap-2">
              {children.map((a) => (
                <AssessmentRow key={a.id} a={a} onDelete={onDelete} onToggle={onToggle}
                  onShare={onShare} onAddToSeries={onAddToSeries} toggling={toggling} inSeries />
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border bg-surface flex items-center justify-between gap-3">
            <p className="text-xs text-ink-4">
              To add more: use the <strong>Add to series</strong> button on any standalone assessment below.
            </p>
            <button onClick={() => onDeleteSeries(series)}
              className="flex items-center gap-1.5 text-xs font-semibold text-ink-4 hover:text-danger transition-colors flex-shrink-0">
              <Trash2 size={11} /> Delete series
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-2 h-14 bg-surface rounded-full flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-3 w-16 bg-surface rounded-full" />
          <div className="h-5 w-3/4 bg-surface rounded-lg" />
          <div className="h-3 w-1/2 bg-surface rounded-full" />
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AssessmentsPage() {
  const { toast } = useToast()

  const [assessments,    setAssessments]    = useState([])
  const [seriesList,     setSeriesList]     = useState([])
  const [loading,        setLoading]        = useState(true)
  const [deleteTarget,   setDeleteTarget]   = useState(null)
  const [deleteSeriesT,  setDeleteSeriesT]  = useState(null)
  const [deleting,       setDeleting]       = useState(false)
  const [toggling,       setToggling]       = useState(null)
  const [shareTarget,    setShareTarget]    = useState(null)
  const [addSeriesFor,   setAddSeriesFor]   = useState(null)
  const [showNewSeries,  setShowNewSeries]  = useState(false)
  const [autoDeactBanner,setAutoDeactBanner]= useState(false)
  const [tutorName,      setTutorName]      = useState('')
  const [search,         setSearch]         = useState('')
  const [viewFilter,     setViewFilter]     = useState('all') // all | series | standalone | archived
  const [showTip,        setShowTip]        = useState(false)

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    try { if (!localStorage.getItem(TIP_DISMISS_KEY)) setShowTip(true) } catch { /* ignore */ }

    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      supabase.from('profiles').select('full_name').eq('id', session.user.id).single()
        .then(({ data: p }) => { if (p?.full_name) setTutorName(p.full_name) })

      const [sRes, aRes] = await Promise.all([
        supabase.from('assessment_series').select('id, name, subject, description, created_at')
          .eq('teacher_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('assessments')
          .select('id, title, topic, subject, class_level, slug, is_active, created_at, assessment_type, question_type, series_id, series_order, submissions(id)')
          .eq('teacher_id', session.user.id).order('created_at', { ascending: false }),
      ])

      const raw = aRes.data ?? []
      const cutoff  = new Date(Date.now() - AUTO_DEACTIVATE_DAYS * 86400000)
      const toDeact = raw.filter((a) => a.is_active && new Date(a.created_at) < cutoff)

      if (toDeact.length > 0) {
        await supabase.from('assessments').update({ is_active: false }).in('id', toDeact.map((a) => a.id))
        setAutoDeactBanner(true)
      }

      setSeriesList(sRes.data ?? [])
      setAssessments(raw.map((a) => ({
        ...a,
        is_active:        toDeact.some((d) => d.id === a.id) ? false : a.is_active,
        submission_count: a.submissions?.length ?? 0,
      })))
      setLoading(false)
    }
    load()
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleToggle = useCallback(async (id, active) => {
    setToggling(id)
    const supabase = createClient()
    await supabase.from('assessments').update({ is_active: !active }).eq('id', id)
    setAssessments((prev) => prev.map((a) => a.id === id ? { ...a, is_active: !active } : a))
    toast({ message: active ? 'Assessment deactivated.' : 'Assessment reactivated!' })
    setToggling(null)
  }, [toast])

  const handleDelete = useCallback(async (delData) => {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()
    if (delData) await supabase.from('submissions').delete().eq('assessment_id', deleteTarget.id)
    const { error } = await supabase.from('assessments').delete().eq('id', deleteTarget.id)
    if (!error) {
      setAssessments((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      toast({ message: 'Assessment deleted.' })
    } else {
      toast({ message: 'Could not delete.', type: 'error' })
    }
    setDeleting(false); setDeleteTarget(null)
  }, [deleteTarget, toast])

  const handleDeleteSeries = useCallback(async () => {
    if (!deleteSeriesT) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('assessment_series').delete().eq('id', deleteSeriesT.id)
    if (!error) {
      setAssessments((prev) => prev.map((a) => a.series_id === deleteSeriesT.id ? { ...a, series_id: null } : a))
      setSeriesList((prev) => prev.filter((s) => s.id !== deleteSeriesT.id))
      toast({ message: `Series "${deleteSeriesT.name}" deleted.` })
    } else {
      toast({ message: 'Could not delete series.', type: 'error' })
    }
    setDeleting(false); setDeleteSeriesT(null)
  }, [deleteSeriesT, toast])

  const handleSeriesUpdate = useCallback((aId, newSeriesId) => {
    setAssessments((prev) => prev.map((a) => a.id === aId ? { ...a, series_id: newSeriesId } : a))
  }, [])

  // ── Filter logic ───────────────────────────────────────────────────────────
  const q = search.trim().toLowerCase()
  const matchA = (a) => {
    if (!q) return true
    return displayTitle(a).toLowerCase().includes(q)
      || (a.subject ?? '').toLowerCase().includes(q)
      || (a.topic   ?? '').toLowerCase().includes(q)
  }
  const matchS = (s) => {
    if (!q) return true
    if (s.name.toLowerCase().includes(q)) return true
    if ((s.subject     ?? '').toLowerCase().includes(q)) return true
    if ((s.description ?? '').toLowerCase().includes(q)) return true
    return assessments.filter((a) => a.series_id === s.id).some(matchA)
  }

  const visibleSeries = seriesList.filter((s) => {
    if (viewFilter === 'standalone' || viewFilter === 'archived') return false
    return matchS(s)
  })

  const seriesChildren = (sid) => assessments.filter((a) => a.series_id === sid && matchA(a))

  const visibleStandalone = assessments.filter((a) => {
    if (a.series_id)                                         return false
    if (viewFilter === 'series')                             return false
    if (viewFilter === 'archived')                           return false
    if (!a.is_active && viewFilter !== 'all')               return false
    return matchA(a)
  })

  const visibleArchived = viewFilter === 'archived'
    ? assessments.filter((a) => !a.is_active && matchA(a))
    : []

  const totalVisible = visibleSeries.length + visibleStandalone.length + visibleArchived.length

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Assessments</h1>
          <p className="text-sm text-ink-3 mt-0.5">
            {loading
              ? 'Loading…'
              : `${assessments.length} assessment${assessments.length !== 1 ? 's' : ''}${seriesList.length > 0 ? ` · ${seriesList.length} series` : ''}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowNewSeries(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-border text-ink text-sm font-semibold rounded-xl hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 transition-colors">
            <Layers size={15} /> New Series
          </button>
          <Link href="/dashboard/assessments/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-900 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors">
            <Plus size={15} /> New Assessment
          </Link>
        </div>
      </div>

      {/* ── Tip ─────────────────────────────────────────────────────── */}
      {showTip && !loading && <SeriesTipBanner onDismiss={() => { try { localStorage.setItem(TIP_DISMISS_KEY, '1') } catch { /* ok */ } setShowTip(false) }} />}

      {/* ── Auto-deact banner ────────────────────────────────────────── */}
      {autoDeactBanner && (
        <div className="flex items-start gap-3 bg-amber-light border border-amber/20 rounded-2xl px-5 py-4">
          <AlertCircle size={16} className="text-amber flex-shrink-0 mt-0.5" />
          <p className="flex-1 text-sm text-amber">Some older assessments were automatically deactivated after {AUTO_DEACTIVATE_DAYS} days.</p>
          <button onClick={() => setAutoDeactBanner(false)} className="text-amber/60 hover:text-amber"><X size={15} /></button>
        </div>
      )}

      {/* ── Search + filter bar ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 bg-white border-2 border-border rounded-xl px-3 py-2.5 focus-within:border-brand-500 transition-colors">
          <Search size={15} className="text-ink-4 flex-shrink-0" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assessments and series…"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-4 outline-none" />
          {search && <button onClick={() => setSearch('')} className="text-ink-4 hover:text-ink"><X size={13} /></button>}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all',        label: 'All',        Icon: BookOpen  },
            { id: 'series',     label: 'Series',     Icon: Layers    },
            { id: 'standalone', label: 'Standalone', Icon: FileText  },
            { id: 'archived',   label: 'Archived',   Icon: Archive   },
          ].map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setViewFilter(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                viewFilter === id
                  ? 'bg-brand-900 text-white border-brand-900'
                  : 'bg-white text-ink-3 border-border hover:border-brand-300 hover:text-ink'
              )}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Skeletons ────────────────────────────────────────────────── */}
      {loading && <div className="flex flex-col gap-4">{[1,2,3].map((i) => <Skeleton key={i} />)}</div>}

      {/* ── Empty state (no assessments at all) ─────────────────────── */}
      {!loading && assessments.length === 0 && (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <div className="text-5xl">📋</div>
          <h2 className="font-display text-xl font-bold text-ink">No assessments yet</h2>
          <p className="text-sm text-ink-3 max-w-sm">Create your first assessment and share the link with students.</p>
          <Link href="/dashboard/assessments/new"
            className="flex items-center gap-2 px-6 py-3 bg-brand-900 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors mt-2">
            <Plus size={16} /> Create Assessment
          </Link>
        </div>
      )}

      {/* ── No results after filter/search ──────────────────────────── */}
      {!loading && assessments.length > 0 && totalVisible === 0 && (
        <div className="text-center py-12 text-sm text-ink-4">
          Nothing matches your filters.{' '}
          <button onClick={() => { setSearch(''); setViewFilter('all') }} className="text-brand-500 font-semibold hover:text-brand-400">Clear</button>
        </div>
      )}

      {/* ── Series ──────────────────────────────────────────────────── */}
      {!loading && visibleSeries.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-brand-500" />
            <h2 className="text-sm font-bold text-ink">Series</h2>
            <span className="text-xs text-ink-4">{visibleSeries.length}</span>
          </div>
          {visibleSeries.map((s) => (
            <SeriesCard key={s.id} series={s} children={seriesChildren(s.id)}
              onDeleteSeries={setDeleteSeriesT}
              onDelete={setDeleteTarget}
              onToggle={handleToggle}
              onShare={setShareTarget}
              onAddToSeries={setAddSeriesFor}
              toggling={toggling}
            />
          ))}
        </section>
      )}

      {/* ── Standalone ──────────────────────────────────────────────── */}
      {!loading && visibleStandalone.length > 0 && viewFilter !== 'series' && viewFilter !== 'archived' && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-ink-3" />
            <h2 className="text-sm font-bold text-ink">Standalone</h2>
            <span className="text-xs text-ink-4">{visibleStandalone.length}</span>
            {seriesList.length > 0 && <span className="text-[10px] text-ink-4">— not in a series yet</span>}
          </div>
          {visibleStandalone.map((a) => (
            <AssessmentRow key={a.id} a={a} onDelete={setDeleteTarget}
              onToggle={handleToggle} onShare={setShareTarget}
              onAddToSeries={setAddSeriesFor} toggling={toggling} />
          ))}
        </section>
      )}

      {/* ── Archived ────────────────────────────────────────────────── */}
      {!loading && viewFilter === 'archived' && visibleArchived.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Archive size={14} className="text-ink-3" />
            <h2 className="text-sm font-bold text-ink">Archived / Inactive</h2>
            <span className="text-xs text-ink-4">{visibleArchived.length}</span>
          </div>
          {visibleArchived.map((a) => (
            <AssessmentRow key={a.id} a={a} onDelete={setDeleteTarget}
              onToggle={handleToggle} onShare={setShareTarget}
              onAddToSeries={setAddSeriesFor} toggling={toggling} />
          ))}
        </section>
      )}

      {!loading && viewFilter === 'archived' && visibleArchived.length === 0 && assessments.length > 0 && (
        <div className="text-center py-12 text-sm text-ink-4">No archived assessments. Inactive ones appear here.</div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────── */}
      {showNewSeries  && <NewSeriesModal     onClose={() => setShowNewSeries(false)} onCreate={(s) => setSeriesList((p) => [s, ...p])} />}
      {shareTarget    && <ShareSheet         assessment={shareTarget} shareUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/t/${shareTarget.slug}`} tutorName={tutorName} onClose={() => setShareTarget(null)} />}
      {addSeriesFor   && <AddToSeriesModal   assessment={addSeriesFor} seriesList={seriesList} onClose={() => setAddSeriesFor(null)} onSaved={handleSeriesUpdate} />}
      {deleteTarget   && <DeleteModal        assessment={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} deleting={deleting} />}
      {deleteSeriesT  && <DeleteSeriesModal  series={deleteSeriesT} onConfirm={handleDeleteSeries} onCancel={() => setDeleteSeriesT(null)} deleting={deleting} />}
    </div>
  )
}