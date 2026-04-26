'use client'

/**
 * MathRenderer
 *
 * Renders math using KaTeX (react-katex).
 *
 * PRIMARY path (preferred): text containing $...$ or \(...\) delimiters
 *   → extracted and passed directly to KaTeX as-is
 *
 * SECONDARY path (for plain text without delimiters):
 *   → hasMath() detects math-like content
 *   → the whole string is converted to LaTeX and wrapped in $...$
 *   → then rendered via KaTeX
 *
 * For STEM working lines, use preprocessMath() in ExplanationRenderer
 * BEFORE passing here — it handles compound expressions like "250*3.5/2"
 * which would otherwise be ambiguously split.
 */

import { InlineMath, BlockMath } from 'react-katex'

// ── Plain text → LaTeX ─────────────────────────────────────────────────────
// Applied to the WHOLE string (not to individual tokens).
// Called only when the string has no $...$ delimiters but contains math patterns.
export function plainToLatex(text) {
  if (!text) return text
  let t = text

  // Compound fraction: "250*3.5/2" → "\frac{250 \times 3.5}{2}"
  t = t.replace(/([\d.]+)\s*\*\s*([\d.]+)\s*\/\s*([\d.]+)/g,
    (_, a, b, c) => `\\frac{${a} \\times ${b}}{${c}}`)

  // Simple fraction: "875/2" → "\frac{875}{2}"
  t = t.replace(/(?<![a-zA-Z:])(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)(?!\d)/g,
    (_, a, b) => `\\frac{${a}}{${b}}`)

  // Multiplication: "250*3.5" or "250 * 3.5" → "250 \times 3.5"
  t = t.replace(/(\d)\s*\*\s*(\d)/g, (_, a, b) => `${a} \\times ${b}`)
  t = t.replace(/(\d)\s*×\s*(\d)/g,  (_, a, b) => `${a} \\times ${b}`)

  // Negative exponents: "s^-1" → "s^{-1}"
  t = t.replace(/([a-zA-Z])\^(-\d+)/g, (_, b, e) => `${b}^{${e}}`)

  // Positive exponents: "x^2" → "x^{2}"
  t = t.replace(/([a-zA-Z0-9])\^(\d+)/g, (_, b, e) => `${b}^{${e}}`)

  // Square roots: "sqrt(9)" → "\sqrt{9}"
  t = t.replace(/sqrt\(([^)]+)\)/gi, (_, inner) => `\\sqrt{${inner}}`)

  // Subscripts: "d_1" → "d_{1}", bare "d1" → "d_{1}"
  t = t.replace(/([a-zA-Z])_(\w+)/g,  (_, b, s) => `${b}_{${s}}`)
  t = t.replace(/\b([a-zA-Z])(\d)\b/g, (_, b, s) => `${b}_{${s}}`)

  // Units
  t = t.replace(/\bm\s*\/\s*s\b/g, 'm\\,s^{-1}')
  t = t.replace(/\bms\^?-?1\b/gi,  'm\\,s^{-1}')
  t = t.replace(/\bkm\/h\b/g,      'km\\,h^{-1}')

  // Constants and operators
  t = t.replace(/\bpi\b/gi, '\\pi')
  t = t.replace(/\+-/g, '\\pm').replace(/±/g, '\\pm')
  t = t.replace(/<=/g, '\\leq').replace(/>=/g, '\\geq').replace(/!=/g, '\\neq')
  t = t.replace(/\bdegrees?\b/gi, '^{\\circ}').replace(/°/g, '^{\\circ}')

  return t
}

// ── Detect math-like content ───────────────────────────────────────────────
function hasMath(text) {
  if (!text) return false
  return /[\^*]|sqrt\s*\(|\bpi\b|\\frac|\\sqrt|\\times|\d+\/\d+|[a-zA-Z]_\d|\+-|<=|>=|!=|\bms\^?-1\b|m\/s/.test(text)
}

// ── Parse $...$, \(...\) segments ──────────────────────────────────────────
function parseSegments(text) {
  if (!text) return [{ type: 'text', content: '' }]

  const segments = []
  const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$|\\\[[^\]]+\\\]|\\\([^)]+\\\))/)

  for (const part of parts) {
    if (!part) continue
    if (part.startsWith('$$') && part.endsWith('$$')) {
      segments.push({ type: 'block', content: part.slice(2, -2) })
    } else if (part.startsWith('$') && part.endsWith('$')) {
      segments.push({ type: 'inline', content: part.slice(1, -1) })
    } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
      segments.push({ type: 'block', content: part.slice(2, -2) })
    } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
      segments.push({ type: 'inline', content: part.slice(2, -2) })
    } else if (hasMath(part)) {
      // No delimiters but has math — convert the whole segment
      const latex = plainToLatex(part)
      segments.push({ type: latex !== part ? 'inline' : 'text', content: latex !== part ? latex : part })
    } else {
      segments.push({ type: 'text', content: part })
    }
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }]
}

// ── Main component ─────────────────────────────────────────────────────────
export default function MathRenderer({ text, block = false, className = '' }) {
  if (!text) return null

  // Block mode override
  if (block) {
    const t = text.trim()
    const inner =
      t.startsWith('$$') && t.endsWith('$$') ? t.slice(2, -2) :
      t.startsWith('$')  && t.endsWith('$')  ? t.slice(1, -1) : null
    if (inner) {
      try { return <div className={className}><BlockMath math={inner} /></div> }
      catch { return <p className={className}>{text}</p> }
    }
  }

  const segments = parseSegments(text)

  if (segments.every((s) => s.type === 'text')) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'block') {
          try { return <div key={i}><BlockMath math={seg.content} /></div> }
          catch { return <span key={i}>{seg.content}</span> }
        }
        if (seg.type === 'inline') {
          try { return <InlineMath key={i} math={seg.content} /> }
          catch { return <span key={i}>{seg.content}</span> }
        }
        return <span key={i}>{seg.content}</span>
      })}
    </span>
  )
}