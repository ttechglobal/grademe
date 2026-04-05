'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const INITIAL_COUNT = 5

function scoreVariant(score) {
  if (score === null || score === undefined) return 'grey'
  if (score >= 75) return 'green'
  if (score >= 50) return 'amber'
  return 'red'
}

export default function LiveSubmissions({ userId }) {
  const [submissions, setSubmissions] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showAll,     setShowAll]     = useState(false)

  const loadSubmissions = async () => {
    const supabase = createClient()

    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, title, class_level')
      .eq('teacher_id', userId)

    if (!assessments || assessments.length === 0) {
      setSubmissions([])
      setLoading(false)
      return
    }

    const assessmentIds = assessments.map((a) => a.id)
    const assessmentMap = {}
    assessments.forEach((a) => { assessmentMap[a.id] = a })

    const { data } = await supabase
      .from('submissions')
      .select('id, student_name, score, total, completed_at, assessment_id')
      .in('assessment_id', assessmentIds)
      .order('completed_at', { ascending: false })
      .limit(50)

    const rows = (data ?? []).map((s) => ({
      ...s,
      assessmentTitle: assessmentMap[s.assessment_id]?.title ?? '—',
      classLevel:      assessmentMap[s.assessment_id]?.class_level ?? '',
    }))

    setSubmissions(rows)
    setLoading(false)
  }

  useEffect(() => {
    loadSubmissions()
    const supabase = createClient()
    const channel  = supabase
      .channel('live-submissions-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, () => loadSubmissions())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 bg-white border border-border rounded-2xl shadow-card">
        <Loader2 size={20} className="animate-spin text-brand-400" />
        <span className="ml-2 text-sm text-ink-4">Loading…</span>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white border border-dashed border-border rounded-2xl p-8 text-center">
        <p className="text-2xl mb-2">📭</p>
        <p className="text-sm font-medium text-ink mb-1">No submissions yet</p>
        <p className="text-xs text-ink-4">Updates automatically when students submit</p>
      </div>
    )
  }

  const visible = showAll ? submissions : submissions.slice(0, INITIAL_COUNT)
  const hasMore = submissions.length > INITIAL_COUNT

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <p className="text-xs text-ink-4 font-medium">Live — updates automatically</p>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4">Student</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden md:table-cell">Assessment</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden md:table-cell">Submitted</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-4">Score</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((sub) => (
              <tr key={sub.id} className="border-t border-border hover:bg-surface transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={sub.student_name} size="sm" />
                    <span className="font-medium text-ink">{sub.student_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-ink-2 hidden md:table-cell">
                  <span className="truncate max-w-xs block">
                    {sub.assessmentTitle}
                    {sub.classLevel && (
                      <span className="text-ink-4 ml-1">— {sub.classLevel.toUpperCase()}</span>
                    )}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-ink-4 text-xs hidden md:table-cell">
                  {new Date(sub.completed_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="px-5 py-3.5">
                  {sub.score !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-border rounded-full overflow-hidden hidden sm:block">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            sub.score >= 75 ? 'bg-success' :
                            sub.score >= 50 ? 'bg-amber'   : 'bg-danger'
                          )}
                          style={{ width: `${sub.score}%` }}
                        />
                      </div>
                      <Badge variant={scoreVariant(sub.score)}>{sub.score}%</Badge>
                    </div>
                  ) : (
                    <Badge variant="grey">Pending</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {hasMore && (
          <div className="border-t border-border">
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-ink-3 hover:bg-surface hover:text-ink transition-colors"
            >
              <ChevronDown
                size={15}
                className={showAll ? 'rotate-180 transition-transform' : 'transition-transform'}
              />
              {showAll
                ? 'Show Less'
                : `Show ${submissions.length - INITIAL_COUNT} More`
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}