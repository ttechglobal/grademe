import { cn } from '@/lib/utils'

// Deterministic color from a string (name/id)
function getColor(str = '') {
  const colors = [
    'bg-brand-600',
    'bg-purple-600',
    'bg-sky-600',
    'bg-rose-600',
    'bg-amber',
    'bg-emerald-600',
    'bg-orange-600',
  ]
  const index = str.charCodeAt(0) % colors.length
  return colors[index]
}

function getInitials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-16 h-16 text-xl',
}

export default function Avatar({ name, size = 'md', className }) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center',
        'font-display font-bold text-white flex-shrink-0',
        getColor(name),
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}