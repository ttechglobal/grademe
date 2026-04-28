'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, TrendingUp, TrendingDown, Minus, ArrowLeft,
  AlertTriangle, Users, Send, BarChart2, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Helpers ────────────────────────────────────────────────────────────────
function relTime(dateStr) {
  if (!dateStr) return '—'
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  <  1)  return 'just now'
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days  <  7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

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
  return (
    <span className={cn('text-sm font-bold px-2.5 py-1 rounded-xl tabular-nums', cls)}>
      {score}%
    </span>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function StudentSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-surface flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-36 bg-surface rounded-lg" />
        <div className="h-3 w-24 bg-surface rounded-full" />
      </div>
      <div className="h-7 w-14 bg-surface rounded-xl" />
    </div>
  )
}

// ── Student detail view ────────────────────────────────────────────────────
function StudentDetail({ student, onBack }) {
  const submissions = [...(student.submissions ?? [])].sort(
    (a, b) => new Date(b.completed_at) - new Date(a.completed_at)
  )

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-ink-3 hover:text-ink transition-colors self-start"
      >
        <ArrowLeft size={15} /> All Students
      </button>

      {/* Student card */}
      <div className="bg-white border border-border rounded-2xl px-6 py-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
          <span className="font-display text-xl font-bold text-brand-700">
            {(student.full_name ?? '?').charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-bold text-ink">{student.full_name}</h2>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-ink-4">
            <span>{submissions.length} assessment{submissions.length !== 1 ? 's' : ''} taken</span>
            {student.avgScore !== null && <span>Avg {student.avgScore}%</span>}
            <span>Last active {relTime(student.last_active)}</span>
          </div>
        </div>
        {student.avgScore !== null && <ScoreChip score={student.avgScore} />}
      </div>

      {/* Submission history */}
      {submissions.length === 0 ? (
        <div className="text-center py-12 text-sm text-ink-4">No submission history.</div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-4">Assessment History</p>
          </div>
          <div className="divide-y divide-border">
            {submissions.map((sub, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">
                    {sub.assessment_title ?? 'Assessment'}
                  </p>
                  <p className="text-xs text-ink-4 mt-0.5 flex items-center gap-1">
                    <Clock size={10} /> {relTime(sub.completed_at)}
                  </p>
                </div>
                {sub.score !== null && <ScoreChip score={sub.score} />}
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
  const [students,    setStudents]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [search,      setSearch]      = useState('')
  const [openStudent, setOpenStudent] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/students')
      const data = await res.json()
      if (!res.ok) setError(data.error ?? `Error ${res.status}`)
      else         setStudents(data.students ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Student detail
  if (openStudent) {
    const fresh = students.find((s) => s.id === openStudent.id) ?? openStudent
    return <StudentDetail student={fresh} onBack={() => setOpenStudent(null)} />
  }

  // Error
  if (!loading && error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-danger-light flex items-center justify-center">
        <AlertTriangle size={24} className="text-danger" />
      </div>
      <p className="font-display text-lg font-bold text-ink">Failed to load students</p>
      <p className="text-sm text-ink-3 font-mono bg-surface px-3 py-2 rounded-lg">{error}</p>
      <button onClick={load}
        className="px-6 py-2.5 bg-brand-800 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors">
        Try again
      </button>
    </div>
  )

  // Derived values
  const totalStudents    = students.length
  const totalSubmissions = students.reduce((acc, s) => acc + (s.submission_count ?? 0), 0)
  const scored           = students.filter((s) => s.avgScore !== null)
  const overallAvg       = scored.length > 0
    ? Math.round(scored.reduce((acc, s) => acc + s.avgScore, 0) / scored.length)
    : null

  const visible = students.filter((s) =>
    !search || s.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Students</h1>
        <p className="text-sm text-ink-3 mt-1">
          Profiles built automatically from assessment submissions.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon:  Users,
            label: 'Total Students',
            value: loading ? '—' : totalStudents,
            color: 'bg-brand-800',
          },
          {
            icon:  Send,
            label: 'Total Submissions',
            value: loading ? '—' : totalSubmissions,
            color: 'bg-brand-500',
          },
          {
            icon:  BarChart2,
            label: 'Overall Average',
            value: loading ? '—' : overallAvg !== null ? `${overallAvg}%` : '—',
            color: overallAvg === null ? 'bg-ink-4' : overallAvg >= 50 ? 'bg-success' : 'bg-danger',
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-2">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', color)}>
              <Icon size={17} className="text-white" />
            </div>
            <p className="font-display text-3xl font-bold text-ink leading-none">{value}</p>
            <p className="text-sm text-ink-3">{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
        <input
          type="text"
          placeholder="Search students by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
        />
      </div>

      {/* Student list */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">

        {loading && [1, 2, 3, 4, 5].map((i) => <StudentSkeleton key={i} />)}

        {!loading && students.length === 0 && (
          <div className="text-center py-20">
            <p className="text-3xl mb-3">👥</p>
            <p className="font-semibold text-ink mb-1">No students yet</p>
            <p className="text-sm text-ink-3 max-w-xs mx-auto">
              Students appear here automatically after they submit an assessment.
            </p>
          </div>
        )}

        {!loading && students.length > 0 && visible.length === 0 && (
          <div className="text-center py-16 text-sm text-ink-4">
            No students matching &ldquo;{search}&rdquo;
          </div>
        )}

        {!loading && visible.map((student) => (
          <button
            key={student.id}
            onClick={() => setOpenStudent(student)}
            className="w-full flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-brand-50/30 transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-brand-700">
                {(student.full_name ?? '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate group-hover:text-brand-800">
                {student.full_name}
              </p>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-ink-4">
                <span>{student.submission_count ?? 0} assessment{(student.submission_count ?? 0) !== 1 ? 's' : ''}</span>
                <span>Last active {relTime(student.last_active)}</span>
              </div>
            </div>
            <div className="hidden sm:flex flex-shrink-0">
              <TrendBadge trend={student.trend} />
            </div>
            <div className="flex-shrink-0">
              <ScoreChip score={student.avgScore} />
            </div>
          </button>
        ))}
      </div>

    </div>
  )
}