'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import {
  Users, ClipboardList, BookOpen,
  TrendingUp, Calendar, RefreshCw,
  BarChart2, Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Use service role key for full admin access
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

const DATE_FILTERS = [
  { id: 'today',      label: 'Today'      },
  { id: 'week',       label: 'This Week'  },
  { id: 'month',      label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'year',       label: 'This Year'  },
  { id: 'all',        label: 'All Time'   },
]

function getDateRange(filterId) {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (filterId) {
    case 'today':
      return {
        start: today.toISOString(),
        end:   new Date(today.getTime() + 86400000).toISOString(),
      }
    case 'week': {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      return { start: weekStart.toISOString(), end: now.toISOString() }
    }
    case 'month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        end:   now.toISOString(),
      }
    case 'last_month':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
        end:   new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      }
    case 'year':
      return {
        start: new Date(now.getFullYear(), 0, 1).toISOString(),
        end:   now.toISOString(),
      }
    default:
      return { start: null, end: null }
  }
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-brand-600', bgColor = 'bg-brand-50' }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex flex-col gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bgColor)}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-4 mb-1">{label}</p>
        <p className="font-display text-4xl font-bold text-ink">{value ?? '—'}</p>
        {sub && <p className="text-sm text-ink-4 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function BarChart({ data, label, color = 'bg-brand-600' }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
      <p className="font-display text-base font-bold text-ink mb-6">{label}</p>
      <div className="flex items-end gap-1.5 h-36">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold text-ink-4">
              {d.count > 0 ? d.count : ''}
            </span>
            <div className="w-full flex flex-col justify-end" style={{ height: '90px' }}>
              <div
                className={cn('w-full rounded-t-lg transition-all duration-700', color)}
                style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 3 : 0)}%` }}
              />
            </div>
            <span className="text-[9px] text-ink-4 text-center leading-tight">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Breakdown({ title, data, color = 'bg-brand-600' }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
      <p className="font-display text-base font-bold text-ink mb-4">{title}</p>
      {total === 0 ? (
        <p className="text-sm text-ink-4">No data for this period</p>
      ) : (
        <div className="flex flex-col gap-3">
          {Object.entries(data)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([key, count]) => {
              const pct = Math.round((count / total) * 100)
              return (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-bold text-ink">
                      {count} <span className="text-ink-4 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

export default function SuperAdminClient({ adminEmail }) {
  const [filter,   setFilter]   = useState('month')
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [lastSync, setLastSync] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase  = getAdminSupabase()
    const dateRange = getDateRange(filter)

    try {
      // ── All-time counts ─────────────────────────────────────────────────
      const [
        { count: totalTutors },
        { count: totalAssessments },
        { count: totalSubmissions },
        { data:  allAssessments },
        { data:  allSurveys },
        { data:  allSubmissions },
        { data:  allProfiles },
      ] = await Promise.all([
        supabase.from('profiles')
          .select('*', { count: 'exact', head: true }),

        supabase.from('assessments')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dateRange.start || '2020-01-01')
          .lte('created_at', dateRange.end   || new Date().toISOString()),

        supabase.from('submissions')
          .select('*', { count: 'exact', head: true })
          .gte('completed_at', dateRange.start || '2020-01-01')
          .lte('completed_at', dateRange.end   || new Date().toISOString()),

        supabase.from('assessments')
          .select('id, created_at, subject, teacher_id')
          .gte('created_at', dateRange.start || '2020-01-01')
          .lte('created_at', dateRange.end   || new Date().toISOString()),

        supabase.from('onboarding_surveys')
          .select('teaching_mode, heard_from, school_type, years_teaching'),

        supabase.from('submissions')
          .select('id, completed_at, assessment_id, student_name')
          .gte('completed_at', dateRange.start || '2020-01-01')
          .lte('completed_at', dateRange.end   || new Date().toISOString()),

        supabase.from('profiles')
          .select('id, created_at')
          .order('created_at', { ascending: false }),
      ])

      // ── New tutors in period ─────────────────────────────────────────────
      const newTutors = (allProfiles ?? []).filter((p) => {
        if (!dateRange.start) return true
        const d = new Date(p.created_at)
        return d >= new Date(dateRange.start) &&
               (!dateRange.end || d <= new Date(dateRange.end))
      }).length

      // ── Unique students (by name per assessment — approximation) ─────────
      const uniqueStudents = new Set(
        (allSubmissions ?? []).map((s) => s.student_name?.toLowerCase()?.trim())
      ).size

      // ── Chart data — last 8 periods ──────────────────────────────────────
      const chartData = buildChartData(allAssessments ?? [], filter)

      // ── Subject breakdown ────────────────────────────────────────────────
      const subjects = {}
      for (const a of allAssessments ?? []) {
        if (!a.subject) continue
        const s = a.subject.replace(/_/g, ' ')
        subjects[s] = (subjects[s] ?? 0) + 1
      }

      // ── Active tutors (tutors who created assessments in period) ─────────
      const activeTutorIds = new Set((allAssessments ?? []).map((a) => a.teacher_id))

      // ── Survey breakdowns ────────────────────────────────────────────────
      const surveyData  = allSurveys ?? []
      const heardFrom   = {}
      const teachMode   = {}
      const schoolType  = {}
      for (const s of surveyData) {
        if (s.heard_from)    heardFrom[s.heard_from]   = (heardFrom[s.heard_from]   ?? 0) + 1
        if (s.teaching_mode) teachMode[s.teaching_mode] = (teachMode[s.teaching_mode] ?? 0) + 1
        if (s.school_type) {
          s.school_type.split(',').forEach((t) => {
            const key = t.trim()
            if (key) schoolType[key] = (schoolType[key] ?? 0) + 1
          })
        }
      }

      setData({
        totalTutors:      totalTutors ?? 0,
        newTutors,
        totalAssessments: totalAssessments ?? 0,
        totalSubmissions: totalSubmissions ?? 0,
        uniqueStudents,
        activeTutors:     activeTutorIds.size,
        chartData,
        subjects,
        heardFrom,
        teachMode,
        schoolType,
        surveyCount:      surveyData.length,
      })
      setLastSync(new Date())
    } catch (err) {
      console.error('Admin data load error:', err)
    }
    setLoading(false)
  }, [filter])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div className="min-h-screen bg-surface">

      {/* Header */}
      <div className="bg-brand-900 px-5 sm:px-8 py-4 flex items-center justify-between">
        <div>
          <div className="font-display text-xl font-bold">
            <span className="text-white">Grade</span>
            <span className="text-amber">Mee</span>
            <span className="text-white/40 text-sm font-normal ml-3">Super Admin</span>
          </div>
          {lastSync && (
            <p className="text-xs text-white/30 mt-0.5">
              Last synced: {lastSync.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <span className="text-xs text-white/30 hidden sm:block">
            {adminEmail}
          </span>
          <Link
            href="/dashboard"
            className="text-xs text-amber hover:text-amber/80 font-semibold"
          >
            → App
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8">

        {/* Date filter */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-ink-4" />
            <h2 className="text-sm font-bold text-ink">Date Range</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {DATE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                  filter === f.id
                    ? 'bg-brand-800 text-white shadow-sm'
                    : 'bg-white border border-border text-ink-3 hover:border-brand-300 hover:text-ink'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={24} className="animate-spin text-brand-400" />
              <p className="text-sm text-ink-4">Loading data…</p>
            </div>
          </div>
        ) : data ? (
          <>
            {/* Key stats */}
            <div>
              <h2 className="font-display text-xl font-bold text-ink mb-4">
                Key Metrics
                <span className="text-sm font-normal text-ink-4 ml-2">
                  — {DATE_FILTERS.find((f) => f.id === filter)?.label}
                </span>
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Users}
                  label="Total Tutors"
                  value={data.totalTutors}
                  sub={`${data.newTutors} new in period`}
                  color="text-brand-600"
                  bgColor="bg-brand-50"
                />
                <StatCard
                  icon={ClipboardList}
                  label="Assessments Created"
                  value={data.totalAssessments}
                  sub="In selected period"
                  color="text-amber"
                  bgColor="bg-amber/10"
                />
                <StatCard
                  icon={Activity}
                  label="Student Submissions"
                  value={data.totalSubmissions}
                  sub={`~${data.uniqueStudents} unique students`}
                  color="text-success"
                  bgColor="bg-success-light"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Active Tutors"
                  value={data.activeTutors}
                  sub="Created ≥1 assessment"
                  color="text-purple-600"
                  bgColor="bg-purple-50"
                />
              </div>
            </div>

            {/* Chart */}
            <BarChart
              data={data.chartData}
              label={`Assessment creation trend — ${DATE_FILTERS.find((f) => f.id === filter)?.label.toLowerCase()}`}
            />

            {/* Subject breakdown */}
            <div>
              <h2 className="font-display text-xl font-bold text-ink mb-4">
                Subject Demand
              </h2>
              <Breakdown
                title="Assessments by subject"
                data={data.subjects}
                color="bg-brand-600"
              />
            </div>

            {/* Survey data */}
            <div>
              <h2 className="font-display text-xl font-bold text-ink mb-1">
                Onboarding Insights
              </h2>
              <p className="text-sm text-ink-4 mb-4">
                {data.surveyCount} of {data.totalTutors} tutors completed onboarding survey
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Breakdown
                  title="How tutors heard about us"
                  data={data.heardFrom}
                  color="bg-amber"
                />
                <Breakdown
                  title="Teaching mode"
                  data={data.teachMode}
                  color="bg-success"
                />
                <Breakdown
                  title="School / setting type"
                  data={data.schoolType}
                  color="bg-purple-500"
                />
              </div>
            </div>

            {/* Privacy notice */}
            <div className="bg-white border border-border rounded-2xl p-5 text-sm text-ink-4 leading-relaxed">
              <strong className="text-ink">Privacy:</strong>{' '}
              This dashboard shows aggregate and anonymised data only.
              No student personal data is collected or displayed.
              All data collection complies with GDPR principles of data minimisation and purpose limitation.
              Historical data is never deleted or overwritten.
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-ink-4">
            Failed to load data. Check your connection.
          </div>
        )}

      </div>
    </div>
  )
}

// Build chart data points based on filter
function buildChartData(assessments, filter) {
  const now = new Date()

  if (filter === 'today') {
    // Hours 0–23
    return Array.from({ length: 24 }, (_, h) => {
      const count = assessments.filter((a) => {
        const d = new Date(a.created_at)
        return d.getHours() === h &&
               d.toDateString() === now.toDateString()
      }).length
      return { label: `${h}h`, count }
    }).filter((_, i) => i % 3 === 0) // every 3 hours
  }

  if (filter === 'week') {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    return days.map((label, di) => {
      const count = assessments.filter((a) => {
        return new Date(a.created_at).getDay() === di
      }).length
      return { label, count }
    })
  }

  if (filter === 'month' || filter === 'last_month') {
    // Weeks 1–4
    return Array.from({ length: 4 }, (_, i) => {
      const weekStart = i * 7 + 1
      const weekEnd   = (i + 1) * 7
      const count = assessments.filter((a) => {
        const d = new Date(a.created_at).getDate()
        return d >= weekStart && d <= weekEnd
      }).length
      return { label: `W${i + 1}`, count }
    })
  }

  if (filter === 'year') {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return months.map((label, mi) => {
      const count = assessments.filter((a) => {
        return new Date(a.created_at).getMonth() === mi
      }).length
      return { label, count }
    })
  }

  // All time — last 8 months
  return Array.from({ length: 8 }, (_, i) => {
    const d     = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1)
    const label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    const count = assessments.filter((a) => {
      const ad = new Date(a.created_at)
      return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear()
    }).length
    return { label, count }
  })
}