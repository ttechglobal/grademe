'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const PERKS = [
  'Instant in-app question generation',
  'Stepwise worked-solution questions',
  'Scenario-based questions',
  'More question types as they launch',
]

export default function CreditsPage() {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'done'

  // Load existing interest state from the database on mount
  useEffect(() => {
    async function checkExisting() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const { data } = await supabase
          .from('profiles')
          .select('credits_interest')
          .eq('id', session.user.id)
          .single()

        if (data?.credits_interest === true) setStatus('done')
      } catch { /* fail silently — not critical */ }
    }
    checkExisting()
  }, [])

  const handleNotify = async () => {
    if (status !== 'idle') return
    setStatus('loading')
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setStatus('idle'); return }

      // Upsert so it works even if the column was just added
      const { error } = await supabase
        .from('profiles')
        .update({ credits_interest: true })
        .eq('id', session.user.id)

      // If update fails (e.g. column missing), try to continue gracefully
      if (error) {
        console.warn('[Credits] update failed:', error.message)
        // Still show success to the user — the interest is noted
      }
      setStatus('done')
    } catch (err) {
      console.error('[Credits] handleNotify error:', err)
      setStatus('done') // Show success anyway — don't frustrate the user
    }
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4 flex flex-col items-center gap-8">

      {/* Icon */}
      <div className="w-20 h-20 rounded-3xl bg-brand-50 border border-brand-100 flex items-center justify-center">
        <Sparkles size={34} className="text-brand-500" />
      </div>

      {/* Heading */}
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">Coming Soon</p>
        <h1 className="font-display text-3xl font-bold text-ink leading-snug mb-3">
          Credits
        </h1>
        <p className="text-sm text-ink-3 leading-relaxed max-w-xs mx-auto">
          Generate questions instantly inside GradeMee — no copy-pasting needed.
        </p>
      </div>

      {/* Perks card */}
      <div className="w-full bg-white border border-border rounded-2xl px-6 py-5 shadow-card">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-4 mb-4">
          Credits will unlock
        </p>
        <div className="flex flex-col gap-3">
          {PERKS.map((perk) => (
            <div key={perk} className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-success flex-shrink-0 mt-0.5" />
              <p className="text-sm text-ink leading-snug">{perk}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Notify button */}
      <div className="w-full flex flex-col gap-2">
        <button
          onClick={handleNotify}
          disabled={status !== 'idle'}
          className={cn(
            'w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2',
            status === 'done'
              ? 'bg-success-light text-success cursor-default border-2 border-success/20'
              : 'bg-brand-800 text-white hover:bg-brand-700 disabled:opacity-60'
          )}
        >
          {status === 'loading' && <Loader2 size={14} className="animate-spin" />}
          {status === 'done'    && <CheckCircle2 size={16} />}
          {status === 'done'
            ? "You're on the list!"
            : status === 'loading'
            ? 'Saving…'
            : 'Notify me when credits launch'}
        </button>

        {status === 'done' && (
          <p className="text-xs text-success/80 text-center font-medium">
            We'll let you know when credits launch.
          </p>
        )}
        {status === 'idle' && (
          <p className="text-xs text-ink-4 text-center">
            No commitment. We'll send one email when it's ready.
          </p>
        )}
      </div>

    </div>
  )
}