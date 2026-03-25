import { cn } from '@/lib/utils'

const variants = {
  primary:   'bg-brand-800 text-white hover:bg-brand-700 shadow-card',
  secondary: 'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50',
  amber:     'bg-amber text-ink font-semibold hover:brightness-105 shadow-card',
  ghost:     'bg-transparent text-ink-3 hover:bg-brand-50',
  danger:    'bg-danger text-white hover:brightness-105',
}

const sizes = {
  sm:   'px-3 py-2 text-sm rounded-xl',
  md:   'px-5 py-3 text-sm rounded-xl',
  lg:   'px-6 py-4 text-base rounded-2xl',
  full: 'w-full px-5 py-4 text-base rounded-xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  onClick,
  type = 'button',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'font-medium font-sans transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          fill="none" viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}