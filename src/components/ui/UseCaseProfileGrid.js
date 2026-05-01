'use client'

import { GraduationCap, BookOpen, Check } from 'lucide-react'
import { USE_CASE_OPTIONS } from '@/lib/useCaseConfig'
import { cn } from '@/lib/utils'

const ICON_MAP = { GraduationCap, BookOpen }

export default function UseCaseProfileGrid({ selected, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {USE_CASE_OPTIONS.map((opt) => {
        const Icon       = ICON_MAP[opt.lucideIcon] ?? GraduationCap
        const isSelected = selected === opt.value
        const circleBg   = `${opt.iconColor}1F`

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={isSelected}
            className={cn(
              'relative flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-150',
              'hover:shadow-md hover:-translate-y-0.5',
              isSelected
                ? 'border-brand-600 bg-brand-50 shadow-sm'
                : 'border-border bg-white hover:border-brand-300'
            )}
          >
            {isSelected && (
              <span className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                <Check size={11} strokeWidth={3} className="text-white" />
              </span>
            )}

            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: circleBg }}
            >
              <Icon size={22} strokeWidth={1.75} style={{ color: opt.iconColor }} />
            </div>

            <div className="min-w-0 pr-6">
              <p className={cn(
                'text-sm font-bold leading-snug',
                isSelected ? 'text-brand-900' : 'text-ink'
              )}>
                {opt.label}
              </p>
              <p className="text-[11px] text-ink-4 mt-1 leading-relaxed font-normal">
                {opt.description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/**
 * UseCaseProfileBadge — compact icon + name, used in settings collapsed state.
 */
export function UseCaseProfileBadge({ profileKey }) {
  const opt  = USE_CASE_OPTIONS.find((o) => o.value === profileKey) ?? USE_CASE_OPTIONS[0]
  const Icon = ICON_MAP[opt.lucideIcon] ?? GraduationCap

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${opt.iconColor}1F` }}
      >
        <Icon size={16} strokeWidth={1.75} style={{ color: opt.iconColor }} />
      </div>
      <span className="text-sm font-semibold text-ink">{opt.label}</span>
    </div>
  )
}