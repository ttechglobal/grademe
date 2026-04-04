'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'

const SUBJECT_COLORS = {
  mathematics: 'bg-brand-400',
  english:     'bg-blue-500',
  biology:     'bg-emerald-500',
  chemistry:   'bg-purple-500',
  physics:     'bg-sky-500',
  government:  'bg-orange-500',
  economics:   'bg-rose-500',
  default:     'bg-brand-400',
}

function AssessmentCard({ assessment }) {
  const count = assessment.submission_count ?? 0
  const color = SUBJECT_COLORS[assessment.subject?.toLowerCase()] ?? SUBJECT_COLORS.default

  return (
    <Link
      href={`/dashboard/assessments/${assessment.id}`}
      className="bg-white border border-border rounded-2xl p-5 shadow-card hover:-translate-y-0.5 hover:shadow-lg transition-all duration-150 flex flex-col gap-3 relative overflow-hidden"
    >
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${color}`} />

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-4 mb-1">
          {assessment.subject} · {assessment.class_level?.toUpperCase()}
        </p>
        <p className="font-semibold text-ink text-sm leading-snug">
          {assessment.title}
        </p>
        <p className="text-xs text-ink-3 mt-1">{assessment.topic}</p>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs text-ink-4">
          {count} response{count !== 1 ? 's' : ''}
        </span>
        <Badge variant={count > 0 ? 'green' : 'grey'}>
          {count > 0 ? 'Active' : 'No responses'}
        </Badge>
      </div>
    </Link>
  )
}

export default function LiveAssessmentStats({ userId }) {
  const [assessments, setAssessments] = useState([])
  const [loading,     setLoading]     = useState(true)

  const load = async () => {
    const supabase = createClient()

    const { data } = await supabase
      .from('assessments')
      .select('id, title, subject, class_level, topic, slug')
      .eq('teacher_id', userId)
      .order('created_at', { ascending: false })
      .limit(6)

    if (!data) { setLoading(false); return }

    // Get submission counts for each assessment
    const withCounts = await Promise.all(
      data.map(async (a) => {
        const { count } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('assessment_id', a.id)
        return { ...a, submission_count: count ?? 0 }
      })
    )

    setAssessments(withCounts)
    setLoading(false)
  }

  useEffect(() => {
    load()

    const supabase = createClient()
    const channel  = supabase
      .channel('live-assessment-stats')
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'submissions',
        },
        () => load()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="w-6 h-6" />
      </div>
    )
  }

  if (assessments.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {assessments.map((a) => (
        <AssessmentCard key={a.id} assessment={a} />
      ))}
    </div>
  )
}