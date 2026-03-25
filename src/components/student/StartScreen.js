'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { BookOpen, Clock, HelpCircle } from 'lucide-react'

export default function StartScreen({ assessment, onStart }) {
  const [name, setName] = useState('')
  const error = name.trim().length > 0 && name.trim().length < 2
    ? 'Please enter your full name'
    : ''

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-5">

        {/* Header card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 px-8 py-8">
          {/* Decorative circles */}
          <div className="absolute -right-6 -top-6 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute right-10 -bottom-10 w-28 h-28 rounded-full bg-white/5" />

          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-1">
              {assessment.teacherName}&apos;s Class
            </p>
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
              <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
                <HelpCircle size={13} className="text-white/70" />
                <span className="text-xs text-white/80">
                  {assessment.subject}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
                <Clock size={13} className="text-white/70" />
                <span className="text-xs text-white/80">
                  {assessment.classLevel?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Name entry card */}
        <div className="bg-white border border-border rounded-3xl p-6 shadow-card flex flex-col gap-5">
          <div>
            <h2 className="font-display text-lg font-bold text-ink mb-1">
              Enter your details
            </h2>
            <p className="text-sm text-ink-3">
              Your name will appear in the teacher&apos;s results.
            </p>
          </div>

          <Input
            label="Full Name"
            placeholder="e.g. Amara Chidinma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
          />

          {/* Tip */}
          <div className="bg-amber-light rounded-xl px-4 py-3 text-xs text-amber leading-relaxed">
            💡 <strong>Tip:</strong> After finishing, you&apos;ll see your score and
            step-by-step explanations for every question.
          </div>

          <Button
            variant="amber"
            size="full"
            onClick={() => onStart(name.trim())}
            disabled={name.trim().length < 2}
          >
            Start Assessment →
          </Button>
        </div>

      </div>
    </div>
  )
}