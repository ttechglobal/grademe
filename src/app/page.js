'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Moon, Sun } from 'lucide-react'

// ── Dark mode hook ─────────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('grademee-dark')
    if (stored === 'true') setDark(true)
  }, [])

  const toggle = () => {
    setDark((d) => {
      const next = !d
      localStorage.setItem('grademee-dark', String(next))
      return next
    })
  }

  return { dark, toggle }
}

// ── Nav ────────────────────────────────────────────────────────────────────
function Nav({ dark, toggleDark }) {
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${
      dark
        ? 'bg-gray-950/90 border-white/5'
        : 'bg-white/80 border-black/5'
    }`}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <div className="font-display text-xl font-extrabold tracking-tight">
          <span className={dark ? 'text-white' : 'text-brand-900'}>Grade</span>
          <span className="text-amber">Mee</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              dark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-surface text-ink-3 hover:bg-border'
            }`}
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <Link
            href="/login"
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              dark
                ? 'text-white/60 hover:text-white hover:bg-white/10'
                : 'text-ink-3 hover:text-ink hover:bg-surface'
            }`}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-brand-800 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-all shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero({ dark }) {
  const t = dark
    ? { heading: 'text-white', sub: 'text-white/60', pill: 'bg-white/10 text-white/70 border-white/10', blob1: 'bg-amber/5', blob2: 'bg-brand-700/20' }
    : { heading: 'text-brand-900', sub: 'text-ink-3', pill: 'bg-amber/10 text-amber border-amber/20', blob1: 'bg-amber/10', blob2: 'bg-brand-100' }

  return (
    <section className="pt-36 pb-24 sm:pt-44 sm:pb-32 px-5 sm:px-8 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          {/* Left */}
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6">
              <h1 className={`font-display text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.08] tracking-tight ${t.heading}`}>
                Stop spending hours{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-amber">on assessments.</span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 10" fill="none" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M2 8 C60 2, 140 2, 298 8" stroke="#f5a623" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.35" />
                  </svg>
                </span>
              </h1>
              <p className={`text-lg sm:text-xl leading-relaxed max-w-lg ${t.sub}`}>
                GradeMee lets you create and share assessments in minutes.
                Students get instant results, step-by-step explanations, and real feedback.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-brand-900 text-white font-bold text-base px-9 py-4 rounded-2xl hover:bg-brand-700 transition-all shadow-xl shadow-brand-900/25"
              >
                Start for Free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/login"
                className={`inline-flex items-center justify-center gap-2 font-bold text-base px-9 py-4 rounded-2xl border-2 transition-all ${
                  dark
                    ? 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                    : 'bg-white text-brand-900 border-brand-100 hover:border-brand-200 hover:bg-brand-50'
                }`}
              >
                Sign In
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['A','B','C','D'].map((l, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      background:   ['#4f46e5','#0ea5e9','#10b981','#f59e0b'][i],
                      borderColor:  dark ? '#111827' : '#ffffff',
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>
              <p className={`text-sm font-medium ${dark ? 'text-white/40' : 'text-ink-4'}`}>
                Trusted by teachers across{' '}
                <strong className={dark ? 'text-white/70' : 'text-ink-2'}>
                  Nigeria, UK & beyond
                </strong>
              </p>
            </div>
          </div>

          {/* Right — illustration */}
          <div className="relative lg:pl-4">
            <div className="absolute inset-0 -z-10" aria-hidden="true">
              <div className={`absolute top-8 right-0 w-72 h-72 ${t.blob1} rounded-full blur-3xl`} />
              <div className={`absolute bottom-0 left-8 w-56 h-56 ${t.blob2} rounded-full blur-2xl`} />
            </div>

            <div className={`rounded-3xl shadow-2xl border overflow-hidden ${
              dark
                ? 'bg-gray-900 border-white/10 shadow-black/50'
                : 'bg-white border-black/5 shadow-brand-900/10'
            }`}>

              {/* Card header */}
              <div className="bg-gradient-to-br from-brand-900 to-brand-700 p-6">
                <div className="flex items-center gap-1.5 mb-5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                </div>
                <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 mb-4">
                  <div className="w-5 h-5 rounded-full bg-amber flex items-center justify-center">
                    <span className="text-[10px] font-bold text-brand-900">G</span>
                  </div>
                  <span className="text-xs font-medium text-white/80">Assessment by Mrs. Obi</span>
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-1">Algebra — Class Quiz</h3>
                <p className="text-white/50 text-xs">Mathematics · SS2 · 10 questions</p>
              </div>

              {/* Card body */}
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dark ? 'text-white/30' : 'text-ink-4'}`}>
                    Question 3 of 10
                  </p>
                  <p className={`text-sm font-semibold leading-relaxed ${dark ? 'text-white' : 'text-ink'}`}>
                    Solve for x: 2x² + 5x − 3 = 0
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'A', text: 'x = ½ and x = −3', correct: true  },
                    { label: 'B', text: 'x = 3 and x = −½', correct: false },
                    { label: 'C', text: 'x = 1 and x = −3', correct: false },
                    { label: 'D', text: 'x = 2 and x = −½', correct: false },
                  ].map((opt) => (
                    <div
                      key={opt.label}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-sm font-medium ${
                        opt.correct
                          ? 'border-amber bg-amber/10 text-amber'
                          : dark
                          ? 'border-white/10 text-white/30'
                          : 'border-border text-ink-3'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        opt.correct
                          ? 'bg-amber text-brand-900'
                          : dark ? 'bg-white/10 text-white/30' : 'bg-surface text-ink-4'
                      }`}>
                        {opt.label}
                      </span>
                      {opt.text}
                      {opt.correct && <span className="ml-auto text-xs font-bold">✓</span>}
                    </div>
                  ))}
                </div>

                <div className="bg-success-light border border-success/20 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-success uppercase tracking-wide">Result</p>
                    <p className="font-display text-2xl font-bold text-success">8/10 · 80%</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="11" stroke="#2da44e" strokeWidth="2" />
                      <path d="M7 12l3.5 3.5 6.5-7" stroke="#2da44e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className={`absolute -top-4 -right-4 rounded-2xl shadow-lg border px-4 py-3 flex items-center gap-2.5 ${
              dark ? 'bg-gray-800 border-white/10' : 'bg-white border-black/5'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8l3.5 3.5 6.5-7" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className={`text-xs font-bold leading-none ${dark ? 'text-white' : 'text-ink'}`}>Auto-graded</p>
                <p className={`text-[10px] mt-0.5 ${dark ? 'text-white/40' : 'text-ink-4'}`}>Instant results</p>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-brand-900 rounded-2xl shadow-lg shadow-brand-900/30 px-4 py-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M7 1v12M1 7h12" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-none">AI-generated</p>
                <p className="text-[10px] text-white/40 mt-0.5">In seconds</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Features ───────────────────────────────────────────────────────────────
const features = [
  {
    emoji: '⚡',
    light: 'bg-amber/10 text-amber border-amber/20',
    dark:  'bg-amber/10 text-amber border-amber/20',
    title: 'Build assessments in minutes',
    desc:  'Type questions, paste from a worksheet, or describe a topic and let AI generate the whole thing.',
  },
  {
    emoji: '✅',
    light: 'bg-success-light text-success border-success/20',
    dark:  'bg-success/10 text-success border-success/20',
    title: 'Zero marking. Ever.',
    desc:  'Students submit. GradeMee scores automatically and shows step-by-step explanations.',
  },
  {
    emoji: '📊',
    light: 'bg-brand-50 text-brand-600 border-brand-100',
    dark:  'bg-brand-900/50 text-brand-300 border-brand-700',
    title: 'Know exactly who\'s lost',
    desc:  'See which questions students got wrong, who needs support, and where the class is struggling.',
  },
  {
    emoji: '🔗',
    light: 'bg-purple-50 text-purple-600 border-purple-100',
    dark:  'bg-purple-900/30 text-purple-300 border-purple-800',
    title: 'One link. No logins.',
    desc:  'Students open a link on any phone or laptop and start. No app, no account, no friction.',
  },
]

function Features({ dark }) {
  return (
    <section className="py-20 sm:py-28 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-amber uppercase tracking-widest mb-3">
            Why teachers choose GradeMee
          </p>
          <h2 className={`font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4 ${dark ? 'text-white' : 'text-brand-900'}`}>
            Everything you need.{' '}
            <span className="text-amber">Nothing you don&apos;t.</span>
          </h2>
          <p className={`text-lg max-w-xl mx-auto leading-relaxed ${dark ? 'text-white/50' : 'text-ink-3'}`}>
            Designed around how teachers actually work.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className={`rounded-3xl border p-7 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-200 ${
                dark
                  ? 'bg-gray-900 border-white/10 shadow-xl shadow-black/20'
                  : 'bg-white border-black/5 shadow-sm hover:shadow-md'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl ${dark ? f.dark : f.light}`}>
                {f.emoji}
              </div>
              <div>
                <h3 className={`font-display text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-brand-900'}`}>
                  {f.title}
                </h3>
                <p className={`leading-relaxed text-[15px] ${dark ? 'text-white/50' : 'text-ink-3'}`}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How it works ───────────────────────────────────────────────────────────
function HowItWorks({ dark }) {
  const steps = [
    { num: '01', color: dark ? 'bg-amber/10 text-amber' : 'bg-amber/10 text-amber',             title: 'Set up in seconds',         desc: 'Pick subject, class and assessment type.' },
    { num: '02', color: dark ? 'bg-brand-800 text-brand-300' : 'bg-brand-50 text-brand-600',    title: 'Add or generate questions',  desc: 'Type them, import, or let AI build the quiz.' },
    { num: '03', color: dark ? 'bg-success/10 text-success' : 'bg-success-light text-success',  title: 'Share one link',             desc: 'Send via WhatsApp or email. Students need no account.' },
    { num: '04', color: dark ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-600', title: 'Results instantly',      desc: 'See scores and answers the moment students submit.' },
  ]

  return (
    <section className={`py-20 sm:py-28 px-5 sm:px-8 ${dark ? 'bg-gray-900/50' : 'bg-surface'}`}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-sm font-bold text-amber uppercase tracking-widest mb-3">How it works</p>
          <h2 className={`font-display text-3xl sm:text-4xl font-extrabold leading-tight mb-4 ${dark ? 'text-white' : 'text-brand-900'}`}>
            From zero to graded{' '}
            <span className="text-amber">in minutes</span>
          </h2>
          <p className={`leading-relaxed text-[15px] max-w-md ${dark ? 'text-white/50' : 'text-ink-3'}`}>
            If you can send a WhatsApp message, you can run a GradeMee assessment.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${s.color}`}>
                {s.num}
              </div>
              <div className={`flex-1 pb-4 border-b last:border-none ${dark ? 'border-white/5' : 'border-border'}`}>
                <h3 className={`font-display text-base font-bold mb-1 ${dark ? 'text-white' : 'text-brand-900'}`}>{s.title}</h3>
                <p className={`text-sm leading-relaxed ${dark ? 'text-white/50' : 'text-ink-3'}`}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Testimonials ───────────────────────────────────────────────────────────
const testimonials = [
  {
    stars:  5,
    quote:  'I used to spend Sunday evenings preparing quizzes. Now I generate them in the car before class.',
    name:   'Secondary school Maths teacher',
    detail: 'Nigerian curriculum, 8 years teaching',
    accent: 'from-brand-600 to-brand-400',
  },
  {
    stars:  5,
    quote:  'My students actually enjoy the instant feedback. They know exactly what they got wrong and why.',
    name:   'Private tutor',
    detail: 'UK, Year 9–13',
    accent: 'from-amber to-orange-400',
  },
  {
    stars:  5,
    quote:  'The AI generation understood exactly what I wanted to test. I described the topic and it built a full quiz.',
    name:   'A-Level Chemistry teacher',
    detail: 'International school',
    accent: 'from-emerald-500 to-teal-400',
  },
]

function Testimonials({ dark }) {
  return (
    <section className="py-20 sm:py-28 px-5 sm:px-8 bg-brand-900 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-700/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-800/50 rounded-full blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <p className="text-sm font-bold text-amber uppercase tracking-widest mb-3">Early feedback</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Teachers love it.
          </h2>
          <p className="text-white/40 text-lg max-w-md mx-auto">
            What teachers said when they first used GradeMee.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 hover:bg-white/8 transition-colors">
              <div className="flex gap-1">
                {[...Array(t.stars)].map((_, j) => (
                  <svg key={j} width="14" height="14" viewBox="0 0 14 14" fill="#f5a623" aria-hidden="true">
                    <path d="M7 1l1.8 3.6 4 .6-2.9 2.8.7 4L7 10.1 3.4 12l.7-4L1.2 5.2l4-.6L7 1z" />
                  </svg>
                ))}
              </div>
              <p className="text-white/80 leading-relaxed italic text-[15px] flex-1">
                &quot;{t.quote}&quot;
              </p>
              <div className="pt-4 border-t border-white/10">
                <div className={`inline-flex h-1 w-8 rounded-full bg-gradient-to-r ${t.accent} mb-3`} />
                <p className="text-sm font-semibold text-white leading-tight">{t.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{t.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA ────────────────────────────────────────────────────────────────────
function CTA({ dark }) {
  return (
    <section className="py-20 sm:py-28 px-5 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 rounded-[32px] p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl shadow-brand-900/30">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber/10 rounded-full -translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-amber items-center justify-center mb-6 shadow-lg shadow-amber/30">
              <span className="font-display font-extrabold text-brand-900 text-xl">G</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
              Ready to get your evenings back?
            </h2>
            <p className="text-white/60 text-lg mb-10 max-w-md mx-auto leading-relaxed">
              Join teachers who have already cut their assessment workload in half.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-amber text-brand-900 font-extrabold text-base px-9 py-4 rounded-2xl hover:bg-amber/90 transition-all shadow-lg shadow-amber/30 w-full sm:w-auto"
              >
                Start for Free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-bold text-base px-9 py-4 rounded-2xl hover:bg-white/20 transition-all w-full sm:w-auto"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer({ dark }) {
  return (
    <footer className={`border-t px-5 sm:px-8 py-10 ${dark ? 'border-white/5' : 'border-border'}`}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="font-display text-lg font-extrabold">
            <span className={dark ? 'text-white' : 'text-brand-900'}>Grade</span>
            <span className="text-amber">Mee</span>
          </div>
          <p className={`text-xs mt-1 ${dark ? 'text-white/30' : 'text-ink-4'}`}>
            Smart assessments for every teacher
          </p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
          {['Sign Up', 'Sign In', 'Privacy', 'Terms'].map((label) => (
            <Link
              key={label}
              href={`/${label.toLowerCase().replace(' ', '')}`}
              className={`transition-colors ${dark ? 'text-white/30 hover:text-white' : 'text-ink-4 hover:text-ink'}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className={`text-xs ${dark ? 'text-white/20' : 'text-ink-4'}`}>
          © {new Date().getFullYear()} GradeMee
        </p>
      </div>
    </footer>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { dark, toggle } = useDarkMode()

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        dark ? 'bg-gray-950' : 'bg-white'
      }`}
    >
      <Nav dark={dark} toggleDark={toggle} />
      <main>
        <Hero dark={dark} />
        <Features dark={dark} />
        <HowItWorks dark={dark} />
        <Testimonials dark={dark} />
        <CTA dark={dark} />
      </main>
      <Footer dark={dark} />
    </div>
  )
}