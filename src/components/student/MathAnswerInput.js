'use client'

/**
 * src/components/student/MathAnswerInput.js
 *
 * Renders structured answer boxes for calculation (Fill-in Answer) questions.
 *
 * Props:
 *   template  {object}  question.answer_template
 *   values    {object}  { [boxId]: string } — current student values
 *   onChange  {fn}      (boxId, value) => void
 *   readOnly  {boolean} true in results mode
 *   result    {object}  { [boxId]: 'correct'|'wrong' } — results mode only
 *
 * FIXES applied in this version:
 *   - Boxes auto-grow with content (width:auto + size attr) so long answers
 *     like "-123.45 m/s" are fully visible and not clipped
 *   - Text is left-aligned for readability of longer values
 *   - font-size 16px prevents iOS auto-zoom on focus
 *   - Touch targets: minHeight 48px (≥44px WCAG)
 *   - Superscript boxes intentionally smaller (exponents are short)
 */

import { useRef } from 'react'

// ─── Single answer box ────────────────────────────────────────────────────────

function AnswerBox({ id, value, onChange, result, readOnly, superscript = false, fraction = false }) {
  const inputRef = useRef(null)
  const status   = result?.[id]

  const minW  = superscript ? '40px'    : fraction ? '56px' : '64px'
  const minH  = superscript ? '32px'    : '48px'
  const fSize = superscript ? '13px'    : '16px'   // 16px prevents iOS auto-zoom
  const pad   = superscript ? '2px 4px' : '8px 10px'

  const baseStyle = {
    fontFamily:       'Nunito, sans-serif',
    width:            'auto',      // grow with content
    minWidth:         minW,
    minHeight:        minH,
    height:           superscript ? '32px' : '48px',
    fontSize:         fSize,
    fontWeight:       '700',
    padding:          pad,
    textAlign:        'left',      // left-align — long answers stay visible
    outline:          'none',
    border:           '2px solid',
    borderRadius:     '8px',
    display:          'inline-block',
    transition:       'border-color 0.15s, background 0.15s, box-shadow 0.15s',
    WebkitAppearance: 'none',
    boxSizing:        'content-box', // size attr drives width correctly
    ...(status === 'correct' ? {
      borderColor: '#3B6D11',
      background:  '#EAF3DE',
      color:       '#3B6D11',
    } : status === 'wrong' ? {
      borderColor: '#A32D2D',
      background:  '#FCEBEB',
      color:       '#A32D2D',
    } : {
      borderColor: 'var(--color-border)',
      background:  'var(--color-surface)',
      color:       'var(--color-ink)',
    }),
  }

  // size attribute: native HTML makes the input wide enough for `size` chars
  const sizeAttr = Math.max(superscript ? 2 : 3, (value || '').length + 1)

  return (
    <input
      ref={inputRef}
      id={`mathbox-${id}`}
      type="text"
      inputMode="decimal"
      value={value || ''}
      placeholder={readOnly ? '' : '?'}
      readOnly={readOnly}
      size={sizeAttr}
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

// ─── Correct answer label ────────────────────────────────────────────────────

function CorrectLabel({ answer }) {
  return (
    <div style={{
      color:      '#3B6D11',
      fontSize:   '11px',
      fontWeight: '700',
      textAlign:  'center',
      marginTop:  '3px',
      whiteSpace: 'nowrap',
    }}>
      ✓ {answer}
    </div>
  )
}

// ─── Box + optional correct label wrapper ────────────────────────────────────

function BoxWithLabel({ item, value, onChange, result, readOnly, superscript = false, fraction = false }) {
  const showCorrect = readOnly && result?.[item.id] === 'wrong'
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <AnswerBox
        id={item.id}
        value={value}
        onChange={onChange}
        result={result}
        readOnly={readOnly}
        superscript={superscript}
        fraction={fraction}
      />
      {showCorrect && <CorrectLabel answer={item.answer} />}
    </div>
  )
}

// ─── Template renderers ───────────────────────────────────────────────────────

function RenderFraction({ structure, value, onChange, result, readOnly }) {
  const num = structure.find((s) => s.id === 'num') || structure[0]
  const den = structure.find((s) => s.id === 'den') || structure[1]
  if (!num || !den) return <RenderDefault structure={structure} value={value} onChange={onChange} result={result} readOnly={readOnly} />
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <BoxWithLabel item={num} value={value?.[num.id]} onChange={onChange} result={result} readOnly={readOnly} fraction />
      <div style={{ width: '100%', minWidth: '56px', height: '2px', background: 'var(--color-ink)', borderRadius: '1px' }} />
      <BoxWithLabel item={den} value={value?.[den.id]} onChange={onChange} result={result} readOnly={readOnly} fraction />
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
        <BoxWithLabel item={exp}  value={value?.[exp?.id]}  onChange={onChange} result={result} readOnly={readOnly} superscript />
      </div>
    </div>
  )
}

function RenderScientific({ structure, value, onChange, result, readOnly }) {
  const coeff = structure.find((s) => s.id === 'coeff')                                  || structure[0]
  const expo  = structure.find((s) => s.id === 'exponent' || s.id === 'exp')             || structure[1]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
      <BoxWithLabel item={coeff} value={value?.[coeff?.id]} onChange={onChange} result={result} readOnly={readOnly} />
      <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--color-ink)', userSelect: 'none' }}>× 10</span>
      <div style={{ marginTop: '-8px' }}>
        <BoxWithLabel item={expo} value={value?.[expo?.id]} onChange={onChange} result={result} readOnly={readOnly} superscript />
      </div>
    </div>
  )
}

function RenderCoordinate({ structure, value, onChange, result, readOnly }) {
  const x = structure.find((s) => s.id === 'x') || structure[0]
  const y = structure.find((s) => s.id === 'y') || structure[1]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontWeight: '700', fontSize: '22px', color: 'var(--color-ink)', userSelect: 'none' }}>(</span>
      <BoxWithLabel item={x} value={value?.[x?.id]} onChange={onChange} result={result} readOnly={readOnly} />
      <span style={{ fontWeight: '700', fontSize: '18px', color: 'var(--color-ink)', userSelect: 'none' }}>,</span>
      <BoxWithLabel item={y} value={value?.[y?.id]} onChange={onChange} result={result} readOnly={readOnly} />
      <span style={{ fontWeight: '700', fontSize: '22px', color: 'var(--color-ink)', userSelect: 'none' }}>)</span>
    </div>
  )
}

function RenderSimultaneous({ structure, value, onChange, result, readOnly }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
      {structure.map((item) => (
        <div key={item.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--color-ink)', minWidth: '20px', userSelect: 'none' }}>
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
          {i > 0 && <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-ink-3)', margin: '0 4px', userSelect: 'none' }}>or</span>}
          <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--color-ink)', userSelect: 'none' }}>x =</span>
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
      <span style={{ fontWeight: '700', fontSize: '20px', color: 'var(--color-ink)', userSelect: 'none' }}>%</span>
    </div>
  )
}

function RenderAngle({ structure, value, onChange, result, readOnly }) {
  const item = structure[0]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <BoxWithLabel item={item} value={value?.[item?.id]} onChange={onChange} result={result} readOnly={readOnly} />
      <span style={{ fontWeight: '700', fontSize: '20px', color: 'var(--color-ink)', userSelect: 'none' }}>°</span>
    </div>
  )
}

function RenderRatio({ structure, value, onChange, result, readOnly }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      {structure.map((item, i) => (
        <span key={item.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          {i > 0 && <span style={{ fontWeight: '700', fontSize: '20px', color: 'var(--color-ink)', userSelect: 'none' }}>:</span>}
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
      {unit && <span style={{ fontWeight: '600', fontSize: '15px', color: 'var(--color-ink-3)', userSelect: 'none' }}>{unit}</span>}
    </div>
  )
}

function RenderSurd({ structure, value, onChange, result, readOnly }) {
  const coeff = structure.find((s) => s.id === 'coeff') || structure[0]
  const rad   = structure.find((s) => s.id === 'rad')   || structure[1]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <BoxWithLabel item={coeff} value={value?.[coeff?.id]} onChange={onChange} result={result} readOnly={readOnly} />
      <span style={{ fontWeight: '700', fontSize: '18px', color: 'var(--color-ink)', userSelect: 'none' }}>√</span>
      <BoxWithLabel item={rad}   value={value?.[rad?.id]}   onChange={onChange} result={result} readOnly={readOnly} />
    </div>
  )
}

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

// ─── Main export ──────────────────────────────────────────────────────────────

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

  const wrapperStyle = {
    display:   'inline-block',
    padding:   '4px 2px 8px',
    maxWidth:  '100%',
    overflowX: 'auto',
  }

  let inner
  switch (type) {
    case 'fraction':
      inner = <RenderFraction    structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />; break
    case 'power':
      inner = <RenderPower       structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />; break
    case 'scientific':
      inner = <RenderScientific  structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />; break
    case 'coordinate':
    case 'coordinates':
      inner = <RenderCoordinate  structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />; break
    case 'simultaneous':
      inner = <RenderSimultaneous structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />; break
    case 'two_roots':
      inner = <RenderTwoRoots   structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />; break
    case 'percentage':
      inner = <RenderPercentage structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />; break
    case 'angle':
      inner = <RenderAngle      structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />; break
    case 'ratio':
      inner = <RenderRatio      structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />; break
    case 'units':
      inner = <RenderUnits      structure={structure} unit={unit} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />; break
    case 'surd':
      inner = <RenderSurd       structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />; break
    case 'number':
    case 'decimal':
    default:
      inner = <RenderDefault    structure={structure} value={safeValue} onChange={onChange} result={result} readOnly={readOnly} />
  }

  return <div style={wrapperStyle}>{inner}</div>
}