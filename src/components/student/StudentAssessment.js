'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Clock, AlertTriangle, CheckCircle, XCircle,
  History, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import MathRenderer        from '@/components/ui/MathRenderer'
import ExplanationRenderer from '@/components/ui/ExplanationRenderer'
import { cn } from '@/lib/utils'

// ── Storage helpers ────────────────────────────────────────────────────────
const HISTORY_KEY = 'grademee_student_history'
const MAX_HISTORY  = 30

function saveToHistory(entry) {
  try {
    const raw      = localStorage.getItem(HISTORY_KEY)
    const existing = raw ? JSON.parse(raw) : []
    const filtered = existing.filter(
      (h) => !(h.slug === entry.slug && h.studentName?.toLowerCase() === entry.studentName?.toLowerCase())
    )
    localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...filtered].slice(0, MAX_HISTORY)))
  } catch { /**/ }
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') } catch { return [] }
}

function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY) } catch { /**/ }
}

function getSessionKey() {
  try {
    const s = sessionStorage.getItem('grademee_session')
    if (s) return s
    const k = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('grademee_session', k)
    return k
  } catch { return Math.random().toString(36).slice(2) }
}

// ── Score ring ─────────────────────────────────────────────────────────────
function ScoreRing({ pct, size = 52 }) {
  const r = size / 2 - 5, circ = 2 * Math.PI * r, dash = (pct / 100) * circ
  const col = pct >= 75 ? '#2da44e' : pct >= 50 ? '#f5a623' : '#e5534b'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e5e0" strokeWidth="4" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  )
}

// ── Countdown timer ────────────────────────────────────────────────────────
function CountdownTimer({ totalSeconds, onExpire, onWarn }) {
  const [secs, setSecs]    = useState(totalSeconds)
  const warnRef            = useRef(false)
  const expireRef          = useRef(false)

  useEffect(() => {
    if (!totalSeconds) return
    const iv = setInterval(() => {
      setSecs((p) => {
        const n = p - 1
        if (n === 300 && !warnRef.current)  { warnRef.current   = true; onWarn?.()   }
        if (n <= 0   && !expireRef.current) { expireRef.current = true; clearInterval(iv); onExpire?.(); return 0 }
        return n
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [totalSeconds])

  const m = Math.floor(secs / 60), s = secs % 60
  const pct    = (secs / totalSeconds) * 100
  const warn   = secs <= 300 && secs > 60
  const danger = secs <= 60

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all',
      danger ? 'bg-danger-light border-danger animate-pulse' :
      warn   ? 'bg-amber-light border-amber' : 'bg-brand-50 border-brand-200'
    )}>
      <Clock size={14} className={danger ? 'text-danger' : warn ? 'text-amber' : 'text-brand-600'} />
      <div className="flex flex-col gap-0.5">
        <span className={cn(
          'text-sm font-bold tabular-nums',
          danger ? 'text-danger' : warn ? 'text-amber' : 'text-brand-700'
        )}>
          {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </span>
        <div className="w-16 h-1 bg-white/60 rounded-full overflow-hidden">
          <div className={cn(
            'h-full rounded-full transition-all duration-1000',
            danger ? 'bg-danger' : warn ? 'bg-amber' : 'bg-brand-500'
          )} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

// ── Hint reveal button ─────────────────────────────────────────────────────
// Standalone so state resets per-question when key changes
function HintButton({ hint }) {
  const [open, setOpen] = useState(false)
  if (!hint?.trim()) return null
  return open ? (
    <div className="flex items-start gap-2 bg-amber-light border border-amber/25 rounded-xl px-4 py-3">
      <span className="text-sm flex-shrink-0">💡</span>
      <p className="text-sm text-amber leading-relaxed flex-1">{hint}</p>
      <button
        onClick={() => setOpen(false)}
        className="text-amber/50 hover:text-amber text-lg leading-none flex-shrink-0"
      >×</button>
    </div>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-2 text-xs font-bold text-amber bg-amber-light border border-amber/25 px-3 py-2 rounded-xl hover:bg-amber/20 transition-colors self-start"
    >
      💡 Show Hint
    </button>
  )
}

// ── Past review screen (from history) ─────────────────────────────────────
function PastReviewScreen({ entry, onBack }) {
  const { questions = [], answers = {}, title, subject } = entry
  const [idx, setIdx] = useState(0)
  const q = questions[idx]
  if (!q) return null

  const sa      = answers[idx] ?? ''
  const ok      = sa.toUpperCase() === (q.answer ?? '').toUpperCase()
  const total   = questions.length

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex flex-col">
      <div className="bg-brand-900 px-4 py-4 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={onBack} className="text-white/60 hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{title}</p>
          <p className="text-white/40 text-xs">Reviewing Q{idx + 1} of {total}</p>
        </div>
        <div className="w-20 flex-shrink-0">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber rounded-full transition-all"
              style={{ width: `${((idx + 1) / total) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full flex flex-col gap-5">
        <QuestionReviewCard
          q={q}
          idx={idx}
          total={total}
          studentAnswer={sa}
          isCorrect={ok}
          subject={entry.subject}
        />
        <ReviewNav idx={idx} total={total} onPrev={() => setIdx(i => i - 1)} onNext={() => setIdx(i => i + 1)} onDone={onBack} />
      </div>
    </div>
  )
}

// ── Shared question review card ────────────────────────────────────────────
// Used by both PastReviewScreen and the live ReviewScreen.
// Key prop on HintButton ensures hint state resets on each new question.
function QuestionReviewCard({ q, idx, total, studentAnswer: sa, isCorrect: ok, subject }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Result banner */}
      <div className={cn(
        'flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2',
        ok
          ? 'bg-success-light border-success/30 text-success'
          : 'bg-danger-light border-danger/30 text-danger'
      )}>
        {ok
          ? <CheckCircle size={20} className="flex-shrink-0" />
          : <XCircle    size={20} className="flex-shrink-0" />}
        <span className="text-sm font-bold">
          {ok ? 'Correct!' : 'Incorrect'}
        </span>
        <span className="text-xs opacity-60 ml-auto">
          Question {idx + 1} of {total}
        </span>
      </div>

      {/* Question text */}
      <div className="bg-white border border-border rounded-2xl px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-3">Question</p>
        <p className="text-base font-semibold text-ink leading-relaxed">
          <MathRenderer text={q.text} />
        </p>
      </div>

      {/* Answer options */}
      {q.options?.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {q.options.map((opt, oi) => {
            const letter     = String.fromCharCode(65 + oi)
            const optLetter  = opt.trim().charAt(0)
            const isCorrect  = letter === q.answer || optLetter === q.answer
            const isStudent  = letter === sa       || optLetter === sa

            let style = 'border-border bg-white text-ink-4'
            let badge = null

            if (isCorrect && isStudent) {
              style = 'border-success bg-success-light text-success font-semibold'
              badge = <span className="text-xs font-bold ml-auto flex-shrink-0">✓ Correct</span>
            } else if (isCorrect) {
              style = 'border-success/60 bg-success-light/60 text-success'
              badge = <span className="text-xs font-bold ml-auto flex-shrink-0 opacity-80">✓ Correct answer</span>
            } else if (isStudent) {
              style = 'border-danger bg-danger-light text-danger font-semibold'
              badge = <span className="text-xs font-bold ml-auto flex-shrink-0">✗ Your answer</span>
            }

            return (
              <div key={oi} className={cn('flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-sm', style)}>
                <span className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  isCorrect && isStudent ? 'bg-success text-white' :
                  isCorrect             ? 'bg-success/60 text-white' :
                  isStudent             ? 'bg-danger text-white' :
                                          'bg-surface text-ink-4'
                )}>
                  {letter}
                </span>
                <span className="flex-1 leading-relaxed">
                  <MathRenderer text={opt.replace(/^[A-D]\.\s*/, '')} />
                </span>
                {badge}
              </div>
            )
          })}
        </div>
      )}

      {/* Hint — hidden behind button, key resets state per question */}
      <HintButton key={`hint-${idx}`} hint={q.hint} />

      {/* Explanation */}
      {q.explanation?.trim() && (
        <ExplanationRenderer
          explanation={q.explanation}
          hint={null}    /* hint handled separately above */
          subject={subject}
          showClosing={true}
        />
      )}
    </div>
  )
}

// ── Review nav buttons ─────────────────────────────────────────────────────
function ReviewNav({ idx, total, onPrev, onNext, onDone }) {
  return (
    <div className="flex items-center justify-between gap-3 pb-6">
      <button
        onClick={onPrev}
        disabled={idx === 0}
        className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-border text-sm font-semibold text-ink disabled:opacity-40 hover:bg-surface transition-colors"
      >
        <ChevronLeft size={15} /> Previous
      </button>

      {/* Question dots */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-[140px]">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0 transition-all',
              i === idx ? 'bg-brand-800 w-4' : 'bg-border'
            )}
          />
        ))}
      </div>

      {idx < total - 1 ? (
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          Next <ChevronRight size={15} />
        </button>
      ) : (
        <button
          onClick={onDone}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber text-brand-900 text-sm font-bold hover:bg-amber/90 transition-colors"
        >
          Done ✓
        </button>
      )}
    </div>
  )
}

// ── Start screen ───────────────────────────────────────────────────────────
function StartScreen({ assessment, onStart }) {
  const [name,         setName]         = useState('')
  const [showHistory,  setShowHistory]  = useState(false)
  const [reviewEntry,  setReviewEntry]  = useState(null)
  const [historyCount, setHistoryCount] = useState(0)

  useEffect(() => { setHistoryCount(loadHistory().length) }, [])

  const canStart = name.trim().length >= 2

  if (reviewEntry) {
    return <PastReviewScreen entry={reviewEntry} onBack={() => setReviewEntry(null)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-md flex flex-col gap-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          <div className="bg-gradient-to-br from-brand-900 to-brand-700 px-7 pt-7 pb-6">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 mb-4">
              <div className="w-5 h-5 rounded-full bg-amber flex items-center justify-center">
                <span className="text-[10px] font-bold text-brand-900">G</span>
              </div>
              <span className="text-xs font-semibold text-white/80">GradeMee Assessment</span>
            </div>
            <h1 className="font-display text-xl font-bold text-white mb-2 leading-snug">
              {assessment.title}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium bg-white/10 text-white/70 px-2.5 py-1 rounded-full">
                📝 {assessment.questions?.length ?? 0} questions
              </span>
              {assessment.subject && (
                <span className="text-xs font-medium bg-white/10 text-white/70 px-2.5 py-1 rounded-full capitalize">
                  {assessment.subject.replace(/_/g, ' ')}
                </span>
              )}
              {assessment.time_limit_mins && (
                <span className="text-xs font-semibold bg-amber/20 text-amber px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock size={10} /> {assessment.time_limit_mins}m
                </span>
              )}
            </div>
          </div>

          <div className="px-7 py-6 flex flex-col gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-ink mb-0.5">Enter your full name</h2>
              <p className="text-sm text-ink-3">Your teacher will see your results.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && canStart) onStart(name.trim()) }}
                placeholder="e.g. Ayomide Bello"
                autoComplete="name"
                autoFocus
                className="w-full px-4 py-4 bg-surface border-2 border-border rounded-2xl text-base text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
              />
              <p className="text-xs text-ink-4 px-1 leading-relaxed">
                Please enter your first and last name so your teacher can identify you correctly.
              </p>
            </div>
            {assessment.time_limit_mins && (
              <div className="bg-amber-light border border-amber/20 rounded-xl px-4 py-3 text-xs text-amber leading-relaxed">
                ⚠️ This assessment has a {assessment.time_limit_mins}-minute timer. It starts when you click Begin.
              </div>
            )}
            <button
              onClick={() => canStart && onStart(name.trim())}
              disabled={!canStart}
              className="w-full py-4 bg-brand-900 text-white font-bold text-base rounded-2xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Begin Assessment →
            </button>
          </div>
        </div>

        {historyCount > 0 && (
          <button onClick={() => setShowHistory(true)}
            className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-2xl border border-white/20 transition-colors">
            <History size={15} /> View Past Assessments ({historyCount})
          </button>
        )}
        <p className="text-center text-xs text-white/30">
          Powered by <span className="font-semibold text-white/50">GradeMee</span>
        </p>
      </div>

      {showHistory && (
        <HistoryPanel
          studentName={name.trim() || null}
          onReviewPast={(e) => { setReviewEntry(e); setShowHistory(false) }}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}

// ── History panel ──────────────────────────────────────────────────────────
function HistoryPanel({ studentName, onReviewPast, onClose }) {
  const history = loadHistory().filter(
    (h) => !studentName || h.studentName?.toLowerCase() === studentName.toLowerCase()
  )
  if (!history.length) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Past Assessments</h2>
            <p className="text-xs text-ink-4 mt-0.5">{history.length} saved on this device</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-border">
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {history.map((entry, i) => {
            const pct   = entry.score ?? Math.round((entry.correct / entry.total) * 100)
            const color = pct >= 75 ? 'text-success' : pct >= 50 ? 'text-amber' : 'text-danger'
            const date  = new Date(entry.completedAt).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })
            return (
              <button key={i} onClick={() => onReviewPast(entry)}
                className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-white hover:border-brand-300 hover:bg-brand-50/30 text-left transition-all">
                <div className="relative flex-shrink-0">
                  <ScoreRing pct={pct} size={52} />
                  <div className={cn('absolute inset-0 flex items-center justify-center text-xs font-bold', color)}>
                    {pct}%
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink truncate">{entry.title}</p>
                  <p className="text-xs text-ink-4 mt-0.5">{entry.correct}/{entry.total} correct · {date}</p>
                </div>
                <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1.5 rounded-lg flex-shrink-0">
                  Review →
                </span>
              </button>
            )
          })}
          <button onClick={() => { clearHistory(); onClose() }}
            className="mt-1 w-full py-2.5 text-xs font-semibold text-danger border border-danger/20 rounded-xl hover:bg-danger-light transition-colors">
            Clear all history
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Test screen ────────────────────────────────────────────────────────────
function TestScreen({ assessment, studentName, onSubmit, timedOut }) {
  const questions  = assessment.questions ?? []
  const [answers,  setAnswers]  = useState({})
  const [current,  setCurrent]  = useState(0)
  const [showWarn, setShowWarn] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const startTime  = useRef(Date.now())
  const answered   = Object.keys(answers).length
  const q          = questions[current]

  useEffect(() => {
    if (timedOut && !submitting) handleSubmit(true)
  }, [timedOut])

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting) return
    if (!auto && answered < questions.length) {
      if (!confirm(`You've answered ${answered} of ${questions.length}. Submit anyway?`)) return
    }
    setSubmitting(true)
    const timeTakenSecs = Math.round((Date.now() - startTime.current) / 1000)
    onSubmit(answers, timeTakenSecs)
  }, [answers, answered, questions.length, submitting, onSubmit])

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex flex-col">

      {/* Top bar */}
      <div className="bg-brand-900 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-lg">
        <div>
          <p className="text-white font-semibold text-sm">{studentName}</p>
          <p className="text-white/40 text-xs">{assessment.title} · {answered}/{questions.length} answered</p>
        </div>
        {assessment.time_limit_mins && (
          <div className="flex-1 max-w-[200px] mx-3">
            <CountdownTimer
              totalSeconds={assessment.time_limit_mins * 60}
              onExpire={() => handleSubmit(true)}
              onWarn={() => setShowWarn(true)}
            />
          </div>
        )}
        <div className="text-right flex-shrink-0">
          <p className="text-white/60 text-xs mb-1">Q{current + 1}/{questions.length}</p>
          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber rounded-full transition-all duration-300"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* 5-min warning */}
      {showWarn && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-amber text-brand-900 rounded-2xl px-5 py-4 shadow-xl flex items-center gap-4 max-w-sm w-full pointer-events-auto">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm">5 minutes remaining!</p>
              <p className="text-xs opacity-70 mt-0.5">Review your answers now.</p>
            </div>
            <button onClick={() => setShowWarn(false)} className="text-xl font-bold opacity-60 hover:opacity-100">×</button>
          </div>
        </div>
      )}

      {/* Question dots */}
      <div className="flex gap-1.5 px-4 py-3 overflow-x-auto bg-white border-b border-border">
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={cn(
              'w-8 h-8 rounded-full text-xs font-bold flex-shrink-0 transition-all border-2',
              i === current
                ? 'bg-brand-800 text-white border-brand-800'
                : answers[i] !== undefined
                ? 'bg-success-light text-success border-success/30'
                : 'bg-surface text-ink-4 border-border'
            )}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      {q && (
        <div className="flex-1 px-4 py-7 max-w-2xl mx-auto w-full">
          <div className="flex flex-col gap-5">

            <div className="bg-white border border-border rounded-2xl px-5 py-5">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-3">
                Question {current + 1} of {questions.length}
              </p>
              <p className="text-lg font-semibold text-ink leading-relaxed">
                <MathRenderer text={q.text} />
              </p>
            </div>

            {/* Hint — hidden behind button; key resets state between questions */}
            <HintButton key={`test-hint-${current}`} hint={q.hint} />

            {/* MCQ options */}
            <div className="flex flex-col gap-3">
              {q.options?.map((opt, oi) => {
                const letter = String.fromCharCode(65 + oi)
                const sel    = answers[current] === letter
                return (
                  <button key={oi}
                    onClick={() => setAnswers((p) => ({ ...p, [current]: letter }))}
                    className={cn(
                      'flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all',
                      sel ? 'border-brand-600 bg-brand-50 shadow-sm' : 'border-border bg-white hover:border-brand-300'
                    )}
                  >
                    <span className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors',
                      sel ? 'bg-brand-800 text-white' : 'bg-surface text-ink-4'
                    )}>{letter}</span>
                    <span className={cn('text-sm font-medium leading-relaxed', sel ? 'text-brand-800' : 'text-ink')}>
                      <MathRenderer text={opt.replace(/^[A-D]\.\s*/, '')} />
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Nav */}
            <div className="flex items-center justify-between pt-3">
              <button onClick={() => setCurrent((p) => Math.max(0, p - 1))} disabled={current === 0}
                className="px-5 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink disabled:opacity-40 hover:bg-surface transition-colors">
                ← Previous
              </button>
              {current < questions.length - 1 ? (
                <button onClick={() => setCurrent((p) => p + 1)}
                  className="px-5 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 transition-colors">
                  Next →
                </button>
              ) : (
                <button onClick={() => handleSubmit(false)} disabled={submitting}
                  className="px-7 py-2.5 rounded-xl bg-amber text-ink text-sm font-bold hover:bg-amber/90 disabled:opacity-60 transition-colors">
                  {submitting ? 'Submitting…' : `Submit (${answered}/${questions.length})`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Result screen ──────────────────────────────────────────────────────────
function ResultScreen({ score, correct, total, onReview }) {
  const pct = score ?? Math.round((correct / total) * 100)
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className={cn('px-7 py-8 text-center', pct >= 50 ? 'bg-success-light' : 'bg-danger-light')}>
          <div className="text-6xl mb-3">{pct >= 80 ? '🏆' : pct >= 60 ? '🎉' : pct >= 50 ? '👍' : '📚'}</div>
          <p className="font-display text-4xl font-extrabold text-ink mb-1">{pct}%</p>
          <p className={cn('font-semibold text-sm', pct >= 50 ? 'text-success' : 'text-danger')}>
            {pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort!' : pct >= 50 ? 'You passed!' : 'Keep practising!'}
          </p>
        </div>
        <div className="px-7 py-6 flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { val: correct,         label: 'Correct', color: 'text-success' },
              { val: total - correct, label: 'Wrong',   color: 'text-danger'  },
              { val: total,           label: 'Total',   color: 'text-ink'     },
            ].map((s, i) => (
              <div key={i} className="bg-surface rounded-2xl p-4">
                <p className={cn('font-display text-2xl font-bold', s.color)}>{s.val}</p>
                <p className="text-xs text-ink-4 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <button onClick={onReview}
            className="w-full py-3.5 bg-brand-900 text-white font-bold rounded-2xl hover:bg-brand-700 transition-colors">
            Review My Answers →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Review screen — question by question ───────────────────────────────────
function ReviewScreen({ assessment, answers, onDone }) {
  const questions = assessment.questions ?? []
  const [idx, setIdx] = useState(0)
  const q = questions[idx]
  if (!q) return null

  const sa  = answers[idx] ?? ''
  const ok  = sa.toUpperCase() === (q.answer ?? '').toUpperCase()

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex flex-col">

      {/* Top bar */}
      <div className="bg-brand-900 px-4 py-4 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={onDone} className="text-white/60 hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">Review — {assessment.title}</p>
          <p className="text-white/40 text-xs">Question {idx + 1} of {questions.length}</p>
        </div>
        {/* Progress bar */}
        <div className="w-24 flex-shrink-0">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-amber rounded-full transition-all"
              style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Question dots */}
      <div className="flex gap-1.5 px-4 py-3 overflow-x-auto bg-white border-b border-border">
        {questions.map((_, i) => {
          const a   = answers[i] ?? ''
          const cor = a.toUpperCase() === (questions[i].answer ?? '').toUpperCase()
          return (
            <button key={i} onClick={() => setIdx(i)}
              className={cn(
                'w-8 h-8 rounded-full text-xs font-bold flex-shrink-0 transition-all border-2',
                i === idx
                  ? 'bg-brand-800 text-white border-brand-800 scale-110'
                  : cor
                  ? 'bg-success-light text-success border-success/30'
                  : 'bg-danger-light text-danger border-danger/20'
              )}>
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Main content — key forces full remount on question change (resets hint state) */}
      <div key={idx} className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full flex flex-col gap-5">
        <QuestionReviewCard
          q={q}
          idx={idx}
          total={questions.length}
          studentAnswer={sa}
          isCorrect={ok}
          subject={assessment.subject}
        />
        <ReviewNav
          idx={idx}
          total={questions.length}
          onPrev={() => setIdx((i) => i - 1)}
          onNext={() => setIdx((i) => i + 1)}
          onDone={onDone}
        />
      </div>
    </div>
  )
}

// ── Root component ─────────────────────────────────────────────────────────
export default function StudentAssessment({ assessment }) {
  const sessionKey = useRef(getSessionKey())

  const [phase,       setPhase]       = useState('start')
  const [studentName, setStudentName] = useState('')
  const [answers,     setAnswers]     = useState({})
  const [result,      setResult]      = useState(null)
  const [timedOut,    setTimedOut]    = useState(false)

  const handleSubmit = useCallback(async (answersMap, timeTakenSecs) => {
    const questions = assessment.questions ?? []
    const ansArr    = Array.from({ length: questions.length }, (_, i) => answersMap[i] ?? '')
    let correct = 0
    for (let i = 0; i < questions.length; i++) {
      if ((ansArr[i] ?? '').toUpperCase() === (questions[i].answer ?? '').toUpperCase()) correct++
    }
    const score = Math.round((correct / questions.length) * 100)

    fetch('/api/submit', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        assessmentId:  assessment.id,
        studentName,
        answers:       ansArr,
        score,
        total:         questions.length,
        sessionKey:    sessionKey.current,
        timeTakenSecs: timeTakenSecs ?? null,
      }),
    }).catch(console.error)

    saveToHistory({
      slug:        assessment.slug,
      title:       assessment.title,
      subject:     assessment.subject,
      studentName,
      score,
      correct,
      total:       questions.length,
      completedAt: new Date().toISOString(),
      answers:     answersMap,
      questions:   questions.map((q) => ({
        text: q.text, options: q.options, answer: q.answer,
        hint: q.hint, explanation: q.explanation, type: q.type,
      })),
    })

    setAnswers(answersMap)
    setResult({ score, correct, total: questions.length })
    setPhase('result')
  }, [assessment, studentName])

  if (phase === 'start') {
    return <StartScreen assessment={assessment} onStart={(n) => { setStudentName(n); setPhase('test') }} />
  }
  if (phase === 'test') {
    return <TestScreen assessment={assessment} studentName={studentName} onSubmit={handleSubmit} timedOut={timedOut} />
  }
  if (phase === 'result' && result) {
    return <ResultScreen score={result.score} correct={result.correct} total={result.total} onReview={() => setPhase('review')} />
  }
  if (phase === 'review') {
    return <ReviewScreen assessment={assessment} answers={answers} onDone={() => setPhase('result')} />
  }
  return null
}