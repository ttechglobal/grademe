'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Link2, Copy, CheckCheck, ExternalLink } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function CopyButton({ url }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:border-brand-400 hover:text-brand-600 transition-colors text-ink-3"
    >
      {copied ? (
        <>
          <CheckCheck size={12} className="text-success" />
          Copied
        </>
      ) : (
        <>
          <Copy size={12} />
          Copy
        </>
      )}
    </button>
  )
}

function LinkCard({ assessment, origin }) {
  const url             = `${origin}/t/${assessment.slug}`
  const submissionCount = assessment.submissions?.[0]?.count ?? 0
  const createdDate     = formatDate(assessment.created_at)

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-card flex flex-col gap-4">

      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm">{assessment.title}</p>
          <p className="text-xs text-ink-4 mt-0.5">
            {assessment.subject} · {assessment.class_level?.toUpperCase()} · Created {createdDate}
          </p>
        </div>
        <Badge variant={submissionCount > 0 ? 'green' : 'grey'}>
          {submissionCount} response{submissionCount !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Link row */}
      <div className="flex items-center gap-2 bg-surface rounded-xl px-4 py-3 border border-border">
        <span className="flex-1 text-sm text-brand-600 font-medium truncate">
          {url}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <CopyButton url={url} />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-800 text-white hover:bg-brand-700 transition-colors"
          >
            <ExternalLink size={12} />
            Open
          </a>
        </div>
      </div>

    </div>
  )
}

export default function ShareLinksPage() {
  const [assessments, setAssessments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [origin,      setOrigin]      = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)

    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('assessments')
        .select(`
          id,
          title,
          subject,
          class_level,
          slug,
          created_at,
          submissions (count)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })

      setAssessments(data ?? [])
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link2 size={22} className="text-brand-500" />
          <h1 className="font-display text-3xl font-bold text-ink">
            Share Links
          </h1>
        </div>
        <p className="text-ink-3 text-sm">
          Copy and share these links with your students — no account needed
        </p>
      </div>

      {/* Empty state */}
      {assessments.length === 0 && (
        <div className="bg-white border border-dashed border-border rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">🔗</p>
          <p className="font-semibold text-ink mb-1">No links yet</p>
          <p className="text-sm text-ink-3">
            Create an assessment to generate a shareable link.
          </p>
        </div>
      )}

      {/* Links list */}
      <div className="flex flex-col gap-3">
        {assessments.map((assessment) => (
          <LinkCard
            key={assessment.id}
            assessment={assessment}
            origin={origin}
          />
        ))}
      </div>

    </div>
  )
}