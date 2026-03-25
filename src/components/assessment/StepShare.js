'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Copy, CheckCheck, Eye, BookOpen } from 'lucide-react'

const SLUG = 'adaeze/linear-eq-ss1'
const SHARE_URL = `https://grademe.ng/t/${SLUG}`

function Toggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-border last:border-none">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && (
          <p className="text-xs text-ink-4 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          value ? 'bg-brand-700' : 'bg-border'
        }`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          value ? 'translate-x-5' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  )
}

export default function StepShare({ data, onBack, onFinish }) {
  const [copied, setCopied] = useState(false)
  const [settings, setSettings] = useState({
    showResults:      true,
    showExplanations: true,
    requireName:      true,
    timeLimit:        false,
  })

  const copyLink = () => {
    navigator.clipboard.writeText(SHARE_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Success header */}
      <div className="text-center py-4">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="font-display text-2xl font-bold text-ink">Assessment Ready!</h2>
        <p className="text-sm text-ink-3 mt-1">
          {data.title || data.topic} · {data.classLevel?.toUpperCase()} ·{' '}
          {data.questionCount} question{data.questionCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Share link */}
      <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-card">
        <p className="text-sm font-semibold text-ink flex items-center gap-2">
          <BookOpen size={15} className="text-brand-500" />
          Share Link
        </p>
        <div className="flex items-center gap-2 bg-surface rounded-xl p-3 border border-border">
          <span className="flex-1 text-sm text-brand-600 font-medium truncate">
            {SHARE_URL}
          </span>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 bg-brand-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors flex-shrink-0"
          >
            {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-ink-4">
          Students just need this link — no account required.
        </p>
      </div>

      {/* Settings */}
      <div className="bg-white border border-border rounded-2xl px-5 shadow-card">
        <p className="text-sm font-semibold text-ink pt-5 pb-3">Settings</p>
        <Toggle
          label="Show results to student immediately"
          description="Students see their score right after submitting"
          value={settings.showResults}
          onChange={(v) => updateSetting('showResults', v)}
        />
        <Toggle
          label="Show step-by-step explanations"
          description="Students see explanations for each answer"
          value={settings.showExplanations}
          onChange={(v) => updateSetting('showExplanations', v)}
        />
        <Toggle
          label="Require student name"
          description="Students must enter their name before starting"
          value={settings.requireName}
          onChange={(v) => updateSetting('requireName', v)}
        />
        <Toggle
          label="Time limit"
          description="Set a countdown timer for the assessment"
          value={settings.timeLimit}
          onChange={(v) => updateSetting('timeLimit', v)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          ← Edit Questions
        </Button>
        <Button variant="amber" onClick={onFinish} className="flex-1">
          <Eye size={15} />
          Go to Dashboard
        </Button>
      </div>

    </div>
  )
}