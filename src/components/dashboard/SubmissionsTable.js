import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

function scoreVariant(score) {
  if (score >= 75) return 'green'
  if (score >= 50) return 'amber'
  return 'red'
}

function scoreLabel(score) {
  if (score >= 75) return 'Excellent'
  if (score >= 50) return 'Needs Review'
  return 'Below Average'
}

export default function SubmissionsTable({ submissions }) {
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4">
                Student
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4">
                Assessment
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden md:table-cell">
                Submitted
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4">
                Score
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden lg:table-cell">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((row, i) => (
              <tr
                key={i}
                className="border-t border-border hover:bg-surface transition-colors duration-100 cursor-pointer"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={row.student} size="sm" />
                    <span className="font-medium text-ink">{row.student}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-ink-2">{row.assessment}</td>
                <td className="px-5 py-3.5 text-ink-4 hidden md:table-cell">
                  {row.submittedAt ? formatDate(row.submittedAt) : '—'}
                </td>
                <td className="px-5 py-3.5">
                  {row.score !== null
                    ? <span className="font-semibold text-ink">{row.score}%</span>
                    : <span className="text-ink-4">—</span>
                  }
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  {row.score !== null ? (
                    <Badge variant={scoreVariant(row.score)}>
                      {scoreLabel(row.score)}
                    </Badge>
                  ) : (
                    <Badge variant="grey">Pending</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}