'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { BookOpen, User, GraduationCap } from 'lucide-react'

export default function StartScreen({ assessment, onStart }) {
  const [name,  setName]  = useState('')
  const [error, setError] = useState('')

  const handleStart = () => {
    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your full name')
      return
    }
    onStart(name.trim())
  }

  const displayTeacher = assessment.teacherRole
    ? `${assessment.teacherName} · ${assessment.teacherRole}`
    : assessment.teacherName

  return (
    <div className="min-h-screen bg-surface flex flex-col">

      {/* Branded top bar */}
      <div className="bg-brand-900 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber flex items-center justify-center">
            <span className="font-display font-bold text-brand-900 text-sm">G</span>
          </div>
          <span className="font-display font-bold text-white text-sm">
            GradeMee
          </span>
        </div>
        <span className="text-xs text-white/40">Assessment Platform</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md flex flex-col gap-5">

          {/* Assessment header card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 px-7 py-8">
            <div className="absolute -right-6 -top-6 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute right-10 -bottom-10 w-28 h-28 rounded-full bg-white/5" />

            <div className="relative z-10">
              {/* Teacher name badge */}
              <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1.5 mb-4">
                <GraduationCap size={14} className="text-amber flex-shrink-0" />
                <span className="text-sm font-medium text-white">
                  {displayTeacher}
                </span>
              </div>

              <h1 className="font-display text-2xl font-bold text-white leading-snug mb-4">
                {assessment.title}
              </h1>

              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
                  <BookOpen size={13} className="text-white/70" />
                  <span className="text-xs text-white/80">
                    {assessment.questionCount} Questions
                  </span>
                </div>
                {assessment.subject && (
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-white/80 capitalize">
                      {assessment.subject}
                    </span>
                  </div>
                )}
                {assessment.classLevel && (
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-white/80">
                      {assessment.classLevel.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-white/80">
                    {assessment.questionMode === 'fill' ? '✏️ Fill in' : '🔘 Multiple Choice'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Name entry */}
          <div className="bg-white border border-border rounded-3xl p-6 shadow-card flex flex-col gap-5">
            <div>
              <h2 className="font-display text-lg font-bold text-ink mb-1">
                Enter your name
              </h2>
              <p className="text-sm text-ink-3">
                Your name will appear on your teacher&apos;s results page.
              </p>
            </div>

            <Input
              label="Full Name"
              placeholder="e.g. Amara Chidinma"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleStart() }}
              error={error}
              icon={<User size={15} />}
            />

            <div className="bg-amber-light rounded-xl px-4 py-3 text-sm text-amber leading-relaxed">
              💡 After finishing, you&apos;ll see your score and step-by-step explanations.
            </div>

            <Button
              variant="amber"
              size="full"
              onClick={handleStart}
              disabled={name.trim().length < 2}
            >
              Start Assessment →
            </Button>
          </div>

          {/* Footer brand */}
          <p className="text-center text-xs text-ink-4">
            Powered by <span className="font-semibold text-brand-500">GradeMee</span>
          </p>

        </div>
      </div>
    </div>
  )
}