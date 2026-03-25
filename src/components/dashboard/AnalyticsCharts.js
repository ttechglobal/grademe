'use client'

import { cn } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

// Simple bar chart built with pure CSS/divs — no external chart lib needed
function BarChart({ data, title }) {
  const max = Math.max(...data.map((d) => d.value))

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
      <p className="font-display text-base font-bold text-ink mb-6">{title}</p>
      <div className="flex items-end gap-3 h-40">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-ink-3">
              {item.value}%
            </span>
            <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
              <div
                className={cn(
                  'w-full rounded-t-lg transition-all duration-700',
                  item.value >= 75 ? 'bg-brand-400' :
                  item.value >= 50 ? 'bg-amber'     : 'bg-danger'
                )}
                style={{ height: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-ink-4 text-center leading-tight">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Horizontal difficulty bar per question
function DifficultyBar({ label, pct, count }) {
  const color =
    pct >= 75 ? 'bg-success' :
    pct >= 50 ? 'bg-amber'   : 'bg-danger'

  const variant =
    pct >= 75 ? 'green' :
    pct >= 50 ? 'amber' : 'red'

  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-border last:border-none">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink font-medium truncate max-w-xs">{label}</p>
        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <span className="text-xs text-ink-4">{count} answered</span>
          <Badge variant={variant}>{pct}%</Badge>
        </div>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// Stat summary card
function SummaryCard({ label, value, sub, color }) {
  return (
    <div className={cn(
      'rounded-2xl p-5 flex flex-col gap-1 border',
      color === 'brand' && 'bg-brand-50 border-brand-200',
      color === 'amber' && 'bg-amber-light border-amber/30',
      color === 'green' && 'bg-success-light border-success/30',
      color === 'red'   && 'bg-danger-light border-danger/30',
    )}>
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-4">{label}</p>
      <p className={cn(
        'font-display text-3xl font-bold leading-none',
        color === 'brand' && 'text-brand-700',
        color === 'amber' && 'text-amber',
        color === 'green' && 'text-success',
        color === 'red'   && 'text-danger',
      )}>
        {value}
      </p>
      {sub && <p className="text-xs text-ink-4 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AnalyticsCharts({ data }) {
  return (
    <div className="flex flex-col gap-6">

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Submissions"
          value={data.totalSubmissions}
          sub="Across all assessments"
          color="brand"
        />
        <SummaryCard
          label="Class Average"
          value={`${data.classAverage}%`}
          sub="All assessments"
          color="green"
        />
        <SummaryCard
          label="Completion Rate"
          value={`${data.completionRate}%`}
          sub="Students who finished"
          color="amber"
        />
        <SummaryCard
          label="Need Support"
          value={data.needSupport}
          sub="Scored below 50%"
          color="red"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Average Score by Subject"
          data={data.bySubject}
        />
        <BarChart
          title="Score Distribution"
          data={data.scoreDistribution}
        />
      </div>

      {/* Question difficulty breakdown */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <p className="font-display text-base font-bold text-ink">
            Question Difficulty — Quadratic Equations
          </p>
          <select className="text-xs border border-border rounded-lg px-3 py-1.5 outline-none bg-surface text-ink-3">
            <option>Quadratic Equations</option>
            <option>Photosynthesis</option>
            <option>Comprehension Skills</option>
          </select>
        </div>
        <p className="text-xs text-ink-4 mb-4">
          % of students who answered each question correctly
        </p>
        {data.questionDifficulty.map((q, i) => (
          <DifficultyBar
            key={i}
            label={`Q${i + 1}: ${q.label}`}
            pct={q.pct}
            count={q.count}
          />
        ))}
        {/* Insight callout */}
        <div className="mt-4 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger leading-relaxed">
          ⚠️ <strong>Q3 was the hardest</strong> — only{' '}
          {data.questionDifficulty[2]?.pct}% got it right.
          Consider revisiting this topic in your next class.
        </div>
      </div>

      {/* Top & bottom students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top performers */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
          <p className="font-display text-base font-bold text-ink mb-4">
            🏆 Top Performers
          </p>
          <div className="flex flex-col gap-3">
            {data.topStudents.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  i === 0 ? 'bg-amber text-ink' :
                  i === 1 ? 'bg-ink-4 text-white' :
                            'bg-border text-ink-3'
                )}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{s.name}</p>
                  <p className="text-xs text-ink-4">{s.class}</p>
                </div>
                <Badge variant="green">{s.score}%</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Need support */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
          <p className="font-display text-base font-bold text-ink mb-4">
            📚 Need Support
          </p>
          <div className="flex flex-col gap-3">
            {data.bottomStudents.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{s.name}</p>
                  <p className="text-xs text-ink-4">{s.class}</p>
                </div>
                <Badge variant="red">{s.score}%</Badge>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}