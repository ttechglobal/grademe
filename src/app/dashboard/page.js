'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Plus, ExternalLink, Users, BarChart3, Link2,
  ClipboardList, ChevronRight, ArrowUpRight,
  ArrowDownRight, Clock, X, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FLAGS } from '@/lib/featureFlags'

// ── Design tokens (match GradeMee brand) ──────────────────────────────────
// bg-[#F8FAFC] page bg, white cards, brand navy #1a1a2e, amber #f5a623

// ── Helpers ────────────────────────────────────────────────────────────────
function greeting(name) {
  const h = new Date().getHours()
  const salutation = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return `${salutation}${name ? `, ${name}` : ''}!`
}

function relTime(dateStr) {
  if (!dateStr) return ''
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

function scoreColor(score) {
  if (score === null || score === undefined) return { bg: 'bg-surface', text: 'text-ink-4' }
  if (score >= 70) return { bg: 'bg-success-light', text: 'text-success' }
  if (score >= 50) return { bg: 'bg-amber-light',   text: 'text-amber'   }
  return            { bg: 'bg-danger-light',         text: 'text-danger'  }
}

function subjectColor(subject = '') {
  const s = subject.toLowerCase()
  if (s.includes('math'))    return 'bg-brand-50 text-brand-700'
  if (s.includes('english')) return 'bg-brand-100 text-brand-600'
  if (s.includes('phys'))    return 'bg-brand-50 text-brand-700'
  if (s.includes('chem'))    return 'bg-brand-100 text-brand-600'
  if (s.includes('bio'))     return 'bg-success-light text-success'
  if (s.includes('hist'))    return 'bg-amber-light text-amber'
  if (s.includes('gov'))     return 'bg-surface text-ink-3'
  if (s.includes('econ'))    return 'bg-amber-light text-amber'
  return 'bg-brand-50 text-brand-700'
}

// ── Skeleton pieces ────────────────────────────────────────────────────────
function Pulse({ className }) {
  return <div className={cn('animate-pulse bg-[#E9EEF5] rounded-lg', className)} />
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col gap-4">
      <Pulse className="w-10 h-10 rounded-xl" />
      <div className="flex flex-col gap-2">
        <Pulse className="h-8 w-16" />
        <Pulse className="h-3.5 w-28" />
      </div>
    </div>
  )
}

function AssessmentRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-[#F0F4F8] last:border-0">
      <Pulse className="w-1.5 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Pulse className="h-4 w-2/5" />
        <Pulse className="h-3 w-1/4" />
      </div>
      <Pulse className="h-6 w-16 rounded-full" />
      <Pulse className="h-6 w-20 rounded-lg" />
    </div>
  )
}

function SubmissionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-3.5 border-b border-[#F0F4F8] last:border-0">
      <Pulse className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <Pulse className="h-3.5 w-28" />
        <Pulse className="h-3 w-20" />
      </div>
      <Pulse className="h-6 w-12 rounded-full" />
      <Pulse className="h-3 w-16" />
    </div>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, iconBg, iconColor = 'text-brand-600', value, label, trend }) {
  // Only show trend when it's genuinely non-zero — never show "No change"
  const hasTrend = trend !== undefined && trend !== 0 && trend !== null

  const trendEl = hasTrend ? (
    <div className="flex items-center gap-1 mt-1">
      {trend > 0
        ? <ArrowUpRight   size={12} className="text-success" />
        : <ArrowDownRight size={12} className="text-danger"  />}
      <span className="text-[11px] text-ink-4 font-medium">
        {trend > 0 ? `+${trend}` : trend} this week
      </span>
    </div>
  ) : null

  return (
    <div className="
      bg-white rounded-2xl p-5 sm:p-6
      shadow-[0_1px_3px_rgba(0,0,0,0.08)]
      hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]
      hover:-translate-y-0.5
      transition-all duration-200 ease-out
      flex flex-col gap-3
    ">
      {/* Icon */}
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
        iconBg
      )}>
        <Icon size={19} className={iconColor} />
      </div>

      {/* Value + label */}
      <div>
        <p className="font-display text-[2rem] font-bold text-[#1a1a2e] leading-none tracking-tight">
          {value}
        </p>
        <p className="text-[13px] text-[#6B7280] font-medium mt-1.5">{label}</p>
      </div>

      {/* Trend — only shown for real non-zero changes */}
      {trendEl}
    </div>
  )
}



// ── Subject + grade pill ───────────────────────────────────────────────────
function SubjectPill({ subject, classLevel }) {
  const parts = [
    subject?.replace(/_/g, ' '),
    classLevel?.replace(/_/g, ' ')?.toUpperCase(),
  ].filter(Boolean)
  if (!parts.length) return null
  return (
    <span className={cn(
      'text-[11px] font-semibold px-2 py-0.5 rounded-full',
      subjectColor(subject)
    )}>
      {parts.join(' · ')}
    </span>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────
// ── Credits teaser banner ──────────────────────────────────────────────────
const BANNER_DISMISSED_KEY = 'grademee_credits_banner_dismissed'

function CreditsBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY)
      setVisible(!dismissed)
    } catch { setVisible(true) }
  }, [])

  const dismiss = () => {
    try { localStorage.setItem(BANNER_DISMISSED_KEY, '1') } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-2xl px-5 py-3.5">
      <span className="text-base flex-shrink-0">✨</span>
      <p className="text-sm text-brand-700 flex-1 leading-relaxed">
        <strong>In-app AI generation with credits is coming soon.</strong>{' '}
        Generate questions instantly — no copy-pasting needed.
      </p>
      <Link
        href="/dashboard/credits"
        className="text-xs font-bold text-brand-600 hover:text-brand-500 whitespace-nowrap flex-shrink-0 underline underline-offset-2"
      >
        Learn more
      </Link>
      <button
        onClick={dismiss}
        className="text-brand-400 hover:text-brand-600 flex-shrink-0 transition-colors"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  )
}

export default function DashboardPage() {
  const [firstName,   setFirstName]   = useState('')
  const [stats,       setStats]       = useState(null)
  const [assessments, setAssessments] = useState(null)
  const [submissions, setSubmissions] = useState(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const uid = session.user.id

      const [profileRes, assessmentsRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', uid).single(),
        supabase
          .from('assessments')
          .select('id, title, subject, class_level, is_active, created_at')
          .eq('teacher_id', uid)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      setFirstName(profileRes.data?.full_name?.split(' ')[0] ?? 'Teacher')

      const allAssessments = assessmentsRes.data ?? []
      const assessmentIds  = allAssessments.map((a) => a.id)
      setAssessments(allAssessments)

      if (assessmentIds.length === 0) {
        setStats({ assessments: 0, students: 0, avgScore: null, totalSubmissions: 0 })
        setSubmissions([])
        setLoading(false)
        return
      }

      const [countRes, scoresRes, studentsRes, recentSubsRes] = await Promise.all([
        supabase
          .from('submissions')
          .select('id', { count: 'exact', head: true })
          .in('assessment_id', assessmentIds),
        supabase
          .from('submissions')
          .select('score')
          .in('assessment_id', assessmentIds)
          .not('score', 'is', null),
        supabase
          .from('submissions')
          .select('student_name')
          .in('assessment_id', assessmentIds),
        supabase
          .from('submissions')
          .select('id, student_name, score, completed_at, assessment_id')
          .in('assessment_id', assessmentIds)
          .order('completed_at', { ascending: false })
          .limit(5),
      ])

      const scores         = (scoresRes.data ?? []).map((s) => s.score)
      const avgScore       = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null
      const uniqueStudents = new Set(
        (studentsRes.data ?? []).map((s) => s.student_name?.toLowerCase().trim()).filter(Boolean)
      ).size

      setStats({
        assessments:      allAssessments.length,
        students:         uniqueStudents,
        totalSubmissions: countRes.count ?? 0,
        avgScore,
      })
      setSubmissions(recentSubsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // ── Derived subtitle ───────────────────────────────────────────────────
  const subtitle = useMemo(() => {
    if (loading || !stats) return 'Loading your dashboard…'
    const dayAgo = Date.now() - 86400000
    const recentCount = (submissions ?? []).filter(
      (s) => new Date(s.completed_at).getTime() > dayAgo
    ).length
    if (recentCount > 0)
      return `${recentCount} student${recentCount !== 1 ? 's' : ''} submitted in the last 24 hours.`
    const noSubs = (assessments ?? []).filter((a) => a.is_active).length
    if (noSubs > 0 && stats.totalSubmissions === 0)
      return `You have ${noSubs} active assessment${noSubs !== 1 ? 's' : ''} with no submissions yet.`
    if (stats.assessments === 0)
      return "Welcome! Ready to create your first assessment?"
    return "Here's what's happening with your students."
  }, [loading, stats, submissions, assessments])

  const hasAssessments = (assessments?.length ?? 0) > 0
  const hasSubs        = (submissions?.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">

      {/* Credits teaser banner — dismissible, shows once */}
      {FLAGS.CREDITS_COMING_SOON_UI && <CreditsBanner />}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 — WELCOME HEADER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 px-7 py-8 sm:px-10 sm:py-9 flex items-center justify-between gap-6">

        {/* Decorative background circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/[0.06] pointer-events-none" />
        <div className="absolute -bottom-14 right-16 w-36 h-36 rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute top-4 right-48 w-20 h-20 rounded-full bg-amber/[0.08] pointer-events-none" />

        {/* Content */}
        <div className="relative flex-1 min-w-0">
          {loading ? (
            <div className="flex flex-col gap-3">
              <Pulse className="h-8 w-64 bg-white/20" />
              <Pulse className="h-4 w-80 bg-white/10" />
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-snug">
                {greeting(firstName)}
              </h1>
              <p className="text-[15px] text-white/65 mt-1.5 leading-relaxed max-w-xl">
                {subtitle}
              </p>
            </>
          )}

          {!loading && (
            <Link
              href="/dashboard/assessments/new"
              className="mt-5 inline-flex items-center gap-2 bg-white text-brand-800 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors shadow-sm"
            >
              <Plus size={15} strokeWidth={2.5} />
              Create Assessment
            </Link>
          )}
        </div>

        {/* Right decorative element — desktop only */}
        <div className="hidden md:flex relative flex-shrink-0 w-16 h-16 rounded-2xl bg-white/10 items-center justify-center">
          <BookOpen size={28} className="text-white/60" />
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 — STAT CARDS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading || !stats ? (
          [1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              icon={ClipboardList}
              iconBg="bg-brand-50"
              iconColor="text-brand-600"
              value={stats.assessments}
              label="Total Assessments"
              trend={0}
            />
            <StatCard
              icon={Users}
              iconBg="bg-brand-50"
              iconColor="text-brand-600"
              value={stats.students}
              label="Total Students"
              trend={0}
            />
            <StatCard
              icon={BarChart3}
              iconBg={
                stats.avgScore === null ? 'bg-surface' :
                stats.avgScore >= 70   ? 'bg-success-light' :
                stats.avgScore >= 50   ? 'bg-amber-light' :
                                          'bg-danger-light'
              }
              iconColor={
                stats.avgScore === null ? 'text-ink-4' :
                stats.avgScore >= 70   ? 'text-success' :
                stats.avgScore >= 50   ? 'text-amber' :
                                          'text-danger'
              }
              value={stats.avgScore !== null ? `${stats.avgScore}%` : '—'}
              label="Class Average"
            />
            <StatCard
              icon={Link2}
              iconBg="bg-success-light"
              iconColor="text-success"
              value={stats.totalSubmissions}
              label="Assessments Sent"
              trend={0}
            />
          </>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4 — RECENT ASSESSMENTS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-[#1a1a2e]">Recent Assessments</h2>
          <Link
            href="/dashboard/assessments"
            className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-[#2a3f7e] transition-colors"
          >
            View all <ChevronRight size={15} />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
          {loading ? (
            [1, 2, 3].map((i) => <AssessmentRowSkeleton key={i} />)
          ) : !hasAssessments ? (
            /* Empty state */
            <div className="flex flex-col items-center gap-4 py-16 px-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
                <ClipboardList size={28} className="text-brand-400" />
              </div>
              <div>
                <p className="font-display font-bold text-[#1a1a2e] text-lg mb-1">
                  No assessments yet
                </p>
                <p className="text-sm text-[#6B7280] leading-relaxed max-w-xs">
                  Create your first assessment and share the link with your students.
                </p>
              </div>
              <Link
                href="/dashboard/assessments/new"
                className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#16213e] transition-colors"
              >
                <Plus size={15} /> Create Assessment
              </Link>
            </div>
          ) : (
            assessments.map((a, idx) => (
              <Link
                key={a.id}
                href={`/dashboard/assessments/${a.id}`}
                className="
                  flex items-center gap-4 px-6 py-4 min-h-[64px]
                  border-b border-[#F0F4F8] last:border-0
                  hover:bg-[#F8FAFC] transition-colors group
                "
              >
                {/* Status bar */}
                <div className={cn(
                  'w-1.5 h-10 rounded-full flex-shrink-0 transition-colors',
                  a.is_active ? 'bg-[#2da44e]' : 'bg-[#E5E5E0]'
                )} />

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a2e] truncate group-hover:text-brand-700 transition-colors">
                    {a.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <SubjectPill subject={a.subject} classLevel={a.class_level} />
                    <span className="text-[11px] text-[#9CA3AF]">
                      {relTime(a.created_at)}
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <span className={cn(
                  'text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex-shrink-0 hidden sm:inline',
                  a.is_active
                    ? 'bg-[#e6f4eb] text-[#2da44e]'
                    : 'bg-[#F0F4F8] text-[#9CA3AF]'
                )}>
                  {a.is_active ? 'Active' : 'Inactive'}
                </span>

                <ChevronRight size={14} className="text-[#D1D5DB] group-hover:text-brand-700 flex-shrink-0 transition-colors" />
              </Link>
            ))
          )}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 5 — RECENT STUDENT ACTIVITY
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {(loading || hasSubs) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-[#1a1a2e]">Recent Submissions</h2>
            <Link
              href="/dashboard/students"
              className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-[#2a3f7e] transition-colors"
            >
              View students <ChevronRight size={15} />
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
            {loading ? (
              [1, 2, 3, 4].map((i) => <SubmissionRowSkeleton key={i} />)
            ) : (
              submissions.map((s) => {
                const { bg, text } = scoreColor(s.score)
                const initials = (s.student_name ?? '?')
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()

                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-4 px-6 py-3.5 border-b border-[#F0F4F8] last:border-0"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-[12px] font-bold text-brand-700">{initials}</span>
                    </div>

                    {/* Name + assessment */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a1a2e] truncate">{s.student_name}</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {relTime(s.completed_at)}
                      </p>
                    </div>

                    {/* Score */}
                    {s.score !== null && (
                      <span className={cn(
                        'text-xs font-bold px-2.5 py-1 rounded-full tabular-nums flex-shrink-0',
                        bg, text
                      )}>
                        {s.score}%
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

    </div>
  )
}