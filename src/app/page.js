'use client'

/**
 * GradeMee Landing Page
 * Brand colors: #0a1f1f (dark teal) + #f5a623 (amber)
 */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Menu, X, CheckCircle, Zap, Link2, MessageSquare,
  BarChart2, Brain, Shield, ChevronDown, Star,
  GraduationCap, Monitor, BookOpen, Users, ArrowRight,
} from 'lucide-react'

// ── Brand palette ──────────────────────────────────────────────────────────
const B = {
  primary:    '#f5a623',   // amber — logo, sidebar, CTAs
  primaryDim: '#ffecc4',   // amber light
  teal:       '#217070',   // mid teal
  teal50:     '#f4fbfb',
  teal100:    '#e0f5f5',
  dark:       '#0f2e2e',   // brand-800
  darkDeep:   '#0a1f1f',   // brand-900 — the main dark color per spec
  ink:        '#0d1b1b',
  inkMid:     '#2a3d3d',
  inkMuted:   '#4a6060',
  inkFaint:   '#7a9898',
  surface:    '#f2f8f8',
  border:     '#d8ecec',
  amber:      '#f5a623',
  amberLight: '#ffecc4',
  success:    '#2da44e',
}

function useScrolled(t = 20) {
  const [s, set] = useState(false)
  useEffect(() => {
    const h = () => set(window.scrollY > t)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [t])
  return s
}

function useInView() {
  const ref = useRef(null)
  const [v, set] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { set(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return [ref, v]
}

const FAQS = [
  { q: 'Do students need to create an account?', a: 'No. Students click the link, enter their name, and start immediately. No signup, no password, no app to download.' },
  { q: 'How long does it take to create an assessment?', a: 'Most teachers create their first assessment in under 5 minutes. With AI generation it can be under 2 minutes — type a topic, pick a difficulty, click generate.' },
  { q: 'Can students take the assessment on their phone?', a: 'Yes. Every assessment is fully responsive and works on any phone, tablet, or computer. No app download needed.' },
  { q: 'How does AI generation work?', a: 'You enter a topic and grade level. GradeMee calls an AI model that generates complete, grade-appropriate questions with four options, the correct answer, a step-by-step explanation, and a hint. You can edit any question before publishing.' },
  { q: 'What subjects are supported?', a: 'All subjects. Maths, Physics, Chemistry, Biology, English, Literature, History, Geography, Economics, Government, and more. The AI adapts the language and style to the subject.' },
  { q: 'Can I use GradeMee for university-level courses?', a: 'Yes. GradeMee has a dedicated University profile that supports course codes, matric number collection, academic style selection (Cambridge, Oxford, Harvard, Professional), and higher-order thinking questions.' },
  { q: 'What happens to student data?', a: 'Student names and scores are stored securely in your account. We never share them. Students do not need accounts — they only enter their name (and matric number for university assessments).' },
  { q: 'Are credits refundable?', a: 'Credits are non-refundable once used for generation. If generation fails due to a system error on our side, credits are not deducted.' },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${B.border}`, padding: '0' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 600, color: B.ink, lineHeight: 1.4 }}>{q}</span>
        <ChevronDown
          size={18}
          color={open ? B.amber : B.inkFaint}
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
        />
      </button>
      <div style={{ overflow: 'hidden', maxHeight: open ? '400px' : 0, transition: 'max-height 0.25s ease' }}>
        <p style={{ paddingBottom: '18px', fontSize: '14px', color: B.inkMuted, lineHeight: 1.7 }}>{a}</p>
      </div>
    </div>
  )
}

function CheckItem({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <CheckCircle size={16} color={B.amber} style={{ flexShrink: 0, marginTop: '2px' }} />
      <span style={{ fontSize: '14px', color: B.inkMid }}>{children}</span>
    </div>
  )
}

export default function LandingPage() {
  const scrolled = useScrolled()
  const [menu, setMenu] = useState(false)
  const [heroRef,  heroIn]  = useInView()
  const [featRef,  featIn]  = useInView()
  const [testRef,  testIn]  = useInView()
  const [priceRef, priceIn] = useInView()

  const go = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenu(false) }
  const navLinks = [['How It Works', 'how-it-works'], ['Features', 'features'], ['Pricing', 'pricing'], ['FAQ', 'faq']]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'GradeMee', applicationCategory: 'EducationalApplication',
        description: 'Assessment platform for teachers, tutors, and lecturers. Instant student feedback and step-by-step explanations.',
        url: 'https://grademee.app', offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN' },
      }) }} />

      <div style={{ fontFamily: 'Nunito, system-ui, sans-serif', color: B.ink, minHeight: '100vh' }}>

        {/* ── NAV ──────────────────────────────────────────────────── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: scrolled ? B.darkDeep : 'transparent',
          borderBottom: scrolled ? `1px solid rgba(255,255,255,0.06)` : 'none',
          transition: 'background 0.3s, border-color 0.3s',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
        }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px' }}>
                <span style={{ color: scrolled ? '#fff' : B.darkDeep }}>Grade</span>
                <span style={{ color: B.amber }}>Mee</span>
              </span>
            </Link>

            <nav className="hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {navLinks.map(([label, id]) => (
                <button key={id} onClick={() => go(id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 600, color: scrolled ? 'rgba(255,255,255,0.7)' : B.inkMuted,
                  padding: '6px 14px', borderRadius: '8px', transition: 'color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = scrolled ? '#fff' : B.ink}
                  onMouseLeave={e => e.currentTarget.style.color = scrolled ? 'rgba(255,255,255,0.7)' : B.inkMuted}
                >{label}</button>
              ))}
            </nav>

            <div className="hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link href="/login" style={{ fontSize: '14px', fontWeight: 600, color: scrolled ? 'rgba(255,255,255,0.7)' : B.inkMuted, textDecoration: 'none', padding: '6px 14px' }}
                onMouseEnter={e => e.currentTarget.style.color = scrolled ? '#fff' : B.ink}
                onMouseLeave={e => e.currentTarget.style.color = scrolled ? 'rgba(255,255,255,0.7)' : B.inkMuted}>
                Sign in
              </Link>
              <Link href="/signup" style={{
                fontSize: '14px', fontWeight: 700, background: B.amber, color: B.darkDeep,
                textDecoration: 'none', padding: '8px 20px', borderRadius: '10px', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = B.darkDeep; e.currentTarget.style.color = B.amber }}
                onMouseLeave={e => { e.currentTarget.style.background = B.amber; e.currentTarget.style.color = B.darkDeep }}>
                Get Started Free
              </Link>
            </div>

            <button className="md:hidden" onClick={() => setMenu(!menu)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
              {menu ? <X size={22} color={scrolled ? '#fff' : B.ink} /> : <Menu size={22} color={scrolled ? '#fff' : B.ink} />}
            </button>
          </div>

          {/* Mobile menu */}
          {menu && (
            <div style={{ background: B.darkDeep, borderTop: `1px solid rgba(255,255,255,0.08)`, padding: '16px 24px 24px' }}>
              {navLinks.map(([label, id]) => (
                <button key={id} onClick={() => go(id)} style={{
                  display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                  padding: '12px 0', borderBottom: `1px solid rgba(255,255,255,0.06)`,
                }}>{label}</button>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <Link href="/login" style={{ textAlign: 'center', fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', padding: '12px' }}>Sign in</Link>
                <Link href="/signup" style={{ textAlign: 'center', fontSize: '14px', fontWeight: 700, background: B.amber, color: B.darkDeep, textDecoration: 'none', padding: '13px', borderRadius: '12px' }}>Get Started Free →</Link>
              </div>
            </div>
          )}
        </header>

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section aria-labelledby="hero-heading" style={{ background: `linear-gradient(160deg, ${B.darkDeep} 0%, #0d2d2d 60%, #0f3a3a 100%)`, padding: '80px 0 72px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} aria-hidden="true" />
          <div style={{ position: 'absolute', top: '-40%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${B.amber}12 0%, transparent 70%)`, pointerEvents: 'none' }} aria-hidden="true" />

          <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px' }}>
            <div ref={heroRef} style={{ display: 'grid', gap: '48px', alignItems: 'center' }} className="md:grid-cols-2">

              {/* Left — copy */}
              <div style={{ opacity: heroIn ? 1 : 0, transform: heroIn ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${B.amber}20`, border: `1px solid ${B.amber}40`, borderRadius: '99px', padding: '6px 14px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: B.amber }}>🚀 Now live for Nigerian teachers</span>
                </div>
                <h1 id="hero-heading" style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: '20px', letterSpacing: '-0.5px' }}>
                  Create assessments<br />
                  <span style={{ color: B.amber }}>students actually</span><br />
                  learn from
                </h1>
                <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,0.68)', lineHeight: 1.7, marginBottom: '36px', maxWidth: '480px' }}>
                  Share one link. Students complete it on any device — no login needed. Every submission is marked instantly. Every wrong answer gets a step-by-step explanation.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                  <Link href="/signup" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: B.amber, color: B.darkDeep,
                    fontWeight: 800, fontSize: '15px',
                    padding: '14px 28px', borderRadius: '12px',
                    textDecoration: 'none', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = B.amber; e.currentTarget.style.transform = '' }}>
                    Get started free →
                  </Link>
                  <button onClick={() => go('how-it-works')} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)',
                    fontWeight: 600, fontSize: '14px',
                    padding: '14px 24px', borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}>
                    See how it works
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '28px', flexWrap: 'wrap' }}>
                  {[['✓', 'No student accounts needed'], ['✓', 'Results in seconds'], ['✓', 'Free to start']].map(([icon, text]) => (
                    <span key={text} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ color: B.amber, fontWeight: 700 }}>{icon}</span> {text}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right — hero image / mockup */}
              <div style={{ opacity: heroIn ? 1 : 0, transform: heroIn ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s' }}>
                {/* ── PRODUCT MOCKUP — brand colors applied ── */}
                <div style={{
                  background: B.darkDeep,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px ${B.amber}20`,
                  maxWidth: '460px',
                  margin: '0 auto',
                }}>
                  {/* Mockup top bar */}
                  <div style={{ background: '#0d2828', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${B.amber}20` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: B.amber }} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Grade<span style={{ color: B.amber }}>Mee</span></span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', background: `${B.amber}20`, padding: '3px 10px', borderRadius: '99px', fontWeight: 600 }}>Live results</span>
                  </div>

                  {/* Mockup question card */}
                  <div style={{ padding: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '16px', marginBottom: '14px', border: `1px solid rgba(255,255,255,0.06)` }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: B.amber, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Q3 · Mathematics</p>
                      <p style={{ fontSize: '14px', color: '#fff', lineHeight: 1.5, fontWeight: 500 }}>A car travels 120 km in 2 hours. What is its average speed?</p>
                    </div>

                    {/* Options */}
                    {[
                      { label: 'A', text: '40 km/h', correct: false, student: true  },
                      { label: 'B', text: '60 km/h', correct: true,  student: false },
                      { label: 'C', text: '80 km/h', correct: false, student: false },
                      { label: 'D', text: '240 km/h',correct: false, student: false },
                    ].map((opt) => (
                      <div key={opt.label} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', borderRadius: '10px', marginBottom: '6px',
                        background: opt.correct ? 'rgba(45,164,78,0.15)' : opt.student ? 'rgba(229,83,75,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${opt.correct ? 'rgba(45,164,78,0.4)' : opt.student ? 'rgba(229,83,75,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      }}>
                        <span style={{
                          width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700,
                          background: opt.correct ? '#2da44e' : opt.student ? '#e5534b' : `${B.amber}20`,
                          color: opt.correct || opt.student ? '#fff' : B.amber,
                        }}>{opt.label}</span>
                        <span style={{ fontSize: '13px', color: opt.correct ? '#4ade80' : opt.student ? '#fca5a5' : 'rgba(255,255,255,0.6)', flex: 1 }}>{opt.text}</span>
                        {opt.correct && <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700 }}>✓ Correct</span>}
                        {opt.student && !opt.correct && <span style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 700 }}>Your answer</span>}
                      </div>
                    ))}

                    {/* Explanation strip */}
                    <div style={{ marginTop: '12px', background: `${B.amber}12`, border: `1px solid ${B.amber}30`, borderRadius: '10px', padding: '12px 14px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: B.amber, marginBottom: '4px' }}>💡 Step-by-step explanation</p>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>Speed = Distance ÷ Time = 120 ÷ 2 = <strong style={{ color: B.amber }}>60 km/h</strong></p>
                    </div>

                    {/* Score bar */}
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '73%', background: `linear-gradient(90deg, ${B.amber}, #2da44e)`, borderRadius: '99px' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: B.amber }}>73%</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── WHO IT'S FOR ─────────────────────────────────────────── */}
        <section aria-labelledby="audience-heading" style={{ background: B.surface, borderTop: `1px solid ${B.border}`, borderBottom: `1px solid ${B.border}`, padding: '80px 0' }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <h2 id="audience-heading" style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: B.ink, marginBottom: '14px' }}>Built for every educator</h2>
              <p style={{ fontSize: '16px', color: B.inkMuted, maxWidth: '440px', margin: '0 auto', lineHeight: 1.6 }}>Whether you teach privately, online, in a classroom, or a lecture hall.</p>
            </div>
            <div style={{ display: 'grid', gap: '20px' }} className="sm:grid-cols-2">
              {[
                { Icon: GraduationCap, color: B.darkDeep, bg: `${B.darkDeep}15`, title: 'K-12 Teachers & Private Tutors', desc: 'Create tests, assignments, and quizzes in minutes. Students get instant feedback and step-by-step explanations — your marking pile disappears.' },
                { Icon: Monitor,       color: B.amber,    bg: B.amberLight,       title: 'Online Tutors', desc: 'Share your assessment link via WhatsApp, Telegram, or email. Students open it on any phone — no login, no download. Results come to you automatically.' },
                { Icon: BookOpen,      color: B.darkDeep, bg: `${B.darkDeep}12`,  title: 'University & College Lecturers', desc: 'Academic-standard questions. Collect matric numbers. Give every student instant explanations — even in a class of 200.' },
                { Icon: Users,         color: B.amber,    bg: B.amberLight,       title: 'Tutoring Centres & Institutes', desc: "Run assessments across multiple groups. Track every learner's progress automatically, without any manual data entry." },
              ].map((c, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: '20px', padding: '28px',
                  border: `1px solid ${B.border}`, transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'default',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(13,31,31,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <c.Icon size={22} color={c.color} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: B.ink, marginBottom: '8px' }}>{c.title}</h3>
                  <p style={{ fontSize: '14px', color: B.inkMuted, lineHeight: 1.65 }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
        <section aria-labelledby="how-it-works-heading" id="how-it-works" style={{ padding: '80px 0' }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2 id="how-it-works-heading" style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: B.ink, marginBottom: '12px' }}>From zero to assessment in under 5 minutes</h2>
              <p style={{ fontSize: '16px', color: B.inkFaint }}>Three steps. That's all.</p>
            </div>
            <div style={{ display: 'grid', gap: '32px' }} className="md:grid-cols-3">
              {[
                { n: '01', title: 'Create your assessment', desc: 'Choose your subject, grade, and question type. Type a topic — or add questions manually. AI handles the rest in seconds.', icon: '✏️' },
                { n: '02', title: 'Share one link', desc: 'Students click the link from any device — phone, tablet, computer. No login, no app download. They enter their name and start.', icon: '🔗' },
                { n: '03', title: 'See results instantly', desc: 'Every submission is marked the moment it arrives. See scores, identify weak areas, and give students step-by-step explanations — automatically.', icon: '📊' },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '14px',
                      background: B.darkDeep, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '22px', fontWeight: 800,
                      boxShadow: `0 0 0 3px ${B.amber}40`,
                    }}>
                      {step.icon}
                    </div>
                    <div style={{
                      position: 'absolute', top: '-6px', right: '-8px',
                      background: B.amber, color: B.darkDeep,
                      fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '99px',
                    }}>{step.n}</div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: B.ink, marginBottom: '8px' }}>{step.title}</h3>
                    <p style={{ fontSize: '14px', color: B.inkMuted, lineHeight: 1.7 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EXPLANATION DEMO ──────────────────────────────────────── */}
        <section aria-labelledby="explanation-heading" style={{ background: B.surface, borderTop: `1px solid ${B.border}`, borderBottom: `1px solid ${B.border}`, padding: '80px 0' }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'grid', alignItems: 'center', gap: '48px' }} className="md:grid-cols-2">
              <div>
                <div style={{ display: 'inline-block', background: `${B.amber}20`, border: `1px solid ${B.amber}40`, borderRadius: '99px', padding: '5px 14px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: B.amber }}>The difference students feel</span>
                </div>
                <h2 id="explanation-heading" style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: B.ink, marginBottom: '16px', lineHeight: 1.25 }}>
                  Students learn from <em style={{ fontStyle: 'normal', color: B.amber }}>every</em> mistake — immediately
                </h2>
                <p style={{ fontSize: '16px', color: B.inkMuted, lineHeight: 1.7, marginBottom: '28px' }}>
                  Not days later when they've forgotten the question. The moment they submit — every wrong answer gets a clear, step-by-step explanation written at their exact level.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    'Formula first — then every substitution step shown',
                    'Variables defined before they appear in working',
                    'Each arithmetic operation on its own line',
                    '✅ answer line and 💡 Remember tip on every explanation',
                  ].map((item) => <CheckItem key={item}>{item}</CheckItem>)}
                </div>
              </div>

              {/* Explanation card mockup */}
              <div ref={testRef}>
                <div style={{
                  background: '#fff', borderRadius: '20px', padding: '24px',
                  border: `1px solid ${B.border}`,
                  boxShadow: '0 4px 24px rgba(13,31,31,0.08)',
                  opacity: testIn ? 1 : 0, transform: testIn ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.5s ease, transform 0.5s ease',
                }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: B.inkFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Sample explanation — Physics</p>

                  {/* Question */}
                  <div style={{ background: B.surface, borderRadius: '12px', padding: '14px', marginBottom: '16px', border: `1px solid ${B.border}` }}>
                    <p style={{ fontSize: '14px', color: B.ink, fontWeight: 600 }}>A sound wave travels at 250 m/s. An echo returns after 3.5 seconds. How far away is the cliff?</p>
                  </div>

                  {/* Step-by-step working */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                    {[
                      { n: 1, label: 'Find:', math: 'Distance to the cliff (d)' },
                      { n: 2, label: 'Formula:', math: 'd = (v × t) ÷ 2  [÷2 because sound travels there and back]' },
                      { n: 3, label: 'Values:', math: 'v = 250 m/s,  t = 3.5 s' },
                      { n: 4, label: 'Working:', math: 'd = (250 × 3.5) ÷ 2\n        250 × 3.5 = 875\n        875 ÷ 2 = 437.5' },
                      { n: 5, label: 'Answer:', math: 'd = 437.5 metres' },
                    ].map(s => (
                      <div key={s.n} style={{ display: 'flex', gap: '12px' }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: B.darkDeep, color: '#fff',
                          fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginTop: '2px',
                          boxShadow: `0 0 0 2px ${B.amber}40`,
                        }}>{s.n}</div>
                        <div>
                          <span style={{ fontSize: '13px', color: B.inkMuted }}>{s.label} </span>
                          <strong style={{ fontSize: '13px', color: B.ink, fontFamily: 'monospace', whiteSpace: 'pre-line' }}>{s.math}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '11px 14px', marginBottom: '8px', display: 'flex', gap: '8px' }}>
                    <span>✅</span>
                    <p style={{ fontSize: '13px', color: '#166534', lineHeight: 1.6 }}><strong>The answer is 437.5 m</strong> because sound makes a return journey — to the cliff and back.</p>
                  </div>
                  <div style={{ background: B.amberLight, border: `1px solid ${B.amber}30`, borderRadius: '10px', padding: '11px 14px', display: 'flex', gap: '8px' }}>
                    <span>💡</span>
                    <p style={{ fontSize: '13px', color: '#92400E' }}><strong>Remember:</strong> Always divide by 2 in echo questions — sound makes a return trip.</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '32px', marginTop: '64px' }} className="md:grid-cols-3">
              {[
                { icon: '🧠', title: 'No teacher needed to explain again', desc: 'Students understand immediately — not days later.' },
                { icon: '📏', title: 'Grade-appropriate language', desc: "Every explanation is written for the student's exact level." },
                { icon: '📚', title: 'Every subject covered', desc: 'Maths, Sciences, English, History, and more.' },
              ].map((c, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>{c.icon}</div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: B.ink, marginBottom: '8px' }}>{c.title}</h3>
                  <p style={{ fontSize: '14px', color: B.inkMuted, lineHeight: 1.6 }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────────── */}
        <section aria-labelledby="features-heading" id="features" style={{ padding: '80px 0' }}>
          <div ref={featRef} style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <h2 id="features-heading" style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: B.ink, marginBottom: '12px' }}>Built for how teachers actually work</h2>
              <p style={{ fontSize: '16px', color: B.inkFaint }}>Everything you need. Nothing you don't.</p>
            </div>
            <div style={{ display: 'grid', gap: '16px' }} className="sm:grid-cols-2 lg:grid-cols-3">
              {[
                { Icon: Zap,          color: B.darkDeep, bg: `${B.darkDeep}15`, title: 'Under 5 Minutes',         desc: 'Create a full assessment with AI assistance in the time it takes to make a cup of tea.' },
                { Icon: Link2,        color: B.amber,    bg: B.amberLight,      title: 'One Link. No Logins.',     desc: 'Students click the link, enter their name, and start. No accounts, no passwords, no IT support.' },
                { Icon: MessageSquare,color: B.darkDeep, bg: `${B.darkDeep}12`, title: 'Instant Explanations',    desc: "Every wrong answer gets a step-by-step explanation written at the student's grade level." },
                { Icon: BarChart2,    color: B.amber,    bg: B.amberLight,      title: 'Track Every Student',     desc: 'See how each student is improving across every assessment — automatically.' },
                { Icon: Brain,        color: B.darkDeep, bg: `${B.darkDeep}12`, title: 'AI Question Generation', desc: 'Generate grade-appropriate questions on any topic in seconds. MCQ, True/False, and more.' },
                { Icon: Shield,       color: B.amber,    bg: B.amberLight,      title: 'Academic Integrity',      desc: 'Timer, test mode, and copy protection keep your assessments honest and results reliable.' },
              ].map((feat, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: '16px', padding: '24px',
                  border: `1px solid ${B.border}`, transition: 'box-shadow 0.2s, transform 0.2s',
                  opacity: featIn ? 1 : 0,
                  transform: featIn ? 'translateY(0)' : 'translateY(16px)',
                  transition: `opacity 0.5s ease ${i * 0.06}s, transform 0.5s ease ${i * 0.06}s, box-shadow 0.2s`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(13,31,31,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: feat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <feat.Icon size={20} color={feat.color} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: B.ink, marginBottom: '8px' }}>{feat.title}</h3>
                  <p style={{ fontSize: '14px', color: B.inkMuted, lineHeight: 1.6 }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
        <section aria-label="Testimonials" style={{ background: B.surface, borderTop: `1px solid ${B.border}`, borderBottom: `1px solid ${B.border}`, padding: '72px 0' }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '12px' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={20} fill={B.amber} color={B.amber} />)}
              </div>
              <p style={{ fontSize: '14px', color: B.inkFaint }}>Trusted by teachers and tutors across Nigeria</p>
            </div>
            <div style={{ display: 'grid', gap: '20px' }} className="md:grid-cols-3">
              {[
                { quote: "I created my first assessment in literally 3 minutes. The AI questions were perfect for my JSS3 class. My students actually read their explanations now.", name: "Mrs. Adaeze O.", role: "Mathematics Teacher, Lagos" },
                { quote: "As an online tutor I used to spend hours marking. Now results come in automatically and students get explanations immediately. GradeMee changed everything.", name: "Mr. Emeka N.", role: "Private Tutor, Abuja" },
                { quote: "I teach 200 students per semester. The university profile with matric numbers is exactly what I needed. Questions are at the right academic level.", name: "Dr. Funmilayo A.", role: "Lecturer, University of Lagos" },
              ].map((t, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: '16px', padding: '24px',
                  border: `1px solid ${B.border}`,
                  boxShadow: '0 2px 12px rgba(13,31,31,0.04)',
                }}>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '14px' }}>
                    {[...Array(5)].map((_, j) => <Star key={j} size={13} fill={B.amber} color={B.amber} />)}
                  </div>
                  <p style={{ fontSize: '14px', color: B.inkMid, lineHeight: 1.7, marginBottom: '16px', fontStyle: 'italic' }}>"{t.quote}"</p>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: B.ink }}>{t.name}</p>
                    <p style={{ fontSize: '12px', color: B.inkFaint, marginTop: '2px' }}>{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────────────── */}
        <section aria-labelledby="pricing-heading" id="pricing" style={{ padding: '80px 0' }}>
          <div ref={priceRef} style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <h2 id="pricing-heading" style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: B.ink, marginBottom: '12px' }}>Simple, fair pricing</h2>
              <p style={{ fontSize: '16px', color: B.inkFaint }}>Free to start. Pay only for AI generation — not to use the platform.</p>
            </div>
            <div style={{ display: 'grid', gap: '24px', alignItems: 'start' }} className="md:grid-cols-2">

              {/* Free plan */}
              <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', border: `2px solid ${B.border}` }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: B.inkFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Free forever</p>
                <p style={{ fontSize: '36px', fontWeight: 800, color: B.ink, marginBottom: '4px' }}>₦0</p>
                <p style={{ fontSize: '14px', color: B.inkFaint, marginBottom: '28px' }}>No credit card needed</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                  {[
                    'Unlimited assessments',
                    'Unlimited student submissions',
                    'Manual question entry',
                    'Copy-paste AI prompt generation',
                    'Full results dashboard',
                    'Share link — no student login needed',
                  ].map(f => <CheckItem key={f}>{f}</CheckItem>)}
                </div>
                <Link href="/signup" style={{
                  display: 'block', textAlign: 'center', background: B.surface,
                  color: B.darkDeep, fontWeight: 700, fontSize: '14px',
                  padding: '13px', borderRadius: '12px', textDecoration: 'none',
                  border: `2px solid ${B.border}`, transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = B.darkDeep }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = B.border }}>
                  Get started free →
                </Link>
              </div>

              {/* Credits plan */}
              <div style={{ background: B.darkDeep, borderRadius: '20px', padding: '32px', border: `2px solid ${B.amber}40`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, background: B.amber, padding: '6px 16px', fontSize: '11px', fontWeight: 800, color: B.darkDeep, borderRadius: '0 20px 0 12px' }}>MOST POPULAR</div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: B.amber, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Credits plan</p>
                <p style={{ fontSize: '36px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>₦2,500</p>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '28px' }}>for 50 credits · ₦50 per question</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                  {[
                    'Everything in Free',
                    '1 credit = 1 AI-generated question',
                    'MCQ, True/False, Fill-in questions',
                    'Step-by-step explanations generated',
                    'Hints generated automatically',
                    'Credits never expire',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle size={16} color={B.amber} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/signup" style={{
                  display: 'block', textAlign: 'center',
                  background: B.amber, color: B.darkDeep,
                  fontWeight: 800, fontSize: '14px',
                  padding: '13px', borderRadius: '12px', textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = B.amber; e.currentTarget.style.transform = '' }}>
                  Get Started Free →
                </Link>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '10px', textAlign: 'center' }}>1 credit = 1 AI-generated question · Credits never expire</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section aria-labelledby="faq-heading" id="faq" style={{ background: B.surface, borderTop: `1px solid ${B.border}`, borderBottom: `1px solid ${B.border}`, padding: '80px 0' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 id="faq-heading" style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: B.ink }}>Questions educators ask us</h2>
            </div>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '0 24px', border: `1px solid ${B.border}` }}>
              {FAQS.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────── */}
        <section aria-labelledby="final-cta-heading" style={{ position: 'relative', overflow: 'hidden', padding: '96px 0' }}>
          <div style={{ position: 'absolute', inset: 0, background: B.darkDeep, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} aria-hidden="true" />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 120%, ${B.amber}15 0%, transparent 55%)` }} aria-hidden="true" />
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative' }}>
            <h2 id="final-cta-heading" style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '20px' }}>
              Every student deserves better feedback.<br />Every teacher deserves more time.
            </h2>
            <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', color: 'rgba(255,255,255,0.68)', maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.7 }}>
              Join K-12 teachers, online tutors, and university lecturers creating assessments in minutes — and watching their students actually learn.
            </p>
            <Link href="/signup" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: B.amber, color: B.darkDeep,
              fontWeight: 800, fontSize: '16px',
              padding: '16px 36px', borderRadius: '14px',
              textDecoration: 'none', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = B.amber; e.currentTarget.style.transform = '' }}>
              Get Started Free — it's free →
            </Link>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '16px' }}>No credit card · No student accounts · Takes 5 minutes</p>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────── */}
        <footer style={{ background: '#06100f', borderTop: `1px solid rgba(255,255,255,0.05)`, padding: '56px 0 32px' }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'grid', gap: '40px', marginBottom: '48px' }} className="md:grid-cols-4">
              {/* Brand */}
              <div>
                <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: 800, marginBottom: '12px' }}>
                  <span style={{ color: '#fff' }}>Grade</span>
                  <span style={{ color: B.amber }}>Mee</span>
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.65, maxWidth: '200px' }}>
                  Smart assessments for every teacher. Built in Nigeria.
                </p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  {[
                    { icon: '𝕏', href: 'https://twitter.com/grademee' },
                    { icon: 'in', href: 'https://linkedin.com/company/grademee' },
                  ].map((s) => (
                    <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer"
                      style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* Product */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '16px' }}>Product</p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
                  {[['Features', '#features'], ['Pricing', '#pricing'], ['Sign Up', '/signup'], ['Sign In', '/login']].map(([l, h]) => (
                    <li key={l}><Link href={h} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', transition: 'color 0.15s', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>{l}</Link></li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '16px' }}>Company</p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
                  {[['About', '/about'], ['Blog', '/blog'], ['Contact', 'mailto:hello@grademee.app']].map(([l, h]) => (
                    <li key={l}><Link href={h} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', transition: 'color 0.15s', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>{l}</Link></li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '16px' }}>Legal</p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
                  {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms']].map(([l, h]) => (
                    <li key={l}><Link href={h} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', transition: 'color 0.15s', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>{l}</Link></li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>
                © {new Date().getFullYear()} GradeMee. All rights reserved. Built for teachers everywhere.
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
                Made with ❤️ in Nigeria
              </p>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}