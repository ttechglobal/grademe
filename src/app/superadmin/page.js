import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

const ADMIN_EMAILS = [
  'irokagolden@gmail.com', // replace with your email
]

async function getAdminData(supabase) {
  const [
    { count: totalTutors },
    { data: assessments },
    { data: surveys },
    { data: recentAssessments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('assessments').select('id, created_at, teacher_id'),
    supabase.from('onboarding_surveys').select('teaching_mode, heard_from, school_type, years_teaching, country'),
    supabase.from('assessments').select('created_at').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  // Assessments per week for last 8 weeks
  const weeks = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000)
    const weekEnd   = new Date(Date.now() - (i - 1) * 7 * 24 * 60 * 60 * 1000)
    const label     = weekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
    const count     = (assessments ?? []).filter((a) => {
      const d = new Date(a.created_at)
      return d >= weekStart && d < weekEnd
    }).length
    weeks.push({ label, count })
  }

  // Survey breakdowns
  const surveyData = surveys ?? []
  const heardFrom  = {}
  const teachingMode = {}
  const schoolType = {}
  for (const s of surveyData) {
    if (s.heard_from)    heardFrom[s.heard_from]       = (heardFrom[s.heard_from] ?? 0)       + 1
    if (s.teaching_mode) teachingMode[s.teaching_mode] = (teachingMode[s.teaching_mode] ?? 0) + 1
    if (s.school_type)   schoolType[s.school_type]     = (schoolType[s.school_type] ?? 0)     + 1
  }

  const totalAssessments = assessments?.length ?? 0
  const thisWeek         = recentAssessments?.length ?? 0

  return {
    totalTutors:      totalTutors ?? 0,
    totalAssessments,
    thisWeek,
    avgPerTutor:      totalTutors ? (totalAssessments / totalTutors).toFixed(1) : 0,
    weeks,
    heardFrom,
    teachingMode,
    schoolType,
    surveyCount:      surveyData.length,
  }
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-4 mb-1">{label}</p>
      <p className="font-display text-4xl font-bold text-ink">{value}</p>
      {sub && <p className="text-sm text-ink-4 mt-1">{sub}</p>}
    </div>
  )
}

function BarChart({ data, label }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
      <p className="font-display text-base font-bold text-ink mb-6">{label}</p>
      <div className="flex items-end gap-2 h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold text-ink-4">{d.count}</span>
            <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
              <div
                className="w-full rounded-t-lg bg-brand-600 transition-all"
                style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 4 : 0)}%` }}
              />
            </div>
            <span className="text-[9px] text-ink-4 text-center">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Breakdown({ title, data }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  if (total === 0) return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
      <p className="font-display text-base font-bold text-ink mb-3">{title}</p>
      <p className="text-sm text-ink-4">No data yet</p>
    </div>
  )
  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
      <p className="font-display text-base font-bold text-ink mb-4">{title}</p>
      <div className="flex flex-col gap-3">
        {Object.entries(data)
          .sort(([, a], [, b]) => b - a)
          .map(([key, count]) => {
            const pct = Math.round((count / total) * 100)
            return (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-bold text-ink">{count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-brand-600 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Strict auth — only allowed emails
  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    redirect('/')
  }

  const data = await getAdminData(supabase)

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-brand-900 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-display text-xl font-bold">
            <span className="text-white">Grade</span>
            <span className="text-amber">Mee</span>
            <span className="text-white/40 text-sm font-normal ml-3">Super Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40">Signed in as {user.email}</span>
          <a href="/dashboard" className="text-xs text-amber hover:text-amber/80 font-semibold">
            → App Dashboard
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">

        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Platform Overview</h1>
          <p className="text-ink-3 text-sm mt-1">
            Developer-only view — not accessible to regular users
          </p>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Tutors"      value={data.totalTutors}      sub="Registered accounts" />
          <StatCard label="Total Assessments" value={data.totalAssessments} sub="All time" />
          <StatCard label="This Week"         value={data.thisWeek}         sub="New assessments" />
          <StatCard label="Avg per Tutor"     value={data.avgPerTutor}      sub="Assessments created" />
        </div>

        {/* Assessments over time */}
        <BarChart data={data.weeks} label="Assessment creation — last 8 weeks" />

        {/* Survey data */}
        <div>
          <h2 className="font-display text-xl font-bold text-ink mb-4">
            Onboarding Survey Responses
            <span className="text-base font-normal text-ink-4 ml-3">
              {data.surveyCount} of {data.totalTutors} tutors completed
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Breakdown title="How they heard about us"   data={data.heardFrom} />
            <Breakdown title="Teaching mode"             data={data.teachingMode} />
            <Breakdown title="School / setting type"     data={data.schoolType} />
          </div>
        </div>

        {/* Privacy notice */}
        <div className="bg-surface border border-border rounded-2xl p-5 text-sm text-ink-4 leading-relaxed">
          <strong className="text-ink">Privacy notice:</strong> This dashboard shows only aggregate and anonymised data.
          No student personal data is collected or displayed. Tutor location data is not collected.
          Survey responses are voluntary and stored without linking to personally identifiable information beyond user ID.
          All data collection complies with GDPR principles of data minimisation and purpose limitation.
        </div>

      </div>
    </div>
  )
}