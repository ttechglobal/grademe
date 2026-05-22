'use client'

import { useState, useEffect } from 'react'
import { createClient }  from '@/lib/supabase/client'
import Link              from 'next/link'
import { Plus, ClipboardList, Users, ArrowRight, Sparkles } from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────
function greeting(name) {
  const h = new Date().getHours()
  const t = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  return `Good ${t}, ${name?.split(' ')[0] ?? 'there'}.`
}

function relDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins || 1}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}



// ── Assessment card ────────────────────────────────────────────────────────
function AssessmentCard({ a }) {
  const [hov, setHov] = useState(false)
  const subject = (a.subject ?? 'General').replace(/_/g, ' ')
  const qCount  = a.questions?.[0]?.count ?? 0
  const type    = (a.question_type ?? 'MCQ').replace('_', '/').toUpperCase()
  return (
    <Link href={`/dashboard/assessments/${a.id}`} style={{
      display: 'block', textDecoration: 'none',
      backgroundColor: '#fff',
      border: `1px solid ${hov ? '#c8ddd5' : '#e2ede8'}`,
      borderRadius: '12px',
      padding: '20px 22px',
      boxShadow: hov ? '0 4px 12px rgba(0,0,0,0.07)' : 'none',
      transition: 'all 0.18s ease',
      cursor: 'pointer',
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Row 1: chips */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#4b5563', backgroundColor: '#f0f7f4', border: '1px solid #e2ede8', borderRadius: '20px', padding: '3px 10px' }}>
          {subject}
        </span>
        <span style={{
          fontSize: '12px', borderRadius: '20px', padding: '3px 10px', fontWeight: '500',
          ...(a.is_active
            ? { backgroundColor: '#dcfce7', color: '#16a34a' }
            : { backgroundColor: '#f3f4f6', color: '#6b7280' })
        }}>
          {a.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
      {/* Title */}
      <p style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginTop: '12px', marginBottom: '4px', lineHeight: 1.4 }}>
        {a.title}
      </p>
      {/* Meta */}
      <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
        {a.class_level} · {qCount} question{qCount !== 1 ? 's' : ''} · {type}
      </p>
      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: '#e2ede8', margin: '14px 0' }} />
      {/* Footer */}
      <p style={{ fontSize: '13px', color: '#4b5563', margin: 0 }}>{relDate(a.created_at)}</p>
    </Link>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [name,        setName]        = useState('')
  const [stats,       setStats]       = useState(null)
  const [assessments, setAssessments] = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()

      const { data: profile } = await supabase
        .from('profiles').select('full_name').eq('id', u.id).single()
      setName(profile?.full_name || u?.user_metadata?.full_name || u.email?.split('@')[0] || '')

      const idRes = await supabase.from('assessments').select('id').eq('teacher_id', u.id)
      const ids   = (idRes.data ?? []).map((a) => a.id)

      const [{ data: recentA }, { count: subCount }, { data: subsData }] = await Promise.all([
        supabase.from('assessments')
          .select('id, title, subject, class_level, question_type, is_active, created_at, questions(count)')
          .eq('teacher_id', u.id)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('submissions')
          .select('*', { count: 'exact', head: true })
          .in('assessment_id', ids),
        supabase.from('submissions')
          .select('score, student_name')
          .in('assessment_id', ids),
      ])

      const scores       = (subsData ?? []).filter((s) => s.score !== null).map((s) => s.score)
      const avg          = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
      const uniqStudents = new Set((subsData ?? []).map((s) => s.student_name?.toLowerCase().trim()).filter(Boolean)).size

      setAssessments(recentA ?? [])
      setStats({ assessments: ids.length, students: uniqStudents, avg, submissions: subCount ?? 0 })
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

      {/* ── Greeting ── */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: '600', color: '#1a1a1a', margin: 0, marginBottom: '5px' }}>
          {loading ? 'Welcome back!' : greeting(name)}
        </h1>
        <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
          Here's your classroom.
        </p>
      </div>

      {/* ── Primary action card ── */}
      <div style={{
        backgroundColor: '#fff', border: '1px solid #e2ede8', borderRadius: '12px',
        padding: '24px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontSize: '17px', fontWeight: '600', color: '#1a1a1a', margin: 0, marginBottom: '4px' }}>
            Create a new assessment
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
            AI-assisted · Share via link · Auto-graded
          </p>
        </div>
        <Link href="/dashboard/assessments/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          backgroundColor: '#0f2e2e', color: '#fff',
          fontSize: '14px', fontWeight: '600',
          padding: '10px 22px', borderRadius: '8px', textDecoration: 'none',
          whiteSpace: 'nowrap', transition: 'background-color 0.12s',
        }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a5454'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0f2e2e'}
        >
          <Plus size={15} strokeWidth={2.5} /> Create Assessment
        </Link>
      </div>



      {/* ── Recent assessments ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
            Recent Assessments
          </h2>
          <Link href="/dashboard/assessments" style={{
            display: 'flex', alignItems: 'center', gap: '3px',
            fontSize: '13px', color: '#16a34a', textDecoration: 'none', fontWeight: '500',
          }}>
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gap: '14px' }} className="md-2col">
            <style>{`@media(min-width:768px){.md-2col{grid-template-columns:repeat(2,1fr)!important}}`}</style>
            {[1,2,3].map((i) => (
              <div key={i} style={{ height: '140px', borderRadius: '12px', backgroundColor: '#f0f7f4', border: '1px solid #e2ede8' }} />
            ))}
          </div>
        ) : assessments.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '52px 24px',
            backgroundColor: '#f9fbf9', border: '1px dashed #c8ddd5', borderRadius: '14px',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 6px' }}>No assessments yet</p>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px' }}>
              Create your first — share a link, students submit, results appear instantly.
            </p>
            <Link href="/dashboard/assessments/new" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              backgroundColor: '#f5a623', color: '#fff', fontWeight: '600',
              fontSize: '14px', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none',
            }}>
              <Plus size={14} /> Create Assessment
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }} className="md-2col">
            <style>{`@media(min-width:768px){.md-2col{grid-template-columns:repeat(2,1fr)!important}}`}</style>
            {assessments.slice(0, 6).map((a) => <AssessmentCard key={a.id} a={a} />)}
          </div>
        )}
      </div>

    </div>
  )
}