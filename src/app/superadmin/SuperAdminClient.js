'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Users, ClipboardList, BookOpen,
  BarChart2, Activity, RefreshCw, Menu, X,
  TrendingUp, TrendingDown, Zap, ChevronRight,
  Search, ChevronDown, ChevronUp, ArrowUpDown,
  Sparkles, AlertTriangle, CheckCircle2, Clock,
  Target, Eye, Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Design tokens (matching GradeMee brand) ──────────────────────────────────
const C = {
  ink:     '#0d1b1b',
  ink3:    '#4a6060',
  ink4:    '#7a9898',
  surface: '#f2f8f8',
  border:  '#d8ecec',
  brand:   '#217070',
  brand8:  '#0f2e2e',
  brand9:  '#0a1f1f',
  amber:   '#f5a623',
  success: '#2da44e',
  danger:  '#e5534b',
  teal2:   '#1a8f8f',
}

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV = [
  { id: 'overview',  label: 'Overview',   icon: LayoutDashboard },
  { id: 'tutors',    label: 'Tutors',     icon: Users           },
  { id: 'usage',     label: 'AI Usage',   icon: Sparkles        },
  { id: 'assessments', label: 'Assessments', icon: ClipboardList },
  { id: 'engagement', label: 'Engagement', icon: BarChart2      },
]

const FILTERS = [
  { id: 'today',      label: 'Today'      },
  { id: 'week',       label: 'This Week'  },
  { id: 'month',      label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'year',       label: 'This Year'  },
  { id: 'all',        label: 'All Time'   },
]

// ─── Segment config ───────────────────────────────────────────────────────────
const SEGMENTS = {
  power:       { label: 'Power User',   color: C.amber,   bg: '#fff8ee', icon: '⚡' },
  active:      { label: 'Active',       color: C.success, bg: '#e8f9ed', icon: '✅' },
  tried:       { label: 'Tried AI',     color: C.brand,   bg: '#e8f4f4', icon: '🔬' },
  manual_only: { label: 'Manual Only',  color: C.ink3,    bg: '#f2f8f8', icon: '✏️' },
  inactive:    { label: 'Inactive',     color: C.danger,  bg: '#fef0ef', icon: '💤' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relTime(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30)  return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function num(n) {
  if (n === null || n === undefined) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function pct(n, total) {
  if (!total) return 0
  return Math.round((n / total) * 100)
}

// ─── Reusable UI components ───────────────────────────────────────────────────

function KPICard({ label, value, sub, delta, accent = C.brand, icon: Icon }) {
  return (
    <div style={{
      background: 'white',
      border:     `1px solid ${C.border}`,
      borderRadius: 16,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Accent strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: accent, borderRadius: '16px 16px 0 0',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.ink4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        {Icon && (
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={15} color={accent} />
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 32, fontWeight: 800, color: C.ink, lineHeight: 1, fontFamily: 'Nunito, sans-serif' }}>
          {value ?? '—'}
        </div>
        {(sub || delta !== undefined) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            {sub && <span style={{ fontSize: 12, color: C.ink4 }}>{sub}</span>}
            {delta !== undefined && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                color:   delta >= 0 ? C.success : C.danger,
                display: 'flex', alignItems: 'center', gap: 2,
              }}>
                {delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {Math.abs(delta)}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function HorizBar({ label, count, total, color = C.brand }) {
  const p = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: C.ink, fontWeight: 500, textTransform: 'capitalize' }}>
          {String(label).replace(/_/g, ' ')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{count.toLocaleString()}</span>
          <span style={{ fontSize: 11, color: C.ink4, width: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p}%</span>
        </div>
      </div>
      <div style={{ height: 6, background: C.surface, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

function InsightChip({ icon, text, color = C.brand }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', borderRadius: 10,
      background: color + '15', border: `1px solid ${color}30`,
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 13, color, fontWeight: 600 }}>{text}</span>
    </div>
  )
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: 0, fontFamily: 'Nunito, sans-serif' }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: C.ink4, marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'white', border: `1px solid ${C.border}`,
      borderRadius: 16, padding: 24, ...style,
    }}>
      {children}
    </div>
  )
}

function SegmentBadge({ segment }) {
  const s = SEGMENTS[segment] ?? SEGMENTS.inactive
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 99,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      {s.icon} {s.label}
    </span>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ active, onNav, open, onClose }) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)' }}
          className="md:hidden"
        />
      )}
      <aside style={{
        width: 220, background: C.brand9, display: 'flex', flexDirection: 'column',
        flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
      }} className={cn('hidden md:flex')}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: 20, fontWeight: 800 }}>
            <span style={{ color: 'white' }}>Grade</span>
            <span style={{ color: C.amber }}>Mee</span>
          </div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2, fontWeight: 700 }}>
            Admin Console
          </p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {NAV.map(({ id, label, icon: Icon }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => onNav(id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 20px', fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'white' : 'rgba(255,255,255,0.4)',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s', position: 'relative',
                  borderLeft: isActive ? `3px solid ${C.amber}` : '3px solid transparent',
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
            <ChevronRight size={12} /> Back to App
          </Link>
        </div>
      </aside>
    </>
  )
}

// ─── Overview section ─────────────────────────────────────────────────────────

function OverviewSection({ totals, period, tutors, filterLabel }) {
  if (!totals || !period) return null

  const aiUsers     = (tutors ?? []).filter((t) => t.usesAI).length
  const powerUsers  = (tutors ?? []).filter((t) => t.segment === 'power').length
  const neverUsedAI = (tutors ?? []).filter((t) => t.segment === 'inactive' || t.segment === 'manual_only').length
  const aiAdoption  = totals.tutors > 0 ? pct(aiUsers, totals.tutors) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <SectionHeader
        title="Platform Overview"
        sub="All-time health metrics — never resets"
      />

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <KPICard icon={Users}        label="Total Tutors"       value={num(totals.tutors)}       accent={C.brand}   sub="All-time registered" />
        <KPICard icon={ClipboardList} label="Assessments"       value={num(totals.assessments)}  accent="#4f46e5"   sub="All-time created" />
        <KPICard icon={Activity}     label="Student Submissions" value={num(totals.submissions)}  accent={C.success} sub="All-time" />
        <KPICard icon={BookOpen}     label="Questions Generated" value={num(totals.questions)}    accent="#8b5cf6"   sub="All-time" />
        <KPICard icon={Sparkles}     label="AI Adoption"        value={`${aiAdoption}%`}          accent={C.amber}   sub={`${aiUsers} of ${totals.tutors} tutors`} />
        <KPICard icon={Zap}          label="Power Users"        value={num(powerUsers)}            accent={C.amber}   sub="≥10 AI sessions" />
      </div>

      {/* Period stats */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: 0 }}>Activity — {filterLabel}</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 24 }}>
          {[
            { label: 'New tutors',    value: period.newTutors,     color: C.brand   },
            { label: 'Active tutors', value: period.activeTutors,  color: C.amber   },
            { label: 'Assessments',   value: period.assessments,   color: '#4f46e5' },
            { label: 'Submissions',   value: period.submissions,   color: C.success },
            { label: 'Questions',     value: period.questions,     color: '#8b5cf6' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'Nunito, sans-serif' }}>
                {num(s.value)}
              </div>
              <div style={{ fontSize: 12, color: C.ink4, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Insights row */}
      <Card style={{ background: C.brand9, border: 'none' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          Quick Insights
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {aiAdoption >= 50 && <InsightChip icon="🚀" text={`${aiAdoption}% AI adoption — strong`} color={C.amber} />}
          {aiAdoption < 30 && <InsightChip icon="⚠️" text={`Only ${aiAdoption}% using AI — opportunity`} color={C.danger} />}
          {powerUsers > 0 && <InsightChip icon="⚡" text={`${powerUsers} power users driving usage`} color={C.amber} />}
          {neverUsedAI > 0 && <InsightChip icon="📬" text={`${neverUsedAI} tutors never used AI generation`} color={C.brand2} />}
          {period.activeTutors > 0 && <InsightChip icon="📈" text={`${period.activeTutors} active tutors this period`} color={C.success} />}
          {totals.tutors > 0 && <InsightChip icon="🏛️" text={`${num(pct(totals.useCaseCounts?.university ?? 0, totals.tutors))}% university profile`} color="#8b5cf6" />}
        </div>
      </Card>

      {/* Use case breakdown */}
      {totals.useCaseCounts && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 20 }}>Tutor Profile Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'k12_tutor',  label: 'Teachers / Tutors',     color: C.brand   },
              { key: 'university', label: 'University Lecturers',   color: '#4f46e5' },
            ].map(({ key, label, color }) => (
              <HorizBar
                key={key}
                label={label}
                count={totals.useCaseCounts[key] ?? 0}
                total={totals.tutors}
                color={color}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Tutors section ───────────────────────────────────────────────────────────

function TutorsSection({ tutors }) {
  const [search,      setSearch]      = useState('')
  const [segFilter,   setSegFilter]   = useState('all')
  const [sortKey,     setSortKey]     = useState('joinedAt')
  const [sortDir,     setSortDir]     = useState('desc')
  const [selected,    setSelected]    = useState(null)

  const filtered = useMemo(() => {
    let list = tutors ?? []
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q))
    }
    if (segFilter !== 'all') list = list.filter((t) => t.segment === segFilter)

    return [...list].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [tutors, search, segFilter, sortKey, sortDir])

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function SortTh({ col, label }) {
    const active = sortKey === col
    return (
      <th
        onClick={() => toggleSort(col)}
        style={{
          padding: '10px 16px', textAlign: 'left', fontSize: 11,
          fontWeight: 700, color: active ? C.brand : C.ink4,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
          background: C.surface,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {label}
          {active
            ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
            : <ArrowUpDown size={10} color={C.ink4} />}
        </span>
      </th>
    )
  }

  if (selected) {
    return <TutorDetail tutor={selected} onBack={() => setSelected(null)} />
  }

  const segCounts = (tutors ?? []).reduce((acc, t) => {
    acc[t.segment] = (acc[t.segment] ?? 0) + 1
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Tutor Management" sub={`${tutors?.length ?? 0} registered tutors`} />

      {/* Segment filter pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          onClick={() => setSegFilter('all')}
          style={{
            padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
            border: '2px solid',
            borderColor: segFilter === 'all' ? C.brand : C.border,
            background:  segFilter === 'all' ? C.brand : 'white',
            color:       segFilter === 'all' ? 'white' : C.ink3,
            cursor: 'pointer',
          }}
        >
          All ({tutors?.length ?? 0})
        </button>
        {Object.entries(SEGMENTS).map(([key, s]) => (
          <button
            key={key}
            onClick={() => setSegFilter(key)}
            style={{
              padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              border: '2px solid',
              borderColor: segFilter === key ? s.color : C.border,
              background:  segFilter === key ? s.bg   : 'white',
              color:        segFilter === key ? s.color : C.ink3,
              cursor: 'pointer',
            }}
          >
            {s.icon} {s.label} ({segCounts[key] ?? 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360 }}>
        <Search size={14} color={C.ink4} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          style={{
            width: '100%', paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
            border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 13, color: C.ink,
            outline: 'none', background: 'white', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <SortTh col="name"             label="Name"          />
                <SortTh col="profile"          label="Type"          />
                <SortTh col="joinedAt"         label="Joined"        />
                <SortTh col="lastActive"       label="Last Active"   />
                <SortTh col="totalAssessments" label="Assessments"   />
                <SortTh col="totalQuestions"   label="Questions"     />
                <SortTh col="aiGenSessions"    label="AI Sessions"   />
                <th style={{ padding: '10px 16px', background: C.surface, width: 120 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: C.ink4, fontSize: 13 }}>
                    No tutors match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((t, i) => (
                  <tr
                    key={t.id}
                    style={{
                      borderTop: `1px solid ${C.border}`,
                      background: i % 2 === 0 ? 'white' : C.surface + '60',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.ink, margin: 0 }}>{t.name}</p>
                        <p style={{ fontSize: 11, color: C.ink4, margin: '2px 0 0' }}>{t.email}</p>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                        background: t.profile === 'university' ? '#ede9fe' : C.surface,
                        color:      t.profile === 'university' ? '#7c3aed' : C.brand,
                      }}>
                        {t.profile === 'university' ? 'University' : 'K-12'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: C.ink3 }}>{fmtDate(t.joinedAt)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: C.ink3 }}>{relTime(t.lastActive)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.ink, textAlign: 'center' }}>{t.totalAssessments}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.ink, textAlign: 'center' }}>{t.totalQuestions}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {t.aiGenSessions > 0 ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.amber }}>⚡ {t.aiGenSessions}</span>
                      ) : (
                        <span style={{ fontSize: 12, color: C.ink4 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <SegmentBadge segment={t.segment} />
                        <button
                          onClick={() => setSelected(t)}
                          style={{
                            padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                            background: C.surface, border: `1px solid ${C.border}`,
                            color: C.brand, cursor: 'pointer',
                          }}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ fontSize: 12, color: C.ink4 }}>
        Showing {filtered.length} of {tutors?.length ?? 0} tutors
      </p>
    </div>
  )
}

// ─── Tutor detail view ────────────────────────────────────────────────────────

function TutorDetail({ tutor, onBack }) {
  const seg = SEGMENTS[tutor.segment] ?? SEGMENTS.inactive

  const ACTION_LABELS = {
    mcq_generation:          'MCQ generation',
    true_false_generation:   'True/False generation',
    calculation_generation:  'Fill-in generation',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.brand, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
      >
        ← Back to tutors
      </button>

      {/* Header */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: C.brand, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, fontFamily: 'Nunito, sans-serif',
              flexShrink: 0,
            }}>
              {tutor.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: 0, fontFamily: 'Nunito, sans-serif' }}>{tutor.name}</h2>
              <p style={{ fontSize: 13, color: C.ink4, margin: '4px 0 0' }}>{tutor.email}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: C.surface, color: C.brand }}>
                  {tutor.profile === 'university' ? '🏛️ University' : '🎓 K-12'}
                </span>
                <SegmentBadge segment={tutor.segment} />
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: C.ink4, margin: 0 }}>Joined {fmtDate(tutor.joinedAt)}</p>
            <p style={{ fontSize: 12, color: C.ink4, margin: '4px 0 0' }}>Last active {relTime(tutor.lastActive)}</p>
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Assessments',   value: tutor.totalAssessments, accent: '#4f46e5'  },
          { label: 'Questions',     value: tutor.totalQuestions,   accent: '#8b5cf6'  },
          { label: 'Submissions',   value: tutor.totalSubmissions, accent: C.success  },
          { label: 'AI Sessions',   value: tutor.aiGenSessions,    accent: C.amber    },
          { label: 'AI Questions',  value: tutor.aiGenQuestions,   accent: C.amber    },
        ].map((s) => (
          <div key={s.label} style={{
            background: 'white', border: `1px solid ${C.border}`, borderRadius: 14,
            padding: 18, borderTop: `3px solid ${s.accent}`,
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.ink, fontFamily: 'Nunito, sans-serif' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.ink4, marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Behaviour insight */}
      <Card style={{ background: seg.bg, border: `1px solid ${seg.color}30` }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: seg.color, margin: '0 0 8px' }}>
          {seg.icon} {seg.label} Profile
        </p>
        <p style={{ fontSize: 13, color: C.ink3, margin: 0 }}>
          {tutor.segment === 'power'       && `This tutor is a power user — ${tutor.aiGenSessions} AI sessions, ${tutor.aiGenQuestions} questions generated. High engagement.`}
          {tutor.segment === 'active'      && `Actively using AI generation. ${tutor.aiGenSessions} sessions completed so far.`}
          {tutor.segment === 'tried'       && `Has tried AI generation (${tutor.aiGenSessions} session${tutor.aiGenSessions !== 1 ? 's' : ''}) but hasn't returned frequently. Re-engagement opportunity.`}
          {tutor.segment === 'manual_only' && `Creates assessments manually. ${tutor.totalAssessments} assessments created but hasn't used AI generation yet.`}
          {tutor.segment === 'inactive'    && `No assessment or generation activity recorded. May need onboarding support.`}
        </p>
      </Card>

      {/* Recent AI activity */}
      {tutor.recentTransactions?.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 16 }}>Recent AI Generation Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tutor.recentTransactions.map((tx, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                background: i % 2 === 0 ? C.surface : 'white',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Sparkles size={14} color={C.amber} />
                  <span style={{ fontSize: 13, color: C.ink }}>
                    {ACTION_LABELS[tx.action] ?? tx.action}
                  </span>
                  <span style={{ fontSize: 12, color: C.ink4 }}>{tx.description}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.amber }}>−{tx.amount} credits</span>
                  <span style={{ fontSize: 11, color: C.ink4 }}>{relTime(tx.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── AI Usage section ─────────────────────────────────────────────────────────

function UsageSection({ tutors }) {
  if (!tutors) return null

  const total      = tutors.length
  const aiUsers    = tutors.filter((t) => t.usesAI)
  const nonAI      = tutors.filter((t) => !t.usesAI)
  const power      = tutors.filter((t) => t.segment === 'power')
  const tried      = tutors.filter((t) => t.segment === 'tried')
  const manualOnly = tutors.filter((t) => t.segment === 'manual_only')
  const inactive   = tutors.filter((t) => t.segment === 'inactive')

  const totalAIQuestions = tutors.reduce((acc, t) => acc + t.aiGenQuestions, 0)
  const totalAISessions  = tutors.reduce((acc, t) => acc + t.aiGenSessions, 0)
  const avgPerSession    = totalAISessions > 0 ? Math.round(totalAIQuestions / totalAISessions) : 0

  // Sort by AI usage
  const topUsers = [...tutors]
    .sort((a, b) => b.aiGenQuestions - a.aiGenQuestions)
    .slice(0, 10)
    .filter((t) => t.aiGenQuestions > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="AI Generation Usage" sub="Track how tutors are using in-app AI generation" />

      {/* Top KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        <KPICard icon={Sparkles}  label="AI Users"          value={num(aiUsers.length)}    accent={C.amber}   sub={`${pct(aiUsers.length, total)}% of tutors`} />
        <KPICard icon={Zap}       label="Total Sessions"    value={num(totalAISessions)}   accent={C.amber}   />
        <KPICard icon={BookOpen}  label="AI Questions"      value={num(totalAIQuestions)}  accent="#8b5cf6"   sub="all time" />
        <KPICard icon={Target}    label="Avg / Session"     value={avgPerSession || '—'}    accent={C.brand}   sub="questions per session" />
        <KPICard icon={AlertTriangle} label="Never Used AI" value={num(nonAI.length)}      accent={C.danger}  sub={`${pct(nonAI.length, total)}% of tutors`} />
      </div>

      {/* Funnel breakdown */}
      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 20 }}>Engagement Funnel</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Power users (≥10 sessions)',      count: power.length,      color: C.amber,   icon: '⚡', desc: 'High-frequency AI users — your best advocates' },
            { label: 'Active users (3–9 sessions)',     count: tutors.filter(t=>t.segment==='active').length, color: C.success, icon: '✅', desc: 'Regularly using AI, growing habit' },
            { label: 'Tried once (1–2 sessions)',       count: tried.length,      color: C.brand,   icon: '🔬', desc: 'Started but not returning — re-engagement target' },
            { label: 'Manual only (0 AI, has content)', count: manualOnly.length, color: C.ink3,    icon: '✏️', desc: 'Creating assessments but not using AI' },
            { label: 'Inactive (no content created)',   count: inactive.length,   color: C.danger,  icon: '💤', desc: 'Signed up but never created anything' },
          ].map((row) => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 16px', borderRadius: 12, background: C.surface,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'white', border: `2px solid ${row.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>{row.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{row.label}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: row.color, fontFamily: 'Nunito, sans-serif', flexShrink: 0 }}>
                    {row.count}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: C.ink4, margin: '4px 0 0' }}>{row.desc}</p>
                <div style={{ marginTop: 8, height: 4, background: 'white', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct(row.count, total)}%`, background: row.color, borderRadius: 99 }} />
                </div>
              </div>
              <span style={{ fontSize: 12, color: C.ink4, flexShrink: 0 }}>
                {pct(row.count, total)}%
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top users */}
      {topUsers.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Top AI Users</h3>
          <p style={{ fontSize: 12, color: C.ink4, marginBottom: 20 }}>Tutors generating the most questions with AI</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {topUsers.map((t, i) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '10px 14px', borderRadius: 10,
                background: i % 2 === 0 ? C.surface : 'white',
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%', background: i < 3 ? C.amber : C.border,
                  color: i < 3 ? 'white' : C.ink4, fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.ink, margin: 0, truncate: true }}>{t.name}</p>
                  <p style={{ fontSize: 11, color: C.ink4, margin: '2px 0 0' }}>{t.email}</p>
                </div>
                <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.amber }}>{t.aiGenQuestions}</div>
                    <div style={{ fontSize: 10, color: C.ink4 }}>questions</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.brand }}>{t.aiGenSessions}</div>
                    <div style={{ fontSize: 10, color: C.ink4 }}>sessions</div>
                  </div>
                </div>
                <SegmentBadge segment={t.segment} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Assessments section ──────────────────────────────────────────────────────

function AssessmentsSection({ totals, period }) {
  if (!totals || !period) return null
  const subjectTotal = Object.values(period.subjectMap ?? {}).reduce((a, b) => a + b, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Assessments" sub="What subjects are being assessed and how often" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        <KPICard icon={ClipboardList} label="All Time"     value={num(totals.assessments)} accent="#4f46e5" />
        <KPICard icon={ClipboardList} label="This Period"  value={num(period.assessments)} accent={C.brand} />
        <KPICard icon={BookOpen}      label="Questions"    value={num(period.questions)}    accent="#8b5cf6" />
        <KPICard icon={Activity}      label="Submissions"  value={num(period.submissions)}  accent={C.success} />
      </div>

      {subjectTotal > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Subjects</h3>
          <p style={{ fontSize: 12, color: C.ink4, marginBottom: 20 }}>{subjectTotal} assessments in this period</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(period.subjectMap)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 15)
              .map(([subject, count]) => (
                <HorizBar key={subject} label={subject.replace(/_/g, ' ')} count={count} total={subjectTotal} color="#4f46e5" />
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Engagement section ───────────────────────────────────────────────────────

function EngagementSection({ period, totals, tutors, filterLabel }) {
  if (!period || !totals) return null

  const aiUsers        = (tutors ?? []).filter((t) => t.usesAI).length
  const retention      = totals.tutors > 0 ? pct(period.activeTutors, totals.tutors) : 0
  const aiAdoption     = totals.tutors > 0 ? pct(aiUsers, totals.tutors) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Engagement" sub={`Platform engagement — ${filterLabel}`} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        <KPICard icon={TrendingUp}  label="Active Rate"     value={`${retention}%`}   accent={C.brand}   sub="of all tutors active" />
        <KPICard icon={Sparkles}    label="AI Adoption"     value={`${aiAdoption}%`}  accent={C.amber}   sub="ever used AI gen" />
        <KPICard icon={Users}       label="Active Tutors"   value={num(period.activeTutors)} accent={C.success} sub={`in ${filterLabel}`} />
        <KPICard icon={Activity}    label="Unique Students" value={num(period.uniqueStudents)} accent="#ec4899" sub="approx by name" />
      </div>

      {/* Onboarding survey breakdown */}
      {(Object.keys(period.heardMap ?? {}).length > 0 || Object.keys(period.teachMap ?? {}).length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {Object.keys(period.heardMap ?? {}).length > 0 && (
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 16 }}>How they found GradeMee</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(period.heardMap)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, count]) => {
                    const total = Object.values(period.heardMap).reduce((a, b) => a + b, 0)
                    return <HorizBar key={key} label={key} count={count} total={total} color={C.brand} />
                  })}
              </div>
            </Card>
          )}
          {Object.keys(period.teachMap ?? {}).length > 0 && (
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 16 }}>Teaching setting</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(period.teachMap)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, count]) => {
                    const total = Object.values(period.teachMap).reduce((a, b) => a + b, 0)
                    return <HorizBar key={key} label={key} count={count} total={total} color={C.teal2} />
                  })}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SuperAdminClient({ adminEmail, adminName }) {
  const [section,     setSection]     = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filter,      setFilter]      = useState('month')

  const [totals,  setTotals]  = useState(null)
  const [period,  setPeriod]  = useState(null)
  const [tutors,  setTutors]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [tutorsLoading, setTutorsLoading] = useState(true)
  const [lastSync, setLastSync] = useState(null)
  const [error,   setError]   = useState('')

  // Fetch aggregate stats
  const fetchStats = useCallback(async (f) => {
    setLoading(true)
    setError('')
    try {
      const [totalsRes, periodRes] = await Promise.all([
        fetch('/api/admin/stats', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: 'totals', adminEmail }),
        }),
        fetch('/api/admin/stats', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: 'period', filter: f, adminEmail }),
        }),
      ])
      if (!totalsRes.ok || !periodRes.ok) throw new Error('Failed to load data')
      const [t, p] = await Promise.all([totalsRes.json(), periodRes.json()])
      setTotals(t)
      setPeriod(p)
      setLastSync(new Date())
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [adminEmail])

  // Fetch per-tutor data
  const fetchTutors = useCallback(async () => {
    setTutorsLoading(true)
    try {
      const res  = await fetch('/api/admin/tutors')
      const data = await res.json()
      if (res.ok) setTutors(data.tutors ?? [])
    } catch {}
    setTutorsLoading(false)
  }, [])

  useEffect(() => {
    fetchStats(filter)
    fetchTutors()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filterLabel = FILTERS.find((f) => f.id === filter)?.label ?? ''

  function renderContent() {
    if (loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <RefreshCw size={24} color={C.brand} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13, color: C.ink4 }}>Loading data…</p>
          </div>
        </div>
      )
    }
    if (error) {
      return (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>Failed to load data</p>
          <p style={{ fontSize: 12, color: '#ef4444' }}>{error}</p>
          <button
            onClick={() => fetchStats(filter)}
            style={{ marginTop: 16, padding: '8px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )
    }

    if (section === 'overview')    return <OverviewSection    totals={totals} period={period} tutors={tutors} filterLabel={filterLabel} />
    if (section === 'tutors')      return <TutorsSection      tutors={tutors} />
    if (section === 'usage')       return <UsageSection       tutors={tutors} />
    if (section === 'assessments') return <AssessmentsSection totals={totals} period={period} />
    if (section === 'engagement')  return <EngagementSection  period={period} totals={totals} tutors={tutors} filterLabel={filterLabel} />
    return null
  }

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Nunito', sans-serif; }
        button { font-family: inherit; }
        input  { font-family: inherit; }
        table  { font-family: inherit; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: C.surface }}>

        {/* Sidebar (desktop) */}
        <Sidebar active={section} onNav={setSection} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Topbar */}
          <div style={{
            background: 'white', borderBottom: `1px solid ${C.border}`,
            padding: '0 24px', height: 56,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, zIndex: 30,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Mobile menu */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden"
                style={{ padding: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, cursor: 'pointer' }}
              >
                <Menu size={16} color={C.ink3} />
              </button>
              {/* Mobile logo */}
              <div className="md:hidden" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, fontWeight: 800 }}>
                <span style={{ color: C.brand8 }}>Grade</span>
                <span style={{ color: C.amber }}>Mee</span>
                <span style={{ fontSize: 10, color: C.ink4, marginLeft: 6, fontWeight: 600 }}>Admin</span>
              </div>
              <span className="hidden md:block" style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>
                {NAV.find((n) => n.id === section)?.label ?? 'Overview'}
              </span>
              {lastSync && (
                <span style={{ fontSize: 11, color: C.ink4 }} className="hidden sm:block">
                  · synced {lastSync.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Filter pills */}
              <div style={{ display: 'flex', gap: 4 }} className="hidden sm:flex">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setFilter(f.id); fetchStats(f.id) }}
                    style={{
                      padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                      border: 'none', cursor: 'pointer',
                      background: filter === f.id ? C.brand8 : 'transparent',
                      color:      filter === f.id ? 'white'  : C.ink4,
                      transition: 'all 0.15s',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => { fetchStats(filter); fetchTutors() }}
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.ink4, background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8 }}
              >
                <RefreshCw size={12} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
                <span className="hidden sm:block">Refresh</span>
              </button>

              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: C.brand,
                color: 'white', fontSize: 13, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {adminName?.charAt(0)?.toUpperCase() ?? 'A'}
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: '28px 24px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
            {renderContent()}

            {/* Footer */}
            <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 11, color: C.ink4 }}>
                <strong style={{ color: C.ink3 }}>Privacy:</strong> Aggregate data only. No student personal data displayed. Admin session verified server-side.
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}