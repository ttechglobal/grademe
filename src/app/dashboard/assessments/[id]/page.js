'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { createClient }  from '@/lib/supabase/client'
import { useRouter }     from 'next/navigation'
import { useToast }      from '@/components/ui/ToastProvider'
import Link              from 'next/link'
import MathRenderer      from '@/components/ui/MathRenderer'
import EditQuestionModal from '@/components/assessment/EditQuestionModal'
import {
  ArrowLeft, Eye, Copy, CheckCheck, Check, X,
  ChevronDown, ChevronUp, Pencil, Trash2,
  Users, BarChart3, ClipboardList, Link2,
  ChevronsDownUp, ChevronsUpDown,
} from 'lucide-react'

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bg:       '#f0f7f4',
  white:    '#ffffff',
  border:   '#e2ede8',
  borderHov:'#c8ddd5',
  text:     '#1a1a1a',
  secondary:'#4b5563',
  muted:    '#9ca3af',
  brand:    '#0f2e2e',
  brandHov: '#1a5454',
  amber:    '#f5a623',
  green:    '#16a34a',
  greenBg:  '#dcfce7',
  danger:   '#dc2626',
  dangerBg: '#fee2e2',
}

// ── Helpers ────────────────────────────────────────────────────────────────
function scoreColor(s) {
  return s >= 75 ? C.green : s >= 50 ? C.amber : C.danger
}
function scoreBg(s) {
  return s >= 75
    ? { backgroundColor: C.greenBg, color: C.green }
    : s >= 50
    ? { backgroundColor: '#fef3c7', color: '#d97706' }
    : { backgroundColor: C.dangerBg, color: C.danger }
}
function relDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function getInitial(name) { return (name || 'S').charAt(0).toUpperCase() }
function resolveAnswer(answers, question, index) {
  if (!answers) return undefined
  if (question?.id && answers[question.id] !== undefined) return answers[question.id]
  if (answers[index] !== undefined) return answers[index]
  if (answers[String(index)] !== undefined) return answers[String(index)]
  return undefined
}
function scoreOne(q, sa) {
  if (!sa && sa !== 0) return false
  const t = q.question_type || q.type || ''
  if (t === 'calculation') {
    if (!q.answer_template?.structure?.length) return false
    const vals = typeof sa === 'object' && sa ? sa : {}
    return q.answer_template.structure.every((item) => {
      const sv  = (vals[item.id] ?? '').toString().trim().toLowerCase()
      const acc = (item.accepted ?? [item.answer]).map((a) => String(a).trim().toLowerCase())
      return acc.includes(sv)
    })
  }
  return (sa ?? '').toString().trim().toUpperCase() === (q.answer ?? '').trim().toUpperCase()
}

// ── Stat pill ──────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, valueStyle }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      padding: '16px 20px',
      backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: '12px',
      flex: 1, minWidth: '80px',
    }}>
      <Icon size={16} style={{ color: C.muted }} />
      <p style={{ fontSize: '22px', fontWeight: '600', color: C.text, margin: 0, lineHeight: 1, ...valueStyle }}>
        {value ?? '—'}
      </p>
      <p style={{ fontSize: '12px', color: C.muted, margin: 0 }}>{label}</p>
    </div>
  )
}

// ── Question row (in questions panel) ─────────────────────────────────────
function QuestionRow({ q, index, onEdit, onDelete, confirmDel, onConfirmDel, onCancelDel }) {
  const [open, setOpen] = useState(false)
  const typeLabel = q.type === 'truefalse' ? 'T/F'
    : q.type === 'calculation' ? 'Fill-in' : 'MCQ'

  return (
    <div style={{
      border: `1px solid ${C.border}`, borderRadius: '10px',
      overflow: 'hidden', backgroundColor: C.white,
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '14px 16px',
        backgroundColor: C.white,
      }}>
        {/* Q number badge */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: '28px', height: '20px', padding: '0 6px',
          backgroundColor: C.bg, borderRadius: '4px',
          fontSize: '11px', fontWeight: '600', color: C.secondary, flexShrink: 0,
        }}>
          Q{index + 1}
        </span>

        {/* Question text */}
        <p style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: C.text, lineHeight: 1.5, margin: 0 }}>
          <MathRenderer text={q.text} />
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {confirmDel ? (
            <>
              <button onClick={onConfirmDel} style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: '600', backgroundColor: C.dangerBg, color: C.danger, border: 'none', cursor: 'pointer' }}>
                Delete?
              </button>
              <button onClick={onCancelDel} style={{ padding: '3px 6px', borderRadius: '5px', border: `1px solid ${C.border}`, backgroundColor: C.white, color: C.muted, cursor: 'pointer' }}>
                <X size={10} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onEdit(q)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '5px', border: `1px solid ${C.border}`, backgroundColor: C.white, color: C.secondary, cursor: 'pointer' }}>
                <Pencil size={12} />
              </button>
              <button onClick={() => onDelete(q.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '5px', border: `1px solid ${C.border}`, backgroundColor: C.white, color: C.muted, cursor: 'pointer' }}>
                <Trash2 size={12} />
              </button>
            </>
          )}
          {/* Explanation toggle */}
          {q.explanation && (
            <button onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '5px', border: `1px solid ${C.border}`, backgroundColor: C.white, color: C.secondary, cursor: 'pointer' }}>
              {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Explanation */}
      {open && q.explanation && (
        <div style={{ padding: '10px 14px 14px', borderTop: `1px solid ${C.border}`, backgroundColor: '#f8fbf9' }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            Explanation
          </p>
          <p style={{ fontSize: '13px', color: C.secondary, lineHeight: 1.6, margin: 0 }}>
            <MathRenderer text={q.explanation} />
          </p>
        </div>
      )}
    </div>
  )
}

// ── Submission row ─────────────────────────────────────────────────────────
function SubmissionRow({ sub, questions, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const answers = sub.answers ?? {}
  const correct = questions.filter((q, i) => scoreOne(q, resolveAnswer(answers, q, i))).length
  const pct     = sub.score ?? Math.round((correct / Math.max(questions.length, 1)) * 100)
  const initial = getInitial(sub.student_name)

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      borderRadius: '10px', overflow: 'hidden',
      backgroundColor: C.white,
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          backgroundColor: C.bg, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: '600', color: C.secondary, flexShrink: 0,
        }}>
          {initial}
        </div>

        {/* Name + date */}
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: C.text, margin: 0 }}>
            {sub.student_name}
          </p>
          <p style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
            {relDate(sub.completed_at)}
          </p>
        </div>

        {/* Score chip */}
        <span style={{
          padding: '3px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
          flexShrink: 0, ...scoreBg(pct),
        }}>
          {pct}%
        </span>

        {/* Correct count */}
        <span style={{ fontSize: '12px', color: C.muted, flexShrink: 0, marginRight: '4px' }}
          className="hidden sm:block">
          {correct}/{questions.length}
        </span>

        <ChevronDown size={14} style={{ color: C.muted, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {/* Expanded: score bar + per-question answers */}
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.border}` }}>
          {/* Score bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0' }}>
            <div style={{ flex: 1, height: '6px', backgroundColor: C.bg, borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, backgroundColor: scoreColor(pct), borderRadius: '99px', transition: 'width 0.5s' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: scoreColor(pct), flexShrink: 0 }}>
              {pct}% · {correct}/{questions.length} correct
            </span>
          </div>

          {/* Per-question answer list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {questions.map((q, i) => {
              const sa      = resolveAnswer(answers, q, i)
              const correct = scoreOne(q, sa)
              const qText   = (q.text || '').slice(0, 80) + ((q.text || '').length > 80 ? '…' : '')
              return (
                <div key={q.id ?? i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  padding: '8px 12px', borderRadius: '8px',
                  backgroundColor: correct ? '#f0fdf4' : '#fff5f5',
                  border: `1px solid ${correct ? '#bbf7d0' : '#fecaca'}`,
                }}>
                  <span style={{
                    width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: '700',
                    backgroundColor: correct ? C.green : C.danger, color: '#fff',
                    marginTop: '1px',
                  }}>
                    {correct ? '✓' : '✗'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', color: C.secondary, margin: 0, lineHeight: 1.4 }}>
                      Q{i+1}: {qText}
                    </p>
                    <p style={{ fontSize: '12px', margin: '2px 0 0', color: correct ? C.green : C.danger }}>
                      Answered: {sa ? String(sa).slice(0, 60) : '—'}
                      {!correct && q.answer && (
                        <span style={{ color: C.muted }}> · Correct: {q.answer}</span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AssessmentDetailPage({ params }) {
  const { id }    = use(params)
  const router    = useRouter()
  const { toast } = useToast()

  const [assessment,   setAssessment]   = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [deleting,     setDeleting]     = useState(false)
  const [editingQ,     setEditingQ]     = useState(null)
  const [copied,       setCopied]       = useState(false)
  const [shareUrl,     setShareUrl]     = useState('')
  const [editTitle,    setEditTitle]    = useState(false)
  const [titleVal,     setTitleVal]     = useState('')
  const [savingTitle,  setSavingTitle]  = useState(false)
  const [confirmDel,   setConfirmDel]   = useState(null)   // null | 'assessment' | { qid }
  const [allExpanded,  setAllExpanded]  = useState(false)
  const [activeTab,    setActiveTab]    = useState('submissions')  // submissions | questions

  const loadAssessment = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        *,
        questions (
          id, type, question_type, text, options, answer,
          hint, explanation, order_index, answer_template
        ),
        submissions (
          id, student_name, score, total, completed_at, answers, tab_violations
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      toast({ message: 'Assessment not found.', type: 'error' })
      router.push('/dashboard/assessments')
      return
    }

    data.questions.sort((a, b) => a.order_index - b.order_index)
    data.submissions.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))

    setAssessment(data)
    setTitleVal(data.title)
    setShareUrl(`${window.location.origin}/t/${data.slug}`)
    setLoading(false)
  }, [id, router, toast])

  useEffect(() => {
    if (!id) return
    loadAssessment()

    const supabase = createClient()
    const channel  = supabase
      .channel(`detail-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions', filter: `assessment_id=eq.${id}` }, loadAssessment)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [id, loadAssessment])

  const handleDeleteAssessment = async () => {
    if (confirmDel !== 'assessment') { setConfirmDel('assessment'); return }
    setConfirmDel(null); setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('assessments').delete().eq('id', id)
    if (error) { toast({ message: 'Failed to delete.', type: 'error' }); setDeleting(false) }
    else { toast({ message: 'Deleted.', type: 'success' }); router.push('/dashboard/assessments') }
  }

  const handleDeleteQuestion = async (qid) => {
    if (!confirmDel || confirmDel?.qid !== qid) { setConfirmDel({ qid }); return }
    setConfirmDel(null)
    const supabase = createClient()
    await supabase.from('questions').delete().eq('id', qid)
    toast({ message: 'Question removed.', type: 'success' })
    loadAssessment()
  }

  const handleSaveTitle = async () => {
    if (!titleVal.trim()) return
    setSavingTitle(true)
    const supabase = createClient()
    const { error } = await supabase.from('assessments').update({ title: titleVal.trim() }).eq('id', id)
    if (!error) { setEditTitle(false); loadAssessment(); toast({ message: 'Title updated.', type: 'success' }) }
    setSavingTitle(false)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '28px', height: '28px', border: `2px solid ${C.border}`, borderTopColor: C.brand, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '13px', color: C.muted }}>Loading…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const scores   = assessment.submissions.filter((s) => s.score !== null).map((s) => s.score)
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  const subject  = (assessment.subject ?? '').replace(/_/g, ' ')
  const isActive = assessment.is_active

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── Back ── */}
        <Link href="/dashboard/assessments" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', color: C.secondary, textDecoration: 'none',
          alignSelf: 'flex-start',
        }}>
          <ArrowLeft size={14} /> Assessments
        </Link>

        {/* ── Title + status row ── */}
        <div>
          {/* Subject + status chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            {subject && (
              <span style={{ fontSize: '12px', color: C.secondary, backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '3px 10px' }}>
                {subject}
              </span>
            )}
            <span style={{
              fontSize: '12px', borderRadius: '20px', padding: '3px 10px', fontWeight: '500',
              ...(isActive ? { backgroundColor: C.greenBg, color: C.green } : { backgroundColor: '#f3f4f6', color: '#6b7280' })
            }}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
            {assessment.class_level && (
              <span style={{ fontSize: '12px', color: C.muted }}>{assessment.class_level}</span>
            )}
          </div>

          {/* Editable title */}
          {editTitle ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle() }}
                autoFocus
                style={{
                  flex: 1, fontSize: '22px', fontWeight: '600', color: C.text,
                  border: 'none', borderBottom: `2px solid ${C.brand}`,
                  outline: 'none', padding: '2px 0', background: 'transparent',
                }}
              />
              <button onClick={handleSaveTitle} disabled={savingTitle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.green }}>
                <Check size={18} />
              </button>
              <button onClick={() => setEditTitle(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}>
                <X size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '600', color: C.text, margin: 0, lineHeight: 1.3 }}>
                {assessment.title}
              </h1>
              <button onClick={() => setEditTitle(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '2px' }}>
                <Pencil size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <StatPill icon={ClipboardList} label="Questions"  value={assessment.questions.length} />
          <StatPill icon={Users}         label="Responses"  value={assessment.submissions.length} />
          <StatPill icon={BarChart3}     label="Avg Score"  value={avgScore !== null ? `${avgScore}%` : '—'}
            valueStyle={avgScore !== null ? { color: scoreColor(avgScore) } : {}} />
        </div>

        {/* ── Share link bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: '10px',
          padding: '10px 14px',
        }}>
          <Link2 size={14} style={{ color: C.muted, flexShrink: 0 }} />
          <span style={{
            flex: 1, fontSize: '13px', color: C.brand, fontFamily: 'monospace',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {shareUrl}
          </span>
          <button onClick={copyLink} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
            backgroundColor: copied ? C.greenBg : C.brand,
            color: copied ? C.green : '#fff',
            border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
          }}>
            {copied ? <><CheckCheck size={12} /> Copied</> : <><Copy size={12} /> Copy link</>}
          </button>
          <a href={`/t/${assessment.slug}?preview=1`} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
              border: `1px solid ${C.border}`, color: C.secondary, textDecoration: 'none',
              backgroundColor: C.white, flexShrink: 0,
            }}>
            <Eye size={12} /> Preview
          </a>
        </div>

        {/* ── Tabs: Submissions / Questions ── */}
        <div style={{ display: 'flex', gap: '0', borderBottom: `1px solid ${C.border}` }}>
          {[
            { id: 'submissions', label: `Submissions (${assessment.submissions.length})` },
            { id: 'questions',   label: `Questions (${assessment.questions.length})` },
          ].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '10px 16px', fontSize: '14px', fontWeight: activeTab === t.id ? '600' : '400',
              color: activeTab === t.id ? C.brand : C.secondary,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === t.id ? C.brand : 'transparent'}`,
              marginBottom: '-1px', transition: 'all 0.12s',
            }}>
              {t.label}
            </button>
          ))}

          {/* Expand/collapse all — submissions tab only */}
          {activeTab === 'submissions' && assessment.submissions.length > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center', paddingRight: '4px' }}>
              <button onClick={() => setAllExpanded(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '4px' }} title="Expand all">
                <ChevronsUpDown size={15} />
              </button>
              <button onClick={() => setAllExpanded(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '4px' }} title="Collapse all">
                <ChevronsDownUp size={15} />
              </button>
            </div>
          )}
        </div>

        {/* ── Submissions tab ── */}
        {activeTab === 'submissions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {assessment.submissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '52px 24px', backgroundColor: '#f9fbf9', border: `1px dashed ${C.borderHov}`, borderRadius: '14px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
                <p style={{ fontSize: '15px', fontWeight: '600', color: C.text, margin: '0 0 6px' }}>No submissions yet</p>
                <p style={{ fontSize: '13px', color: C.muted }}>Share the link — this page updates automatically when students submit</p>
              </div>
            ) : (
              assessment.submissions.map((sub) => (
                <SubmissionRow
                  key={`${sub.id}-${allExpanded}`}
                  sub={sub}
                  questions={assessment.questions}
                  defaultOpen={allExpanded}
                />
              ))
            )}
          </div>
        )}

        {/* ── Questions tab ── */}
        {activeTab === 'questions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {assessment.questions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: C.muted }}>No questions.</div>
            ) : (
              assessment.questions.map((q, i) => (
                <QuestionRow
                  key={q.id}
                  q={q} index={i}
                  onEdit={(q) => setEditingQ(q)}
                  onDelete={handleDeleteQuestion}
                  confirmDel={confirmDel?.qid === q.id}
                  onConfirmDel={() => handleDeleteQuestion(q.id)}
                  onCancelDel={() => setConfirmDel(null)}
                />
              ))
            )}
          </div>
        )}

        {/* ── Danger zone: delete assessment ── */}
        <div style={{ marginTop: '16px', paddingTop: '20px', borderTop: `1px solid ${C.border}` }}>
          {confirmDel === 'assessment' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p style={{ fontSize: '13px', color: C.danger, margin: 0 }}>Delete this assessment and all its data?</p>
              <button onClick={handleDeleteAssessment} disabled={deleting}
                style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', backgroundColor: C.danger, color: '#fff', border: 'none', cursor: 'pointer' }}>
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button onClick={() => setConfirmDel(null)}
                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '13px', border: `1px solid ${C.border}`, backgroundColor: C.white, color: C.secondary, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={handleDeleteAssessment}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
              <Trash2 size={13} /> Delete this assessment
            </button>
          )}
        </div>

      </div>

      {editingQ && (
        <EditQuestionModal
          question={editingQ}
          onClose={() => setEditingQ(null)}
          onSaved={() => { setEditingQ(null); loadAssessment() }}
        />
      )}
    </>
  )
}