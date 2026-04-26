'use client'

import { useState, useEffect, useCallback } from 'react'
import Avatar  from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/ToastProvider'
import MergeStudentsModal from '@/components/students/MergeStudentModal'
import {
  Search, TrendingUp, TrendingDown, Minus, ArrowLeft,
  X, GitMerge, Star, AlertTriangle, Pencil,
  BarChart2, Users, Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const LOW = 50

// ── Helpers ────────────────────────────────────────────────────────────────
function TrendBadge({ trend }) {
  if (trend === 'improving') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success bg-success-light px-2 py-0.5 rounded-full">
      <TrendingUp size={10} /> Improving
    </span>
  )
  if (trend === 'declining') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-danger bg-danger-light px-2 py-0.5 rounded-full">
      <TrendingDown size={10} /> Declining
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-4 bg-surface px-2 py-0.5 rounded-full">
      <Minus size={10} /> Stable
    </span>
  )
}

function ScoreChip({ score }) {
  if (score === null || score === undefined) return <span className="text-xs text-ink-4">—</span>
  const cls =
    score >= 75 ? 'text-success bg-success-light' :
    score >= 50 ? 'text-amber  bg-amber-light'    :
                  'text-danger  bg-danger-light'
  return <span className={cn('text-sm font-bold px-2.5 py-1 rounded-xl tabular-nums', cls)}>{score}%</span>
}

function ScoreBar({ score, className = '' }) {
  if (score == null) return null
  const c = score >= 75 ? 'bg-success' : score >= 50 ? 'bg-amber' : 'bg-danger'
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden min-w-[60px]">
        <div className={cn('h-full rounded-full transition-all', c)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-bold text-ink w-10 text-right tabular-nums">{score}%</span>
    </div>
  )
}

function Sparkline({ scores = [] }) {
  if (scores.length < 2) return null
  const w = 64, h = 24
  const max = Math.max(...scores, 1), min = Math.min(...scores, 0), range = max - min || 1
  const pts = scores.map((s, i) =>
    `${((i / (scores.length - 1)) * w).toFixed(1)},${(h - ((s - min) / range) * h).toFixed(1)}`
  ).join(' ')
  const col = scores.at(-1) >= 75 ? '#2da44e' : scores.at(-1) >= 50 ? '#f5a623' : '#e5534b'
  return (
    <svg width={w} height={h} className="overflow-visible flex-shrink-0">
      <polyline points={pts} fill="none" stroke={col} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Summary stat cards ─────────────────────────────────────────────────────
function SummaryCards({ students }) {
  const active     = students.filter((s) => !s.is_archived)
  const totalTests = active.reduce((n, s) => n + s.totalAssessments, 0)
  const allScores  = active.flatMap((s) =>
    (s.submissions ?? []).map((sub) => sub.score).filter((sc) => sc !== null)
  )
  const avg      = allScores.length
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : null
  const avgColor = avg == null ? 'text-ink-4' : avg >= 75 ? 'text-success' : avg >= 50 ? 'text-amber' : 'text-danger'
  const avgBg    = avg == null ? 'bg-surface'  : avg >= 75 ? 'bg-success-light' : avg >= 50 ? 'bg-amber-light' : 'bg-danger-light'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[
        {
          icon: Users, bg: 'bg-brand-50', color: 'text-brand-600',
          label: 'Total Students',
          value: active.length,
          sub:   `${active.length} active profile${active.length !== 1 ? 's' : ''}`,
        },
        {
          icon: Activity, bg: 'bg-surface', color: 'text-ink',
          label: 'Assessments Taken',
          value: totalTests,
          sub:   `${totalTests} submission${totalTests !== 1 ? 's' : ''} total`,
        },
        {
          icon: BarChart2, bg: avgBg, color: avgColor,
          label: 'Overall Average',
          value: avg !== null ? `${avg}%` : '—',
          sub:   avg != null
            ? avg >= 75 ? 'Class performing well 🎉'
            : avg >= 50 ? 'Room for improvement'
            :             'Needs attention ⚠️'
            : 'No scores yet',
        },
      ].map((c, i) => (
        <div key={i} className="bg-white border border-border rounded-2xl p-5 shadow-card flex items-start gap-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', c.bg)}>
            <c.icon size={18} className={c.color} />
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-4 uppercase tracking-wide">{c.label}</p>
            <p className={cn('font-display text-3xl font-bold mt-0.5', c.color)}>{c.value}</p>
            <p className="text-xs text-ink-4 mt-1">{c.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Score history chart ────────────────────────────────────────────────────
function HistoryChart({ submissions = [] }) {
  if (!submissions.length) return (
    <p className="py-8 text-center text-sm text-ink-4">No score history yet</p>
  )
  return (
    <div className="flex items-end gap-2" style={{ height: '128px' }}>
      {submissions.map((sub, i) => {
        const h    = Math.max((sub.score / 100) * 100, sub.score > 0 ? 3 : 0)
        const c    = sub.score >= 75 ? 'bg-success' : sub.score >= 50 ? 'bg-amber' : 'bg-danger'
        const date = new Date(sub.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute bottom-full mb-2 bg-ink text-white text-[10px] font-semibold
                            px-2.5 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none
                            z-10 text-center whitespace-nowrap shadow-lg leading-relaxed">
              {sub.assessments?.title ?? 'Assessment'}<br />{sub.score}% · {date}
            </div>
            <div className="w-full flex flex-col justify-end" style={{ height: '96px' }}>
              <div className={cn('w-full rounded-t-lg', c)} style={{ height: `${h}%` }} />
            </div>
            <span className="text-[9px] text-ink-4 text-center leading-none">{date}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Rename modal ───────────────────────────────────────────────────────────
function RenameModal({ student, onConfirm, onClose }) {
  const [name, setName] = useState(student.full_name)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Rename Student</h2>
            <p className="text-sm text-ink-3 mt-1">
              Disambiguate two students sharing the same name.
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-border ml-3">
            <X size={15} />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-2">Display name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onConfirm(name.trim()) }}
            autoFocus
            placeholder="e.g. Paul A  or  Paul — SS2"
            className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm outline-none
                       focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <p className="text-xs text-ink-4">Students never see this — only affects your dashboard.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface">
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim() || name.trim() === student.full_name}
            className="flex-1 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-semibold
                       hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Student detail ─────────────────────────────────────────────────────────
function StudentDetail({ student, onBack, onRename }) {
  const [showRename, setShowRename] = useState(false)
  const pct   = student.avgScore ?? 0
  const subs  = student.submissions ?? []
  const best  = student.subjectBreakdown?.[0]
  const worst = student.subjectBreakdown?.at(-1)

  return (
    <>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <button onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-ink-3 hover:text-ink self-start transition-colors">
          <ArrowLeft size={15} /> Back to Students
        </button>

        {/* Header */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
          <div className="flex items-start gap-5 flex-wrap">
            <Avatar name={student.full_name} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="font-display text-2xl font-bold text-ink">{student.full_name}</h1>
                <TrendBadge trend={student.trend} />
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {student.grades_taken?.map((g) => (
                  <span key={g} className="text-xs font-semibold bg-brand-50 border border-brand-200
                                           text-brand-700 px-2.5 py-1 rounded-full uppercase">{g}</span>
                ))}
                {student.subjectBreakdown?.map((s) => (
                  <span key={s.name} className="text-xs font-medium bg-surface border border-border
                                                text-ink-3 px-2.5 py-1 rounded-full capitalize">
                    {s.name.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className={cn('font-display text-3xl font-bold',
                    pct >= 75 ? 'text-success' : pct >= 50 ? 'text-amber' : pct > 0 ? 'text-danger' : 'text-ink-4'
                  )}>
                    {pct > 0 ? `${pct}%` : '—'}
                  </p>
                  <p className="text-xs text-ink-4 mt-0.5">Average Score</p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="font-display text-3xl font-bold text-ink">{student.totalAssessments}</p>
                  <p className="text-xs text-ink-4 mt-0.5">Assessments</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl font-bold text-ink">
                    {student.last_active
                      ? new Date(student.last_active).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      : '—'}
                  </p>
                  <p className="text-xs text-ink-4 mt-0.5">Last Active</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowRename(true)}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl
                         text-sm font-semibold text-ink hover:border-brand-400 transition-colors flex-shrink-0">
              <Pencil size={13} /> Rename
            </button>
          </div>
        </div>

        {/* Score history */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
          <h2 className="font-display text-base font-bold text-ink mb-5">Score History</h2>
          <HistoryChart submissions={subs} />
        </div>

        {/* Subject breakdown */}
        {student.subjectBreakdown?.length > 0 && (
          <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
            <h2 className="font-display text-base font-bold text-ink mb-5">Performance by Subject</h2>
            <div className="flex flex-col gap-3">
              {student.subjectBreakdown.map((s) => (
                <div key={s.name} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-ink w-36 truncate capitalize">
                    {s.name.replace(/_/g, ' ')}
                  </span>
                  <ScoreBar score={s.avg} className="flex-1" />
                  <span className="text-xs text-ink-4 flex-shrink-0">
                    {s.count} test{s.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
            {student.subjectBreakdown.length >= 2 && (
              <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-border">
                <div className="bg-success-light border border-success/20 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold text-success uppercase tracking-wide mb-1">⭐ Strongest</p>
                  <p className="font-semibold text-ink capitalize">{best.name.replace(/_/g, ' ')}</p>
                  <p className="text-success font-bold text-lg">{best.avg}%</p>
                </div>
                <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3">
                  <p className="text-xs font-bold text-danger uppercase tracking-wide mb-1">📚 Needs Work</p>
                  <p className="font-semibold text-ink capitalize">{worst.name.replace(/_/g, ' ')}</p>
                  <p className="text-danger font-bold text-lg">{worst.avg}%</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assessment history */}
        <div>
          <h2 className="font-display text-base font-bold text-ink mb-3">
            Assessment History ({subs.length})
          </h2>
          {subs.length === 0 ? (
            <div className="bg-white border border-dashed border-border rounded-2xl p-8 text-center">
              <p className="text-sm text-ink-4">No assessments taken yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4">Assessment</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden md:table-cell">Subject</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden md:table-cell">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4">Score</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden lg:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((sub) => (
                    <tr key={sub.id} className="border-t border-border hover:bg-surface/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-ink">{sub.assessments?.title ?? 'Assessment'}</p>
                        <p className="text-xs text-ink-4 capitalize mt-0.5">
                          {sub.assessments?.class_level?.toUpperCase()}
                          {sub.assessments?.topic && ` · ${sub.assessments.topic}`}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-ink-3 text-sm capitalize hidden md:table-cell">
                        {sub.assessments?.subject?.replace(/_/g, ' ') ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-ink-4 text-xs hidden md:table-cell">
                        {new Date(sub.completed_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3.5"><ScoreChip score={sub.score} /></td>
                      <td className="px-5 py-3.5 text-ink-4 text-xs hidden lg:table-cell">
                        {sub.time_taken_secs
                          ? `${Math.floor(sub.time_taken_secs / 60)}m ${sub.time_taken_secs % 60}s`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showRename && (
        <RenameModal
          student={student}
          onConfirm={(name) => { onRename(student.full_name, name); setShowRename(false) }}
          onClose={() => setShowRename(false)}
        />
      )}
    </>
  )
}

// ── Class analytics ────────────────────────────────────────────────────────
function ClassAnalytics({ students }) {
  const active     = students.filter((s) => !s.is_archived && s.totalAssessments > 0)
  const struggling = active.filter((s) => s.avgScore !== null && s.avgScore < LOW)
  const improving  = active.filter((s) => s.trend === 'improving')
  const classAvg   = active.length
    ? Math.round(active.reduce((n, s) => n + (s.avgScore ?? 0), 0) / active.length)
    : null
  const top = [...active]
    .filter((s) => s.avgScore !== null)
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5)
  const buckets = [
    { label: '0–40%',   min: 0,  max: 40,  bar: 'bg-danger',    text: 'text-danger'  },
    { label: '41–60%',  min: 41, max: 60,  bar: 'bg-amber',     text: 'text-amber'   },
    { label: '61–75%',  min: 61, max: 75,  bar: 'bg-success/60', text: 'text-success' },
    { label: '76–100%', min: 76, max: 100, bar: 'bg-success',    text: 'text-success' },
  ].map((b) => ({
    ...b,
    count: active.filter((s) => s.avgScore !== null && s.avgScore >= b.min && s.avgScore <= b.max).length,
  }))
  const maxB = Math.max(...buckets.map((b) => b.count), 1)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Users,         bg: 'bg-brand-50',      color: 'text-brand-600', label: 'Active Students', value: active.length },
          { icon: BarChart2,     bg: 'bg-surface',        color: classAvg != null && classAvg >= 50 ? 'text-success' : 'text-danger', label: 'Class Average', value: classAvg != null ? `${classAvg}%` : '—' },
          { icon: TrendingUp,    bg: 'bg-success-light',  color: 'text-success',   label: 'Improving',      value: improving.length },
          { icon: AlertTriangle, bg: 'bg-danger-light',   color: 'text-danger',    label: 'Need Attention', value: struggling.length },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-border rounded-2xl p-5 shadow-card">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', s.bg)}>
              <s.icon size={17} className={s.color} />
            </div>
            <p className={cn('font-display text-3xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-ink-4 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
        <h2 className="font-display text-base font-bold text-ink mb-5">Score Distribution</h2>
        {active.length === 0 ? <p className="text-sm text-ink-4">No data yet</p> : (
          <div className="flex items-end gap-4">
            {buckets.map((b, i) => {
              const h = Math.max((b.count / maxB) * 100, b.count > 0 ? 6 : 0)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className={cn('text-sm font-bold', b.text)}>{b.count}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                    <div className={cn('w-full rounded-t-xl', b.bar)} style={{ height: `${h}%` }} />
                  </div>
                  <span className="text-[10px] text-ink-4 text-center leading-snug">{b.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {top.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Star size={15} className="text-amber" />
            <h2 className="font-display text-base font-bold text-ink">Top Performers</h2>
          </div>
          <div className="flex flex-col gap-3">
            {top.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className={cn('text-sm font-bold w-5 flex-shrink-0', i === 0 ? 'text-amber' : 'text-ink-4')}>
                  {i + 1}
                </span>
                <Avatar name={s.full_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{s.full_name}</p>
                  <p className="text-xs text-ink-4">{s.grade_class || '—'} · {s.totalAssessments} assessments</p>
                </div>
                <ScoreChip score={s.avgScore} />
              </div>
            ))}
          </div>
        </div>
      )}

      {struggling.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-danger" />
            <h2 className="font-display text-base font-bold text-ink">Needs Support</h2>
            <span className="text-xs text-ink-4">below {LOW}%</span>
          </div>
          <div className="flex flex-col gap-2">
            {struggling.sort((a, b) => (a.avgScore ?? 0) - (b.avgScore ?? 0)).map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-danger-light/30 border border-danger/10">
                <Avatar name={s.full_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{s.full_name}</p>
                  <p className="text-xs text-ink-4">{s.grade_class || '—'} · {s.totalAssessments} assessments</p>
                </div>
                <ScoreChip score={s.avgScore} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function StudentsPage() {
  const { toast } = useToast()

  const [students,     setStudents]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState('')
  const [gradeFilter,  setGradeFilter]  = useState('')
  const [activeTab,    setActiveTab]    = useState('students')
  const [openStudent,  setOpenStudent]  = useState(null)
  const [showMerge,    setShowMerge]    = useState(false)
  const [acting,       setActing]       = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/students')
      const data = await res.json()
      if (!res.ok) setError(data.error ?? `Error ${res.status}`)
      else setStudents(data.students ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleRename = useCallback(async (oldName, newName) => {
    setActing(true)
    const res = await fetch('/api/students', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'rename', oldName, newName }),
    })
    if (res.ok) {
      toast({ message: 'Student renamed.', type: 'success' })
      await load()
      setOpenStudent((p) => p ? { ...p, full_name: newName } : null)
    } else {
      toast({ message: 'Failed to rename.', type: 'error' })
    }
    setActing(false)
  }, [load, toast])

  const handleMerge = useCallback(async ({ sourceIds, primaryName }) => {
    setActing(true)
    const sourceNames = sourceIds.map((id) => {
      const s = students.find((st) => st.id === id)
      return s?.full_name ?? id
    })
    const res = await fetch('/api/students', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'merge', sourceNames, primaryName }),
    })
    if (res.ok) {
      toast({ message: `Profiles merged into "${primaryName}".`, type: 'success' })
      setShowMerge(false)
      await load()
    } else {
      toast({ message: 'Merge failed. Try again.', type: 'error' })
    }
    setActing(false)
  }, [students, load, toast])

  // Student detail view
  if (openStudent) {
    const fresh = students.find((s) => s.id === openStudent.id) ?? openStudent
    return (
      <div className="max-w-5xl mx-auto">
        <StudentDetail
          student={fresh}
          onBack={() => setOpenStudent(null)}
          onRename={handleRename}
        />
      </div>
    )
  }

  const allGrades  = [...new Set(students.flatMap((s) => s.grades_taken ?? []).filter(Boolean))]
  const struggling = students.filter((s) => !s.is_archived && s.avgScore !== null && s.avgScore < LOW)
  const visible    = students.filter((s) => {
    if (search      && !s.full_name.toLowerCase().includes(search.toLowerCase())) return false
    if (gradeFilter && !(s.grades_taken ?? []).includes(gradeFilter))             return false
    return true
  })

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Spinner className="w-8 h-8" />
      <p className="text-sm text-ink-4">Loading students…</p>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-danger-light flex items-center justify-center">
        <AlertTriangle size={24} className="text-danger" />
      </div>
      <div>
        <p className="font-display text-lg font-bold text-ink mb-1">Failed to load students</p>
        <p className="text-sm text-ink-3 font-mono bg-surface px-3 py-2 rounded-lg">{error}</p>
      </div>
      <button onClick={load}
        className="px-6 py-2.5 bg-brand-800 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors">
        Try again
      </button>
    </div>
  )

  return (
    <>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">

        {/* Page header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Students</h1>
          <p className="text-ink-3 text-sm mt-1">
            Profiles built automatically from your assessment submissions.
          </p>
        </div>

        {/* ── Merge duplicate students — prominent, always visible ─────── */}
        {students.length >= 2 && (
          <div className="bg-white border-2 border-brand-200 rounded-2xl px-5 py-4 shadow-card
                          flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {/* Icon + text row */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <GitMerge size={18} className="text-brand-700" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-brand-900">
                  Students appearing under different names?
                </p>
                <p className="text-xs text-brand-600 mt-0.5 leading-relaxed">
                  Students sometimes type their name differently (e.g. "Ayomide" vs "Ayomide Bello").
                  Use Merge to combine their history into one profile.
                </p>
              </div>
            </div>
            {/* Button — full-width on mobile, auto-width on sm+ */}
            <button
              onClick={() => setShowMerge(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5
                         bg-brand-800 text-white text-sm font-bold rounded-xl
                         hover:bg-brand-700 transition-colors flex-shrink-0 whitespace-nowrap"
            >
              <GitMerge size={15} /> Merge Duplicate Students
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-surface border border-border rounded-2xl p-1.5 self-start">
          {[
            { id: 'students',  label: 'All Students',   icon: Users     },
            { id: 'analytics', label: 'Class Analytics', icon: BarChart2 },
          ].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                activeTab === t.id ? 'bg-brand-900 text-white shadow-sm' : 'text-ink-4 hover:text-ink'
              )}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── STUDENTS TAB ─────────────────────────────────────────────── */}
        {activeTab === 'students' && (
          <>
            {/* Summary cards */}
            {students.length > 0 && <SummaryCards students={students} />}

            {/* Low-score alert */}
            {struggling.length > 0 && (
              <div className="flex items-start gap-3 bg-danger-light border border-danger/20 rounded-2xl px-5 py-4">
                <AlertTriangle size={17} className="text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-danger">
                    {struggling.length} student{struggling.length !== 1 ? 's' : ''} averaging below {LOW}%
                  </p>
                  <p className="text-xs text-danger/70 mt-0.5 leading-relaxed">
                    {struggling.slice(0, 5).map((s) => s.full_name).join(', ')}
                    {struggling.length > 5 ? ` +${struggling.length - 5} more` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1 bg-white border border-border rounded-xl px-4 py-3 shadow-card">
                <Search size={15} className="text-ink-4 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name…"
                  className="flex-1 bg-transparent text-sm outline-none text-ink placeholder:text-ink-4"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-ink-4 hover:text-ink">
                    <X size={13} />
                  </button>
                )}
              </div>
              {allGrades.length > 1 && (
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="px-4 py-3 bg-white border border-border rounded-xl text-sm text-ink
                             outline-none shadow-card cursor-pointer"
                >
                  <option value="">All classes</option>
                  {allGrades.map((g) => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                </select>
              )}
            </div>

            {/* Empty states */}
            {students.length === 0 ? (
              <div className="bg-white border border-dashed border-border rounded-2xl p-14 text-center">
                <p className="text-5xl mb-4">👥</p>
                <p className="font-display text-xl font-bold text-ink mb-2">No students yet</p>
                <p className="text-sm text-ink-3 max-w-md mx-auto leading-relaxed">
                  Share an assessment link with your students. Their profiles appear here
                  automatically the moment they submit — no setup needed.
                </p>
              </div>
            ) : visible.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-10 text-center">
                <p className="text-sm text-ink-4">No students match your search.</p>
              </div>
            ) : (
              <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface border-b border-border">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4">Student</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden md:table-cell">Class</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4">Avg Score</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden sm:table-cell">Tests</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden lg:table-cell">Trend</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden xl:table-cell">History</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((s) => (
                      <tr key={s.id}
                        className="border-t border-border hover:bg-surface/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <button onClick={() => setOpenStudent(s)}
                            className="flex items-center gap-3 group text-left">
                            <Avatar name={s.full_name} size="sm" />
                            <div>
                              <p className="font-semibold text-ink group-hover:text-brand-600 transition-colors">
                                {s.full_name}
                              </p>
                              {s.avgScore !== null && s.avgScore < LOW && (
                                <p className="text-[10px] text-danger font-semibold">Needs attention</p>
                              )}
                            </div>
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-ink-3 text-sm hidden md:table-cell">
                          {s.grade_class?.toUpperCase() || '—'}
                        </td>
                        <td className="px-5 py-3.5"><ScoreChip score={s.avgScore} /></td>
                        <td className="px-5 py-3.5 text-ink-3 hidden sm:table-cell">{s.totalAssessments}</td>
                        <td className="px-5 py-3.5 hidden lg:table-cell"><TrendBadge trend={s.trend} /></td>
                        <td className="px-5 py-3.5 hidden xl:table-cell">
                          <Sparkline scores={s.submissions?.map((sub) => sub.score).filter(Boolean)} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end">
                            <button onClick={() => setOpenStudent(s)}
                              className="text-xs font-semibold text-brand-600 hover:text-brand-500
                                         px-2.5 py-1.5 bg-brand-50 rounded-lg hover:bg-brand-100
                                         transition-colors whitespace-nowrap">
                              View →
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-ink-4 px-5 py-3 border-t border-border">
                  Click any student name to see their full performance history.
                </p>
              </div>
            )}
          </>
        )}

        {/* ── ANALYTICS TAB ────────────────────────────────────────────── */}
        {activeTab === 'analytics' && <ClassAnalytics students={students} />}

      </div>

      {/* Merge modal */}
      {showMerge && (
        <MergeStudentsModal
          students={students}
          onConfirm={handleMerge}
          onClose={() => setShowMerge(false)}
        />
      )}
    </>
  )
}