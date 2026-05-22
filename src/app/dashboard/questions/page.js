'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import MathRenderer     from '@/components/ui/MathRenderer'
import { Search, Plus } from 'lucide-react'

const C = {
  bg: '#f0f7f4', white: '#ffffff', border: '#e2ede8', borderHov: '#c8ddd5',
  text: '#1a1a1a', secondary: '#4b5563', muted: '#9ca3af',
  amber: '#f5a623', green: '#16a34a', greenBg: '#dcfce7',
}

const DIFFICULTY_STYLE = {
  easy:   { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  medium: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  hard:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
}

// ── Question card ──────────────────────────────────────────────────────────
function QuestionCard({ question }) {
  const [hov,  setHov]  = useState(false)
  const subject = (question.subject ?? 'General').replace(/_/g, ' ')
  const diff    = question.difficulty ?? 'medium'
  const diffStyle = DIFFICULTY_STYLE[diff] ?? DIFFICULTY_STYLE.medium
  const typeLabel = question.type === 'truefalse' ? 'True/False'
    : question.type === 'calculation' ? 'Fill-in'
    : 'MCQ'
  const optCount = Array.isArray(question.options) ? question.options.length : 0

  return (
    <div style={{
      backgroundColor: C.white,
      border: `1px solid ${hov ? C.borderHov : C.border}`,
      borderRadius: '12px', padding: '18px 20px',
      boxShadow: hov ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
      transition: 'all 0.15s',
      cursor: 'default', position: 'relative',
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Row 1: chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <span style={{
          fontSize: '12px', color: C.secondary, backgroundColor: C.bg,
          border: `1px solid ${C.border}`, borderRadius: '20px', padding: '2px 9px',
        }}>
          {subject}
        </span>
        <span style={{
          fontSize: '12px', borderRadius: '20px', padding: '2px 9px',
          backgroundColor: diffStyle.bg, color: diffStyle.color,
          border: `1px solid ${diffStyle.border}`,
        }}>
          {diff.charAt(0).toUpperCase() + diff.slice(1)}
        </span>
      </div>

      {/* Row 2: question text */}
      <p style={{
        fontSize: '15px', fontWeight: '500', color: C.text, lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden', margin: '0 0 8px',
      }}>
        <MathRenderer text={question.text || question.question || ''} />
      </p>

      {/* Row 3: type meta */}
      <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
        {typeLabel}{optCount > 0 ? ` · ${optCount} options` : ''}
      </p>

      {/* Hover CTA */}
      {hov && (
        <button style={{
          position: 'absolute', bottom: '12px', right: '14px',
          fontSize: '13px', fontWeight: '500', color: C.amber,
          background: 'none', border: 'none', cursor: 'pointer', padding: '0',
        }}>
          + Add to Assessment
        </button>
      )}
    </div>
  )
}

// ── Filter panel item ──────────────────────────────────────────────────────
function FilterItem({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left',
      padding: '8px 12px', borderRadius: '6px', fontSize: '14px',
      border: 'none', cursor: 'pointer', transition: 'all 0.12s',
      backgroundColor: active ? C.bg : 'transparent',
      color: active ? C.green : C.secondary,
      fontWeight: active ? '500' : '400',
    }}>
      {label}
    </button>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function QuestionsPage() {
  const [questions,     setQuestions]     = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [activeSubject, setActiveSubject] = useState('')
  const [activeType,    setActiveType]    = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('questions').select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })
      setQuestions(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const subjects  = useMemo(() => [...new Set(questions.map((q) => q.subject).filter(Boolean))], [questions])
  const typeList  = useMemo(() => [...new Set(questions.map((q) => q.type).filter(Boolean))], [questions])

  const filtered  = useMemo(() => {
    let list = [...questions]
    if (activeSubject) list = list.filter((q) => q.subject === activeSubject)
    if (activeType)    list = list.filter((q) => q.type === activeType)
    if (search.trim()) {
      const sq = search.toLowerCase()
      list = list.filter((q) => q.text?.toLowerCase().includes(sq) || q.subject?.toLowerCase().includes(sq))
    }
    return list
  }, [questions, activeSubject, activeType, search])

  const typeLabel = (t) => t === 'truefalse' ? 'True/False' : t === 'calculation' ? 'Fill-in' : 'MCQ'

  // All filter chips for mobile chip row
  const allChips = [
    { key: 'all', label: 'All', active: !activeSubject && !activeType, onClick: () => { setActiveSubject(''); setActiveType('') } },
    ...subjects.map((s) => ({ key: `s-${s}`, label: s.replace(/_/g, ' '), active: activeSubject === s, onClick: () => { setActiveSubject(s); setActiveType('') } })),
    ...typeList.map((t) => ({ key: `t-${t}`, label: typeLabel(t), active: activeType === t, onClick: () => { setActiveType(t); setActiveSubject('') } })),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowX: 'hidden' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: '600', color: C.text, margin: 0, marginBottom: '4px' }}>
          Question Bank
        </h1>
        <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
          {loading ? 'Loading…' : `${questions.length} saved question${questions.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions…"
          style={{
            width: '100%', height: '44px', paddingLeft: '38px', paddingRight: '16px',
            border: `1px solid ${C.border}`, borderRadius: '10px',
            backgroundColor: C.white, fontSize: '15px', outline: 'none', boxSizing: 'border-box',
          }} />
      </div>

      {/* Mobile: horizontal scrollable chip row */}
      <div className="qb-mobile-chips" style={{ display: 'none', gap: '8px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
        {allChips.map((chip) => (
          <button key={chip.key} onClick={chip.onClick} style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500',
            whiteSpace: 'nowrap', flexShrink: 0, border: 'none', cursor: 'pointer', transition: 'all 0.12s',
            backgroundColor: chip.active ? C.text : C.white,
            color: chip.active ? '#fff' : '#6b7280',
            boxShadow: chip.active ? 'none' : `0 0 0 1px ${C.border}`,
          }}>
            {chip.label}
          </button>
        ))}
      </div>

      {/* Desktop: two-panel layout */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* Filter sidebar — desktop only */}
        <div className="qb-sidebar" style={{
          width: '200px', flexShrink: 0,
          backgroundColor: C.white, border: `1px solid ${C.border}`,
          borderRadius: '12px', padding: '16px',
        }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px 4px' }}>
            Subject
          </p>
          <FilterItem label="All subjects" active={!activeSubject} onClick={() => setActiveSubject('')} />
          {subjects.map((s) => (
            <FilterItem key={s} label={s.replace(/_/g, ' ')} active={activeSubject === s} onClick={() => setActiveSubject(s)} />
          ))}
          {typeList.length > 0 && (
            <>
              <div style={{ height: '1px', backgroundColor: C.border, margin: '12px 0' }} />
              <p style={{ fontSize: '12px', fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px 4px' }}>
                Type
              </p>
              <FilterItem label="All types" active={!activeType} onClick={() => setActiveType('')} />
              {typeList.map((t) => (
                <FilterItem key={t} label={typeLabel(t)} active={activeType === t} onClick={() => setActiveType(t)} />
              ))}
            </>
          )}
        </div>

        {/* Question list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {[1,2,3].map((i) => (
                <div key={i} style={{ height: '120px', borderRadius: '12px', backgroundColor: C.bg, border: `1px solid ${C.border}` }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#f9fbf9', border: `1px dashed ${C.borderHov}`, borderRadius: '14px' }}>
              <p style={{ fontSize: '16px', fontWeight: '600', color: C.text, margin: '0 0 6px' }}>No questions found</p>
              <p style={{ fontSize: '14px', color: C.muted }}>
                {search || activeSubject || activeType ? 'Try adjusting your filters' : 'Questions you create will appear here'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {filtered.map((q) => <QuestionCard key={q.id} question={q} />)}
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Mobile: hide sidebar, show chip row, full width */
        @media (max-width: 767px) {
          .qb-sidebar      { display: none !important; }
          .qb-mobile-chips { display: flex !important; }
          /* prevent any child from causing x-overflow */
          .qb-mobile-chips::-webkit-scrollbar { display: none; }
        }
        /* Desktop: hide chip row */
        @media (min-width: 768px) {
          .qb-mobile-chips { display: none !important; }
        }
      `}</style>
    </div>
  )
}