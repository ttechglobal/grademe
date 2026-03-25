'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Sparkles, Copy, CheckCheck } from 'lucide-react'

const PROMPT = `Format the following questions as a JSON array. Each item must have: {"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A", "type": "mcq"}. Return ONLY the JSON array, no explanation, no markdown. Questions:`

export default function AIImport({ onImport }) {
  const [pasted, setPasted]   = useState('')
  const [copied, setCopied]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const copyPrompt = () => {
    navigator.clipboard.writeText(PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleParse = () => {
    setError('')
    setLoading(true)
    try {
      const clean = pasted
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
      const parsed = JSON.parse(clean)
      if (!Array.isArray(parsed)) throw new Error('Response must be a JSON array')

      const questions = parsed.map((q) => ({
        type:    'mcq',
        text:    q.question || '',
        options: q.options  || ['', '', '', ''],
        answer:  q.answer   || '',
        hint:    '',
      }))

      onImport(questions)
    } catch {
      setError('Could not parse the response. Make sure you copied only the AI\'s JSON output.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* How it works */}
      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-brand-500" />
          <h3 className="font-semibold text-brand-800 text-sm">How AI Import works</h3>
        </div>
        <ol className="flex flex-col gap-2 text-sm text-brand-700">
          <li className="flex gap-2"><span className="font-bold">①</span> Copy the prompt below</li>
          <li className="flex gap-2"><span className="font-bold">②</span> Open any AI (ChatGPT, Gemini, Claude…)</li>
          <li className="flex gap-2"><span className="font-bold">③</span> Paste the prompt + your questions into it</li>
          <li className="flex gap-2"><span className="font-bold">④</span> Copy the AI's response and paste it below</li>
        </ol>
      </div>

      {/* Copy prompt */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink-2">
          Step 1 — Copy this prompt
        </label>
        <div className="bg-surface border border-border rounded-xl p-4 text-xs text-ink-3 font-mono leading-relaxed">
          {PROMPT}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={copyPrompt}
          className="self-start"
        >
          {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Prompt'}
        </Button>
      </div>

      {/* Paste response */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink-2">
          Step 2 — Paste AI response here
        </label>
        <textarea
          value={pasted}
          onChange={(e) => { setPasted(e.target.value); setError('') }}
          placeholder={`Paste the AI's JSON response here...\n[\n  {\n    "question": "...",\n    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],\n    "answer": "A",\n    "type": "mcq"\n  }\n]`}
          rows={10}
          className="w-full px-4 py-3 text-sm font-mono bg-white border border-border rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none placeholder:text-ink-4"
        />
        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}
      </div>

      <Button
        variant="primary"
        onClick={handleParse}
        loading={loading}
        disabled={!pasted.trim()}
      >
        <Sparkles size={15} />
        Parse & Import Questions
      </Button>

    </div>
  )
}