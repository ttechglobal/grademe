import { cn } from '@/lib/utils'

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
      <select
        className={cn(
          'w-full font-sans text-sm text-ink',
          'bg-white border border-border rounded-xl',
          'px-4 py-3 outline-none appearance-none',
          'transition-colors duration-150',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-danger',
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
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  )
}