'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Users, ClipboardList,
  BookOpen, BarChart2, Activity,
  RefreshCw, Calendar, Menu, X,
  TrendingUp, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Sidebar config ─────────────────────────────────────────────────────────
const NAV = [
  { id: 'overview',    label: 'Overview',              icon: LayoutDashboard },
  { id: 'tutors',      label: 'Tutors',                icon: Users           },
  { id: 'students',    label: 'Students & Submissions', icon: Activity        },
  { id: 'assessments', label: 'Assessments',           icon: ClipboardList   },
  { id: 'onboarding',  label: 'Onboarding Data',       icon: BookOpen        },
  { id: 'engagement',  label: 'Engagement',            icon: BarChart2       },
]

const FILTERS = [
  { id: 'today',      label: 'Today'      },
  { id: 'week',       label: 'This Week'  },
  { id: 'month',      label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'year',       label: 'This Year'  },
  { id: 'all',        label: 'All Time'   },
  { id: 'custom',     label: 'Custom'     },
]

// ── Chart helpers ──────────────────────────────────────────────────────────
function buildChart(dates, filter) {
  const now = new Date()
  const items = dates.map((d) => ({ created_at: d }))

  if (filter === 'today') {
    return Array.from({ length: 12 }, (_, i) => {
      const h = i * 2
      return {
        label: `${h}h`,
        count: items.filter((a) => {
          const d = new Date(a.created_at)
          return d.getHours() >= h && d.getHours() < h + 2 && d.toDateString() === now.toDateString()
        }).length,
      }
    })
  }
  if (filter === 'week') {
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((label, di) => ({
      label,
      count: items.filter((a) => new Date(a.created_at).getDay() === di).length,
    }))
  }
  if (filter === 'month' || filter === 'last_month') {
    return Array.from({ length: 4 }, (_, i) => ({
      label: `W${i + 1}`,
      count: items.filter((a) => {
        const d = new Date(a.created_at).getDate()
        return d >= i * 7 + 1 && d <= (i + 1) * 7
      }).length,
    }))
  }
  if (filter === 'year') {
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((label, mi) => ({
      label,
      count: items.filter((a) => new Date(a.created_at).getMonth() === mi).length,
    }))
  }
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1)
    return {
      label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      count: items.filter((a) => {
        const ad = new Date(a.created_at)
        return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear()
      }).length,
    }
  })
}

// ── UI Components ──────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent = '#4f46e5' }) {
  return (
    <div className="bg-white border border-[#e5e5e0] rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}15` }}
        >
          <Icon size={17} style={{ color: accent }} />
        </div>
      </div>
      <p className="font-display text-3xl font-extrabold text-[#1a1a2e] mb-1">
        {(value ?? 0).toLocaleString()}
      </p>
      <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest">{label}</p>
      {sub && <p className="text-xs text-[#9ca3af] mt-1">{sub}</p>}
    </div>
  )
}

function BarChart({ data, title, color = '#4f46e5' }) {
  if (!data?.length) return null
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="bg-white border border-[#e5e5e0] rounded-2xl p-6">
      <p className="text-sm font-bold text-[#1a1a2e] mb-5">{title}</p>
      <div className="flex items-end gap-1.5 h-32">
        {data.map((d, i) => {
          const pct = (d.count / max) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="absolute bottom-full mb-2 bg-[#1a1a2e] text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
              >
                {d.label}: {d.count}
              </div>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height:      `${Math.max(pct, d.count > 0 ? 4 : 0)}%`,
                  background:  color,
                  minHeight:   d.count > 0 ? '4px' : '0',
                  maxHeight:   '100%',
                }}
              />
              <span className="text-[9px] text-[#9ca3af] text-center leading-none">{d.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HorizBar({ label, count, total, color = '#4f46e5' }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#1a1a2e] capitalize">
          {label.replace(/_/g, ' ')}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-[#1a1a2e] tabular-nums">{count.toLocaleString()}</span>
          <span className="text-xs text-[#9ca3af] w-9 text-right tabular-nums">{pct}%</span>
        </div>
      </div>
      <div className="h-2 bg-[#f0f0ec] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

function SectionHeader({ title, sub }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-xl font-bold text-[#1a1a2e]">{title}</h2>
      {sub && <p className="text-sm text-[#9ca3af] mt-0.5">{sub}</p>}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="bg-white border border-[#e5e5e0] rounded-2xl p-10 text-center">
      <p className="text-sm text-[#9ca3af]">{message}</p>
    </div>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ active, onNav, open, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed top-0 left-0 bottom-0 z-50 w-[220px] bg-[#1a1a2e] flex flex-col transition-transform duration-200',
        'md:translate-x-0 md:static md:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-extrabold">
              <span className="text-white">Grade</span>
              <span className="text-[#f5a623]">Mee</span>
            </div>
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mt-0.5">
              Admin Panel
            </p>
          </div>
          <button onClick={onClose} className="md:hidden text-white/40 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => { onNav(id); onClose() }}
                className={cn(
                  'w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors relative',
                  isActive
                    ? 'text-white font-semibold bg-white/8'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#f5a623] rounded-r-full" />
                )}
                <Icon size={15} className="flex-shrink-0" />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Bottom links */}
        <div className="p-4 border-t border-white/5 flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <ChevronRight size={12} />
            Go to App
          </Link>
        </div>
      </aside>
    </>
  )
}

// ── Filter bar ─────────────────────────────────────────────────────────────
function FilterBar({ filter, setFilter, customStart, setCustomStart, customEnd, setCustomEnd, onApply }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white border border-[#e5e5e0] rounded-2xl p-1.5 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              filter === f.id
                ? 'bg-[#1a1a2e] text-white shadow-sm'
                : 'text-[#9ca3af] hover:text-[#1a1a2e] hover:bg-[#f7f7f5]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 bg-white border border-[#e5e5e0] rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-[#9ca3af] uppercase tracking-wide">From</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-2 bg-[#f7f7f5] border border-[#e5e5e0] rounded-xl text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-[#9ca3af] uppercase tracking-wide">To</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-2 bg-[#f7f7f5] border border-[#e5e5e0] rounded-xl text-sm outline-none focus:border-brand-500"
            />
          </div>
          <button
            onClick={onApply}
            disabled={!customStart || !customEnd}
            className="px-4 py-2 bg-[#1a1a2e] text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            Apply Range
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function SuperAdminClient({ adminEmail, adminName }) {
  const [section,     setSection]     = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filter,      setFilter]      = useState('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd,   setCustomEnd]   = useState('')

  const [totals,   setTotals]   = useState(null)
  const [period,   setPeriod]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [lastSync, setLastSync] = useState(null)
  const [error,    setError]    = useState('')

  const fetchData = useCallback(async (forceFilter) => {
    setLoading(true)
    setError('')
    const f = forceFilter ?? filter

    try {
      const [totalsRes, periodRes] = await Promise.all([
        fetch('/api/admin/stats', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ section: 'totals', adminEmail }),
        }),
        fetch('/api/admin/stats', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            section: 'period',
            filter:  f,
            customStart,
            customEnd,
            adminEmail,
          }),
        }),
      ])

      if (!totalsRes.ok || !periodRes.ok) {
        const err = await totalsRes.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load data')
      }

      const [t, p] = await Promise.all([totalsRes.json(), periodRes.json()])

      setTotals(t)
      setPeriod({
        ...p,
        trendData: buildChart(p.assessmentDates ?? [], f),
      })
      setLastSync(new Date())
    } catch (err) {
      console.error('Admin fetch error:', err)
      setError(err.message)
    }

    setLoading(false)
  }, [filter, customStart, customEnd, adminEmail])

  useEffect(() => { fetchData() }, [fetchData])

  const filterLabel = FILTERS.find((f) => f.id === filter)?.label ?? ''

  // ── Render section content ───────────────────────────────────────────────
  function renderContent() {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={22} className="animate-spin text-brand-400" />
            <p className="text-sm text-[#9ca3af]">Loading data…</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-red-600 mb-1">Failed to load data</p>
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={() => fetchData()}
            className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )
    }

    if (!period || !totals) return null

    const subjectTotal = Object.values(period.subjectMap ?? {}).reduce((a, b) => a + b, 0)
    const heardTotal   = Object.values(period.heardMap ?? {}).reduce((a, b) => a + b, 0)
    const teachTotal   = Object.values(period.teachMap ?? {}).reduce((a, b) => a + b, 0)
    const schoolTotal  = Object.values(period.schoolMap ?? {}).reduce((a, b) => a + b, 0)
    const yearsTotal   = Object.values(period.yearsMap ?? {}).reduce((a, b) => a + b, 0)

    if (section === 'overview') {
      return (
        <div className="flex flex-col gap-8">
          {/* All-time */}
          <div>
            <SectionHeader
              title="All-Time Totals"
              sub="Cumulative numbers since GradeMee launched — never resets"
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users}        label="Registered Tutors"   value={totals.tutors}      accent="#4f46e5" />
              <StatCard icon={ClipboardList} label="Assessments Created" value={totals.assessments} accent="#f5a623" />
              <StatCard icon={Activity}     label="Student Submissions"  value={totals.submissions}  accent="#2da44e" />
              <StatCard icon={BookOpen}     label="Questions Generated"  value={totals.questions}    accent="#8b5cf6" />
            </div>
            {/* Credits interest counter */}
            {totals.creditsInterest > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 text-sm text-brand-700">
                <span className="text-base">✨</span>
                <strong>{totals.creditsInterest}</strong> tutor{totals.creditsInterest !== 1 ? 's' : ''} interested in credits
              </div>
            )}

            {/* Use case profile breakdown */}
            {totals.useCaseCounts && Object.keys(totals.useCaseCounts).length > 0 && (
              <div className="mt-4 bg-white border border-border rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-3">
                  User Breakdown by Use Case
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { key: 'k12_tutor',  icon: '🎓', label: 'Teachers / Tutors'           },
                    { key: 'university', icon: '🏛️', label: 'University Lecturers'         },
                    { key: 'corporate',  icon: '🏢', label: 'Corporate / HR'               },
                    { key: 'religious',  icon: '✝️', label: 'Religious Education'          },
                    { key: 'vocational', icon: '🔧', label: 'Vocational Training'          },
                    { key: 'other',      icon: '➕', label: 'Other'                        },
                  ].map(({ key, icon, label }) => {
                    const count = totals.useCaseCounts[key] ?? 0
                    const pct   = totals.tutors > 0 ? Math.round((count / totals.tutors) * 100) : 0
                    if (count === 0) return null
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-base w-6 flex-shrink-0">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-medium text-ink">{label}</span>
                            <span className="text-sm font-bold text-ink">{count} <span className="text-ink-4 font-normal text-xs">({pct}%)</span></span>
                          </div>
                          <div className="h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Period */}
          <div>
            <SectionHeader
              title={`Period: ${filterLabel}`}
              sub="These numbers change based on the time filter above"
            />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard icon={Users}        label="New Tutors"         value={period.newTutors}      sub="Signed up in period"  accent="#4f46e5" />
              <StatCard icon={TrendingUp}   label="Active Tutors"      value={period.activeTutors}   sub="Created ≥1 assessment" accent="#f5a623" />
              <StatCard icon={ClipboardList} label="Assessments"       value={period.assessments}    sub="Created in period"    accent="#0ea5e9" />
              <StatCard icon={Activity}     label="Submissions"         value={period.submissions}    sub="Students submitted"   accent="#2da44e" />
              <StatCard icon={Users}        label="Unique Students"    value={period.uniqueStudents}  sub="Approx by name"       accent="#ec4899" />
              <StatCard icon={BookOpen}     label="Questions"          value={period.questions}       sub="Generated in period"  accent="#8b5cf6" />
            </div>
          </div>

          {/* Trend */}
          {period.trendData && (
            <BarChart
              data={period.trendData}
              title={`Assessment creation — ${filterLabel}`}
              color="#4f46e5"
            />
          )}
        </div>
      )
    }

    if (section === 'tutors') {
      return (
        <div className="flex flex-col gap-6">
          <SectionHeader title="Tutors" sub="Registration and activity data" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={Users}      label="Total Registered"  value={totals.tutors}       accent="#4f46e5" />
            <StatCard icon={Users}      label="New in Period"     value={period.newTutors}     accent="#0ea5e9" />
            <StatCard icon={TrendingUp} label="Active in Period"  value={period.activeTutors}  accent="#f5a623" />
          </div>
          {period.trendData && (
            <BarChart data={period.trendData} title="New assessments by period" color="#4f46e5" />
          )}
        </div>
      )
    }

    if (section === 'students') {
      return (
        <div className="flex flex-col gap-6">
          <SectionHeader title="Students & Submissions" sub="All student activity — no personal data stored" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={Activity} label="All-Time Submissions" value={totals.submissions}    accent="#2da44e" />
            <StatCard icon={Activity} label="Period Submissions"   value={period.submissions}    accent="#0ea5e9" />
            <StatCard icon={Users}    label="Unique Students"      value={period.uniqueStudents}  accent="#ec4899" sub="Approx by name" />
          </div>
        </div>
      )
    }

    if (section === 'assessments') {
      return (
        <div className="flex flex-col gap-6">
          <SectionHeader title="Assessments" sub="What subjects are being assessed and how often" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={ClipboardList} label="All Time"       value={totals.assessments}    accent="#f5a623" />
            <StatCard icon={ClipboardList} label="This Period"    value={period.assessments}    accent="#0ea5e9" />
            <StatCard icon={BookOpen}      label="Questions Made" value={period.questions}       accent="#8b5cf6" />
          </div>
          {period.trendData && (
            <BarChart data={period.trendData} title="Creation trend" color="#f5a623" />
          )}
          {subjectTotal > 0 ? (
            <div className="bg-white border border-[#e5e5e0] rounded-2xl p-6">
              <p className="text-sm font-bold text-[#1a1a2e] mb-5">
                Subjects being assessed
                <span className="text-xs font-normal text-[#9ca3af] ml-2">({subjectTotal} total)</span>
              </p>
              <div className="flex flex-col gap-3">
                {Object.entries(period.subjectMap)
                  .sort(([, a], [, b]) => b - a)
                  .map(([subject, count]) => (
                    <HorizBar key={subject} label={subject} count={count} total={subjectTotal} color="#f5a623" />
                  ))}
              </div>
            </div>
          ) : (
            <EmptyState message="No subject data for this period" />
          )}
        </div>
      )
    }

    if (section === 'onboarding') {
      return (
        <div className="flex flex-col gap-6">
          <SectionHeader
            title="Onboarding Data"
            sub={`${period.surveyCount} tutors completed the onboarding survey`}
          />

          {period.surveyCount === 0 ? (
            <EmptyState message="No onboarding survey responses yet. Tutors will fill this in after signing up." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* How they heard */}
              {heardTotal > 0 && (
                <div className="bg-white border border-[#e5e5e0] rounded-2xl p-6">
                  <p className="text-sm font-bold text-[#1a1a2e] mb-5">
                    How tutors found GradeMee
                    <span className="text-xs font-normal text-[#9ca3af] ml-2">({heardTotal} responses)</span>
                  </p>
                  <div className="flex flex-col gap-3">
                    {Object.entries(period.heardMap)
                      .sort(([, a], [, b]) => b - a)
                      .map(([key, count]) => (
                        <HorizBar key={key} label={key} count={count} total={heardTotal} color="#f5a623" />
                      ))}
                  </div>
                </div>
              )}

              {/* Teaching mode */}
              {teachTotal > 0 && (
                <div className="bg-white border border-[#e5e5e0] rounded-2xl p-6">
                  <p className="text-sm font-bold text-[#1a1a2e] mb-5">
                    How tutors teach
                    <span className="text-xs font-normal text-[#9ca3af] ml-2">({teachTotal} responses)</span>
                  </p>
                  <div className="flex flex-col gap-3">
                    {Object.entries(period.teachMap)
                      .sort(([, a], [, b]) => b - a)
                      .map(([key, count]) => (
                        <HorizBar key={key} label={key.replace(/_/g, ' ')} count={count} total={teachTotal} color="#4f46e5" />
                      ))}
                  </div>
                </div>
              )}

              {/* School type */}
              {schoolTotal > 0 && (
                <div className="bg-white border border-[#e5e5e0] rounded-2xl p-6">
                  <p className="text-sm font-bold text-[#1a1a2e] mb-5">
                    Teaching setting
                    <span className="text-xs font-normal text-[#9ca3af] ml-2">({schoolTotal} responses)</span>
                  </p>
                  <div className="flex flex-col gap-3">
                    {Object.entries(period.schoolMap)
                      .sort(([, a], [, b]) => b - a)
                      .map(([key, count]) => (
                        <HorizBar key={key} label={key} count={count} total={schoolTotal} color="#2da44e" />
                      ))}
                  </div>
                </div>
              )}

              {/* Years teaching */}
              {yearsTotal > 0 && (
                <div className="bg-white border border-[#e5e5e0] rounded-2xl p-6">
                  <p className="text-sm font-bold text-[#1a1a2e] mb-5">
                    Years of experience
                    <span className="text-xs font-normal text-[#9ca3af] ml-2">({yearsTotal} responses)</span>
                  </p>
                  <div className="flex flex-col gap-3">
                    {Object.entries(period.yearsMap)
                      .sort(([, a], [, b]) => b - a)
                      .map(([key, count]) => (
                        <HorizBar
                          key={key}
                          label={key.replace(/_/g, '–').replace('plus', '+')}
                          count={count}
                          total={yearsTotal}
                          color="#8b5cf6"
                        />
                      ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )
    }

    if (section === 'engagement') {
      return (
        <div className="flex flex-col gap-6">
          <SectionHeader title="Engagement" sub="How tutors are using GradeMee over time" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard icon={TrendingUp}    label="Active Tutors (Period)"  value={period.activeTutors}   accent="#f5a623" sub="Created ≥1 assessment" />
            <StatCard icon={ClipboardList} label="Assessments (Period)"    value={period.assessments}    accent="#4f46e5" />
            <StatCard icon={Activity}      label="Submissions (Period)"    value={period.submissions}    accent="#2da44e" />
            <StatCard icon={BookOpen}      label="Questions (Period)"      value={period.questions}       accent="#8b5cf6" />
          </div>
          {period.trendData && (
            <BarChart data={period.trendData} title="Activity trend" color="#4f46e5" />
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex">

      {/* Sidebar */}
      <Sidebar
        active={section}
        onNav={setSection}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="bg-white border-b border-[#e5e5e0] px-5 sm:px-8 h-14 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl bg-[#f7f7f5] border border-[#e5e5e0] flex items-center justify-center text-[#9ca3af]"
            >
              <Menu size={17} />
            </button>
            <div>
              <span className="text-sm font-bold text-[#1a1a2e]">
                {NAV.find((n) => n.id === section)?.label ?? 'Overview'}
              </span>
              {lastSync && (
                <span className="text-xs text-[#9ca3af] ml-2 hidden sm:inline">
                  · synced {lastSync.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#9ca3af] hover:text-[#1a1a2e] transition-colors"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
              <div className="w-6 h-6 rounded-full bg-[#4f46e5] flex items-center justify-center text-white text-[10px] font-bold">
                {adminName?.charAt(0)?.toUpperCase() ?? 'A'}
              </div>
              <span className="hidden sm:inline max-w-[140px] truncate">{adminName}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-8 py-8 flex flex-col gap-8 max-w-6xl mx-auto w-full">

          {/* Filter bar — shown on all sections */}
          <FilterBar
            filter={filter}
            setFilter={setFilter}
            customStart={customStart}
            setCustomStart={setCustomStart}
            customEnd={customEnd}
            setCustomEnd={setCustomEnd}
            onApply={() => fetchData(filter)}
          />

          {/* Section content */}
          {renderContent()}

          {/* Privacy */}
          <div className="text-xs text-[#9ca3af] leading-relaxed border-t border-[#e5e5e0] pt-6">
            <strong className="text-[#6b7280]">Privacy:</strong> Aggregate data only.
            No student personal data is collected or displayed.
            Compliant with GDPR data minimisation. Historical records are never deleted.
          </div>

        </div>
      </div>
    </div>
  )
}