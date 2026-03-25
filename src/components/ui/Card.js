import { cn } from '@/lib/utils'

export default function Card({ children, className, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white border border-border rounded-2xl',
        'shadow-card',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all duration-150',
        className
      )}
    >
      {children}
    </div>
  )
}