'use client'

import { InlineMath, BlockMath } from 'react-katex'
import { cn } from '@/lib/utils'

function convertToLatex(text) {
  if (!text) return text
  return text
    .replace(/(\d+)\/(\d+)/g, (_, a, b) => `\\frac{${a}}{${b}}`)
    .replace(/([a-zA-Z0-9])\^(\d+)/g, (_, base, exp) => `${base}^{${exp}}`)
    .replace(/sqrt\(([^)]+)\)/g, (_, inner) => `\\sqrt{${inner}}`)
    .replace(/\s\*\s/g, ' \\times ')
    .replace(/\bpi\b/g, '\\pi')
    .replace(/<=/g, '\\leq')
    .replace(/>=/g, '\\geq')
    .replace(/!=/g, '\\neq')
}

function hasMath(text) {
  if (!text) return false
  return /[\^]|sqrt\(|\\frac|\\sqrt|=\s*[\d]|\d+[a-zA-Z]|[a-zA-Z]\s*=\s*\d/.test(text)
}

function RenderMixed({ content }) {
  const tokens = content.split(
    /(\b\d+\/\d+\b|[a-zA-Z0-9]+\^\d+|sqrt\([^)]+\)|\d+[a-zA-Z]+\b|\b[a-zA-Z]\s*=\s*[\d.]+)/g
  )

  return (
    <span>
      {tokens.map((token, i) => {
        if (!token) return null
        const latex = convertToLatex(token)
        if (latex !== token) {
          try {
            return <InlineMath key={i} math={latex} />
          } catch {
            return <span key={i}>{token}</span>
          }
        }
        return <span key={i}>{token}</span>
      })}
    </span>
  )
}

function parseSegments(text) {
  if (!text) return [{ type: 'text', content: '' }]
  const segments = []
  const parts = text.split(/(\$[^$]+\$|\\\([^)]+\\\))/)

  parts.forEach((part) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      segments.push({ type: 'math', content: part.slice(1, -1) })
    } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
      segments.push({ type: 'math', content: part.slice(2, -2) })
    } else if (part) {
      if (hasMath(part)) {
        segments.push({ type: 'mixed', content: part })
      } else {
        segments.push({ type: 'text', content: part })
      }
    }
  })

  return segments.length > 0 ? segments : [{ type: 'text', content: text }]
}

export default function MathRenderer({ text, block = false, className = '' }) {
  if (!text) return null

  if (block && text.trim().startsWith('$') && text.trim().endsWith('$')) {
    const latex = text.trim().slice(1, -1)
    try {
      return <div className={className}><BlockMath math={latex} /></div>
    } catch {
      return <p className={className}>{text}</p>
    }
  }

  const segments = parseSegments(text)

  if (segments.every((s) => s.type === 'text')) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'math') {
          try { return <InlineMath key={i} math={seg.content} /> }
          catch { return <span key={i}>{seg.content}</span> }
        }
        if (seg.type === 'mixed') return <RenderMixed key={i} content={seg.content} />
        return <span key={i}>{seg.content}</span>
      })}
    </span>
  )
}

// ── Strict step-by-step explanation renderer ──────────────────────────────────
export function MathExplanation({ text, className = '' }) {
  if (!text) return null

  // Split on newlines — each line is its own visual block
  const rawLines = text.split('\n')

  // Group lines into steps
  const blocks = []
  let currentStep = null

  rawLines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) return

    const isStepHeader  = /^step\s*\d+/i.test(trimmed)
    const isAnswer      = /^(✓\s*)?answer:/i.test(trimmed) || trimmed.startsWith('✓')
    const isWrong       = /^where you went wrong/i.test(trimmed)
    const isMathLine    = /=|\\frac|\^|sqrt/.test(trimmed) && !/^step/i.test(trimmed)

    if (isStepHeader) {
      currentStep = { header: trimmed, lines: [] }
      blocks.push({ type: 'step', data: currentStep })
    } else if (isAnswer) {
      blocks.push({ type: 'answer', data: trimmed })
      currentStep = null
    } else if (isWrong) {
      blocks.push({ type: 'wrong', data: trimmed })
      currentStep = null
    } else if (currentStep) {
      currentStep.lines.push({ text: trimmed, isMath: isMathLine })
    } else {
      blocks.push({ type: 'text', data: trimmed, isMath: isMathLine })
    }
  })

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {blocks.map((block, bi) => {
        if (block.type === 'step') {
          return (
            <div key={bi} className="flex flex-col gap-1">
              {/* Step header */}
              <p className="text-sm font-bold text-brand-800">
                {block.data.header}
              </p>
              {/* Step lines */}
              {block.data.lines.map((line, li) => (
                <div
                  key={li}
                  className={cn(
                    'text-sm text-brand-700',
                    line.isMath ? 'font-mono pl-4 py-0.5' : 'pl-4'
                  )}
                >
                  <MathRenderer text={line.text} />
                </div>
              ))}
            </div>
          )
        }

        if (block.type === 'answer') {
          return (
            <div
              key={bi}
              className="flex items-center gap-2 bg-success-light border border-success/30 rounded-lg px-3 py-2 mt-1"
            >
              <span className="text-success font-bold text-sm">
                <MathRenderer text={block.data} />
              </span>
            </div>
          )
        }

        if (block.type === 'wrong') {
          return (
            <p key={bi} className="text-sm font-semibold text-danger">
              {block.data}
            </p>
          )
        }

        return (
          <div
            key={bi}
            className={cn(
              'text-sm text-brand-700',
              block.isMath ? 'font-mono pl-2 py-0.5' : ''
            )}
          >
            <MathRenderer text={block.data} />
          </div>
        )
      })}
    </div>
  )
}