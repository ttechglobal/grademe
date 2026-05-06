'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Clock, AlertTriangle, CheckCircle2,
  XCircle, History, ChevronLeft, ChevronRight,
} from 'lucide-react'
import MathRenderer        from '@/components/ui/MathRenderer'
import ExplanationRenderer from '@/components/ui/ExplanationRenderer'
import MathAnswerInput     from '@/components/student/MathAnswerInput'
import { gradeAnswer }     from '@/lib/gradeAnswer'
import { cn } from '@/lib/utils'

// ─── Type helpers ──────────────────────────────────────────────────────────────
function isCalcQ(q) {
  return q?.type === 'calculation' || q?.question_type === 'calculation'
}
function isTFQ(q) {
  return (
    q?.type === 'truefalse'    ||
    q?.type === 'true_false'   ||
    q?.question_type === 'true_false'
  )
}

// Question text — DB column is question_text; history entries use text
function qText(q) {
  return q?.question_text || q?.text || ''
}

// Grade a calculation question: every box must match accepted[]
function gradeCalc(boxValues, template) {
  if (!template?.structure?.length) return false
  const vals = (typeof boxValues === 'object' && boxValues !== null) ? boxValues : {}
  return template.structure.every((item) => {
    const student  = (vals[item.id] ?? '').trim().toLowerCase()
    const accepted = (item.accepted ?? [item.answer]).map((a) => String(a).trim().toLowerCase())
    return accepted.includes(student)
  })
}

// True if every box in the template has a non-empty value
function calcFullyAnswered(boxValues, template) {
  if (!template?.structure?.length) return false
  const vals = (typeof boxValues === 'object' && boxValues !== null) ? boxValues : {}
  return template.structure.every((item) => (vals[item.id] ?? '').trim().length > 0)
}

// Build { [boxId]: 'correct' | 'wrong' } for MathAnswerInput results mode
function calcBoxResults(boxValues, template) {
  if (!template?.structure?.length) return {}
  const vals = (typeof boxValues === 'object' && boxValues !== null) ? boxValues : {}
  return Object.fromEntries(
    template.structure.map((item) => {
      const student  = (vals[item.id] ?? '').trim().toLowerCase()
      const accepted = (item.accepted ?? [item.answer]).map((a) => String(a).trim().toLowerCase())
      return [item.id, accepted.includes(student) ? 'correct' : 'wrong']
    })
  )
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
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
        <div key={p.id} style={{
          position: 'absolute', top: '-10px', left: p.left,
          width: p.size, height: p.size, backgroundColor: p.color,
          borderRadius: p.id % 2 === 0 ? '50%' : '2px',
          animation: `confetti-fall ${p.dur} ${p.delay} ease-in forwards`,
        }} />
      ))}
    </div>
  )
}

// ─── Submit confirmation modal ─────────────────────────────────────────────────
function SubmitConfirmModal({ answered, total, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className={cn(
        'relative bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl',
        'px-6 pt-6 pb-8 shadow-2xl',
        'animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200'
      )}>
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5 sm:hidden" />
        <div className="text-3xl mb-3">📋</div>
        <h2 className="font-display text-xl font-bold text-ink mb-2">Ready to submit?</h2>
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

// ─── Copy-protection hook ──────────────────────────────────────────────────────
function useCopyProtection(active = true) {
  useEffect(() => {
    if (!active) return
    const blockContext  = (e) => e.preventDefault()
    const blockDrag     = (e) => e.preventDefault()
    const blockShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'a', 'x', 'u'].includes(e.key.toLowerCase())) {
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

// ─── Storage helpers ───────────────────────────────────────────────────────────
const HISTORY_KEY = 'grademee_student_history'
const MAX_HISTORY = 30

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
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') }
  catch { return [] }
}

function getSessionKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ─── Countdown timer ───────────────────────────────────────────────────────────
function CountdownTimer({ totalSeconds, onExpire, onWarn }) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const warned = useRef(false)

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => {
        const next = r - 1
        if (!warned.current && next <= 300) { warned.current = true; onWarn?.() }
        if (next <= 0) { clearInterval(id); onExpire?.() }
        return Math.max(0, next)
      })
    }, 1000)
    return () => clearInterval(id)
  }, [onExpire, onWarn])

  const m      = Math.floor(remaining / 60)
  const s      = remaining % 60
  const pct    = (remaining / totalSeconds) * 100
  const danger = remaining <= 60
  const warn   = remaining <= 300 && !danger

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors',
      danger ? 'bg-red-50 border-red-300 animate-pulse' :
      warn   ? 'bg-amber/10 border-amber/30'            : 'bg-surface border-border'
    )}>
      <Clock size={14} className={danger ? 'text-red-500' : warn ? 'text-amber' : 'text-brand-500'} />
      <div className="flex flex-col gap-0.5">
        <span className={cn(
          'text-sm font-bold tabular-nums',
          danger ? 'text-red-600' : warn ? 'text-amber' : 'text-brand-700'
        )}>
          {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </span>
        <div className="w-16 h-1 bg-white/60 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-1000',
              danger ? 'bg-red-500' : warn ? 'bg-amber' : 'bg-brand-500'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Hint reveal button ────────────────────────────────────────────────────────
function HintButton({ hint }) {
  const [open, setOpen] = useState(false)
  if (!hint?.trim()) return null
  return open ? (
    <div className="flex items-start gap-2 bg-amber/10 border border-amber/25 rounded-xl px-4 py-3">
      <span className="text-sm flex-shrink-0">💡</span>
      <p className="text-sm text-amber leading-relaxed flex-1">{hint}</p>
      <button
        onClick={() => setOpen(false)}
        className="text-amber/50 hover:text-amber text-lg leading-none flex-shrink-0"
      >
        ×
      </button>
    </div>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-2 text-xs font-bold text-amber bg-amber/10 border border-amber/25 px-3 py-2 rounded-xl hover:bg-amber/20 transition-colors self-start"
    >
      💡 Show Hint
    </button>
  )
}

// ─── Review nav buttons ────────────────────────────────────────────────────────
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

      <div className="flex items-center gap-1.5 overflow-x-auto max-w-[140px]">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={cn(
            'w-2 h-2 rounded-full flex-shrink-0 transition-all',
            i === idx ? 'bg-brand-800 w-4' : 'bg-border'
          )} />
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

// ─── Shared question review card ───────────────────────────────────────────────
function QuestionReviewCard({ q, idx, total, studentAnswer: sa, isCorrect: ok, subject }) {
  const isCalc = isCalcQ(q)
  const isTF   = isTFQ(q)
  const boxRes = isCalc ? calcBoxResults(sa, q.answer_template) : {}

  return (
    <div className="flex flex-col gap-4">
      {/* Status badge */}
      <div className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold self-start',
        ok ? 'bg-green-50 text-green-600 border border-green-200'
           : 'bg-red-50 text-red-500 border border-red-200'
      )}>
        {ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
        {ok ? 'Correct' : 'Incorrect'} — Q{idx + 1} of {total}
      </div>

      {/* Question text */}
      <div className="bg-white border border-border rounded-2xl px-5 py-5">
        <p className="text-lg font-semibold text-ink leading-relaxed">
          <MathRenderer text={qText(q)} />
        </p>
      </div>

      {/* Answer area */}
      {isCalc ? (
        <div className="bg-white border border-border rounded-2xl px-5 py-5">
          <p className="text-sm font-semibold text-ink-3 mb-4">Your answer</p>
          <MathAnswerInput
            template={q.answer_template}
            values={typeof sa === 'object' && sa !== null ? sa : {}}
            onChange={() => {}}
            readOnly
            result={boxRes}
          />
        </div>
      ) : isTF ? (
        <div className="grid grid-cols-2 gap-3">
          {['True', 'False'].map((val) => {
            const isAns = val.toLowerCase() === (q.answer ?? '').toLowerCase()
            const isStu = val.toLowerCase() === (sa ?? '').toString().toLowerCase()
            return (
              <div key={val} className={cn(
                'flex flex-col items-center gap-2 py-5 rounded-2xl border-2 text-base font-semibold',
                isAns && isStu  ? 'border-success bg-success-light text-success' :
                isAns && !isStu ? 'border-success/50 bg-success-light/50 text-success' :
                !isAns && isStu ? 'border-danger bg-danger-light text-danger' :
                                  'border-border text-ink-4'
              )}>
                <span className="text-2xl">{val === 'True' ? '✅' : '❌'}</span>
                <span>{val}</span>
                {isAns  && <span className="text-xs font-bold">✓ Correct</span>}
                {!isAns && isStu && <span className="text-xs font-bold">Your answer</span>}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {q.options?.map((opt, oi) => {
            const letter    = String.fromCharCode(65 + oi)
            const optLetter = opt.charAt(0)
            const isAnswer  = optLetter === q.answer || letter === q.answer
            const isStudent = optLetter === sa        || letter === sa
            const badge     = isAnswer && isStudent ? '✓ Correct' : isAnswer ? '✓ Correct answer' : isStudent ? '✗ Your answer' : null
            return (
              <div key={oi} className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm',
                isAnswer && isStudent  ? 'border-success bg-success-light text-success font-semibold' :
                isAnswer && !isStudent ? 'border-success/40 bg-success-light/50 text-success' :
                isStudent && !isAnswer ? 'border-danger bg-danger-light text-danger font-semibold' :
                                         'border-border text-ink-4'
              )}>
                <span className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                  isAnswer && isStudent ? 'bg-green-500 text-white' :
                  isAnswer              ? 'bg-green-400 text-white' :
                  isStudent             ? 'bg-red-500   text-white' : 'bg-surface text-ink-4'
                )}>
                  {letter}
                </span>
                <span className="flex-1 leading-relaxed">
                  <MathRenderer text={opt.replace(/^[A-D]\.\s*/, '')} />
                </span>
                {badge && <span className="text-xs font-bold ml-auto flex-shrink-0">{badge}</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* Hint */}
      <HintButton key={`hint-${idx}`} hint={q.hint} />

      {/* Explanation */}
      {q.explanation?.trim() && (
        <ExplanationRenderer
          explanation={q.explanation}
          hint={null}
          subject={subject}
          showClosing
        />
      )}
    </div>
  )
}

// ─── Past review screen (from localStorage history) ───────────────────────────
function PastReviewScreen({ entry, onBack }) {
  const { questions = [], answers = {}, title, subject } = entry
  const [idx, setIdx] = useState(0)
  const q     = questions[idx]
  const total = questions.length
  if (!q) return null

  const sa = answers[idx] ?? ''
  const ok = isCalcQ(q)
    ? gradeCalc(sa, q.answer_template)
    : gradeAnswer(sa ?? '', q.answer, q.type ?? q.question_type)

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
            <div
              className="h-full bg-amber rounded-full transition-all"
              style={{ width: `${((idx + 1) / total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full flex flex-col gap-5">
        <QuestionReviewCard
          q={q} idx={idx} total={total}
          studentAnswer={sa} isCorrect={ok} subject={subject}
        />
        <ReviewNav
          idx={idx} total={total}
          onPrev={() => setIdx((i) => i - 1)}
          onNext={() => setIdx((i) => i + 1)}
          onDone={onBack}
        />
      </div>
    </div>
  )
}

// ─── Review screen (post-result, all questions) ────────────────────────────────
function ReviewAllScreen({ assessment, answers, onDone }) {
  const questions = assessment.questions ?? []
  const [idx, setIdx] = useState(0)
  useCopyProtection(true)
  const q = questions[idx]
  if (!q) return null

  const sa = answers[idx]
  const ok = isCalcQ(q)
    ? gradeCalc(sa, q.answer_template)
    : gradeAnswer(sa ?? '', q.answer, q.type ?? q.question_type)

  return (
    <div
      className="min-h-screen bg-[#f7f7f5] flex flex-col"
      style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
    >
      <div className="bg-brand-900 px-4 py-4 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={onDone} className="text-white/60 hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">Review — {assessment.title}</p>
          <p className="text-white/40 text-xs">Question {idx + 1} of {questions.length}</p>
        </div>
        <div className="w-24 flex-shrink-0">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber rounded-full transition-all"
              style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question dots */}
      <div className="flex gap-1.5 px-4 py-3 overflow-x-auto bg-white border-b border-border">
        {questions.map((ques, i) => {
          const a = answers[i]
          const c = isCalcQ(ques)
            ? gradeCalc(a, ques.answer_template)
            : gradeAnswer(a ?? '', ques.answer, ques.type ?? ques.question_type)
          return (
            <button key={i} onClick={() => setIdx(i)}
              className={cn(
                'w-8 h-8 rounded-full text-xs font-bold flex-shrink-0 transition-all border-2',
                i === idx ? 'bg-brand-800 text-white border-brand-800 scale-110' :
                c         ? 'bg-green-50 text-green-600 border-green-300' :
                            'bg-red-50 text-red-500 border-red-200'
              )}>
              {i + 1}
            </button>
          )
        })}
      </div>

      <div key={idx} className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full flex flex-col gap-5">
        <QuestionReviewCard
          q={q} idx={idx} total={questions.length}
          studentAnswer={sa} isCorrect={ok} subject={assessment.subject}
        />
        <ReviewNav
          idx={idx} total={questions.length}
          onPrev={() => setIdx((i) => i - 1)}
          onNext={() => setIdx((i) => i + 1)}
          onDone={onDone}
        />
      </div>
    </div>
  )
}

// ─── Result screen ─────────────────────────────────────────────────────────────
function ResultScreen({ score, correct, total, onReview }) {
  const pct       = score ?? 0
  const isPerfect = pct === 100

  const grade =
    pct >= 90 ? { emoji: '🏆', label: 'Outstanding!',    sub: 'You nailed it. Perfect performance!' }      :
    pct >= 75 ? { emoji: '🎉', label: 'Great job!',       sub: 'Really solid performance. Well done!' }     :
    pct >= 60 ? { emoji: '👍', label: 'Good effort!',     sub: 'You are on the right track. Keep going!' }  :
    pct >= 40 ? { emoji: '📚', label: 'Keep practising!', sub: 'Review the explanations to improve.' }      :
                { emoji: '🌱', label: "Don't give up!",   sub: 'Everyone improves with practice.' }

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex flex-col items-center justify-center px-4 py-10">
      {isPerfect && <Confetti />}
      <div className="w-full max-w-sm flex flex-col gap-5">
        <div className="bg-white border border-border rounded-3xl px-6 py-8 text-center shadow-xl">
          <div className="text-5xl mb-3">{grade.emoji}</div>
          <p className="font-display text-4xl font-black text-ink mb-1">{pct}%</p>
          <p className="text-sm text-ink-3 mb-1">{correct} of {total} correct</p>
          <p className="text-base font-semibold text-brand-700 mb-4">{grade.label}</p>
          <p className="text-sm text-ink-3 mb-5">{grade.sub}</p>
          <div className="h-3 bg-surface rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-1000',
                pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber' : 'bg-red-500'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <button
          onClick={onReview}
          className="w-full py-3.5 rounded-2xl bg-brand-800 text-white font-bold hover:bg-brand-700 transition-colors"
        >
          Review Answers →
        </button>
        <p className="text-center text-xs text-ink-4">
          Tap any question dot to jump to it during review
        </p>
      </div>
    </div>
  )
}

// ─── Start screen ──────────────────────────────────────────────────────────────
function StartScreen({ assessment, onStart }) {
  const [showHistory,  setShowHistory]  = useState(false)
  const [reviewEntry,  setReviewEntry]  = useState(null)
  const [historyCount, setHistoryCount] = useState(0)
  const [phase,        setPhase]        = useState('welcome')
  const [committed,    setCommitted]    = useState('')

  useEffect(() => { setHistoryCount(loadHistory().length) }, [])

  const participantFields = (assessment.participant_fields?.length > 0)
    ? assessment.participant_fields
    : [{ key: 'full_name', label: 'Full Name', required: true }]

  const [fieldValues, setFieldValues] = useState(() =>
    Object.fromEntries(participantFields.map((f) => [f.key, '']))
  )

  const fullNameValue = fieldValues['full_name'] ?? ''

  const canStart =
    fullNameValue.trim().length >= 2 &&
    participantFields
      .filter((f) => f.required && f.key !== 'full_name')
      .every((f) => (fieldValues[f.key] ?? '').trim().length > 0)

  const handleGo = () => {
    if (!canStart) return
    const trimmed = fullNameValue.trim()
    setCommitted(trimmed)
    setPhase('transition')
    setTimeout(() => onStart(trimmed, fieldValues), 2000)
  }

  if (reviewEntry) {
    return <PastReviewScreen entry={reviewEntry} onBack={() => setReviewEntry(null)} />
  }

  if (phase === 'transition') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex flex-col items-center justify-center p-5">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber/20 flex items-center justify-center">
            <span className="text-3xl">✊</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-white mb-1">Hi {committed}!</p>
            <p className="text-white/70 text-base">You've got this. Let's begin!</p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i}
                className="w-2 h-2 rounded-full bg-white/30 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (showHistory) {
    const history = loadHistory()
    const mine    = history.filter((h) => h.slug === assessment.slug)
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700 flex flex-col items-center justify-start p-4 pt-10">
        <div className="w-full max-w-sm">
          <button
            onClick={() => setShowHistory(false)}
            className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-5 transition-colors"
          >
            <ChevronLeft size={15} /> Back
          </button>
          <h2 className="font-display text-xl font-bold text-white mb-4">Your Past Attempts</h2>
          {mine.length === 0 ? (
            <p className="text-sm text-white/50">No past attempts for this assessment.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {mine.map((entry, i) => (
                <button key={i} onClick={() => setReviewEntry(entry)}
                  className="bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-left hover:bg-white/20 transition-colors">
                  <p className="font-semibold text-white text-sm">{entry.studentName}</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {new Date(entry.completedAt).toLocaleDateString()}
                  </p>
                  <p className="text-2xl font-black text-amber mt-1">{entry.score}%</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="bg-white rounded-3xl px-6 py-8 shadow-2xl flex flex-col gap-5">
          <div>
            <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">
              {assessment.subject?.replace(/_/g, ' ')}
            </p>
            <h1 className="font-display text-2xl font-bold text-ink leading-snug">
              {assessment.title}
            </h1>
            <p className="text-sm text-ink-3 mt-1">
              {assessment.questions?.length} question{assessment.questions?.length !== 1 ? 's' : ''}
              {assessment.time_limit_mins ? ` · ${assessment.time_limit_mins} min` : ''}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {participantFields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  type="text"
                  value={fieldValues[field.key] ?? ''}
                  onChange={(e) => setFieldValues((p) => ({ ...p, [field.key]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canStart) handleGo() }}
                  placeholder={`Enter your ${field.label.toLowerCase()}`}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm text-ink placeholder:text-ink-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleGo}
            disabled={!canStart}
            className={cn(
              'w-full py-4 rounded-2xl text-base font-bold transition-all',
              canStart
                ? 'bg-brand-800 text-white hover:bg-brand-700 active:scale-[0.98]'
                : 'bg-border text-ink-4 cursor-not-allowed'
            )}
          >
            Start Assessment →
          </button>
        </div>

        {historyCount > 0 && (
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center justify-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors py-2"
          >
            <History size={14} /> View past attempts
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Question screen (test phase) ─────────────────────────────────────────────
function QuestionScreen({ assessment, studentName, answers, setAnswers, onSubmit, timedOut }) {
  const questions = assessment.questions ?? []

  const [current,     setCurrent]     = useState(0)
  const [showWarn,    setShowWarn]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const startTime = useRef(Date.now())

  const q      = questions[current]
  const isCalc = isCalcQ(q)
  const isTF   = isTFQ(q)

  const answered = questions.filter((ques, i) => {
    if (isCalcQ(ques)) return calcFullyAnswered(answers[i], ques.answer_template)
    return answers[i] !== undefined && answers[i] !== ''
  }).length

  const hasAnswer = isCalc
    ? calcFullyAnswered(answers[current], q?.answer_template)
    : answers[current] !== undefined

  useCopyProtection(true)

  useEffect(() => {
    if (timedOut && !submitting) doSubmit()
  }, [timedOut]) // eslint-disable-line react-hooks/exhaustive-deps

  const doSubmit = useCallback(() => {
    if (submitting) return
    setSubmitting(true)
    const timeTakenSecs = Math.round((Date.now() - startTime.current) / 1000)
    onSubmit(answers, timeTakenSecs)
  }, [answers, submitting, onSubmit])

  const handleSubmitClick = useCallback(() => {
    if (submitting) return
    if (answered < questions.length) {
      setShowConfirm(true)
    } else {
      doSubmit()
    }
  }, [answered, questions.length, submitting, doSubmit])

  const handleCalcChange = useCallback((boxId, val) => {
    setAnswers((prev) => ({
      ...prev,
      [current]: {
        ...(typeof prev[current] === 'object' && prev[current] !== null ? prev[current] : {}),
        [boxId]: val,
      },
    }))
  }, [current, setAnswers])

  if (!q) return null

  return (
    <div
      className="min-h-screen bg-[#f7f7f5] flex flex-col"
      style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
    >
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
          <p className="text-white/40 text-xs">
            {assessment.title} · {answered}/{questions.length} answered
          </p>
        </div>
        {assessment.time_limit_mins && (
          <div className="flex-1 max-w-[200px] mx-3">
            <CountdownTimer
              totalSeconds={assessment.time_limit_mins * 60}
              onExpire={doSubmit}
              onWarn={() => setShowWarn(true)}
            />
          </div>
        )}
        <div className="text-right flex-shrink-0">
          <p className="text-white/60 text-xs mb-1">Q{current + 1}/{questions.length}</p>
          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber rounded-full transition-all duration-300"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5-min warning toast */}
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
        {questions.map((ques, i) => {
          const isAnswered = isCalcQ(ques)
            ? calcFullyAnswered(answers[i], ques.answer_template)
            : answers[i] !== undefined && answers[i] !== ''
          return (
            <button key={i} onClick={() => setCurrent(i)}
              className={cn(
                'w-8 h-8 rounded-full text-xs font-bold flex-shrink-0 transition-all border-2',
                i === current
                  ? 'bg-brand-800 text-white border-brand-800'
                  : isAnswered
                  ? 'bg-green-50 text-green-600 border-green-300'
                  : 'bg-surface text-ink-4 border-border'
              )}>
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Question body */}
      <div key={current} className="flex-1 px-4 py-7 max-w-2xl mx-auto w-full">
        <div className="flex flex-col gap-5">

          {/* Question card */}
          <div className="bg-white border border-border rounded-2xl px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-3">
              Question {current + 1} of {questions.length}
            </p>
            <p className="text-lg font-semibold text-ink leading-relaxed">
              <MathRenderer text={qText(q)} />
            </p>
          </div>

          {/* Hint */}
          <HintButton key={`test-hint-${current}`} hint={q.hint} />

          {/* Answer input */}
          <div className="flex flex-col gap-3">

            {/* Calculation */}
            {isCalc && (
              <div
                className="bg-white border border-border rounded-2xl px-5 py-5"
                style={{ userSelect: 'text', WebkitUserSelect: 'text', MozUserSelect: 'text', msUserSelect: 'text' }}
              >
                <p className="text-sm font-semibold text-ink-3 mb-5">Fill in your answer</p>
                <MathAnswerInput
                  template={q.answer_template}
                  values={
                    typeof answers[current] === 'object' && answers[current] !== null
                      ? answers[current]
                      : {}
                  }
                  onChange={handleCalcChange}
                  readOnly={false}
                />
                {q.answer_template?.type === 'fraction' && (
                  <p className="text-xs text-ink-4 mt-4">
                    Enter the numerator (top number) and denominator (bottom number).
                  </p>
                )}
                {q.answer_template?.type === 'simultaneous' && (
                  <p className="text-xs text-ink-4 mt-4">
                    Solve for each variable and enter the values in the boxes.
                  </p>
                )}
              </div>
            )}

            {/* True / False */}
            {isTF && !isCalc && (
              <div className="grid grid-cols-2 gap-3">
                {['True', 'False'].map((val) => {
                  const sel = answers[current] === val
                  return (
                    <button
                      key={val}
                      onClick={() => setAnswers((p) => ({ ...p, [current]: val }))}
                      className={cn(
                        'flex flex-col items-center gap-2 py-6 rounded-2xl border-2 transition-all font-semibold',
                        sel
                          ? val === 'True'
                            ? 'border-success bg-success-light'
                            : 'border-danger bg-danger-light'
                          : 'border-border bg-white hover:border-brand-300'
                      )}
                    >
                      <span className="text-3xl">{val === 'True' ? '✅' : '❌'}</span>
                      <span className={cn(
                        'text-lg font-bold',
                        sel ? (val === 'True' ? 'text-success' : 'text-danger') : 'text-ink'
                      )}>
                        {val}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* MCQ */}
            {!isCalc && !isTF && (
              <div className="flex flex-col gap-3">
                {q.options?.map((opt, oi) => {
                  const letter    = String.fromCharCode(65 + oi)
                  const optLetter = opt.charAt(0)
                  const sel       = answers[current] === letter || answers[current] === optLetter
                  return (
                    <button
                      key={oi}
                      onClick={() => setAnswers((p) => ({ ...p, [current]: letter }))}
                      className={cn(
                        'flex items-center gap-3 w-full px-4 py-4 rounded-2xl border-2 text-left transition-all',
                        sel
                          ? 'border-brand-600 bg-surface shadow-sm'
                          : 'border-border bg-white hover:border-brand-300'
                      )}>
                      <span className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors',
                        sel ? 'bg-brand-800 text-white' : 'bg-surface text-ink-4'
                      )}>
                        {letter}
                      </span>
                      <span className={cn(
                        'text-sm font-medium leading-relaxed flex-1',
                        sel ? 'text-brand-800' : 'text-ink'
                      )}>
                        <MathRenderer text={opt.replace(/^[A-D]\.\s*/, '')} />
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-between pt-3">
            <button
              onClick={() => setCurrent((p) => Math.max(0, p - 1))}
              disabled={current === 0}
              className="px-5 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink disabled:opacity-40 hover:bg-surface transition-colors"
            >
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
    </div>
  )
}

// ─── Root component ────────────────────────────────────────────────────────────
export default function StudentAssessment({ assessment }) {
  const sessionKey = useRef(getSessionKey())

  const [phase,       setPhase]       = useState('start')
  const [studentName, setStudentName] = useState('')
  const [answers,     setAnswers]     = useState({})
  const [result,      setResult]      = useState(null)
  const [timedOut,    setTimedOut]    = useState(false) // eslint-disable-line no-unused-vars

  const handleSubmit = useCallback(async (answersMap, timeTakenSecs) => {
    const questions = assessment.questions ?? []

    // Client-side score calculation
    let correct = 0
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const a = answersMap[i]
      if (isCalcQ(q)) {
        if (gradeCalc(a, q.answer_template)) correct++
      } else {
        if (gradeAnswer(a ?? '', q.answer, q.type ?? q.question_type)) correct++
      }
    }
    const score = Math.round((correct / questions.length) * 100)


    // ✅ REPLACE WITH
    // Convert index-keyed answers { 0: 'A', 1: {boxId: val} }
    // to UUID-keyed { [question.id]: value } — route.js looks up by question.id
    const answersById = {}
    for (let i = 0; i < questions.length; i++) {
      const val = answersMap[i]
      answersById[questions[i].id] = (val !== undefined && val !== null) ? val : ''
    }

    // Fire-and-forget — server re-scores for integrity; this is just for speed
    fetch('/api/submit', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentId:  assessment.id,
        studentName,
        answers:       answersById,
        score,
        total:         questions.length,
        sessionKey:    sessionKey.current,
        timeTakenSecs: timeTakenSecs ?? null,
      }),
    }).catch(console.error)

    // Persist to localStorage for past-attempt review (keep index-keyed locally)
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
        text:            qText(q),
        question_text:   qText(q),
        options:         q.options,
        answer:          q.answer,
        hint:            q.hint,
        explanation:     q.explanation,
        type:            q.type,
        question_type:   q.question_type,
        answer_template: q.answer_template ?? null,
      })),
    })

    setAnswers(answersMap)
    setResult({ score, correct, total: questions.length })
    setPhase('result')
  }, [assessment, studentName])

  if (phase === 'start') {
    return (
      <StartScreen
        assessment={assessment}
        onStart={(name) => { setStudentName(name); setPhase('test') }}
      />
    )
  }

  if (phase === 'test') {
    return (
      <QuestionScreen
        assessment={assessment}
        studentName={studentName}
        answers={answers}
        setAnswers={setAnswers}
        onSubmit={handleSubmit}
        timedOut={timedOut}
      />
    )
  }

  if (phase === 'result' && result) {
    return (
      <ResultScreen
        score={result.score}
        correct={result.correct}
        total={result.total}
        studentName={studentName}
        onReview={() => setPhase('review')}
      />
    )
  }

  if (phase === 'review') {
    return (
      <ReviewAllScreen
        assessment={assessment}
        answers={answers}
        onDone={() => setPhase('result')}
      />
    )
  }

  return null
}