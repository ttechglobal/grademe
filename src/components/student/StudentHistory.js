'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'grademee_history'
const MAX_HISTORY = 20

export function saveToHistory(entry) {
  // entry: { slug, title, subject, classLevel, studentName, score, total, correct, completedAt, answers, questions }
  try {
    const raw     = localStorage.getItem(STORAGE_KEY)
    const history = raw ? JSON.parse(raw) : []

    // Remove duplicate (same slug + same student name)
    const filtered = history.filter(
      (h) => !(h.slug === entry.slug && h.studentName === entry.studentName)
    )

    // Prepend new entry, cap at MAX_HISTORY
    const next = [entry, ...filtered].slice(0, MAX_HISTORY)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearHistory() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

// ── History modal ──────────────────────────────────────────────────────────
function ScoreRing({ pct, size = 48 }) {
  const r = (size / 2) - 5
  const circ = 2 * Math.PI * r
  const dash  = (pct / 100) * circ
  const color = pct >= 75 ? '#2da44e' : pct >= 50 ? '#f5a623' : '#e5534b'

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e5e0" strokeWidth="4" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

function HistoryCard({ entry, onReview, onClose }) {
  const pct  = entry.score ?? Math.round((entry.correct / entry.total) * 100)
  const date = new Date(entry.completedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const color = pct >= 75 ? '#2da44e' : pct >= 50 ? '#f5a623' : '#e5534b'

  return (
    <div style={{
      display:       'flex',
      alignItems:    'center',
      gap:           '16px',
      padding:       '16px',
      borderRadius:  '16px',
      border:        '1.5px solid #e5e5e0',
      background:    '#ffffff',
      cursor:        'pointer',
      transition:    'border-color 0.15s',
    }}
    onClick={() => onReview(entry)}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <ScoreRing pct={pct} size={52} />
        <div style={{
          position:       'absolute',
          inset:          0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '11px',
          fontWeight:     700,
          color,
        }}>
          {pct}%
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a2e', margin: 0 }}>
          {entry.title}
        </p>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>
          {entry.studentName} · {entry.correct}/{entry.total} correct · {date}
        </p>
        {entry.subject && (
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0', textTransform: 'capitalize' }}>
            {entry.subject.replace(/_/g, ' ')} · {entry.classLevel?.toUpperCase?.()}
          </p>
        )}
      </div>

      <div style={{
        fontSize:     '12px',
        fontWeight:   600,
        color:        '#4f46e5',
        flexShrink:   0,
        padding:      '6px 12px',
        borderRadius: '8px',
        background:   '#eef2ff',
      }}>
        Review →
      </div>
    </div>
  )
}

export default function StudentHistory({ currentSlug, currentStudentName }) {
  const [history, setHistory] = useState([])
  const [open,    setOpen]    = useState(false)
  const [reviewing, setReviewing] = useState(null)

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  // Filter to entries from this student name if known, or show all
  const filtered = history.filter((h) => {
    if (currentStudentName) return h.studentName === currentStudentName
    return true
  })

  if (filtered.length === 0) return null

  // Mini review view within the modal
  if (reviewing) {
    return (
      <ReviewModal
        entry={reviewing}
        onBack={() => setReviewing(null)}
        onClose={() => { setReviewing(null); setOpen(false) }}
      />
    )
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '8px',
          padding:        '10px 18px',
          borderRadius:   '12px',
          border:         '1.5px solid #e5e5e0',
          background:     '#ffffff',
          color:          '#4f46e5',
          fontWeight:     600,
          fontSize:       '14px',
          cursor:         'pointer',
          width:          '100%',
          justifyContent: 'center',
        }}
      >
        📋 View Past Assessments ({filtered.length})
      </button>

      {/* Modal */}
      {open && (
        <div style={{
          position:        'fixed',
          inset:           0,
          zIndex:          100,
          background:      'rgba(0,0,0,0.5)',
          backdropFilter:  'blur(4px)',
          display:         'flex',
          alignItems:      'flex-end',
          justifyContent:  'center',
          padding:         '0',
        }}>
          <div style={{
            background:    '#ffffff',
            borderRadius:  '24px 24px 0 0',
            width:         '100%',
            maxWidth:      '600px',
            maxHeight:     '85vh',
            display:       'flex',
            flexDirection: 'column',
            overflow:      'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        '20px 24px 16px',
              borderBottom:   '1px solid #e5e5e0',
              flexShrink:     0,
            }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '18px', color: '#1a1a2e', margin: 0 }}>
                  Past Assessments
                </h2>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0' }}>
                  Saved on this device · {filtered.length} completed
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width:          '32px',
                  height:         '32px',
                  borderRadius:   '50%',
                  border:         '1.5px solid #e5e5e0',
                  background:     '#f9fafb',
                  cursor:         'pointer',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontWeight:     700,
                  fontSize:       '16px',
                  color:          '#9ca3af',
                }}
              >
                ×
              </button>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map((entry, i) => (
                <HistoryCard
                  key={i}
                  entry={entry}
                  onReview={(e) => setReviewing(e)}
                  onClose={() => setOpen(false)}
                />
              ))}

              <button
                onClick={() => {
                  if (confirm('Clear all saved assessments from this device?')) {
                    clearHistory()
                    setHistory([])
                    setOpen(false)
                  }
                }}
                style={{
                  padding:      '10px',
                  borderRadius: '10px',
                  border:       '1px solid #fecaca',
                  background:   'transparent',
                  color:        '#e5534b',
                  fontSize:     '13px',
                  fontWeight:   600,
                  cursor:       'pointer',
                  marginTop:    '4px',
                }}
              >
                Clear history
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Past assessment review modal ───────────────────────────────────────────
function ReviewModal({ entry, onBack, onClose }) {
  const { questions = [], answers = {}, title, studentName } = entry

  if (!questions.length) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 101,
        background: '#ffffff',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e5e0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>←</button>
          <p style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a2e', margin: 0 }}>{title}</p>
        </div>
        <div style={{ padding: '40px 24px', textAlign: 'center', color: '#9ca3af' }}>
          <p>Question details not available for this assessment.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position:      'fixed',
      inset:         0,
      zIndex:        101,
      background:    '#f7f7f5',
      overflowY:     'auto',
      display:       'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background:     '#1a1a2e',
        padding:        '16px 20px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        position:       'sticky',
        top:            0,
        zIndex:         10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px' }}
          >
            ←
          </button>
          <div>
            <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px', margin: 0 }}>{title}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 0' }}>
              {studentName} · {entry.correct}/{entry.total} correct · {entry.score ?? Math.round((entry.correct/entry.total)*100)}%
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}
        >
          ×
        </button>
      </div>

      {/* Questions */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        {questions.map((q, i) => {
          const studentAns = answers[i] ?? ''
          const isCorrect  = studentAns.toUpperCase() === (q.answer ?? '').toUpperCase()

          return (
            <div key={i} style={{
              background:    '#ffffff',
              borderRadius:  '16px',
              border:        `2px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}`,
              overflow:      'hidden',
            }}>
              {/* Q header */}
              <div style={{
                display:     'flex',
                alignItems:  'flex-start',
                gap:         '12px',
                padding:     '14px 16px',
                background:  isCorrect ? '#f0fdf4' : '#fff1f2',
              }}>
                <div style={{
                  width:          '24px',
                  height:         '24px',
                  borderRadius:   '50%',
                  background:     isCorrect ? '#2da44e' : '#e5534b',
                  color:          '#ffffff',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontWeight:     700,
                  fontSize:       '12px',
                  flexShrink:     0,
                }}>
                  {isCorrect ? '✓' : '✗'}
                </div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e', margin: 0, flex: 1 }}>
                  Q{i + 1}. {q.text}
                </p>
              </div>

              {/* Options */}
              {q.options?.length > 0 && (
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {q.options.map((opt, oi) => {
                    const letter       = String.fromCharCode(65 + oi)
                    const isCorrectOpt = letter === q.answer || opt.charAt(0) === q.answer
                    const isStudentPick = letter === studentAns || opt.charAt(0) === studentAns

                    let bg      = '#f9fafb'
                    let border  = '1.5px solid #e5e5e0'
                    let color   = '#9ca3af'
                    let label   = null

                    if (isCorrectOpt && isStudentPick) {
                      bg = '#f0fdf4'; border = '1.5px solid #86efac'; color = '#2da44e'
                      label = '✓ Correct'
                    } else if (isCorrectOpt) {
                      bg = '#f0fdf4'; border = '1.5px solid #86efac'; color = '#2da44e'
                      label = '✓ Correct answer'
                    } else if (isStudentPick) {
                      bg = '#fff1f2'; border = '1.5px solid #fca5a5'; color = '#e5534b'
                      label = '✗ Your answer'
                    }

                    return (
                      <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: bg, border }}>
                        <span style={{ fontWeight: 700, color, fontSize: '13px', flexShrink: 0 }}>{letter}.</span>
                        <span style={{ flex: 1, fontSize: '13px', color: isCorrectOpt || isStudentPick ? color : '#6b7280' }}>
                          {opt.replace(/^[A-D]\.\s*/, '')}
                        </span>
                        {label && <span style={{ fontSize: '11px', fontWeight: 700, color, flexShrink: 0 }}>{label}</span>}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Explanation */}
              {q.explanation && (
                <div style={{ margin: '0 16px 12px', padding: '10px 14px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                    📖 Explanation
                  </p>
                  <p style={{ fontSize: '13px', color: '#1e40af', margin: 0, lineHeight: 1.5 }}>{q.explanation}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}