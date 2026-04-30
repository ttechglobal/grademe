import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export default function Select({
  label,
  error,
  options = [],
  className,
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-ink-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            'w-full font-sans text-sm text-ink',
            'bg-white border-2 border-border rounded-xl',
            'px-4 py-3 pr-10 outline-none appearance-none cursor-pointer',
            'transition-colors duration-150',
            'focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
            'hover:border-brand-300',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-danger',
            !props.value && 'text-ink-4',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <ChevronDown size={15} className="text-ink-4" />
        </div>
      </div>
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  )
}