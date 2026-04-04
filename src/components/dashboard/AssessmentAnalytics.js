'use client'

import { cn } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Users, BarChart2 } from 'lucide-react'

// ── Mini bar chart ────────────────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-ink w-8 text-right">{value}%</span>
    </div>
  )
}

// ── Score trend sparkline ─────────────────────────────────────────────────────
function ScoreTrend({ scores }) {
  if (!scores || scores.length < 2) return null

  const max  = 100
  const w    = 80
  const h    = 32
  const pts  = scores.map((s, i) => ({
    x: (i / (scores.length - 1)) * w,
    y: h - (s / max) * h,
  }))

  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const last  = scores[scores.length - 1]
  const prev  = scores[scores.length - 2]
  const up    = last >= prev

  return (
    <div className="flex items-center gap-2">
      <svg width={w} height={h} className="overflow-visible">
        <path d={d} fill="none" stroke={up ? '#2da44e' : '#e5534b'} strokeWidth="2" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill={up ? '#2da44e' : '#e5534b'} />
        ))}
      </svg>
      <span className={cn('text-xs font-semibold', up ? 'text-success' : 'text-danger')}>
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      </span>
    </div>
  )
}

// ── Student performance card ──────────────────────────────────────────────────
function StudentCard({ student, onClick }) {
  const variant =
    student.avgScore >= 75 ? 'green' :
    student.avgScore >= 50 ? 'amber' : 'red'

  const label =
    student.avgScore >= 75 ? 'Performing well' :
    student.avgScore >= 50 ? 'Needs practice' : 'Needs support'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-white border border-border rounded-2xl shadow-card hover:border-brand-300 hover:-translate-y-0.5 transition-all text-left"
    >
      <Avatar name={student.name} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink text-sm truncate">{student.name}</p>
        <p className="text-xs text-ink-4 mt-0.5">{student.submissions} assessment{student.submissions !== 1 ? 's' : ''} taken</p>
        <div className="mt-2">
          <MiniBar
            value={student.avgScore}
            max={100}
            color={student.avgScore >= 75 ? 'bg-success' : student.avgScore >= 50 ? 'bg-amber' : 'bg-danger'}
          />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <Badge variant={variant}>{student.avgScore}%</Badge>
        <p className="text-[10px] text-ink-4">{label}</p>
        <ScoreTrend scores={student.scoreHistory} />
      </div>
    </button>
  )
}

// ── Question difficulty row ───────────────────────────────────────────────────
function QuestionDifficultyRow({ question, index, correctCount, totalCount }) {
  const pct   = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
  const color = pct >= 75 ? 'bg-success' : pct >= 50 ? 'bg-amber' : 'bg-danger'
  const flag  = pct < 50

  return (
    <div className={cn(
      'flex items-start gap-3 py-3 border-b border-border last:border-none',
      flag && 'bg-danger-light/20'
    )}>
      <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink leading-relaxed line-clamp-2">{question.text}</p>
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-ink-4">
              {correctCount}/{totalCount} students correct
            </span>
            {flag && (
              <span className="flex items-center gap-1 text-[10px] text-danger font-semibold">
                <AlertTriangle size={10} /> Hard question
              </span>
            )}
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', color)}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <span className={cn(
          'text-sm font-bold',
          pct >= 75 ? 'text-success' : pct >= 50 ? 'text-amber' : 'text-danger'
        )}>
          {pct}%
        </span>
      </div>
    </div>
  )
}

// ── Score distribution chart ──────────────────────────────────────────────────
function ScoreDistributionChart({ submissions }) {
  const bands = [
    { label: '0–49%',    min: 0,  max: 49,  color: 'bg-danger'  },
    { label: '50–64%',   min: 50, max: 64,  color: 'bg-amber'   },
    { label: '65–74%',   min: 65, max: 74,  color: 'bg-amber/70' },
    { label: '75–89%',   min: 75, max: 89,  color: 'bg-success'  },
    { label: '90–100%',  min: 90, max: 100, color: 'bg-success'  },
  ]

  const counts = bands.map((b) => ({
    ...b,
    count: submissions.filter((s) => s.score >= b.min && s.score <= b.max).length,
  }))

  const maxCount = Math.max(...counts.map((c) => c.count), 1)

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
      <p className="font-display text-base font-bold text-ink mb-4">Score Distribution</p>
      <div className="flex items-end gap-2 h-32">
        {counts.map((band, i) => {
          const heightPct = (band.count / maxCount) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-semibold text-ink-3">{band.count}</span>
              <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                <div
                  className={cn('w-full rounded-t-lg transition-all duration-700', band.color)}
                  style={{ height: `${Math.max(heightPct, band.count > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="text-[9px] text-ink-4 text-center leading-tight">{band.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Student detail panel ──────────────────────────────────────────────────────
function StudentDetailPanel({ student, assessments, onBack }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Back */}
      <button
        onClick={onBack}
        className="self-start text-sm text-brand-500 font-semibold hover:text-brand-400 flex items-center gap-1"
      >
        ← Back to class overview
      </button>

      {/* Student header */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-card flex items-center gap-4">
        <Avatar name={student.name} size="xl" />
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold text-ink">{student.name}</h2>
          <p className="text-sm text-ink-4 mt-0.5">
            {student.submissions} assessment{student.submissions !== 1 ? 's' : ''} completed
          </p>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  student.avgScore >= 75 ? 'bg-success' : student.avgScore >= 50 ? 'bg-amber' : 'bg-danger'
                )}
                style={{ width: `${student.avgScore}%` }}
              />
            </div>
            <span className="font-bold text-ink">{student.avgScore}%</span>
          </div>
        </div>
      </div>

      {/* Strong vs weak topics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-success-light border border-success/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-success" />
            <p className="font-semibold text-success text-sm">Performing Well</p>
          </div>
          {student.strongTopics?.length > 0 ? (
            <div className="flex flex-col gap-2">
              {student.strongTopics.map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-success">{t.topic}</span>
                  <Badge variant="green">{t.score}%</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-success/70">No data yet</p>
          )}
        </div>

        <div className="bg-danger-light border border-danger/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-danger" />
            <p className="font-semibold text-danger text-sm">Needs Practice</p>
          </div>
          {student.weakTopics?.length > 0 ? (
            <div className="flex flex-col gap-2">
              {student.weakTopics.map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-danger">{t.topic}</span>
                  <Badge variant="red">{t.score}%</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-danger/70">No weak areas found yet</p>
          )}
        </div>
      </div>

      {/* Score trend */}
      {student.scoreHistory?.length > 1 && (
        <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
          <p className="font-display text-base font-bold text-ink mb-4">Score Trend</p>
          <div className="flex items-end gap-2 h-24">
            {student.scoreHistory.map((score, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-ink-3">{score}%</span>
                <div className="w-full flex flex-col justify-end" style={{ height: '60px' }}>
                  <div
                    className={cn(
                      'w-full rounded-t-lg transition-all duration-700',
                      score >= 75 ? 'bg-success' : score >= 50 ? 'bg-amber' : 'bg-danger'
                    )}
                    style={{ height: `${score}%` }}
                  />
                </div>
                <span className="text-[9px] text-ink-4">#{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-4 mt-2">Scores from oldest to most recent</p>
        </div>
      )}

      {/* Per-assessment breakdown */}
      {assessments?.length > 0 && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-border">
            <p className="font-display text-base font-bold text-ink">Assessment Breakdown</p>
          </div>
          {assessments.map((a, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-none">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{a.title}</p>
                <p className="text-xs text-ink-4 mt-0.5">{a.topic}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      a.score >= 75 ? 'bg-success' : a.score >= 50 ? 'bg-amber' : 'bg-danger'
                    )}
                    style={{ width: `${a.score}%` }}
                  />
                </div>
                <Badge variant={a.score >= 75 ? 'green' : a.score >= 50 ? 'amber' : 'red'}>
                  {a.score}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Analytics component ──────────────────────────────────────────────────
export default function AssessmentAnalytics({ data }) {
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [activeTab,       setActiveTab]       = useState('class') // 'class' | 'students'

  if (selectedStudent) {
    const studentAssessments = data.studentAssessmentMap?.[selectedStudent.name] ?? []
    return (
      <StudentDetailPanel
        student={selectedStudent}
        assessments={studentAssessments}
        onBack={() => setSelectedStudent(null)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Submissions', value: data.totalSubmissions, color: 'bg-brand-50 border-brand-200', text: 'text-brand-700' },
          { label: 'Class Average',     value: `${data.classAverage}%`, color: 'bg-success-light border-success/20', text: 'text-success' },
          { label: 'Completion Rate',   value: `${data.completionRate}%`, color: 'bg-amber-light border-amber/20', text: 'text-amber' },
          { label: 'Need Support',      value: data.needSupport, color: 'bg-danger-light border-danger/20', text: 'text-danger' },
        ].map((stat, i) => (
          <div key={i} className={cn('rounded-2xl p-5 border flex flex-col gap-1', stat.color)}>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-4">{stat.label}</p>
            <p className={cn('font-display text-3xl font-bold leading-none', stat.text)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-surface p-1 rounded-xl w-fit">
        {[
          { id: 'class',    label: '📊 Class Overview', icon: BarChart2 },
          { id: 'students', label: '👥 Students',        icon: Users     },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab.id
                ? 'bg-white text-brand-800 shadow-card'
                : 'text-ink-4 hover:text-ink-2'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Class Overview tab ── */}
      {activeTab === 'class' && (
        <div className="flex flex-col gap-6">

          {/* Score distribution */}
          <ScoreDistributionChart submissions={data.submissions ?? []} />

          {/* Subject performance */}
          {data.bySubject?.length > 0 && (
            <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
              <p className="font-display text-base font-bold text-ink mb-4">Performance by Subject</p>
              <div className="flex flex-col gap-3">
                {data.bySubject.map((s, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink capitalize">{s.subject}</span>
                      <span className={cn(
                        'text-sm font-bold',
                        s.avg >= 75 ? 'text-success' : s.avg >= 50 ? 'text-amber' : 'text-danger'
                      )}>
                        {s.avg}%
                      </span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          s.avg >= 75 ? 'bg-success' : s.avg >= 50 ? 'bg-amber' : 'bg-danger'
                        )}
                        style={{ width: `${s.avg}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question difficulty */}
          {data.questionDifficulty?.length > 0 && (
            <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <p className="font-display text-base font-bold text-ink">Question Difficulty</p>
                <p className="text-xs text-ink-4">% of students who got it right</p>
              </div>
              <div className="px-5">
                {data.questionDifficulty.map((q, i) => (
                  <QuestionDifficultyRow
                    key={i}
                    question={q}
                    index={i}
                    correctCount={q.correctCount}
                    totalCount={q.totalCount}
                  />
                ))}
              </div>
              {data.questionDifficulty.some((q) => (q.correctCount / q.totalCount) < 0.5) && (
                <div className="mx-5 mb-5 mt-2 bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger leading-relaxed">
                  <strong>⚠️ Teacher tip:</strong> Questions with low scores may need to be
                  reviewed or retaught before the next assessment.
                </div>
              )}
            </div>
          )}

          {/* Top and bottom students */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
              <p className="font-display text-base font-bold text-ink mb-4">🏆 Top Performers</p>
              <div className="flex flex-col gap-3">
                {data.topStudents?.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      i === 0 ? 'bg-amber text-ink' :
                      i === 1 ? 'bg-ink-4 text-white' : 'bg-border text-ink-3'
                    )}>
                      {i + 1}
                    </span>
                    <Avatar name={s.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{s.name}</p>
                    </div>
                    <Badge variant="green">{s.score}%</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
              <p className="font-display text-base font-bold text-ink mb-4">📚 Need Extra Support</p>
              <div className="flex flex-col gap-3">
                {data.bottomStudents?.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar name={s.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{s.name}</p>
                    </div>
                    <Badge variant="red">{s.score}%</Badge>
                  </div>
                ))}
                {(!data.bottomStudents || data.bottomStudents.length === 0) && (
                  <p className="text-sm text-ink-4">No students below 50% 🎉</p>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── Students tab ── */}
      {activeTab === 'students' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-3">
            Click on a student to see their detailed performance, score trend, and topic breakdown.
          </p>
          {data.students?.length === 0 && (
            <div className="bg-white border border-dashed border-border rounded-2xl p-10 text-center">
              <p className="text-3xl mb-3">👥</p>
              <p className="font-semibold text-ink">No students yet</p>
              <p className="text-sm text-ink-3 mt-1">Students appear here after completing assessments</p>
            </div>
          )}
          {data.students?.map((student, i) => (
            <StudentCard
              key={i}
              student={student}
              onClick={() => setSelectedStudent(student)}
            />
          ))}
        </div>
      )}

    </div>
  )
}