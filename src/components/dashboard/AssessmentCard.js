import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const accentColors = {
  green:  'bg-brand-400',
  amber:  'bg-amber',
  red:    'bg-danger',
  blue:   'bg-blue-500',
  purple: 'bg-purple-500',
}

const progressColors = {
  green:  'bg-brand-400',
  amber:  'bg-amber',
  red:    'bg-danger',
  blue:   'bg-blue-500',
  purple: 'bg-purple-500',
}

export default function AssessmentCard({
  subject,
  title,
  meta,
  submitted,
  total,
  avgScore,
  color = 'green',
  status,
  onClick,
}) {
  const pct = total > 0 ? Math.round((submitted / total) * 100) : 0

  const badgeVariant =
    status === 'new'     ? 'blue'  :
    pct === 100          ? 'green' :
    pct > 40             ? 'amber' : 'grey'

  const badgeLabel =
    status === 'new' ? 'New' :
    pct === 100      ? 'Complete' :
    `${pct}%`

  return (
    <div
      onClick={onClick}
      className="bg-white border border-border rounded-2xl p-5 shadow-card hover:-translate-y-0.5 hover:shadow-lg transition-all duration-150 cursor-pointer flex flex-col gap-3 relative overflow-hidden"
    >
      {/* Top accent bar */}
      <div className={cn('absolute top-0 left-0 right-0 h-[3px]', accentColors[color])} />

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-4 mb-1">
          {subject}
        </p>
        <p className="font-semibold text-ink text-sm leading-snug">
          {title}
        </p>
        <p className="text-xs text-ink-3 mt-1">{meta}</p>
      </div>

      <div className="flex items-center justify-between gap-3 mt-auto">
        <div className="flex-1">
          <p className="text-xs text-ink-4 mb-1">{submitted} / {total} submitted</p>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', progressColors[color])}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
      </div>

      {avgScore !== undefined && (
        <p className="text-xs text-ink-4">
          Class avg: <span className="font-semibold text-ink">{avgScore}%</span>
        </p>
      )}
    </div>
  )
}