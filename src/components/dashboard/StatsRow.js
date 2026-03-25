import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

function StatCard({ label, value, change, positive }) {
  return (
    <div className="bg-white border border-border rounded-2xl px-6 py-5 flex flex-col gap-2 shadow-card hover:-translate-y-0.5 transition-transform duration-150">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-4">
        {label}
      </p>
      <p className="font-display text-4xl font-bold text-ink leading-none">
        {value}
      </p>
      <div className={cn(
        'flex items-center gap-1 text-xs font-medium',
        positive ? 'text-success' : 'text-danger'
      )}>
        {positive
          ? <TrendingUp size={13} />
          : <TrendingDown size={13} />
        }
        {change}
      </div>
    </div>
  )
}

export default function StatsRow({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  )
}