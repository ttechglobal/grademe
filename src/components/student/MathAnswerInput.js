'use client'

/**
 * src/components/student/MathAnswerInput.js
 *
 * Renders structured answer boxes for calculation questions.
 *
 * Props:
 *   template  {object}  question.answer_template
 *   values    {object}  { [boxId]: string } — current student values
 *   onChange  {fn}      (boxId, value) => void
 *   readOnly  {boolean} true in results mode
 *   result    {object}  { [boxId]: 'correct'|'wrong' } — results mode only
 */

import { useRef } from 'react'
import { cn } from '@/lib/utils'

// ─── Single answer box ────────────────────────────────────────────────────────

function AnswerBox({ id, value, onChange, result, readOnly, superscript = false }) {
  const inputRef = useRef(null)

  const status = result?.[id]

  const baseStyle = {
    fontFamily:    'Nunito, sans-serif',
    textAlign:     'center',
    outline:       'none',
    border:        '2px solid',
    borderRadius:  '8px',
    minWidth:      superscript ? '36px' : '52px',
    minHeight:     superscript ? '36px' : '48px',
    width:         superscript ? '36px' : '52px',
    height:        superscript ? '36px' : '48px',
    fontSize:      superscript ? '13px' : '18px',
    fontWeight:    '700',
    padding:       '2px 4px',
    display:       'inline-flex',
    alignItems:    'center',
    justifyContent: 'center',
    transition:    'border-color 0.15s, background 0.15s',
    // correct/wrong use hardcoded hex — no design token exists for these
    ...(status === 'correct' ? {
      borderColor:  '#3B6D11',
      background:   '#EAF3DE',
      color:        '#3B6D11',
    } : status === 'wrong' ? {
      borderColor:  '#A32D2D',
      background:   '#FCEBEB',
      color:        '#A32D2D',
    } : {
      borderColor:  'var(--color-border)',
      background:   'var(--color-surface)',
      color:        'var(--color-ink)',
    }),
  }

  const focusStyle = !readOnly && !status ? {
    '--focus-border': 'var(--color-brand-500)',
  } : {}

  return (
    <input
      ref={inputRef}
      id={`mathbox-${id}`}
      type="text"
      inputMode="decimal"
      value={value || ''}
      placeholder={readOnly ? '' : '?'}
      readOnly={readOnly}
      onChange={readOnly ? undefined : (e) => onChange?.(id, e.target.value)}
      style={baseStyle}
      onFocus={(e) => {
        if (!readOnly && !status) {
          e.target.style.borderColor = 'var(--color-brand-500)'
          e.target.style.boxShadow   = '0 0 0 3px color-mix(in srgb, var(--color-brand-500) 20%, transparent)'
        }
      }}
      onBlur={(e) => {
        if (!readOnly && !status) {
          e.target.style.borderColor = 'var(--color-border)'
          e.target.style.boxShadow   = 'none'
        }
      }}
    />
  )
}

// ─── Correct answer label (shown below wrong boxes in results mode) ────────────

function CorrectLabel({ answer }) {
  return (
    <div style={{ color: '#3B6D11', fontSize: '11px', fontWeight: '700', textAlign: 'center', marginTop: '2px' }}>
      ✓ {answer}
    </div>
  )
}

// ─── Helper: wrap a box + optional correct label ─────────────────────────────

function BoxWithLabel({ item, value, onChange, result, readOnly, superscript = false }) {
  const showCorrect = readOnly && result?.[item.id] === 'wrong'
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <AnswerBox
        id={item.id}
        value={value}
        onChange={onChange}
        result={result}
        readOnly={readOnly}
        superscript={superscript}
      />
      {showCorrect && <CorrectLabel answer={item.answer} />}
    </div>
  )
}

// ─── Template renderers ───────────────────────────────────────────────────────

function RenderFraction({ structure, value, onChange, result, readOnly }) {
  const num = structure.find(s => s.id === 'num') || structure[0]
  const den = structure.find(s => s.id === 'den') || structure[1]
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <BoxWithLabel item={num} value={value?.[num?.id]} onChange={onChange} result={result} readOnly={readOnly} />
      <div style={{ width: '100%', minWidth: '60px', height: '2px', background: 'var(--color-ink)', borderRadius: '1px' }} />
      <BoxWithLabel item={den} value={value?.[den?.id]} onChange={onChange} result={result} readOnly={readOnly} />
    </div>
  )
}

function RenderPower({ structure, value, onChange, result, readOnly }) {
  const base = structure[0]
  const exp  = structure[1]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'flex-start', gap: '2px' }}>
      <BoxWithLabel item={base} value={value?.[base?.id]} onChange={onChange} result={result} readOnly={readOnly} />
      <div style={{ marginTop: '-4px' }}>
        <BoxWithLabel item={exp} value={value?.[exp?.id]} onChange={onChange} result={result} readOnly={readOnly} superscript />
      </div>
    </div>
  )
}

function RenderScientific({ structure, value, onChange, result, readOnly }) {
  const coeff = structure.find(s => s.id === 'coeff') || structure[0]
  const exp   = structure.find(s => s.id === 'exp')   || structure[1]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <BoxWithLabel item={coeff} value={value?.[coeff?.id]} onChange={onChange} result={result} readOnly={readOnly} />
      <span style={{ fontWeight: '700', fontSize: '18px', color: 'var(--color-ink)' }}>× 10</span>
      <div style={{ marginTop: '-12px' }}>
        <BoxWithLabel item={exp} value={value?.[exp?.id]} onChange={onChange} result={result} readOnly={readOnly} superscript />
      </div>
    </div>
  )
}

function RenderSurd({ structure, value, onChange, result, readOnly }) {
  const coeff = structure.find(s => s.id === 'coeff') || structure[0]
  const rad   = structure.find(s => s.id === 'rad')   || structure[1]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <BoxWithLabel item={coeff} value={value?.[coeff?.id]} onChange={onChange} result={result} readOnly={readOnly} />
      <span style={{ fontWeight: '700', fontSize: '22px', color: 'var(--color-ink)' }}>√</span>
      <BoxWithLabel item={rad} value={value?.[rad?.id]} onChange={onChange} result={result} readOnly={readOnly} />
    </div>
  )
}

function RenderCoordinates({ structure, value, onChange, result, readOnly }) {
  const x = structure.find(s => s.id === 'x') || structure[0]
  const y = structure.find(s => s.id === 'y') || structure[1]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontWeight: '700', fontSize: '22px', color: 'var(--color-ink)' }}>(</span>
      <BoxWithLabel item={x} value={value?.[x?.id]} onChange={onChange} result={result} readOnly={readOnly} />
      <span style={{ fontWeight: '700', fontSize: '18px', color: 'var(--color-ink)', margin: '0 2px' }}>,</span>
      <BoxWithLabel item={y} value={value?.[y?.id]} onChange={onChange} result={result} readOnly={readOnly} />
      <span style={{ fontWeight: '700', fontSize: '22px', color: 'var(--color-ink)' }}>)</span>
    </div>
  )
}

function RenderSimultaneous({ structure, value, onChange, result, readOnly }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
      {structure.map((item) => (
        <div key={item.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--color-ink)', minWidth: '20px' }}>
            {item.label} =
          </span>
          <BoxWithLabel item={item} value={value?.[item.id]} onChange={onChange} result={result} readOnly={readOnly} />
        </div>
      ))}
    </div>
  )
}

function RenderTwoRoots({ structure, value, onChange, result, readOnly }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
      {structure.map((item, i) => (
        <div key={item.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          {i > 0 && (
            <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-ink-3)', margin: '0 4px' }}>or</span>
          )}
          <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--color-ink)' }}>x =</span>
          <BoxWithLabel item={item} value={value?.[item.id]} onChange={onChange} result={result} readOnly={readOnly} />
        </div>
      ))}
    </div>
  )
}

function RenderPercentage({ structure, value, onChange, result, readOnly }) {
  const item = structure[0]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <BoxWithLabel item={item} value={value?.[item?.id]} onChange={onChange} result={result} readOnly={readOnly} />
      <span style={{ fontWeight: '700', fontSize: '20px', color: 'var(--color-ink)' }}>%</span>
    </div>
  )
}

function RenderAngle({ structure, value, onChange, result, readOnly }) {
  const item = structure[0]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <BoxWithLabel item={item} value={value?.[item?.id]} onChange={onChange} result={result} readOnly={readOnly} />
      <span style={{ fontWeight: '700', fontSize: '20px', color: 'var(--color-ink)' }}>°</span>
    </div>
  )
}

function RenderRatio({ structure, value, onChange, result, readOnly }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      {structure.map((item, i) => (
        <span key={item.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          {i > 0 && <span style={{ fontWeight: '700', fontSize: '20px', color: 'var(--color-ink)' }}>:</span>}
          <BoxWithLabel item={item} value={value?.[item.id]} onChange={onChange} result={result} readOnly={readOnly} />
        </span>
      ))}
    </div>
  )
}

function RenderUnits({ structure, unit, value, onChange, result, readOnly }) {
  const item = structure[0]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <BoxWithLabel item={item} value={value?.[item?.id]} onChange={onChange} result={result} readOnly={readOnly} />
      {unit && (
        <span style={{ fontWeight: '600', fontSize: '15px', color: 'var(--color-ink-3)' }}>{unit}</span>
      )}
    </div>
  )
}

// Default: single box or labeled boxes
function RenderDefault({ structure, value, onChange, result, readOnly }) {
  if (structure.length === 1) {
    const item = structure[0]
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
        {item.label && item.label !== 'Answer' && item.label !== 'ans' && (
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-3)' }}>{item.label}</span>
        )}
        <BoxWithLabel item={item} value={value?.[item.id]} onChange={onChange} result={result} readOnly={readOnly} />
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
      {structure.map((item) => (
        <div key={item.id} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink-3)' }}>{item.label}</span>
          <BoxWithLabel item={item} value={value?.[item.id]} onChange={onChange} result={result} readOnly={readOnly} />
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MathAnswerInput({ template, values = {}, onChange, readOnly = false, result }) {
  if (!template?.structure?.length) {
    return (
      <p style={{ fontSize: '14px', color: 'var(--color-ink-4)', fontStyle: 'italic' }}>
        No answer template for this question.
      </p>
    )
  }

  const { type, structure, unit } = template
  const safeValue = (typeof values === 'object' && values !== null) ? values : {}

  let content
  switch (type) {
    case 'fraction':
      content = <RenderFraction  structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />
      break
    case 'power':
      content = <RenderPower     structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />
      break
    case 'scientific':
      content = <RenderScientific structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />
      break
    case 'surd':
      content = <RenderSurd      structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />
      break
    case 'coordinates':
      content = <RenderCoordinates structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />
      break
    case 'simultaneous':
      content = <RenderSimultaneous structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />
      break
    case 'two_roots':
      content = <RenderTwoRoots  structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />
      break
    case 'percentage':
      content = <RenderPercentage structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />
      break
    case 'angle':
      content = <RenderAngle     structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />
      break
    case 'ratio':
      content = <RenderRatio     structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />
      break
    case 'units':
      content = <RenderUnits     structure={structure} unit={unit} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />
      break
    default:
      // number, decimal, or unknown
      content = <RenderDefault   structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', padding: '8px 0' }}>
      {content}
    </div>
  )
}