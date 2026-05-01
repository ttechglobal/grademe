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

// ── Helpers ─────────────────────────────────────────────────────────────────
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

// ── Credit packages with value framing ──────────────────────────────────────
const PACKAGES_UI = [
  {
    id:          'starter',
    credits:     100,
    naira:       500,
    label:       'Starter',
    per:         '₦5 per question',
    description: 'Perfect for trying out AI generation',
    popular:     false,
    color:       '#217070',
  },
  {
    id:          'standard',
    credits:     500,
    naira:       2000,
    label:       'Standard',
    per:         '₦4 per question',
    description: 'Best value for active tutors',
    popular:     true,
    color:       '#217070',
  },
  {
    id:          'pro',
    credits:     1000,
    naira:       3500,
    label:       'Pro',
    per:         '₦3.50 per question',
    description: 'For high-volume use — best rate',
    popular:     false,
    color:       '#217070',
  },
]

// ── Buy Credits Modal ─────────────────────────────────────────────────────────
function BuyCreditsModal({ onClose }) {
  const [selected,  setSelected]  = useState('standard')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [step,      setStep]      = useState('select') // 'select' | 'confirm'

  const pkg = PACKAGES_UI.find(p => p.id === selected)

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

        {/* Drag handle (mobile) */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Buy Credits</h2>
            <p className="text-xs text-ink-4 mt-0.5">Credits never expire · Use on any assessment</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface hover:bg-border flex items-center justify-center transition-colors" aria-label="Close">
            <X size={16} className="text-ink-3"/>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Package selector */}
          <div className="flex flex-col gap-3">
            {PACKAGES_UI.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                className={cn(
                  'relative flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all',
                  selected === p.id
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-border bg-white hover:border-brand-200'
                )}
              >
                {p.popular && (
                  <span className="absolute -top-2.5 left-4 text-[10px] font-bold bg-amber text-ink px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    Most Popular
                  </span>
                )}

                {/* Radio dot */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors',
                    selected === p.id ? 'border-brand-600 bg-brand-600' : 'border-border'
                  )}
                    style={{ boxShadow: selected === p.id ? 'inset 0 0 0 3px white' : 'none' }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-ink">{p.credits.toLocaleString()} Credits</p>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', selected === p.id ? 'bg-brand-700 text-white' : 'bg-surface text-ink-4')}>
                        {p.label}
                      </span>
                    </div>
                    <p className="text-xs text-ink-4 mt-0.5">{p.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="font-bold text-ink text-base">₦{p.naira.toLocaleString()}</p>
                  <p className="text-[11px] text-ink-4">{p.per}</p>
                </div>
              </button>
            ))}
          </div>

          {/* What you can do */}
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
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-brand-500 flex-shrink-0"/>
                    <span className="text-xs text-brand-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger flex items-start gap-2">
              <XCircle size={16} className="flex-shrink-0 mt-0.5"/>
              {error}
            </div>
          )}

          {/* Paystack CTA */}
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full rounded-2xl font-bold text-white flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ height: '52px', fontSize: '15px', background: '#217070', boxShadow: '0 4px 14px rgba(33,112,112,0.30)' }}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin"/>Redirecting to Paystack…</>
            ) : (
              <><Zap size={16}/>Pay ₦{pkg?.naira.toLocaleString()} via Paystack</>
            )}
          </button>

          {/* Trust + Paystack badge */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4 text-xs text-ink-4">
              <span className="flex items-center gap-1.5"><Lock size={12}/>Secured by Paystack</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={12}/>SSL encrypted</span>
            </div>

            {/* Paystack badge */}
            <div className="flex items-center gap-2 bg-[#011B33] text-white rounded-xl px-4 py-2.5">
              <div className="flex flex-col leading-none">
                <span style={{ fontSize:'10px', opacity:0.6, letterSpacing:'0.05em' }}>POWERED BY</span>
                <span style={{ fontSize:'14px', fontWeight:800, letterSpacing:'0.02em' }}>Paystack</span>
              </div>
              <div className="w-px h-8 bg-white/20 mx-1"/>
              <div className="flex flex-col leading-none">
                <span style={{ fontSize:'10px', opacity:0.6 }}>Supports</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {['Card','Bank Transfer','USSD'].map(m=>(
                    <span key={m} style={{ fontSize:'10px', fontWeight:600, background:'rgba(255,255,255,0.15)', borderRadius:'4px', padding:'1px 5px' }}>{m}</span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-ink-4 text-center">
              You'll be redirected to Paystack's secure checkout.<br/>
              Your payment details are never stored on GradeMee.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Main credits page ────────────────────────────────────────────────────────
export default function CreditsPage() {
  const searchParams              = useSearchParams()
  const { credits, loading: creditsLoading, refresh } = useCredits()
  const [history,     setHistory]     = useState([])
  const [histLoading, setHistLoading] = useState(true)
  const [showBuy,     setShowBuy]     = useState(false)

  const success    = searchParams.get('success') === 'true'
  const errorParam = searchParams.get('error')
  const newCredits = searchParams.get('credits')

  const loadHistory = useCallback(async () => {
    setHistLoading(true)
    try {
      const res  = await fetch('/api/credits/history?limit=15')
      const data = await res.json()
      setHistory(data.transactions ?? [])
    } catch {}
    setHistLoading(false)
  }, [])

  useEffect(() => { loadHistory() },                                    [loadHistory])
  useEffect(() => { if (success) { refresh(); loadHistory() } },       [success])
  useEffect(() => { if (searchParams.get('buy') === '1') setShowBuy(true) }, [])

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6 pb-16">

      {/* Payment callback banners */}
      {success && (
        <div className="flex items-center gap-3 bg-success-light border border-success/30 rounded-2xl px-5 py-4">
          <CheckCircle2 size={20} className="text-success flex-shrink-0"/>
          <div>
            <p className="text-sm font-bold text-success">Payment successful!</p>
            <p className="text-xs text-success/80">
              {newCredits ? `${parseInt(newCredits).toLocaleString()} credits have been added to your account.` : 'Credits have been added to your account.'}
            </p>
          </div>
        </div>
      )}
      {errorParam && (
        <div className="flex items-center gap-3 bg-danger-light border border-danger/30 rounded-2xl px-5 py-4">
          <XCircle size={20} className="text-danger flex-shrink-0"/>
          <div>
            <p className="text-sm font-bold text-danger">Payment not completed</p>
            <p className="text-xs text-danger/80">
              {errorParam === 'payment_failed'
                ? 'The payment was not successful. No credits were charged. Please try again.'
                : 'Something went wrong. If you were charged, please contact support.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Balance hero card ── */}
      <div className="relative overflow-hidden rounded-3xl text-white"
        style={{ background: 'linear-gradient(135deg, #0f2e2e 0%, #217070 100%)', padding: '32px 28px' }}>

        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.04)' }}/>
        <div className="absolute -bottom-14 right-16 w-36 h-36 rounded-full pointer-events-none" style={{ background: 'rgba(245,166,35,0.07)' }}/>

        <p className="relative text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Current Balance</p>
        <div className="relative flex items-end gap-2 mb-1">
          {creditsLoading ? (
            <div className="h-14 w-28 bg-white/10 rounded-xl animate-pulse"/>
          ) : (
            <>
              <span className="font-display text-6xl font-bold leading-none">{credits.toLocaleString()}</span>
              <span className="text-white/50 text-sm mb-2">credits</span>
            </>
          )}
        </div>
        <p className="relative text-white/40 text-xs mb-6">Credits never expire · Use on any assessment</p>

        <button
          onClick={() => setShowBuy(true)}
          className="relative inline-flex items-center gap-2 font-bold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: '#f5a623', color: '#0f2e2e', fontSize: '14px', padding: '10px 20px' }}
        >
          <Zap size={15}/> Buy Credits
        </button>
      </div>

      {/* ── How credits work ── */}
      <div className="bg-white border border-border rounded-2xl px-5 py-5 shadow-card">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-4">Credit costs</p>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Multiple Choice question',  cost: 1, icon: '🧠' },
            { label: 'True or False question',    cost: 1, icon: '✅' },
            { label: 'Stepwise question',         cost: 3, icon: '📐', soon: true },
            { label: 'Scenario question',         cost: 5, icon: '🎭', soon: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-2.5">
                <span className="text-base">{item.icon}</span>
                <span className="text-sm text-ink">{item.label}</span>
                {item.soon && (
                  <span className="text-[10px] font-bold bg-surface text-ink-4 px-2 py-0.5 rounded-full">Soon</span>
                )}
              </div>
              <span className="text-sm font-bold text-ink">{item.cost} credit{item.cost !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-border">
          <button
            onClick={() => setShowBuy(true)}
            className="w-full rounded-xl border-2 border-brand-600 text-brand-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-50 transition-colors"
            style={{ height: '44px' }}
          >
            <Sparkles size={15}/> Buy more credits
          </button>
        </div>
      </div>

      {/* ── Packages preview ── */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-bold text-ink">Credit Packages</p>
        </div>
        <div className="divide-y divide-border">
          {PACKAGES_UI.map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface transition-colors"
              onClick={() => { setShowBuy(true) }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(33,112,112,0.1)' }}>
                  <Zap size={18} style={{ color: '#217070' }}/>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-ink">{p.credits.toLocaleString()} Credits</p>
                    {p.popular && <span className="text-[10px] font-bold bg-amber text-ink px-2 py-0.5 rounded-full uppercase">Popular</span>}
                  </div>
                  <p className="text-xs text-ink-4 mt-0.5">{p.per}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-ink text-sm">₦{p.naira.toLocaleString()}</p>
                </div>
                <ArrowRight size={16} className="text-ink-4"/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Transaction history ── */}
      <div className="bg-white border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-bold text-ink">Transaction History</p>
        </div>
        {histLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-ink-4"/>
          </div>
        ) : history.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Zap size={32} className="text-ink-4 mx-auto mb-3 opacity-40"/>
            <p className="text-sm text-ink-4">No transactions yet.</p>
            <p className="text-xs text-ink-4 mt-1">Generate questions or buy credits to see your history.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                  {txIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink font-medium truncate">{txLabel(tx)}</p>
                  <p className="text-xs text-ink-4 mt-0.5 flex items-center gap-1">
                    <Clock size={10}/> {relTime(tx.created_at)}
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

      {showBuy && <BuyCreditsModal onClose={() => setShowBuy(false)}/>}
    </div>
  )
}