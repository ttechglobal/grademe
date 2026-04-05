'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { RefreshCw, Users, ClipboardList, Activity, BookOpen, Calendar, TrendingUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

// ── Date helpers ───────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'today',      label: 'Today'      },
  { id: 'week',       label: 'This Week'  },
  { id: 'month',      label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'year',       label: 'This Year'  },
  { id: 'all',        label: 'All Time'   },
  { id: 'custom',     label: 'Custom'     },
]

function getRange(filterId, customStart, customEnd) {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (filterId) {
    case 'today':
      return { start: today.toISOString(), end: now.toISOString() }
    case 'week': {
      const s = new Date(today); s.setDate(today.getDate() - today.getDay())
      return { start: s.toISOString(), end: now.toISOString() }
    }
    case 'month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), end: now.toISOString() }
    case 'last_month':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
        end:   new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      }
    case 'year':
      return { start: new Date(now.getFullYear(), 0, 1).toISOString(), end: now.toISOString() }
    case 'custom':
      return {
        start: customStart ? new Date(customStart).toISOString() : new Date('2020-01-01').toISOString(),
        end:   customEnd   ? new Date(customEnd + 'T23:59:59').toISOString() : now.toISOString(),
      }
    default:
      return { start: '2020-01-01T00:00:00Z', end: now.toISOString() }
  }
}

// ── Sparkline ──────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#4f46e5' }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const w = 80, h = 28
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── All-time stat card ─────────────────────────────────────────────────────
function TotalCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 flex flex-col gap-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color.bg)}>
        <Icon size={18} className={color.icon} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-1">{label}</p>
        <p className={cn('font-display text-4xl font-extrabold', color.text)}>
          {value?.toLocaleString() ?? '—'}
        </p>
      </div>
    </div>
  )
}

// ── Period metric card ─────────────────────────────────────────────────────
function MetricCard({ label, value, sub, spark, sparkColor, delta }) {
  const up = delta > 0
  return (
    <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-4">{label}</p>
        {spark && <Sparkline data={spark} color={sparkColor} />}
      </div>
      <div>
        <p className="font-display text-3xl font-extrabold text-ink">
          {(value ?? 0).toLocaleString()}
        </p>
        {sub && <p className="text-xs text-ink-4 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ── Bar chart ──────────────────────────────────────────────────────────────
function BarChart({ data, label, color = '#4f46e5', height = 120 }) {
  const max = Math.max(...(data ?? []).map((d) => d.count), 1)
  if (!data?.length) return null

  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <p className="font-display text-sm font-bold text-ink mb-5">{label}</p>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => {
          const pct = (d.count / max) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 bg-ink text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {d.label}: {d.count}
              </div>
              <div
                className="w-full rounded-t-lg transition-all duration-700"
                style={{ height: `${Math.max(pct, d.count > 0 ? 3 : 0)}%`, background: color }}
              />
              <span className="text-[9px] text-ink-4 text-center leading-none">{d.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Horizontal breakdown bar ───────────────────────────────────────────────
function HorizBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink capitalize">{label.replace(/_/g, ' ')}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-ink tabular-nums">{count.toLocaleString()}</span>
          <span className="text-xs text-ink-4 w-10 text-right tabular-nums">{pct}%</span>
        </div>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

// ── Chart builders ─────────────────────────────────────────────────────────
function buildTrendChart(items, filterId, dateKey) {
  const now = new Date()
  const getKey = (d) => new Date(d[dateKey] ?? d)

  if (filterId === 'today') {
    return Array.from({ length: 24 }, (_, h) => ({
      label: `${h}h`,
      count: items.filter((a) => {
        const d = getKey(a)
        return d.getHours() === h && d.toDateString() === now.toDateString()
      }).length,
    })).filter((_, i) => i % 2 === 0)
  }

  if (filterId === 'week') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days.map((label, di) => ({
      label,
      count: items.filter((a) => getKey(a).getDay() === di).length,
    }))
  }

  if (filterId === 'month' || filterId === 'last_month') {
    return Array.from({ length: 4 }, (_, i) => ({
      label: `W${i + 1}`,
      count: items.filter((a) => {
        const d = getKey(a).getDate()
        return d >= i * 7 + 1 && d <= (i + 1) * 7
      }).length,
    }))
  }

  if (filterId === 'year') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.map((label, mi) => ({
      label,
      count: items.filter((a) => getKey(a).getMonth() === mi).length,
    }))
  }

  // All time / custom — last 8 months
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1)
    return {
      label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      count: items.filter((a) => {
        const ad = getKey(a)
        return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear()
      }).length,
    }
  })
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function SuperAdminClient({ adminEmail }) {
  const [filter,      setFilter]      = useState('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd,   setCustomEnd]   = useState('')
  const [totals,      setTotals]      = useState(null)
  const [period,      setPeriod]      = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [lastSync,    setLastSync]    = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const db    = getAdminClient()
    const range = getRange(filter, customStart, customEnd)

    try {
      // ── All-time totals ──────────────────────────────────────────────────
      const [
        { count: allTutors },
        { count: allAssessments },
        { count: allSubmissions },
        { count: allQuestions },
      ] = await Promise.all([
        db.from('profiles')     .select('*', { count: 'exact', head: true }),
        db.from('assessments')  .select('*', { count: 'exact', head: true }),
        db.from('submissions')  .select('*', { count: 'exact', head: true }),
        db.from('questions')    .select('*', { count: 'exact', head: true }),
      ])

      // ── Period data ──────────────────────────────────────────────────────
      const [
        { data: pTutors },
        { data: pAssessments },
        { data: pSubmissions },
        { data: pQuestions },
        { data: surveys },
      ] = await Promise.all([
        db.from('profiles')
          .select('id, created_at')
          .gte('created_at', range.start)
          .lte('created_at', range.end),

        db.from('assessments')
          .select('id, created_at, teacher_id, subject')
          .gte('created_at', range.start)
          .lte('created_at', range.end),

        db.from('submissions')
          .select('id, completed_at, student_name, assessment_id')
          .gte('completed_at', range.start)
          .lte('completed_at', range.end),

        db.from('questions')
          .select('id, created_at')
          .gte('created_at', range.start)
          .lte('created_at', range.end),

        db.from('onboarding_surveys')
          .select('teaching_mode, heard_from, school_type, years_teaching'),
      ])

      const activeTutors = new Set((pAssessments ?? []).map((a) => a.teacher_id)).size
      const uniqueStudents = new Set((pSubmissions ?? []).map((s) => s.student_name?.toLowerCase()?.trim())).size

      // Subject breakdown
      const subjectMap = {}
      for (const a of pAssessments ?? []) {
        if (!a.subject) continue
        const k = a.subject.replace(/_/g, ' ')
        subjectMap[k] = (subjectMap[k] ?? 0) + 1
      }

      // Heard from breakdown
      const heardMap = {}
      for (const s of surveys ?? []) {
        if (!s.heard_from) continue
        heardMap[s.heard_from] = (heardMap[s.heard_from] ?? 0) + 1
      }

      // Trend chart
      const trendData = buildTrendChart(pAssessments ?? [], filter, 'created_at')
      const sparkData = trendData.map((d) => d.count)

      setTotals({
        tutors:      allTutors      ?? 0,
        assessments: allAssessments ?? 0,
        submissions: allSubmissions ?? 0,
        questions:   allQuestions   ?? 0,
      })

      setPeriod({
        newTutors:     pTutors?.length       ?? 0,
        activeTutors,
        assessments:   pAssessments?.length  ?? 0,
        submissions:   pSubmissions?.length  ?? 0,
        uniqueStudents,
        questions:     pQuestions?.length    ?? 0,
        subjectMap,
        heardMap,
        trendData,
        sparkData,
        surveyCount:   surveys?.length       ?? 0,
      })

      setLastSync(new Date())
    } catch (err) {
      console.error('Admin load error:', err)
    }

    setLoading(false)
  }, [filter, customStart, customEnd])

  useEffect(() => { load() }, [load])

  const filterLabel = FILTERS.find((f) => f.id === filter)?.label ?? ''
  const subjectTotal = period ? Object.values(period.subjectMap).reduce((a, b) => a + b, 0) : 0
  const heardTotal   = period ? Object.values(period.heardMap).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="min-h-screen bg-[#f7f7f5]">

      {/* Top nav */}
      <div className="bg-brand-900 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-display text-lg font-extrabold">
              <span className="text-white">Grade</span>
              <span className="text-amber">Mee</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              {lastSync ? lastSync.toLocaleTimeString() : 'Loading…'}
            </button>
            <Link href="/dashboard" className="text-xs font-semibold text-amber hover:text-amber/80 transition-colors">
              App →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-10">

        {/* ── Section A: All-Time Totals ──────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-brand-600 rounded-full" />
            <h2 className="font-display text-lg font-bold text-ink">All-Time Totals</h2>
            <span className="text-xs text-ink-4 font-medium ml-1">— never resets</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <TotalCard
              icon={Users}
              label="Registered Tutors"
              value={totals?.tutors}
              color={{ bg: 'bg-brand-50', icon: 'text-brand-600', text: 'text-brand-700' }}
            />
            <TotalCard
              icon={ClipboardList}
              label="Assessments Created"
              value={totals?.assessments}
              color={{ bg: 'bg-amber/10', icon: 'text-amber', text: 'text-amber' }}
            />
            <TotalCard
              icon={Users}
              label="Student Submissions"
              value={totals?.submissions}
              color={{ bg: 'bg-success-light', icon: 'text-success', text: 'text-success' }}
            />
            <TotalCard
              icon={BookOpen}
              label="Questions Generated"
              value={totals?.questions}
              color={{ bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-700' }}
            />
          </div>
        </div>

        {/* ── Section B: Time-Based Metrics ──────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-amber rounded-full" />
            <h2 className="font-display text-lg font-bold text-ink">Period Metrics</h2>
          </div>

          {/* Filter bar */}
          <div className="bg-white border border-border rounded-2xl p-1.5 flex flex-wrap gap-1 mb-6">
            {FILTERS.filter((f) => f.id !== 'custom').map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                  filter === f.id
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'text-ink-4 hover:text-ink hover:bg-surface'
                )}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => setFilter('custom')}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5',
                filter === 'custom'
                  ? 'bg-brand-900 text-white shadow-sm'
                  : 'text-ink-4 hover:text-ink hover:bg-surface'
              )}
            >
              <Calendar size={13} />
              Custom
            </button>
          </div>

          {/* Custom date inputs */}
          {filter === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 mb-6 bg-white border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-ink-4 uppercase tracking-wide">From</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-2 bg-surface border border-border rounded-xl text-sm text-ink outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-ink-4 uppercase tracking-wide">To</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-2 bg-surface border border-border rounded-xl text-sm text-ink outline-none focus:border-brand-500"
                />
              </div>
              <button
                onClick={load}
                disabled={!customStart || !customEnd}
                className="px-4 py-2 bg-brand-800 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white border border-border rounded-2xl">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw size={20} className="animate-spin text-brand-400" />
                <p className="text-sm text-ink-4">Loading metrics…</p>
              </div>
            </div>
          ) : period ? (
            <div className="flex flex-col gap-6">

              {/* Period label */}
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-ink-4" />
                <span className="text-sm font-semibold text-ink-4">
                  Showing data for: <strong className="text-ink">{filterLabel}</strong>
                </span>
              </div>

              {/* Period metric cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                  label="New Tutors"
                  value={period.newTutors}
                  sub="Signed up in period"
                  spark={period.sparkData}
                  sparkColor="#4f46e5"
                />
                <MetricCard
                  label="Active Tutors"
                  value={period.activeTutors}
                  sub="Created ≥1 assessment"
                />
                <MetricCard
                  label="Assessments"
                  value={period.assessments}
                  sub="Created in period"
                  spark={period.sparkData}
                  sparkColor="#f5a623"
                />
                <MetricCard
                  label="Student Submissions"
                  value={period.submissions}
                  sub="Total submissions"
                />
                <MetricCard
                  label="Unique Students"
                  value={period.uniqueStudents}
                  sub="Approx. by name"
                />
                <MetricCard
                  label="Questions Generated"
                  value={period.questions}
                  sub="Manual + AI combined"
                />
              </div>

              {/* Trend chart */}
              {period.trendData?.length > 0 && (
                <BarChart
                  data={period.trendData}
                  label="Assessment creation trend"
                  color="#4f46e5"
                  height={140}
                />
              )}

              {/* Subject breakdown */}
              {subjectTotal > 0 && (
                <div className="bg-white border border-border rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <p className="font-display text-sm font-bold text-ink">Subjects being assessed</p>
                    <span className="text-xs text-ink-4">{subjectTotal} total</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {Object.entries(period.subjectMap)
                      .sort(([, a], [, b]) => b - a)
                      .map(([subject, count]) => (
                        <HorizBar
                          key={subject}
                          label={subject}
                          count={count}
                          total={subjectTotal}
                          color="#4f46e5"
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Survey — how heard */}
              {heardTotal > 0 && (
                <div className="bg-white border border-border rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <p className="font-display text-sm font-bold text-ink">How tutors found GradeMee</p>
                    <span className="text-xs text-ink-4">{period.surveyCount} responses</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {Object.entries(period.heardMap)
                      .sort(([, a], [, b]) => b - a)
                      .map(([key, count]) => (
                        <HorizBar
                          key={key}
                          label={key.replace(/_/g, ' ')}
                          count={count}
                          total={heardTotal}
                          color="#f5a623"
                        />
                      ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="py-16 text-center text-ink-4">
              Failed to load metrics.
            </div>
          )}
        </div>

        {/* Privacy footer */}
        <div className="border-t border-border pt-6 text-xs text-ink-4 leading-relaxed">
          <strong className="text-ink-3">Privacy:</strong> Aggregate data only. No student personal data collected or displayed. All metrics comply with GDPR principles of data minimisation. Historical records are never overwritten or deleted.
        </div>

      </div>
    </div>
  )
}