import { cn } from '@/lib/utils'

const variants = {
  green:  'bg-success-light text-success',
  amber:  'bg-amber-light text-amber',
  red:    'bg-danger-light text-danger',
  blue:   'bg-blue-100 text-blue-700',
  grey:   'bg-surface text-ink-3',
  brand:  'bg-brand-100 text-brand-700',
}

export default function Badge({ children, variant = 'grey', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5',
        'text-xs font-semibold rounded-full',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}