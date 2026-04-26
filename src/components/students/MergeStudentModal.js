'use client'

import { useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import { X, GitMerge, Check, AlertTriangle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * MergeStudentsModal
 *
 * Allows a tutor to select 2+ student profiles and merge them into one.
 * Three steps:
 *   1. Select profiles to merge
 *   2. Choose which name to keep
 *   3. Confirm with clear warning — irreversible
 *
 * Props:
 *   students  — array of student objects { id, full_name, totalAssessments, avgScore, ... }
 *   onMerge   — async (keepName: string, profileIds: string[]) => void
 *   onClose   — () => void
 */
export default function MergeStudentsModal({ students, onMerge, onClose }) {
  const [step,      setStep]      = useState(1)   // 1 | 2 | 3
  const [selected,  setSelected]  = useState([])  // array of student ids
  const [keepName,  setKeepName]  = useState('')
  const [custom,    setCustom]    = useState('')
  const [loading,   setLoading]   = useState(false)

  const selectedStudents = students.filter((s) => selected.includes(s.id))

  // Total assessments across all selected students
  const totalTests = selectedStudents.reduce((n, s) => n + s.totalAssessments, 0)

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const finalName = keepName === '__custom__'
    ? custom.trim()
    : keepName || selectedStudents[0]?.full_name || ''

  // ── Step 1: select students ──────────────────────────────────────────────
  const Step1 = () => (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Merge Student Profiles</h2>
        <p className="text-sm text-ink-3 mt-1 leading-relaxed">
          Select two or more profiles to combine into one. All assessment history will be merged.
        </p>
      </div>

      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
        {students.map((s) => {
          const checked = selected.includes(s.id)
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
                checked ? 'border-brand-600 bg-brand-50' : 'border-border bg-white hover:border-brand-200'
              )}
            >
              {/* Checkbox */}
              <div className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                checked ? 'bg-brand-700 border-brand-700' : 'border-border bg-white'
              )}>
                {checked && <Check size={11} className="text-white" strokeWidth={3} />}
              </div>

              <Avatar name={s.full_name} size="sm" />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-ink truncate">{s.full_name}</p>
                <p className="text-xs text-ink-4">
                  {s.totalAssessments} assessment{s.totalAssessments !== 1 ? 's' : ''}
                  {s.avgScore !== null ? ` · avg ${s.avgScore}%` : ''}
                  {s.grade_class ? ` · ${s.grade_class}` : ''}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors">
          Cancel
        </button>
        <button
          onClick={() => {
            setKeepName(selectedStudents[0]?.full_name ?? '')
            setStep(2)
          }}
          disabled={selected.length < 2}
          className="flex-1 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next — Choose Name ({selected.length} selected)
        </button>
      </div>
    </div>
  )

  // ── Step 2: choose which name to keep ────────────────────────────────────
  const Step2 = () => (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Choose a Name to Keep</h2>
        <p className="text-sm text-ink-3 mt-1 leading-relaxed">
          Select which name should be used for the merged profile. You can also type a custom name.
        </p>
      </div>

      {/* Profiles being merged — summary */}
      <div className="bg-surface border border-border rounded-xl px-4 py-3 flex flex-col gap-2">
        <p className="text-xs font-bold text-ink-4 uppercase tracking-wide">Merging</p>
        <div className="flex flex-wrap gap-2">
          {selectedStudents.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 bg-white border border-border rounded-full px-3 py-1">
              <Avatar name={s.full_name} size="xs" />
              <span className="text-xs font-medium text-ink">{s.full_name}</span>
              <span className="text-[10px] text-ink-4">({s.totalAssessments})</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-4">{totalTests} total assessments will be combined</p>
      </div>

      {/* Name options */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-ink-2">Keep this name:</p>
        {selectedStudents.map((s) => (
          <button
            key={s.id}
            onClick={() => { setKeepName(s.full_name); setCustom('') }}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
              keepName === s.full_name && keepName !== '__custom__'
                ? 'border-brand-600 bg-brand-50'
                : 'border-border bg-white hover:border-brand-200'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
              keepName === s.full_name && keepName !== '__custom__'
                ? 'bg-brand-700 border-brand-700'
                : 'border-border'
            )}>
              {keepName === s.full_name && keepName !== '__custom__' && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <Avatar name={s.full_name} size="sm" />
            <span className="text-sm font-semibold text-ink">{s.full_name}</span>
          </button>
        ))}

        {/* Custom name option */}
        <button
          onClick={() => setKeepName('__custom__')}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
            keepName === '__custom__' ? 'border-brand-600 bg-brand-50' : 'border-border bg-white hover:border-brand-200'
          )}
        >
          <div className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
            keepName === '__custom__' ? 'bg-brand-700 border-brand-700' : 'border-border'
          )}>
            {keepName === '__custom__' && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          <span className="text-sm font-semibold text-ink-3">Type a custom name…</span>
        </button>

        {keepName === '__custom__' && (
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            autoFocus
            placeholder="e.g. Paul Adeyemi"
            className="w-full px-4 py-3 border-2 border-brand-400 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-100"
          />
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={() => setStep(1)}
          className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors">
          ← Back
        </button>
        <button
          onClick={() => setStep(3)}
          disabled={!finalName}
          className="flex-1 py-2.5 rounded-xl bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next — Review & Confirm
        </button>
      </div>
    </div>
  )

  // ── Step 3: confirm ──────────────────────────────────────────────────────
  const Step3 = () => (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Confirm Merge</h2>
        <p className="text-sm text-ink-3 mt-1">Review what will happen, then confirm.</p>
      </div>

      {/* Summary */}
      <div className="bg-surface border border-border rounded-2xl px-5 py-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-bold text-ink-4 uppercase tracking-wide">Profiles being merged</p>
          {selectedStudents.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <Avatar name={s.full_name} size="xs" />
              <span className="text-sm text-ink">{s.full_name}</span>
              <span className="text-xs text-ink-4">· {s.totalAssessments} assessments</span>
            </div>
          ))}
        </div>
        <div className="h-px bg-border" />
        <div>
          <p className="text-xs font-bold text-ink-4 uppercase tracking-wide mb-1">Result</p>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold">{finalName.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-sm font-bold text-ink">{finalName}</span>
            <span className="text-xs text-ink-4">· {totalTests} assessments combined</span>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 bg-danger-light border border-danger/20 rounded-2xl px-4 py-4">
        <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-danger">This cannot be undone</p>
          <p className="text-xs text-danger/80 mt-1 leading-relaxed">
            All assessment history from the selected profiles will be permanently combined into one.
            The original profile names will be removed. Students are unaffected — they always just enter their name.
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={() => setStep(2)}
          className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-ink hover:bg-surface transition-colors">
          ← Back
        </button>
        <button
          onClick={async () => {
            setLoading(true)
            await onMerge(finalName, selected)
            setLoading(false)
          }}
          disabled={loading}
          className="flex-1 py-3 rounded-xl bg-danger text-white text-sm font-bold hover:bg-danger/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <GitMerge size={15} />
          )}
          {loading ? 'Merging…' : `Merge into "${finalName}"`}
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          {/* Step pills */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className={cn(
                'flex items-center gap-1.5',
                n < 3 && 'after:content-["→"] after:text-ink-4 after:text-xs after:ml-2'
              )}>
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  step >= n ? 'bg-brand-800 text-white' : 'bg-border text-ink-4'
                )}>
                  {step > n ? <Check size={11} strokeWidth={3} /> : n}
                </div>
                <span className={cn(
                  'text-xs font-medium hidden sm:block',
                  step >= n ? 'text-ink' : 'text-ink-4'
                )}>
                  {n === 1 ? 'Select' : n === 2 ? 'Name' : 'Confirm'}
                </span>
              </div>
            ))}
          </div>

          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-border transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Step content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[70vh]">
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
        </div>
      </div>
    </div>
  )
}