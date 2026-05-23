'use client'

import { useState } from 'react'
import { Copy, CheckCheck, Eye, ExternalLink, Share2 } from 'lucide-react'
import { createAssessment } from '@/lib/actions/assessments'
import { useToast }         from '@/components/ui/ToastProvider'

const PREVIEW_SESSION_KEY = 'grademee_preview_draft'

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bg:       '#f0f7f4',
  white:    '#ffffff',
  border:   '#e2ede8',
  text:     '#1a1a1a',
  secondary:'#4b5563',
  muted:    '#9ca3af',
  amber:    '#f5a623',
  green:    '#16a34a',
  greenBg:  '#dcfce7',
  brand:    '#0f2e2e',
}

export default function StepShare({
  data,
  questions,
  source          = 'manual',
  onBack,
  onFinish,
  useCaseProfile  = 'k12_tutor',
  questionType    = 'mcq',
}) {
  const { toast }          = useToast()
  const isUniversity       = useCaseProfile === 'university'

  const [copied,  setCopied]  = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [slug,    setSlug]    = useState('')
  const [error,   setError]   = useState('')

  const settings = { showResults: true, showExplanations: true, requireName: true }

  const shareUrl   = slug ? `${window.location.origin}/t/${slug}` : ''
  const previewUrl = slug ? `${shareUrl}?preview=1` : null

  // ── Pre-save preview ──────────────────────────────────────────────────
  const handlePreviewDraft = () => {
    try {
      const draft = {
        title:       data.title || `${(data.subject ?? '').replace(/_/g, ' ')} Assessment`,
        subject:     data.subject,
        class_level: data.classLevel,
        curriculum:  data.curriculum || 'uk',
        // FIX: normalise each question to always have `text` populated
        // AI-generated questions may use q.question or q.question_text
        questions: questions.map((q, i) => ({
          id:            `draft-${i}`,
          type:          q.type          ?? q.question_type ?? 'mcq',
          question_type: q.question_type ?? q.type          ?? 'mcq',
          // text is the canonical field PreviewMode reads — resolve from all variants
          text:          q.text || q.question || q.question_text || '',
          options:       Array.isArray(q.options) ? q.options : [],
          answer:        q.answer        ?? q.correct_answer ?? '',
          correct_answer:q.correct_answer ?? q.answer       ?? '',
          hint:          q.hint          ?? '',
          explanation:   q.explanation   ?? '',
          order_index:   i,
        })),
        time_limit_mins: data.timeLimitMins ?? null,
        is_active: true,
      }
      sessionStorage.setItem(PREVIEW_SESSION_KEY, JSON.stringify(draft))
      window.open('/preview-draft', '_blank')
    } catch {
      toast({ message: 'Could not open preview. Try again.', type: 'error' })
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    setError('')
    const result = await createAssessment(data, questions, settings, source)
    if (result.error) {
      setError(result.error)
      toast({ message: 'Failed to save. Please try again.', type: 'error' })
      setSaving(false)
      return
    }
    setSlug(result.slug)
    setSaved(true)
    setSaving(false)
    toast({ message: 'Assessment saved! Share the link with your students.', type: 'success' })
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {
      // Fallback for browsers that block clipboard
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Take my assessment: ${shareUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const subject    = (data.subject ?? '').replace(/_/g, ' ')
  const grade      = data.classLevel ?? ''
  const qCount     = questions.length
  const typeLabel  = questionType === 'true_false' ? 'True/False' : 'MCQ'

  // ──────────────────────────────────────────────────────────────────────
  // PRE-SAVE STATE
  // ──────────────────────────────────────────────────────────────────────
  if (!saved) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ textAlign: 'center', paddingBottom: '8px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📋</div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: C.text, margin: '0 0 6px' }}>
            Almost ready!
          </h2>
          <p style={{ fontSize: '14px', color: C.muted, margin: 0 }}>
            {qCount} question{qCount !== 1 ? 's' : ''} · {typeLabel}
            {subject ? ` · ${subject}` : ''}
            {grade ? ` · ${grade}` : ''}
          </p>
        </div>

        {/* Preview button */}
        <button
          type="button"
          onClick={handlePreviewDraft}
          disabled={qCount === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            width: '100%', padding: '16px 20px',
            backgroundColor: '#f0f7f4',
            border: `2px solid ${C.border}`,
            borderRadius: '12px', textAlign: 'left',
            cursor: qCount === 0 ? 'not-allowed' : 'pointer',
            opacity: qCount === 0 ? 0.5 : 1,
            transition: 'border-color 0.12s',
          }}
          onMouseEnter={(e) => { if (qCount > 0) e.currentTarget.style.borderColor = C.brand }}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
        >
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            backgroundColor: C.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Eye size={20} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '15px', fontWeight: '600', color: C.text, margin: '0 0 2px' }}>
              Preview Assessment
            </p>
            <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
              See it exactly as students will. Opens in a new tab.
            </p>
          </div>
          <ExternalLink size={16} color={C.muted} style={{ flexShrink: 0 }} />
        </button>

        {/* Summary */}
        <div style={{
          backgroundColor: C.white, border: `1px solid ${C.border}`,
          borderRadius: '12px', padding: '16px 20px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
        }}>
          {[
            { label: 'Questions', value: qCount },
            { label: 'Type',      value: typeLabel },
            ...(subject ? [{ label: 'Subject', value: subject }] : []),
            ...(grade   ? [{ label: isUniversity ? 'Course' : 'Grade', value: grade }] : []),
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: '11px', color: C.muted, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
              </p>
              <p style={{ fontSize: '14px', fontWeight: '600', color: C.text, margin: 0 }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: '#dc2626', textAlign: 'center', margin: 0 }}>
            {error}
          </p>
        )}

        {qCount === 0 && (
          <p style={{ fontSize: '13px', color: '#dc2626', textAlign: 'center', margin: 0 }}>
            Add at least one question before saving.
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || qCount === 0}
            style={{
              height: '48px', width: '100%', borderRadius: '10px',
              backgroundColor: qCount === 0 ? C.muted : C.brand,
              color: '#fff', fontSize: '15px', fontWeight: '600',
              border: 'none', cursor: qCount === 0 || saving ? 'not-allowed' : 'pointer',
              opacity: saving || qCount === 0 ? 0.7 : 1,
              transition: 'opacity 0.12s',
            }}
          >
            {saving ? 'Saving…' : 'Save & Get Link →'}
          </button>
          <button
            type="button"
            onClick={onBack}
            style={{
              height: '44px', width: '100%', borderRadius: '10px',
              backgroundColor: 'transparent', color: C.secondary,
              fontSize: '14px', fontWeight: '500',
              border: `1px solid ${C.border}`, cursor: 'pointer',
            }}
          >
            ← Back to Questions
          </button>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────
  // POST-SAVE STATE — fully mobile responsive
  // ──────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Success header */}
      <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          backgroundColor: C.greenBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
        }}>
          <span style={{ fontSize: '26px' }}>✓</span>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: C.text, margin: '0 0 6px' }}>
          Assessment created!
        </h2>
        <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>
          {subject && `${subject} · `}
          {grade && `${grade} · `}
          {qCount} question{qCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Share link card */}
      <div style={{
        backgroundColor: C.white, border: `1px solid ${C.border}`,
        borderRadius: '12px', padding: '18px 20px',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        <p style={{ fontSize: '13px', fontWeight: '500', color: C.secondary, margin: 0 }}>
          Share this link with your students
        </p>

        {/* Link display — truncated, no overflow */}
        <div style={{
          backgroundColor: C.bg, border: `1px solid ${C.border}`,
          borderRadius: '8px', padding: '12px 14px',
          fontFamily: 'monospace', fontSize: '13px', color: C.brand,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          width: '100%', boxSizing: 'border-box',
        }}>
          {shareUrl}
        </div>

        {/* Copy button — full width on mobile */}
        <button
          type="button"
          onClick={copyLink}
          style={{
            height: '44px', width: '100%', borderRadius: '8px',
            backgroundColor: copied ? C.green : C.amber,
            color: '#fff', fontSize: '14px', fontWeight: '600',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'background-color 0.2s',
          }}
        >
          {copied ? <><CheckCheck size={16} /> Copied ✓</> : <><Copy size={16} /> Copy Link</>}
        </button>
      </div>

      {/* Share via row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontSize: '13px', color: C.muted, margin: 0 }}>Share via</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={shareWhatsApp}
            style={{
              flex: 1, height: '44px', borderRadius: '8px',
              backgroundColor: C.white,
              border: '2px solid #16a34a', color: '#16a34a',
              fontSize: '14px', fontWeight: '600',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '16px' }}>💬</span> WhatsApp
          </button>
          <button
            type="button"
            onClick={copyLink}
            style={{
              flex: 1, height: '44px', borderRadius: '8px',
              backgroundColor: C.white,
              border: `2px solid ${C.border}`, color: C.secondary,
              fontSize: '14px', fontWeight: '600',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              cursor: 'pointer',
            }}
          >
            <Copy size={15} /> Copy Link
          </button>
        </div>
      </div>

      {/* Action buttons — stacked, full width */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              height: '44px', width: '100%', borderRadius: '8px',
              backgroundColor: C.white,
              border: `1px solid ${C.border}`, color: C.secondary,
              fontSize: '14px', fontWeight: '600',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              textDecoration: 'none', boxSizing: 'border-box',
            }}
          >
            <Eye size={15} /> Preview Assessment
          </a>
        )}
        <button
          type="button"
          onClick={onFinish}
          style={{
            height: '48px', width: '100%', borderRadius: '8px',
            backgroundColor: C.amber, color: '#fff',
            fontSize: '15px', fontWeight: '600',
            border: 'none', cursor: 'pointer',
          }}
        >
          Go to Dashboard →
        </button>
      </div>

      {/* Bottom note */}
      <p style={{ fontSize: '12px', color: C.muted, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
        Students don't need an account to take this assessment
      </p>

    </div>
  )
}