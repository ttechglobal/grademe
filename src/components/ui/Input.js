import { cn } from '@/lib/utils'

export default function Input({
  label,
  hint,
  error,
  icon,
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
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full font-sans text-sm text-ink',
            'bg-white border border-border rounded-xl',
            'px-4 py-3 outline-none',
            'placeholder:text-ink-4',
            'transition-colors duration-150',
            'focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-danger focus:border-danger focus:ring-danger/10',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>

      {hint && !error && (
        <p className="text-xs text-ink-4">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  )
}