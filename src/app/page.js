import Link from 'next/link'
import {
  ArrowRight, Zap, BarChart2,
  Share2, CheckCircle, Star,
} from 'lucide-react'

export const metadata = {
  title:       'GradeMee — Smart Assessments for Every Teacher',
  description: 'Create, share and grade assessments in minutes. GradeMee helps teachers spend less time on admin and more time teaching. Built for tutors and schools worldwide.',
  keywords:    'assessment tool, teacher platform, quiz creator, student tracking, tutor software',
  openGraph: {
    title:       'GradeMee — Smart Assessments for Every Teacher',
    description: 'Create, share and grade assessments in minutes.',
    type:        'website',
  },
}

const features = [
  {
    icon:  Zap,
    title: 'Create assessments in minutes',
    desc:  'Type questions manually, import from any source, or let AI generate a full quiz from a topic description. What used to take an hour now takes five minutes.',
    color: 'bg-amber-light text-amber',
  },
  {
    icon:  CheckCircle,
    title: 'Instant grading, zero marking',
    desc:  'Students submit online. GradeMee calculates scores and shows step-by-step explanations automatically — no marking pile, no waiting.',
    color: 'bg-success-light text-success',
  },
  {
    icon:  BarChart2,
    title: 'See exactly who understands what',
    desc:  'Every submission shows you which questions students struggled with, who needs support, and how the class is performing at a glance.',
    color: 'bg-brand-50 text-brand-600',
  },
  {
    icon:  Share2,
    title: 'Share with one link — no logins',
    desc:  'Students open a link on any device and start. No app download, no account creation. Just the assessment, clean and simple.',
    color: 'bg-purple-50 text-purple-600',
  },
]

const testimonials = [
  {
    quote:  'I used to spend Sunday evenings preparing quizzes. Now I generate them in the car before class.',
    name:   'Secondary school Maths teacher',
    detail: 'Nigerian curriculum',
  },
  {
    quote:  'My students actually enjoy the instant feedback. They know what they got wrong and why.',
    name:   'Private tutor',
    detail: 'UK, Year 9–13',
  },
  {
    quote:  'The AI generation is scary good. It understood exactly what I wanted to test.',
    name:   'A-Level Chemistry teacher',
    detail: 'International school',
  },
]

function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <div className="font-display text-xl font-bold">
          <span className="text-ink">Grade</span>
          <span className="text-amber">Mee</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-ink-3 hover:text-ink transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-brand-800 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </div>
    </nav>
  )
}

function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 text-center">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-amber-light text-amber text-xs font-bold px-3 py-1.5 rounded-full mb-6">
          ✨ Built for tutors and schools worldwide
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-tight mb-6">
          Stop spending evenings{' '}
          <span className="text-brand-600">creating assessments</span>{' '}
          from scratch
        </h1>

        <p className="text-lg sm:text-xl text-ink-3 leading-relaxed mb-10 max-w-2xl mx-auto">
          GradeMee lets you create, share and automatically grade assessments in minutes.
          Students get instant results and explanations. You get your evenings back.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-brand-800 text-white text-base font-bold px-7 py-3.5 rounded-2xl hover:bg-brand-700 transition-colors w-full sm:w-auto justify-center"
          >
            Start for free
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white border-2 border-border text-ink text-base font-semibold px-7 py-3.5 rounded-2xl hover:bg-surface hover:border-brand-300 transition-colors w-full sm:w-auto justify-center"
          >
            Sign in to your account
          </Link>
        </div>

        <p className="text-sm text-ink-4 mt-5">
          No credit card required · Works on any device · Students need no account
        </p>
      </div>

      {/* Hero visual */}
      <div className="mt-16 max-w-4xl mx-auto">
        <div className="bg-white border border-border rounded-3xl shadow-2xl overflow-hidden">
          {/* Fake browser bar */}
          <div className="bg-surface border-b border-border px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-danger/40" />
              <div className="w-3 h-3 rounded-full bg-amber/40" />
              <div className="w-3 h-3 rounded-full bg-success/40" />
            </div>
            <div className="flex-1 bg-white border border-border rounded-lg px-3 py-1.5 text-xs text-ink-4 text-center max-w-xs mx-auto">
              grademee.app/t/adaeze-algebra-x9k2
            </div>
          </div>

          {/* Fake assessment UI */}
          <div className="p-6 sm:p-10 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 text-white text-left">
            <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-xs font-medium mb-4">
              🎓 Assessment by Adaeze Obi
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Quadratic Equations — Quiz</h2>
            <p className="text-white/60 text-sm mb-6">Mathematics · SS2 · 10 questions</p>

            <div className="bg-white/10 rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Question 3 of 10</p>
              <p className="text-base font-medium text-white mb-4">
                Solve: x² + 5x + 6 = 0
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { opt: 'A.  x = −2 and x = −3', correct: true  },
                  { opt: 'B.  x = 2 and x = 3',   correct: false },
                  { opt: 'C.  x = −1 and x = −6', correct: false },
                  { opt: 'D.  x = 1 and x = 6',   correct: false },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium ${
                      item.correct
                        ? 'border-amber bg-amber/20 text-white'
                        : 'border-white/10 text-white/50'
                    }`}
                  >
                    <span className="font-bold">{item.opt.charAt(0)}</span>
                    <span>{item.opt.slice(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 bg-surface">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-4">
            Everything a teacher actually needs
          </h2>
          <p className="text-lg text-ink-3 max-w-xl mx-auto leading-relaxed">
            No bloat, no complexity. Just the tools that save you time and help your students learn better.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white border border-border rounded-3xl p-7 flex flex-col gap-4 shadow-card hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${f.color}`}>
                <f.icon size={22} />
              </div>
              <h3 className="font-display text-xl font-bold text-ink">{f.title}</h3>
              <p className="text-ink-3 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    { num: '01', title: 'Set up your assessment',    desc: 'Choose subject, class, and type. Pick MCQ — the cleanest format for quick grading.' },
    { num: '02', title: 'Add or generate questions', desc: 'Type them yourself, import from a worksheet, or describe your topic and let AI build the questions.' },
    { num: '03', title: 'Share one link',            desc: 'Students open the link on any device. No accounts, no downloads, no friction.' },
    { num: '04', title: 'See results instantly',     desc: 'Scores appear on your dashboard the moment students submit. See every answer for every student.' },
  ]

  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-4">
            From zero to graded in minutes
          </h2>
          <p className="text-lg text-ink-3 max-w-lg mx-auto">
            No training required. If you can send a WhatsApp message, you can run a GradeMee assessment.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-6">
              <div className="font-display text-4xl font-bold text-border flex-shrink-0 w-14 text-right">
                {s.num}
              </div>
              <div className="flex-1 pb-6 border-b border-border last:border-none">
                <h3 className="font-display text-xl font-bold text-ink mb-2">{s.title}</h3>
                <p className="text-ink-3 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-brand-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Teachers love it. Students get it.
          </h2>
          <p className="text-white/50 text-lg">
            Early feedback from teachers using GradeMee
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="text-amber fill-amber" />
                ))}
              </div>
              <p className="text-white/80 leading-relaxed italic">&quot;{t.quote}&quot;</p>
              <div className="mt-auto pt-4 border-t border-white/10">
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{t.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-24 px-4 sm:px-6 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-4">
          Ready to get your evenings back?
        </h2>
        <p className="text-lg text-ink-3 mb-8 leading-relaxed">
          Join teachers who have already cut their assessment workload in half.
          Free to start. No credit card.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-brand-800 text-white text-lg font-bold px-10 py-4 rounded-2xl hover:bg-brand-700 transition-colors"
        >
          Create your free account
          <ArrowRight size={20} />
        </Link>
        <p className="text-sm text-ink-4 mt-5">
          Takes less than 2 minutes to sign up
        </p>
      </div>
    </section>
  )
}

function FooterSection() {
  return (
    <footer className="border-t border-border px-4 sm:px-6 py-10">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="font-display text-xl font-bold mb-1">
            <span className="text-ink">Grade</span>
            <span className="text-amber">Mee</span>
          </div>
          <p className="text-xs text-ink-4">
            Smart assessments for every teacher
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-ink-4">
          <Link href="/signup"    className="hover:text-ink transition-colors">Sign Up</Link>
          <Link href="/login"     className="hover:text-ink transition-colors">Sign In</Link>
          <Link href="/privacy"   className="hover:text-ink transition-colors">Privacy</Link>
          <Link href="/terms"     className="hover:text-ink transition-colors">Terms</Link>
        </div>
        <p className="text-xs text-ink-4">
          © {new Date().getFullYear()} GradeMee. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <FooterSection />
    </div>
  )
}