'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const VARIANTS = {
  success: {
    icon:      CheckCircle2,
    container: 'bg-white border-l-4 border-success',
    icon_cls:  'text-success',
    title:     'text-success',
  },
  error: {
    icon:      XCircle,
    container: 'bg-white border-l-4 border-danger',
    icon_cls:  'text-danger',
    title:     'text-danger',
  },
  warning: {
    icon:      AlertCircle,
    container: 'bg-white border-l-4 border-amber',
    icon_cls:  'text-amber',
    title:     'text-amber',
  },
  info: {
    icon:      Info,
    container: 'bg-white border-l-4 border-brand-500',
    icon_cls:  'text-brand-500',
    title:     'text-brand-500',
  },
}

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false)
  const variant = VARIANTS[toast.type] ?? VARIANTS.info
  const Icon    = variant.icon

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => onDismiss(toast.id), 300)
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-lg border border-border min-w-[280px] max-w-sm',
        'transition-all duration-300',
        variant.container,
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2'
      )}
    >
      <Icon size={18} className={cn('flex-shrink-0 mt-0.5', variant.icon_cls)} />
      <p className="flex-1 text-sm font-medium text-ink leading-relaxed">
        {toast.message}
      </p>
      <button
        onClick={handleDismiss}
        className="text-ink-4 hover:text-ink transition-colors flex-shrink-0 mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}