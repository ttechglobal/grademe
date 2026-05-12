'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Zap, CheckCircle2, XCircle, Clock, TrendingDown,
  TrendingUp, Loader2, ShieldCheck, Lock, ArrowRight,
  Sparkles, X
} from 'lucide-react'
import { CREDIT_PACKAGES } from '@/lib/creditService'
import { useCredits } from '@/hooks/useCredits'
import { cn } from '@/lib/utils'

// ── Helpers ──────────────────────────────────────────────────────────────────
function txIcon(type) {
  if (type === 'earn')   return <TrendingUp   size={14} className="text-success" />
  if (type === 'spend')  return <TrendingDown  size={14} className="text-danger"  />
  if (type === 'refund') return <TrendingUp   size={14} className="text-amber"   />
  return <Zap size={14} className="text-brand-500" />
}
function txLabel(tx) {
  if (tx.action === 'purchase')     return 'Credits purchased'
  if (tx.action === 'signup_bonus') return 'Welcome bonus'
  return tx.description || tx.action || tx.type
}
function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m    = Math.floor(diff / 60000)
  if (m < 1)   return 'Just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return new Date(iso).toLocaleDateString()
}

// ── Credit packages — correct pricing in both currencies ─────────────────────
const PACKAGES_UI = [
  {
    id:          'starter',
    credits:     100,
    naira:       500,
    usd:         0.50,
    label:       'Starter',
    per:         '₦5 per question',
    valueLabel:  null,
    description: 'Perfect for trying out AI generation',
    popular:     false,
    bestValue:   false,
  },
  {
    id:          'standard',
    credits:     500,
    naira:       2000,
    usd:         2.00,
    label:       'Standard',
    per:         '₦4 per question',
    valueLabel:  'Save 20%',
    description: 'Best value for active tutors',
    popular:     true,
    bestValue:   false,
  },
  {
    id:          'pro',
    credits:     1000,
    naira:       3500,
    usd:         3.50,
    label:       'Pro',
    per:         '₦3.50 per question',
    valueLabel:  'Best value',
    description: 'For high-volume use — best rate',
    popular:     false,
    bestValue:   true,
  },
]

// ── Buy Credits Modal ─────────────────────────────────────────────────────────
function BuyCreditsModal({ onClose }) {
  const [selected, setSelected] = useState('standard')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const pkg = PACKAGES_UI.find((p) => p.id === selected)

  const handlePurchase = async () => {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/payments/initialize', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ packageId: selected }),
      })
      const data = await res.json()
      if (data.success && data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        setError(data.error || 'Payment initialization failed. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}>

        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Buy Credits</h2>
            <p className="text-xs text-ink-4 mt-0.5">Credits never expire · Use on any assessment</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface hover:bg-border flex items-center justify-center transition-colors"
            aria-label="Close">
            <X size={16} className="text-ink-3" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Package selector */}
          <div className="flex flex-col gap-3">
            {PACKAGES_UI.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                className={cn(
                  'relative flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all',
                  selected === p.id
                    ? 'border-brand-600 bg-brand-50 shadow-sm'
                    : 'border-border bg-white hover:border-brand-200'
                )}
              >
                {/* Popular / Best Value badge */}
                {(p.popular || p.bestValue) && (
                  <span className={cn(
                    'absolute -top-2.5 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                    p.popular ? 'bg-amber text-brand-900' : 'bg-brand-800 text-white'
                  )}>
                    {p.popular ? '⭐ Popular' : '🏆 Best Value'}
                  </span>
                )}

                {/* Left — credits + label */}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors',
                    selected === p.id ? 'border-brand-600 bg-brand-600' : 'border-border'
                  )}
                    style={{ boxShadow: selected === p.id ? 'inset 0 0 0 3px white' : 'none' }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-ink">{p.credits.toLocaleString()} Credits</p>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        selected === p.id ? 'bg-brand-700 text-white' : 'bg-surface text-ink-4')}>
                        {p.label}
                      </span>
                    </div>
                    <p className="text-xs text-ink-4 mt-0.5">{p.description}</p>
                  </div>
                </div>

                {/* Right — price in both currencies */}
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="font-bold text-ink text-base">₦{p.naira.toLocaleString()}</p>
                  <p className="text-[11px] text-ink-4">≈ ${p.usd.toFixed(2)} USD</p>
                  <p className="text-[10px] text-brand-500 font-semibold mt-0.5">{p.per}</p>
                  {p.valueLabel && (
                    <p className="text-[10px] text-success font-bold">{p.valueLabel}</p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* What you can do with selected package */}
          {pkg && (
            <div className="bg-brand-50 border border-brand-100 rounded-2xl px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">
                With {pkg.credits.toLocaleString()} credits you can:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  `~${pkg.credits} MCQ questions`,
                  `~${pkg.credits} True/False questions`,
                  'Mix across any assessments',
                  'Credits never expire',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-brand-500 flex-shrink-0" />
                    <span className="text-xs text-brand-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info line */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs text-ink-4">💡</span>
            <p className="text-xs text-ink-4 leading-relaxed">
              1 credit = 1 AI-generated question (with step-by-step explanation included) ·{' '}
              <span className="font-semibold">Credits never expire</span> ·{' '}
              Secure payment via Paystack
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger flex items-start gap-2">
              <XCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Paystack CTA */}
          <button
            type="button"
            onClick={handlePurchase}
            disabled={loading}
            className="w-full rounded-2xl font-bold text-white flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ height: '52px', fontSize: '15px', background: '#217070', boxShadow: '0 4px 14px rgba(33,112,112,0.30)' }}
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Processing…</>
              : <><Lock size={16} /> Pay ₦{pkg?.naira.toLocaleString()} securely</>
            }
          </button>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {[
              { icon: <ShieldCheck size={13} />, text: 'Secured by Paystack' },
              { icon: <Lock size={13} />, text: 'SSL encrypted' },
            ].map((b) => (
              <div key={b.text} className="flex items-center gap-1.5 text-xs text-ink-4">
                {b.icon}
                <span>{b.text}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CreditsPage() {
  const searchParams = useSearchParams()
  const { credits, loading: creditsLoading, refresh } = useCredits()

  const [showBuy,    setShowBuy]    = useState(false)
  const [history,    setHistory]    = useState([])
  const [histLoading, setHistLoading] = useState(true)
  const [banner,     setBanner]     = useState(null)

  // Handle Paystack redirect
  useEffect(() => {
    const success = searchParams.get('success')
    const error   = searchParams.get('error')
    const bought  = searchParams.get('credits')

    if (success === 'true' && bought) {
      setBanner({ type: 'success', message: `🎉 ${parseInt(bought).toLocaleString()} credits added to your account!` })
      refresh()
    } else if (error) {
      const msgs = {
        payment_failed:    'Payment was not completed. No charge was made.',
        missing_reference: 'Payment reference missing. Please try again.',
        server_error:      'Something went wrong verifying your payment. Contact support if credits were not added.',
      }
      setBanner({ type: 'error', message: msgs[error] || 'Payment could not be verified.' })
    }
  }, [searchParams, refresh])

  const loadHistory = useCallback(async () => {
    setHistLoading(true)
    try {
      const res  = await fetch('/api/credits/history')
      const data = await res.json()
      setHistory(data.transactions ?? [])
    } catch { /* fail silently */ }
    setHistLoading(false)
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">

      {/* Banner */}
      {banner && (
        <div className={cn(
          'flex items-start gap-3 px-5 py-4 rounded-2xl border',
          banner.type === 'success'
            ? 'bg-success-light border-success/20 text-success'
            : 'bg-danger-light border-danger/20 text-danger'
        )}>
          {banner.type === 'success'
            ? <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
            : <XCircle      size={18} className="flex-shrink-0 mt-0.5" />
          }
          <p className="text-sm font-semibold">{banner.message}</p>
          <button onClick={() => setBanner(null)} className="ml-auto text-current/50 hover:text-current">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Credit balance card */}
      <div className="bg-white border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-1">Your Balance</p>
            {creditsLoading ? (
              <div className="h-10 w-24 bg-surface rounded-xl animate-pulse" />
            ) : (
              <p className="font-display text-4xl font-black text-ink">
                {credits.toLocaleString()}
                <span className="text-lg font-bold text-ink-4 ml-2">credits</span>
              </p>
            )}
            <p className="text-xs text-ink-4 mt-1.5">1 credit = 1 AI-generated question with explanation</p>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(33,112,112,0.1)' }}>
            <Zap size={28} style={{ color: '#217070' }} />
          </div>
        </div>

        {/* What credits get you */}
        <div className="px-6 pb-5 flex flex-col gap-1">
          {[
            { label: 'MCQ + 4 options', credits: 1 },
            { label: 'True/False question', credits: 1 },
            { label: 'Fill-in question', credits: 1 },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs text-ink-4">
              <span>✓ {item.label}</span>
              <span className="font-semibold text-ink">{item.credits} credit</span>
            </div>
          ))}
        </div>

        <div className="mt-0 px-5 pb-5">
          <button
            onClick={() => setShowBuy(true)}
            className="w-full rounded-xl border-2 border-brand-600 text-brand-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-50 transition-colors"
            style={{ height: '44px' }}
          >
            <Sparkles size={15} /> Buy more credits
          </button>
        </div>
      </div>

      {/* Packages preview */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-bold text-ink">Credit Packages</p>
        </div>
        <div className="divide-y divide-border">
          {PACKAGES_UI.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface transition-colors"
              onClick={() => setShowBuy(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(33,112,112,0.1)' }}>
                  <Zap size={18} style={{ color: '#217070' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-ink">{p.credits.toLocaleString()} Credits</p>
                    {p.popular    && <span className="text-[10px] font-bold bg-amber text-brand-900 px-2 py-0.5 rounded-full uppercase">Popular</span>}
                    {p.bestValue  && <span className="text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200 px-2 py-0.5 rounded-full uppercase">Best Value</span>}
                  </div>
                  <p className="text-xs text-ink-4 mt-0.5">{p.per}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-ink text-sm">₦{p.naira.toLocaleString()}</p>
                  <p className="text-[11px] text-ink-4">≈ ${p.usd.toFixed(2)} USD</p>
                </div>
                <ArrowRight size={16} className="text-ink-4" />
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-surface border-t border-border">
          <p className="text-xs text-ink-4 text-center">
            💡 1 credit = 1 question · Credits never expire · Secure payment via Paystack
          </p>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-white border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-bold text-ink">Transaction History</p>
        </div>
        {histLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-ink-4" />
          </div>
        ) : history.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Zap size={32} className="text-ink-4 mx-auto mb-3 opacity-40" />
            <p className="text-sm text-ink-4">No transactions yet.</p>
            <p className="text-xs text-ink-4 mt-1">Generate questions or buy credits to see your history.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                  {txIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink font-medium truncate">{txLabel(tx)}</p>
                  <p className="text-xs text-ink-4 mt-0.5 flex items-center gap-1">
                    <Clock size={10} /> {relTime(tx.created_at)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={cn('text-sm font-bold', tx.type === 'spend' ? 'text-danger' : 'text-success')}>
                    {tx.type === 'spend' ? '−' : '+'}{tx.amount}
                  </p>
                  <p className="text-[10px] text-ink-4">{tx.balance_after} left</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBuy && <BuyCreditsModal onClose={() => setShowBuy(false)} />}
    </div>
  )
}