'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link             from 'next/link'
import { useRouter }    from 'next/navigation'
import { useToast }     from '@/components/ui/ToastProvider'
import {
  Plus, Search, EyeOff, RotateCcw, Trash2, X, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const C = {
  bg: '#f0f7f4', white: '#ffffff',
  border: '#e2ede8', borderHov: '#c8ddd5',
  text: '#1a1a1a', secondary: '#4b5563', muted: '#9ca3af',
  // Brand teal for primary button — not amber
  brand: '#0f2e2e', brandHov: '#1a5454',
  amber: '#f5a623',
  green: '#16a34a', greenBg: '#dcfce7',
}

function relDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ── Assessment card ────────────────────────────────────────────────────────
function AssessmentCard({ assessment, onDelete, onToggle, toggling }) {
  const [hov,        setHov]        = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const router = useRouter()

  const subject  = (assessment.subject ?? 'General').replace(/_/g, ' ')
  const qCount   = assessment.questions?.[0]?.count ?? 0
  const type     = (assessment.question_type ?? 'MCQ').replace('_', '/').toUpperCase()
  const isActive = assessment.is_active

  return (
    <div
      style={{
        backgroundColor: C.white,
        border: `1px solid ${hov ? C.borderHov : C.border}`,
        borderRadius: '12px', padding: '18px 20px',
        boxShadow: hov ? '0 4px 12px rgba(0,0,0,0.07)' : 'none',
        transition: 'all 0.15s ease', cursor: 'default',
        display: 'flex', flexDirection: 'column', gap: '0',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setConfirmDel(false) }}
    >
      {/* Row 1: subject chip + status chip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{
          fontSize: '12px', color: C.secondary, backgroundColor: C.bg,
          border: `1px solid ${C.border}`, borderRadius: '20px', padding: '3px 10px',
        }}>
          {subject}
        </span>
        <span style={{
          fontSize: '12px', borderRadius: '20px', padding: '3px 10px', fontWeight: '500',
          ...(isActive
            ? { backgroundColor: C.greenBg, color: C.green }
            : { backgroundColor: '#f3f4f6', color: '#6b7280' })
        }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Title */}
      <p style={{ fontSize: '16px', fontWeight: '600', color: C.text, marginBottom: '4px', lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {assessment.title}
      </p>

      {/* Meta */}
      <p style={{ fontSize: '13px', color: C.muted, marginBottom: '14px' }}>
        {assessment.class_level} · {qCount} question{qCount !== 1 ? 's' : ''} · {type}
      </p>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: C.border, marginBottom: '12px' }} />

      {/* Footer: date left, actions right — always visible */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: C.muted }}>{relDate(assessment.created_at)}</span>

        {/* Action buttons — always visible, compact */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* View detail */}
          <button
            onClick={() => router.push(`/dashboard/assessments/${assessment.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '5px 10px', borderRadius: '6px',
              fontSize: '12px', fontWeight: '500',
              border: `1px solid ${C.border}`, backgroundColor: C.white,
              color: C.secondary, cursor: 'pointer',
            }}
          >
            View <ChevronRight size={11} />
          </button>

          {/* Deactivate — tertiary action, plain muted text */}
          <button
            onClick={() => onToggle(assessment.id, isActive)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 2px',
              fontSize: '13px', fontWeight: '500',
              background: 'none', border: 'none',
              color: '#6b7280',
              cursor: 'pointer', transition: 'color 0.12s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = isActive ? '#dc2626' : C.green}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            {toggling === assessment.id
              ? <span style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
              : isActive ? <EyeOff size={12} /> : <RotateCcw size={12} />
            }
            {isActive ? 'Deactivate' : 'Reactivate'}
          </button>

          {/* Delete */}
          {confirmDel ? (
            <>
              <button
                onClick={() => { onDelete(assessment.id); setConfirmDel(false) }}
                style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer' }}>
                Confirm
              </button>
              <button
                onClick={() => setConfirmDel(false)}
                style={{ width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${C.border}`, backgroundColor: C.white, color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={11} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              title="Delete"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', borderRadius: '6px',
                border: `1px solid ${C.border}`, backgroundColor: C.white,
                color: C.muted, cursor: 'pointer',
              }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────
function EmptyState({ filtered }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: '#f9fbf9', border: '1px dashed #c8ddd5', borderRadius: '14px' }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto 16px', display: 'block' }}>
        <rect x="8" y="12" width="48" height="40" rx="6" fill="#e2ede8" />
        <rect x="16" y="22" width="24" height="3" rx="1.5" fill="#9ca3af" />
        <rect x="16" y="30" width="32" height="3" rx="1.5" fill="#c8ddd5" />
        <rect x="16" y="38" width="20" height="3" rx="1.5" fill="#c8ddd5" />
        <circle cx="48" cy="46" r="10" fill="#f0f7f4" stroke="#e2ede8" strokeWidth="1.5" />
        <path d="M44 46h8M48 42v8" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 6px' }}>
        {filtered ? 'No matching assessments' : 'No assessments yet'}
      </p>
      <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 20px' }}>
        {filtered ? 'Try a different search or filter' : 'Create your first to get started'}
      </p>
      {!filtered && (
        <Link href="/dashboard/assessments/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          backgroundColor: C.brand, color: '#fff', fontWeight: '600',
          fontSize: '14px', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none',
        }}>
          <Plus size={14} /> Create Assessment
        </Link>
      )}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function AssessmentsPage() {
  const { toast }                       = useToast()
  const [assessments, setAssessments]   = useState([])
  const [loading,     setLoading]       = useState(true)
  const [toggling,    setToggling]      = useState(null)
  const [search,      setSearch]        = useState('')
  const [tab,         setTab]           = useState('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('assessments')
        .select('id, title, subject, class_level, question_type, is_active, created_at, questions(count)')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })
      setAssessments(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const handleToggle = async (id, isActive) => {
    setToggling(id)
    const supabase = createClient()
    await supabase.from('assessments').update({ is_active: !isActive }).eq('id', id)
    setAssessments((prev) => prev.map((a) => a.id === id ? { ...a, is_active: !isActive } : a))
    setToggling(null)
    toast({ message: isActive ? 'Assessment deactivated.' : 'Assessment reactivated.', type: 'success' })
  }

  const handleDelete = async (id) => {
    const supabase = createClient()
    await supabase.from('assessments').delete().eq('id', id)
    setAssessments((prev) => prev.filter((a) => a.id !== id))
    toast({ message: 'Assessment deleted.', type: 'success' })
  }

  const filtered = useMemo(() => {
    let list = [...assessments]
    if (tab === 'active')   list = list.filter((a) => a.is_active)
    if (tab === 'inactive') list = list.filter((a) => !a.is_active)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((a) =>
        a.title?.toLowerCase().includes(q) ||
        a.subject?.toLowerCase().includes(q) ||
        a.class_level?.toLowerCase().includes(q)
      )
    }
    return list
  }, [assessments, tab, search])

  const TABS = [
    { id: 'all',      label: 'All',      count: assessments.length },
    { id: 'active',   label: 'Active',   count: assessments.filter((a) => a.is_active).length },
    { id: 'inactive', label: 'Inactive', count: assessments.filter((a) => !a.is_active).length },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '600', color: C.text, margin: '0 0 4px' }}>
            Assessments
          </h1>
          <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
            {loading ? 'Loading…' : `${assessments.length} assessment${assessments.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/dashboard/assessments/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          /* Brand teal — primary button color, not amber */
          backgroundColor: C.brand, color: '#fff',
          fontWeight: '600', fontSize: '14px',
          padding: '10px 20px', borderRadius: '8px', textDecoration: 'none',
          flexShrink: 0, transition: 'background-color 0.12s',
        }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.brandHov}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.brand}
        >
          <Plus size={14} strokeWidth={2.5} /> New Assessment
        </Link>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assessments…"
          style={{
            width: '100%', height: '44px', paddingLeft: '40px', paddingRight: '16px',
            border: `1px solid ${C.border}`, borderRadius: '10px',
            backgroundColor: C.white, fontSize: '15px', color: C.text,
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={(e) => e.target.style.borderColor = C.borderHov}
          onBlur={(e) => e.target.style.borderColor = C.border}
        />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500',
            border: 'none', cursor: 'pointer', transition: 'all 0.12s',
            ...(tab === t.id
              ? { backgroundColor: C.text, color: '#fff' }
              : { backgroundColor: 'transparent', color: '#6b7280' })
          }}>
            {t.label}
            {t.count > 0 && (
              <span style={{ marginLeft: '5px', fontSize: '11px', color: tab === t.id ? 'rgba(255,255,255,0.55)' : C.muted }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '14px' }} className="grid-1col">
          {[1,2,3,4].map((i) => (
            <div key={i} style={{ height: '160px', borderRadius: '12px', backgroundColor: C.bg, border: `1px solid ${C.border}` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filtered={search.trim().length > 0 || tab !== 'all'} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '14px' }} className="grid-1col">
          {filtered.map((a) => (
            <AssessmentCard key={a.id} assessment={a} onDelete={handleDelete} onToggle={handleToggle} toggling={toggling} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 640px) {
          .grid-1col { grid-template-columns: 1fr !important; gap: 12px !important; }
          .assess-actions { flex-wrap: wrap; gap: 6px !important; }
        }
      `}</style>
    </div>
  )
}