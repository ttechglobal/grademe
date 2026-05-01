'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Clock, AlertTriangle, CheckCircle, XCircle, CheckCircle2,
  History, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import MathRenderer        from '@/components/ui/MathRenderer'
import ExplanationRenderer from '@/components/ui/ExplanationRenderer'
import { gradeAnswer }     from '@/lib/gradeAnswer'
import { cn } from '@/lib/utils'

// ── Confetti — lightweight CSS-only particles for celebration ─────────────
function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id:    i,
    color: ['#f5a623', '#4db8b8', '#2da44e', '#e5534b', '#0f2e2e', '#ffecc4'][i % 6],
    left:  `${(i * 37) % 100}%`,
    delay: `${(i * 0.11) % 1}s`,
    dur:   `${2.5 + (i % 4) * 0.3}s`,
    size:  i % 3 === 0 ? 8 : 6,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10" aria-hidden="true">
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position:        'absolute',
            top:             '-10px',
            left:            p.left,
            width:           p.size,
            height:          p.size,
            backgroundColor: p.color,
            borderRadius:    p.id % 2 === 0 ? '50%' : '2px',
            animation:       `confetti-fall ${p.dur} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}

// ── Submit confirmation modal ──────────────────────────────────────────────
// Replaces window.confirm() — bottom sheet on mobile, centered modal on desktop.
function SubmitConfirmModal({ answered, total, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Sheet / Modal */}
      <div className={cn(
        'relative bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl',
        'px-6 pt-6 pb-8 shadow-2xl',
        'animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200'
      )}>
        {/* Drag handle — mobile only */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5 sm:hidden" />

        <div className="text-3xl mb-3">📋</div>
        <h2 className="font-display text-xl font-bold text-ink mb-2">
          Ready to submit?
        </h2>
        <p className="text-sm text-ink-3 leading-relaxed mb-6">
          You have answered <strong className="text-ink">{answered} of {total}</strong> questions.
          Once submitted you cannot change your answers.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-brand-900 text-white text-sm font-bold hover:bg-brand-700 transition-colors"
          >
            Submit Now →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Copy-protection hook ──────────────────────────────────────────────────
// Applied only on TestScreen and ReviewScreen — never on StartScreen.
// Cleans up all listeners automatically when the component unmounts.
function useCopyProtection(active = true) {
  useEffect(() => {
    if (!active) return

    const blockContext  = (e) => e.preventDefault()
    const blockDrag     = (e) => e.preventDefault()
    const blockShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) &&
          ['c', 'a', 'x', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', blockContext)
    document.addEventListener('dragstart',   blockDrag)
    document.addEventListener('keydown',     blockShortcut)

    return () => {
      document.removeEventListener('contextmenu', blockContext)
      document.removeEventListener('dragstart',   blockDrag)
      document.removeEventListener('keydown',     blockShortcut)
    }
  }, [active])
}


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
  const ok      = sa.toUpperCase() === (q.answer ?? '').toUpperCase()  // PastReview — type may not be stored, safe fallback
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
function QuestionReviewCard({ q, idx, total, studentAnswer: sa, isCorrect: ok, subject }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Per-question message */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl border-2',
        ok
          ? 'bg-success-light border-success/30 text-success'
          : 'bg-brand-50 border-brand-200 text-brand-700'
      )}>
        {ok
          ? <CheckCircle2 size={18} className="flex-shrink-0 text-success" />
          : <XCircle      size={18} className="flex-shrink-0 text-brand-500" />
        }
        <span className="text-sm font-semibold">
          {ok ? 'You got this one right! Great job.' : "Let's look at this one together."}
        </span>
      </div>

      {/* Question text */}
      <div className="bg-white border border-border rounded-2xl px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-3">Question</p>
        <p className="text-base font-semibold text-ink leading-relaxed">
          <MathRenderer text={q.text} />
        </p>
      </div>

      {/* Answer options — branched by question type */}
      {(q.type === 'truefalse' || q.question_type === 'true_false') ? (
        /* ── True/False review ──────────────────────────────────────────── */
        <div className="grid grid-cols-2 gap-3">
          {['True', 'False'].map((val) => {
            const isCorrect  = val.toLowerCase() === (q.answer ?? '').toLowerCase()
            const isStudent  = val.toLowerCase() === (sa ?? '').toLowerCase()

            let style = 'border-border bg-white text-ink-3'
            let badge = null

            if (isCorrect && isStudent) {
              style = 'border-success bg-success-light text-success font-semibold'
              badge = <span className="text-xs font-bold">✓ Correct</span>
            } else if (isCorrect) {
              style = 'border-success/60 bg-success-light/60 text-success'
              badge = <span className="text-xs font-bold opacity-80">✓ Correct answer</span>
            } else if (isStudent) {
              style = 'border-danger bg-danger-light text-danger font-semibold'
              badge = <span className="text-xs font-bold">✗ Your answer</span>
            }

            return (
              <div key={val} className={cn(
                'flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 text-center',
                style
              )}>
                {val === 'True'
                  ? <CheckCircle2 size={28} className={isCorrect && isStudent ? 'text-success' : isCorrect ? 'text-success' : isStudent ? 'text-danger' : 'text-ink-4'} />
                  : <XCircle      size={28} className={isCorrect && isStudent ? 'text-success' : isCorrect ? 'text-success' : isStudent ? 'text-danger' : 'text-ink-4'} />
                }
                <span className="text-base font-bold">{val}</span>
                {badge && <div className="text-xs">{badge}</div>}
              </div>
            )
          })}
        </div>
      ) : q.options?.length > 0 ? (
        /* ── MCQ review ─────────────────────────────────────────────────── */
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
      ) : null}

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

// ── Start screen — companion welcome ───────────────────────────────────────
function StartScreen({ assessment, onStart }) {
  const [name,         setName]         = useState('')
  const [showHistory,  setShowHistory]  = useState(false)
  const [reviewEntry,  setReviewEntry]  = useState(null)
  const [historyCount, setHistoryCount] = useState(0)
  const [phase,        setPhase]        = useState('welcome') // 'welcome' | 'transition'
  const [committed,    setCommitted]    = useState('')

  useEffect(() => { setHistoryCount(loadHistory().length) }, [])

  const greetingCopy = {
    quiz:       `You have a ${assessment.subject?.replace(/_/g, ' ') ?? ''} quiz! Ready to show what you know?`,
    test:       `You have a ${assessment.subject?.replace(/_/g, ' ') ?? ''} test. Read each question carefully.`,
    assignment: `You have a ${assessment.subject?.replace(/_/g, ' ') ?? ''} assignment. Take your time!`,
  }[assessment.assessment_type ?? 'quiz'] ?? "Let's get started!"

  // Resolve participant fields: use assessment.participant_fields if set, else Full Name only
  const participantFields = (assessment.participant_fields?.length > 0)
    ? assessment.participant_fields
    : [{ key: 'full_name', label: 'Full Name', required: true }]

  // Track a value for every field
  const [fieldValues, setFieldValues] = useState(() =>
    Object.fromEntries(participantFields.map((f) => [f.key, '']))
  )

  // name state stays as the canonical full_name (used by downstream logic)
  const fullNameValue = fieldValues['full_name'] ?? ''

  const canStart = fullNameValue.trim().length >= 2 &&
    participantFields
      .filter((f) => f.required && f.key !== 'full_name')
      .every((f) => (fieldValues[f.key] ?? '').trim().length > 0)

  const handleGo = () => {
    if (!canStart) return
    const trimmed = fullNameValue.trim()
    setCommitted(trimmed)
    setPhase('transition')
    // Pass all extra fields alongside the name so they're saved with the submission
    setTimeout(() => onStart(trimmed, fieldValues), 2000)
  }

  if (reviewEntry) {
    return <PastReviewScreen entry={reviewEntry} onBack={() => setReviewEntry(null)} />
  }

  // ── Transition screen ────────────────────────────────────────────────────
  if (phase === 'transition') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex flex-col items-center justify-center p-5">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber/20 flex items-center justify-center">
            <span className="text-3xl">✊</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">
              Hi {committed}!
            </p>
            <p className="text-white/70 text-base">
              You've got this. Let's begin!
            </p>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[0,1,2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-amber/60 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Welcome screen ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm flex flex-col items-center gap-5">

        {/* Card */}
        <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Greeting header */}
          <div className="bg-gradient-to-br from-brand-800 to-brand-900 px-7 pt-7 pb-6 text-center">
            <p className="text-2xl font-bold text-white mb-1">Hey there!</p>
            <p className="text-white/70 text-sm leading-relaxed">
              {greetingCopy}
            </p>
            {assessment.title && (
              <p className="text-amber/90 text-xs font-semibold mt-2 leading-relaxed">
                Topic: {assessment.title}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <span className="text-xs font-medium bg-white/10 text-white/70 px-2.5 py-1 rounded-full">
                {assessment.questions?.length ?? 0} questions
              </span>
              {assessment.time_limit_mins && (
                <span className="text-xs font-semibold bg-amber/20 text-amber px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock size={10} /> {assessment.time_limit_mins}m
                </span>
              )}
            </div>
          </div>

          {/* Name input */}
          <div className="px-7 py-6 flex flex-col gap-4">
            {/* Dynamic intake fields — label above input */}
            <div className="flex flex-col gap-4">
              <p className="text-xs text-ink-4">
                {participantFields.length > 1
                  ? 'Your details will be visible to your teacher.'
                  : 'Your name will be visible to your teacher.'}
              </p>
              {participantFields.map((field, i) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`field-${field.key}`}
                    className="text-sm font-semibold text-ink"
                  >
                    {field.label}
                    {field.required && (
                      <span className="text-danger ml-1" aria-hidden="true">*</span>
                    )}
                  </label>
                  <input
                    id={`field-${field.key}`}
                    type="text"
                    value={fieldValues[field.key] ?? ''}
                    onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && i === participantFields.length - 1) handleGo()
                    }}
                    placeholder={`Enter your ${field.label.toLowerCase()}`}
                    autoFocus={i === 0}
                    autoComplete={field.key === 'full_name' ? 'name' : 'off'}
                    required={field.required}
                    className="w-full px-4 py-4 bg-surface border-2 border-border rounded-2xl text-base text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>
              ))}
            </div>
            {assessment.time_limit_mins && (
              <div className="bg-amber-light border border-amber/20 rounded-xl px-4 py-3 text-xs text-amber leading-relaxed flex items-start gap-2">
                <Clock size={13} className="flex-shrink-0 mt-0.5" />
                This assessment has a {assessment.time_limit_mins}-minute timer. It starts when you begin.
              </div>
            )}
            <button
              onClick={handleGo}
              disabled={!canStart}
              className="w-full py-4 bg-brand-900 text-white font-bold text-base rounded-2xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              I'm Ready — Let's Go! →
            </button>
          </div>
        </div>

        {/* History button */}
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
  const questions    = assessment.questions ?? []
  const [answers,    setAnswers]    = useState({})
  const [current,    setCurrent]    = useState(0)
  const [showWarn,   setShowWarn]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const startTime    = useRef(Date.now())
  const answered     = Object.keys(answers).length
  const q            = questions[current]

  // Detect if current question is True/False — checks both type fields defensively
  const isTrueFalse = (question) =>
    question?.type === 'truefalse' ||
    question?.type === 'true_false' ||
    question?.question_type === 'true_false'

  // Current question has an answer selected
  const hasAnswer = answers[current] !== undefined

  useEffect(() => {
    if (timedOut && !submitting) doSubmit()
  }, [timedOut])

  // Called when the tutor confirms submission (or timer expires)
  const doSubmit = useCallback(() => {
    if (submitting) return
    setSubmitting(true)
    const timeTakenSecs = Math.round((Date.now() - startTime.current) / 1000)
    onSubmit(answers, timeTakenSecs)
  }, [answers, submitting, onSubmit])

  // Tap Submit button → show modal if any unanswered, else submit immediately
  const handleSubmitClick = useCallback(() => {
    if (submitting) return
    if (answered < questions.length) {
      setShowConfirm(true)
    } else {
      doSubmit()
    }
  }, [answered, questions.length, submitting, doSubmit])

  const handleSubmit = useCallback(async (auto = false) => {
    if (auto) { doSubmit(); return }
    handleSubmitClick()
  }, [doSubmit, handleSubmitClick])

  // Block copying during the assessment
  useCopyProtection(true)

  return (
    <div
      className="min-h-screen bg-[#f7f7f5] flex flex-col"
      style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
    >
      {/* Submit confirmation modal — replaces window.confirm() */}
      {showConfirm && (
        <SubmitConfirmModal
          answered={answered}
          total={questions.length}
          onConfirm={() => { setShowConfirm(false); doSubmit() }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

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
              {/* ── True/False question ─────────────────────────────────── */}
              {isTrueFalse(q) ? (
                <div className="grid grid-cols-2 gap-4">
                  {['True', 'False'].map((val) => {
                    const sel = answers[current] === val
                    return (
                      <button
                        key={val}
                        onClick={() => setAnswers((p) => ({ ...p, [current]: val }))}
                        className={cn(
                          'flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 text-left transition-all',
                          sel
                            ? val === 'True'
                              ? 'border-success bg-success-light shadow-sm'
                              : 'border-danger bg-danger-light shadow-sm'
                            : 'border-border bg-white hover:border-brand-300'
                        )}
                      >
                        {val === 'True'
                          ? <CheckCircle2 size={32} className={sel ? 'text-success' : 'text-ink-4'} />
                          : <XCircle      size={32} className={sel ? 'text-danger'  : 'text-ink-4'} />
                        }
                        <span className={cn(
                          'text-lg font-bold',
                          sel
                            ? val === 'True' ? 'text-success' : 'text-danger'
                            : 'text-ink'
                        )}>
                          {val}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                /* ── MCQ options ────────────────────────────────────────── */
                q.options?.map((opt, oi) => {
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
                })
              )}
            </div>

            {/* Nav */}
            <div className="flex items-center justify-between pt-3">
              <button onClick={() => setCurrent((p) => Math.max(0, p - 1))} disabled={current === 0}
                className="px-5 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink disabled:opacity-40 hover:bg-surface transition-colors">
                ← Previous
              </button>
              {current < questions.length - 1 ? (
                <button
                  onClick={() => setCurrent((p) => p + 1)}
                  disabled={!hasAnswer}
                  className="px-5 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmitClick}
                  disabled={submitting}
                  className="px-7 py-2.5 rounded-xl bg-amber text-ink text-sm font-bold hover:bg-amber/90 disabled:opacity-60 transition-colors"
                >
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

// ── Result screen — animated score ring + companion messaging ─────────────
function ResultScreen({ score, correct, total, onReview, studentName }) {
  const pct = score ?? Math.round((correct / total) * 100)
  const [displayed, setDisplayed] = useState(0)
  const [showConfetti, setShowConfetti] = useState(pct >= 80)

  // Count-up animation — ease-out over 1.5s
  useEffect(() => {
    const duration = 1500
    const start    = Date.now()
    const tick = () => {
      const elapsed  = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * pct))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [pct])

  // Stop confetti after 3 seconds
  useEffect(() => {
    if (!showConfetti) return
    const t = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(t)
  }, [showConfetti])

  const firstName = (studentName ?? '').split(' ')[0] || 'there'
  const ringColor = pct >= 80 ? '#2da44e' : pct >= 50 ? '#f5a623' : '#e5534b'
  const heading   = pct >= 80 ? `Amazing work, ${firstName}!`
                  : pct >= 50 ? `Well done, ${firstName}!`
                  : `Keep going, ${firstName}! 💪`
  const sub       = pct >= 80 ? `You scored ${pct}% — that's excellent! 🎉`
                  : pct >= 50 ? `You scored ${pct}%. You're getting there! Let's see where you can improve.`
                  : `You scored ${pct}%. Every attempt makes you stronger.`

  const radius = 52
  const circ   = 2 * Math.PI * radius
  const offset = circ - (displayed / 100) * circ

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex items-center justify-center p-5">
      {showConfetti && <Confetti />}

      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Animated score ring */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg width="144" height="144" className="-rotate-90">
            <circle cx="72" cy="72" r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
            <circle
              cx="72" cy="72" r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth="10"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.05s' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-bold text-white leading-none">{displayed}%</span>
            <span className="text-white/50 text-xs mt-1">Score</span>
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-xl font-bold text-white mb-1">{heading}</p>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">{sub}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { val: correct,         label: 'Correct', color: 'text-success' },
            { val: total - correct, label: 'Wrong',   color: 'text-danger'  },
            { val: total,           label: 'Total',   color: 'text-white'   },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-2xl py-4 text-center">
              <p className={cn('font-display text-2xl font-bold', s.color)}>{s.val}</p>
              <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Action */}
        <div className="w-full">
          <button
            onClick={onReview}
            className="w-full py-3.5 bg-white text-brand-900 font-bold rounded-2xl hover:bg-white/90 transition-colors"
          >
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
  // Block copying on the review screen
  useCopyProtection(true)
  const q = questions[idx]
  if (!q) return null

  const sa  = answers[idx] ?? ''
  const ok  = gradeAnswer(sa, q.answer, q.type ?? q.question_type)

  return (
    <div
      className="min-h-screen bg-[#f7f7f5] flex flex-col"
      style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
    >

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
          const cor = gradeAnswer(a, questions[i].answer, questions[i].type ?? questions[i].question_type)
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
      if (gradeAnswer(ansArr[i], questions[i].answer, questions[i].type ?? questions[i].question_type)) correct++
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
    return <ResultScreen score={result.score} correct={result.correct} total={result.total} studentName={studentName} onReview={() => setPhase('review')} />
  }
  if (phase === 'review') {
    return <ReviewScreen assessment={assessment} answers={answers} onDone={() => setPhase('result')} />
  }
  return null
}