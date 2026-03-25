'use client'

import { useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { Search, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

function ScoreBar({ score }) {
  const color =
    score >= 75 ? 'bg-success' :
    score >= 50 ? 'bg-amber'   : 'bg-danger'

  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-ink w-8 text-right">{score}%</span>
    </div>
  )
}

function StudentRow({ student, expanded, onToggle }) {
  const scoreVariant =
    student.avgScore >= 75 ? 'green' :
    student.avgScore >= 50 ? 'amber' : 'red'

  return (
    <>
      {/* Main row */}
      <tr
        onClick={onToggle}
        className="border-t border-border hover:bg-surface transition-colors cursor-pointer"
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={student.name} size="sm" />
            <div>
              <p className="text-sm font-semibold text-ink leading-none">
                {student.name}
              </p>
              <p className="text-xs text-ink-4 mt-0.5">{student.class}</p>
            </div>
          </div>
        </td>
        <td className="px-5 py-4 hidden md:table-cell">
          <span className="text-sm text-ink-2">{student.testsCompleted}</span>
        </td>
        <td className="px-5 py-4">
          <ScoreBar score={student.avgScore} />
        </td>
        <td className="px-5 py-4 hidden lg:table-cell">
          <Badge variant={scoreVariant}>
            {student.avgScore >= 75 ? 'Excellent' :
             student.avgScore >= 50 ? 'Average'   : 'Needs Help'}
          </Badge>
        </td>
        <td className="px-5 py-4 text-ink-4 hidden md:table-cell">
          <span className="text-xs">{student.lastActive}</span>
        </td>
        <td className="px-5 py-4">
          {expanded
            ? <ChevronUp size={15} className="text-ink-4" />
            : <ChevronDown size={15} className="text-ink-4" />
          }
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="border-t border-brand-100 bg-brand-50">
          <td colSpan={6} className="px-5 py-4">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
                Recent Submissions
              </p>
              <div className="flex flex-col gap-2">
                {student.submissions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white border border-border rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{s.assessment}</p>
                      <p className="text-xs text-ink-4 mt-0.5">{s.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        s.score >= 75 ? 'green' :
                        s.score >= 50 ? 'amber' : 'red'
                      }>
                        {s.score}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function StudentsList({ students }) {
  const [search, setSearch]     = useState('')
  const [expanded, setExpanded] = useState(null)
  const [sortBy, setSortBy]     = useState('name')
  const [sortDir, setSortDir]   = useState('asc')

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  const filtered = students
    .filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.class.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let valA = a[sortBy]
      let valB = b[sortBy]
      if (typeof valA === 'string') valA = valA.toLowerCase()
      if (typeof valB === 'string') valB = valB.toLowerCase()
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ?  1 : -1
      return 0
    })

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return null
    return sortDir === 'asc'
      ? <TrendingUp size={12} className="text-brand-500" />
      : <TrendingDown size={12} className="text-brand-500" />
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Search + filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white border border-border rounded-full px-4 py-2.5 max-w-sm">
          <Search size={14} className="text-ink-4 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-4 outline-none"
          />
        </div>
        <div className="text-sm text-ink-4">
          {filtered.length} student{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th
                  onClick={() => toggleSort('name')}
                  className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4 cursor-pointer hover:text-ink-2"
                >
                  <div className="flex items-center gap-1">
                    Student <SortIcon col="name" />
                  </div>
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden md:table-cell">
                  Tests Done
                </th>
                <th
                  onClick={() => toggleSort('avgScore')}
                  className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4 cursor-pointer hover:text-ink-2"
                >
                  <div className="flex items-center gap-1">
                    Avg Score <SortIcon col="avgScore" />
                  </div>
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden lg:table-cell">
                  Status
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink-4 hidden md:table-cell">
                  Last Active
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-ink-4 text-sm">
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    expanded={expanded === student.id}
                    onToggle={() =>
                      setExpanded(expanded === student.id ? null : student.id)
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}