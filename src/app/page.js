'use client'

/**
 * GradeMee Landing Page
 * 
 * Color system — GradeMee brand tokens:
 *   Primary teal:  #217070 (brand-500)
 *   Dark teal:     #0f2e2e (brand-800)
 *   Ink:           #0d1b1b
 *   Ink muted:     #4a6060 (ink-3)
 *   Surface:       #f2f8f8
 *   Border:        #d8ecec
 *   Amber:         #f5a623
 *   Success:       #2da44e
 * 
 * IMAGE PLACEHOLDERS — replace src="..." with your actual images.
 * Generation prompts included per image.
 */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Menu, X, CheckCircle, Zap, Link2, MessageSquare,
  BarChart2, Brain, Shield, ChevronDown, Star,
  GraduationCap, Monitor, BookOpen, Users, ArrowRight,
  ImageIcon,
} from 'lucide-react'

// ── Brand palette — amber is the primary accent to match app logo/sidebar ──
const B = {
  primary:    '#f5a623',   // amber — matches logo, sidebar, dashboard accent
  primaryDim: '#ffecc4',   // amber light
  teal:       '#217070',   // teal — used for dark backgrounds, borders, text
  teal50:     '#f4fbfb',
  teal100:    '#e0f5f5',
  dark:       '#0f2e2e',   // brand-800 — nav bg, footer bg
  darkDeep:   '#0a1f1f',   // brand-900
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

// ── Image placeholder component ──────────────────────────────────────────
// Replace `prompt` and children with <img src="..." alt="..." />
function ImgPlaceholder({ width = '100%', height = 240, prompt, label, className = '' }) {
  return (
    <div
      className={className}
      style={{
        width, height,
        background: `linear-gradient(135deg, ${B.primary50} 0%, ${B.primary100} 100%)`,
        border: `1.5px dashed ${B.border}`,
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '20px',
      }}
    >
      <ImageIcon size={28} color={B.inkFaint} />
      {label && <p style={{ fontSize: '13px', fontWeight: 700, color: B.inkMuted, textAlign: 'center' }}>{label}</p>}
      {prompt && (
        <p style={{
          fontSize: '11px', color: B.inkFaint, textAlign: 'center',
          fontStyle: 'italic', lineHeight: 1.5, maxWidth: '240px',
        }}>
          🎨 Prompt: "{prompt}"
        </p>
      )}
    </div>
  )
}

const FAQS = [
  { q: 'Do students need to create an account?', a: 'No. Students click the link, enter their name, and start immediately. No signup, no password, no app to download.' },
  { q: 'How long does it take to create an assessment?', a: 'Most teachers create their first assessment in under 5 minutes. With AI generation, it can take less than 2 minutes.' },
  { q: 'Is GradeMee free?', a: 'Yes — you can create unlimited assessments and share them for free. AI question generation uses credits which you can purchase in small, affordable packs.' },
  { q: 'I teach online — does it work via WhatsApp?', a: 'Yes. Share your assessment link in any WhatsApp group or DM. Students open it on their phone — no download, no login, no friction.' },
  { q: "I'm a university lecturer with hundreds of students. Can GradeMee handle that?", a: 'Yes. GradeMee collects matric numbers, tracks performance across large cohorts, and gives every student instant individual feedback.' },
  { q: 'Are questions and explanations age-appropriate?', a: 'Absolutely. GradeMee matches questions and explanations to the exact grade level you select — a Grade 4 student and a university student get completely different language and complexity.' },
  { q: 'Can I use it for private tutoring with just one or two students?', a: 'Yes. GradeMee works whether you have 1 student or 1,000. Many tutors use it for weekly practice assessments and progress tracking.' },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${B.border}` }} className="last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0', gap: '16px', cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left' }}
      >
        <span style={{ fontSize: '15px', fontWeight: 600, color: B.ink, lineHeight: 1.4 }}>{q}</span>
        <ChevronDown size={18} color={B.inkFaint} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
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
      <CheckCircle size={16} color={B.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
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
        url: 'https://grademee.app',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN' },
        operatingSystem: 'Web',
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
      })}} />

      <style>{`
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .gm-float { animation: floatUp 5s ease-in-out infinite; }
        * { box-sizing: border-box; }
        a { text-decoration: none; }
        @media (min-width: 768px) {
          .md\\:\\!flex-row { flex-direction: row !important; }
          .md\\:items-center { align-items: center !important; }
          .md\\:grid { display: grid !important; }
          .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .md\\:overflow-visible { overflow: visible !important; }
          .md\\:pb-0 { padding-bottom: 0 !important; }
          .md\\:\\!w-auto { width: auto !important; }
          .md\\:\\!max-w-none { max-width: none !important; }
        }
      `}</style>

      <div style={{ fontFamily: "'Nunito', system-ui, sans-serif", color: B.ink, background: '#fff', minHeight: '100vh' }}>

        <a href="#main" style={{ position: 'absolute', top: '-100px', left: '16px', zIndex: 200, background: B.primary, color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}
          onFocus={e => e.currentTarget.style.top = '16px'} onBlur={e => e.currentTarget.style.top = '-100px'}>
          Skip to main content
        </a>

        {/* ── NAV ──────────────────────────────────────────────────────── */}
        <header role="banner" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: scrolled ? 'rgba(255,255,255,0.96)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          boxShadow: scrolled ? `0 1px 0 ${B.border}` : 'none',
          transition: 'background 0.2s, box-shadow 0.2s',
        }}>
          <nav aria-label="Main navigation" style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

            {/* Logo */}
            <Link href="/" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, userSelect: 'none' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: B.dark }}>Grade<span style={{ color: B.amber }}>Mee</span></span>
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: B.inkFaint, marginTop: '2px' }}>Empowering Learning</span>
            </Link>

            {/* Desktop nav links — center */}
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }} className="hidden md:flex">
              {navLinks.map(([l, id]) => (
                <button key={id} onClick={() => go(id)}
                  style={{ fontSize: '14px', fontWeight: 600, color: B.inkMuted, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = B.dark}
                  onMouseLeave={e => e.currentTarget.style.color = B.inkMuted}>{l}</button>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }} className="hidden md:flex">
              <Link href="/login"
                style={{ padding: '0 18px', height: '38px', display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: 600, color: B.teal, border: `1.5px solid ${B.border}`, borderRadius: '99px', transition: 'border-color 0.15s, background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = B.teal; e.currentTarget.style.background = B.teal50 }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.background = 'transparent' }}>
                Sign In
              </Link>
              <Link href="/signup"
                style={{ padding: '0 18px', height: '38px', display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: 700, color: B.dark, background: B.amber, borderRadius: '99px', boxShadow: `0 2px 8px ${B.amber}55`, transition: 'opacity 0.15s, transform 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = '' }}>
                Start Free →
              </Link>
            </div>

            {/* Mobile: hamburger only */}
            <button
              onClick={() => setMenu(true)}
              aria-label="Open menu"
              className="flex md:hidden"
              style={{ width: '40px', height: '40px', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '10px', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = B.surface}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Menu size={22} color={B.ink} />
            </button>
          </nav>
        </header>

        {/* Mobile menu */}
        {menu && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#fff', display: 'flex', flexDirection: 'column', padding: '24px' }} role="dialog" aria-modal="true">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: B.dark }}>Grade<span style={{ color: B.primary }}>Mee</span></span>
              <button onClick={() => setMenu(false)} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {navLinks.map(([l, id]) => (
                <button key={id} onClick={() => go(id)} style={{ textAlign: 'left', padding: '16px 0', fontSize: '18px', fontWeight: 600, borderBottom: `1px solid ${B.border}`, background: 'none', border: 'none', borderBottom: `1px solid ${B.border}`, cursor: 'pointer', color: B.ink }}>{l}</button>
              ))}
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/login" onClick={() => setMenu(false)} style={{ display: 'block', padding: '14px', textAlign: 'center', fontSize: '16px', fontWeight: 600, color: B.teal, border: `2px solid ${B.border}`, borderRadius: '16px' }}>Sign In</Link>
              <Link href="/signup" onClick={() => setMenu(false)} style={{ display: 'block', padding: '14px', textAlign: 'center', fontSize: '16px', fontWeight: 700, color: B.dark, background: B.amber, borderRadius: '16px' }}>Create Free Account →</Link>
            </div>
          </div>
        )}

        <main id="main">

          {/* ── HERO ─────────────────────────────────────────────────── */}
          <section aria-labelledby="hero-heading" style={{ paddingTop: '108px', paddingBottom: '80px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at 75% 0%, ${B.amberLight}55 0%, transparent 55%)` }} aria-hidden="true" />

            <div ref={heroRef} style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px', position: 'relative' }}>
              {/* flex-col on mobile, flex-row on desktop */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', alignItems: 'center' }} className="md:!flex-row md:items-center">

                {/* Copy — left on desktop */}
                <div style={{ flex: '1 1 0', minWidth: 0, opacity: heroIn ? 1 : 0, transform: heroIn ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
                  {/* Eyebrow pill — amber */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: B.amberLight, border: `1px solid ${B.amber}55`, borderRadius: '99px', padding: '6px 14px', marginBottom: '24px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: B.amber }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#92400E' }}>Free to start — no credit card needed</span>
                  </div>

                  <h1 id="hero-heading" style={{ fontSize: 'clamp(28px, 5vw, 50px)', fontWeight: 800, lineHeight: 1.13, letterSpacing: '-0.02em', color: B.ink, marginBottom: '20px' }}>
                    Create assessments<br />
                    in minutes.{' '}
                    <span style={{ color: B.teal }}>Students<br />actually learn.</span>
                  </h1>

                  <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', color: B.inkMuted, lineHeight: 1.7, maxWidth: '500px', marginBottom: '32px' }}>
                    For K-12 teachers, online tutors, and university lecturers. Share one link — students get instant feedback and step-by-step explanations for every mistake.{' '}
                    <strong style={{ fontWeight: 700, color: B.inkMid }}>No marking. Just learning.</strong>
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                    <Link href="/signup"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0 28px', height: '52px', fontSize: '15px', fontWeight: 700, color: B.dark, background: B.amber, borderRadius: '14px', boxShadow: `0 4px 16px ${B.amber}55`, transition: 'transform 0.15s, opacity 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = '' }}>
                      Create Free Account <ArrowRight size={16} />
                    </Link>
                    <button onClick={() => go('how-it-works')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0 24px', height: '52px', fontSize: '15px', fontWeight: 600, color: B.teal, background: 'transparent', border: `2px solid ${B.border}`, borderRadius: '14px', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = B.teal; e.currentTarget.style.background = B.teal50 }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.background = 'transparent' }}>
                      See How It Works ↓
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    {['Free to start', 'No credit card', 'Ready in 1 minute'].map(t => (
                      <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: B.inkFaint }}>
                        <CheckCircle size={13} color={B.teal} /> {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Image — right on desktop, below text on mobile */}
                <div className="gm-float" style={{ flex: '0 0 42%', width: '100%', maxWidth: '460px', opacity: heroIn ? 1 : 0, transform: heroIn ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s' }}>
                  {/*
                    IMAGE SLOT — HERO (right column on desktop)
                    Replace with: <img src="/images/hero-screen.webp" alt="GradeMee student results screen showing step-by-step explanation" width={480} height={400} loading="eager" style={{ borderRadius:'20px', boxShadow:'0 20px 60px rgba(0,0,0,0.12)', width:'100%' }} />
                    📸 Search: "student on phone viewing quiz results explanation mobile app education"
                    🤖 AI Prompt: "A Nigerian student smiling while looking at their phone screen showing quiz results and step-by-step explanations. Warm, bright, optimistic mood. Clean light background. Photorealistic."
                  */}
                 <img src="/images/grademee_hero_image.png" alt="GradeMee student results screen showing step-by-step explanation" width={480} height={400} loading="eager" fetchpriority="high" style={{ borderRadius:'20px', boxShadow:'0 20px 60px rgba(0,0,0,0.12)', width:'100%' }} />
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
                  { Icon: GraduationCap, color: B.primary, bg: `${B.primary}18`, title: 'K-12 Teachers & Private Tutors', desc: 'Create tests, assignments, and quizzes in minutes. Students get instant feedback and step-by-step explanations — your marking pile disappears.' },
                  { Icon: Monitor, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', title: 'Online Tutors', desc: 'Share your assessment link via WhatsApp, Telegram, or email. Students open it on any phone — no login, no download. Results come to you automatically.' },
                  { Icon: BookOpen, color: '#6366F1', bg: 'rgba(99,102,241,0.12)', title: 'University & College Lecturers', desc: 'Academic-standard questions. Collect matric numbers. Give every student instant explanations — even in a class of 200.' },
                  { Icon: Users, color: B.amber, bg: `${B.amberLight}`, title: 'Tutoring Centres & Institutes', desc: "Run assessments across multiple groups. Track every learner's progress automatically, without any manual data entry." },
                ].map((c, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: `1px solid ${B.border}`, transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'default' }}
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

              <div style={{ display: 'grid', gap: '32px', position: 'relative' }} className="md:grid-cols-3">
                {/* Connector line */}
                <div className="hidden md:block" style={{ position: 'absolute', top: '28px', left: '33%', right: '33%', height: '2px', borderTop: `2px dashed ${B.primary100}`, zIndex: 0 }} aria-hidden="true" />

                {[
                  {
                    n: 1, emoji: '✍️', title: 'Create your assessment',
                    desc: 'Pick your subject, add questions manually, or let AI generate them in seconds.',
                    /*
                      IMAGE SLOT — STEP 1
                      📸 Search: "teacher creating online quiz on laptop education app"
                      🤖 Prompt: "Teacher at desk on laptop creating an online quiz, warm home or classroom setting, focused and calm expression. Photorealistic, soft natural light."
                    */
                  },
                  {
                    n: 2, emoji: '🔗', title: 'Share one link',
                    desc: 'No apps. No logins for students. Send the link via WhatsApp, email, or any channel.',
                    /*
                      IMAGE SLOT — STEP 2
                      📸 Search: "teacher sharing link on whatsapp phone Nigeria education"
                      🤖 Prompt: "Teacher's hand holding phone, sharing a link on WhatsApp to a student group chat. Warm, modern setting. Close-up, photorealistic."
                    */
                  },
                  {
                    n: 3, emoji: '🎓', title: 'Students submit and learn',
                    desc: 'Instant scores. Step-by-step explanations at their grade level. You see every result in your dashboard.',
                    /*
                      IMAGE SLOT — STEP 3
                      📸 Search: "student looking at phone quiz results feedback happy"
                      🤖 Prompt: "Young Nigerian student happily reading their quiz results on a smartphone, with visible scores and explanations. Bright, optimistic mood. Photorealistic."
                    */
                  },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: B.primary, color: '#fff', fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: `0 4px 16px ${B.primary}50`, flexShrink: 0 }}>{s.n}</div>
                    <div style={{ fontSize: '36px', marginBottom: '16px' }}>{s.emoji}</div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: B.ink, marginBottom: '10px' }}>{s.title}</h3>
                    <p style={{ fontSize: '14px', color: B.inkMuted, lineHeight: 1.7, maxWidth: '240px' }}>{s.desc}</p>
                  </div>
                ))}
              </div>
              <p style={{ textAlign: 'center', fontSize: '16px', color: B.inkFaint, fontStyle: 'italic', marginTop: '56px' }}>
                No training needed. No IT setup. No manual marking — ever.
              </p>
            </div>
          </section>

          {/* ── STUDENT EXPERIENCE ───────────────────────────────────── */}
          <section aria-labelledby="student-exp-heading" style={{ background: B.surface, borderTop: `1px solid ${B.border}`, borderBottom: `1px solid ${B.border}`, padding: '80px 0' }}>
            <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                <h2 id="student-exp-heading" style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: B.ink, marginBottom: '16px', lineHeight: 1.2 }}>
                  Students don't just get a score.<br />They get an explanation.
                </h2>
                <p style={{ fontSize: '16px', color: B.inkMuted, maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
                  The moment a student submits, GradeMee gives instant, step-by-step feedback in their own grade level language — so they understand every mistake immediately.
                </p>
              </div>

              {/*
                IMAGE SLOT — STUDENT EXPLANATION SCREEN
                Replace the card below with:
                  <img src="/images/explanation-screen.webp" alt="GradeMee step-by-step explanation screen" width={640} height={480} loading="lazy" style={{ width:'100%', maxWidth:'640px', margin:'0 auto', display:'block', borderRadius:'20px', boxShadow:'0 16px 48px rgba(0,0,0,0.10)' }} />
                
                📸 Search: "mobile app quiz results feedback step by step explanation education"
                🤖 Prompt: "Clean mobile app screen showing a physics quiz result with numbered step-by-step solution, score badge, and a 'Remember' tip at the bottom. Modern, minimal, teal color scheme. UI mockup style."
              */}
              <div style={{ background: '#fff', borderRadius: '24px', maxWidth: '600px', margin: '0 auto', overflow: 'hidden', boxShadow: '0 16px 48px rgba(13,31,31,0.10)', border: `1px solid ${B.border}` }}>
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${B.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: B.inkFaint }}>Physics · Grade 10</p>
                    <p style={{ fontSize: '19px', fontWeight: 800, color: B.ink }}>Your Results</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '11px', color: B.inkFaint }}>Score</p>
                    <p style={{ fontSize: '26px', fontWeight: 800, color: B.primary }}>85%</p>
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  <div style={{ background: '#FFFBF3', border: `1px solid ${B.amberLight}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    <span style={{ flexShrink: 0, fontSize: '16px' }}>❌</span>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>Question 4 — Incorrect</p>
                      <p style={{ fontSize: '13px', color: '#78350F' }}>What is the distance to the cliff if the echo returns after 3.5 seconds? (v = 250 m/s)</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    {[
                      { n: 1, text: 'Formula:', math: 'd = (v × t) ÷ 2', note: 'Divide by 2 — sound travels there and back.' },
                      { n: 2, text: 'Substituting:', math: 'd = (250 × 3.5) ÷ 2 = 875 ÷ 2', note: null },
                      { n: 3, text: 'Answer:', math: 'd = 437.5 metres', note: null },
                    ].map(s => (
                      <div key={s.n} style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: B.primary, color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>{s.n}</div>
                        <div>
                          <span style={{ fontSize: '14px', color: B.inkMuted }}>{s.text} </span>
                          <strong style={{ fontSize: '14px', color: B.ink, fontFamily: 'monospace' }}>{s.math}</strong>
                          {s.note && <p style={{ fontSize: '12px', color: B.inkFaint, marginTop: '2px' }}>{s.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px', marginBottom: '10px', display: 'flex', gap: '8px' }}>
                    <span style={{ flexShrink: 0 }}>✅</span>
                    <p style={{ fontSize: '14px', color: '#166534', lineHeight: 1.6 }}><strong>The answer is 437.5 m</strong> because sound makes a return journey — to the cliff and back.</p>
                  </div>

                  <div style={{ background: B.amberLight, border: `1px solid ${B.amber}30`, borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '8px' }}>
                    <span style={{ flexShrink: 0 }}>💡</span>
                    <p style={{ fontSize: '13px', color: '#92400E' }}><strong>Remember:</strong> Always divide by 2 in echo questions.</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '32px', marginTop: '64px' }} className="md:grid-cols-3">
                {[
                  { icon: '🧠', title: 'No teacher needed to explain again', desc: 'Students understand immediately — not days later.' },
                  { icon: '📏', title: 'Grade-appropriate language', desc: 'Every explanation is written for the student\'s exact level.' },
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
                  { Icon: Zap, color: B.primary, bg: `${B.primary}18`, title: 'Under 5 Minutes', desc: 'Create a full assessment with AI assistance in the time it takes to make a cup of tea.' },
                  { Icon: Link2, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', title: 'One Link. No Logins.', desc: 'Students click the link, enter their name, and start. No accounts, no passwords, no IT support.' },
                  { Icon: MessageSquare, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', title: 'Instant Explanations', desc: "Every wrong answer gets a step-by-step explanation written at the student's grade level." },
                  { Icon: BarChart2, color: B.amber, bg: B.amberLight, title: 'Track Every Student', desc: 'See how each student is improving across every assessment — automatically.' },
                  { Icon: Brain, color: '#0D9488', bg: 'rgba(13,148,136,0.12)', title: 'AI Question Generation', desc: 'Generate grade-appropriate questions on any topic in seconds. MCQ, True/False, and more.' },
                  { Icon: Shield, color: B.inkMid, bg: B.surface, title: 'Academic Integrity', desc: 'Timer, test mode, and copy protection keep your assessments honest and results reliable.' },
                ].map((f, i) => (
                  <div key={i} style={{
                    background: '#fff', borderRadius: '20px', padding: '24px',
                    border: `1px solid ${B.border}`,
                    opacity: featIn ? 1 : 0, transform: featIn ? 'translateY(0)' : 'translateY(16px)',
                    transition: `opacity 0.5s ease ${i * 0.06}s, transform 0.5s ease ${i * 0.06}s, box-shadow 0.2s`,
                    cursor: 'default',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,31,31,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = featIn ? 'translateY(0)' : 'translateY(16px)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}><f.Icon size={22} color={f.color} /></div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: B.ink, marginBottom: '8px' }}>{f.title}</h3>
                    <p style={{ fontSize: '14px', color: B.inkMuted, lineHeight: 1.65 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
          <section aria-labelledby="testimonials-heading" style={{ background: B.surface, borderTop: `1px solid ${B.border}`, borderBottom: `1px solid ${B.border}`, padding: '80px 0' }}>
            <div ref={testRef} style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                <h2 id="testimonials-heading" style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: B.ink, marginBottom: '12px' }}>Tutors and lecturers love it</h2>
                <p style={{ fontSize: '16px', color: B.inkFaint }}>Real feedback from real educators.</p>
              </div>
              {/* Mobile: horizontal scroll. Desktop: 3-column grid with generous gap */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '28px', overflowX: 'auto', paddingBottom: '8px', scrollSnapType: 'x mandatory' }} className="md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
                {[
                  { quote: 'My JSS2 students were excited to review their answers because the explanations made sense. That has never happened with a paper test.', name: 'Secondary School Teacher', loc: 'Lagos', role: 'K-12 Teacher' },
                  { quote: "I teach students across three different cities online. GradeMee is the only tool that lets me share one link and see every result in one place — instantly.", name: 'Online Tutor', loc: 'Nigeria', role: 'Online Tutor' },
                  { quote: 'As a lecturer with 100+ students per semester, individual feedback was impossible. GradeMee gives every student instant explanations without any extra work from me.', name: 'University Lecturer', loc: 'Nigeria', role: 'Lecturer' },
                ].map((t, i) => (
                  <div key={i} style={{
                    background: '#fff', borderRadius: '20px', padding: '28px 28px 24px',
                    border: `1px solid ${B.border}`, position: 'relative', overflow: 'hidden',
                    flexShrink: 0, width: '80vw', maxWidth: '340px', scrollSnapAlign: 'start',
                    opacity: testIn ? 1 : 0, transform: testIn ? 'translateY(0)' : 'translateY(16px)',
                    transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s`,
                  }} className="md:!w-auto md:!max-w-none">
                    {/* Decorative quote mark */}
                    <div style={{ position: 'absolute', top: '14px', right: '20px', fontSize: '72px', fontWeight: 800, color: `${B.amber}18`, fontFamily: 'Georgia, serif', lineHeight: 1, userSelect: 'none' }} aria-hidden="true">"</div>
                    <div style={{ display: 'flex', gap: '3px', marginBottom: '16px' }}>
                      {[...Array(5)].map((_, j) => <Star key={j} size={15} style={{ fill: B.amber, color: B.amber }} />)}
                    </div>
                    <p style={{ fontSize: '15px', color: B.inkMid, fontStyle: 'italic', lineHeight: 1.75, marginBottom: '24px' }}>"{t.quote}"</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Avatar initials */}
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: B.amberLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>{t.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: B.ink }}>{t.name}</p>
                        <p style={{ fontSize: '12px', color: B.inkFaint }}>{t.role} · {t.loc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── PRICING ──────────────────────────────────────────────── */}
          <section aria-labelledby="pricing-heading" id="pricing" style={{ padding: '80px 0' }}>
            <div ref={priceRef} style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h2 id="pricing-heading" style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 800, color: B.ink, marginBottom: '12px' }}>Start free. Upgrade when you're ready.</h2>
                <p style={{ fontSize: '16px', color: B.inkMuted, maxWidth: '440px', margin: '0 auto', lineHeight: 1.6 }}>The core of GradeMee is free — forever. Credits unlock AI generation.</p>
              </div>

              <div style={{
                background: '#fff', borderRadius: '24px', border: `2px solid ${B.primary}`,
                overflow: 'hidden',
                boxShadow: `0 8px 40px ${B.primary}18`,
                opacity: priceIn ? 1 : 0, transform: priceIn ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
              }}>
                <div style={{ display: 'grid' }} className="md:grid-cols-2">
                  {[
                    { head: 'Always Free', sub: 'No credit card ever required', items: ['Create unlimited assessments', 'Share via any channel — one link', 'Students get instant results', 'Step-by-step explanations', 'Student performance tracking'] },
                    { head: 'Credits', sub: 'Buy only what you need — no expiry', items: ['AI question generation', 'In-app generation — no copy-paste', 'Advanced question types (coming)', 'Priority support', 'Bulk generation'] },
                  ].map((col, i) => (
                    <div key={i} style={{ padding: '32px', borderRight: i === 0 ? `1px solid ${B.border}` : 'none', borderTop: i === 1 ? `1px solid ${B.border}` : 'none' }} className="md:border-t-0">
                      <h3 style={{ fontSize: '17px', fontWeight: 700, color: B.primary, marginBottom: '4px' }}>{col.head}</h3>
                      <p style={{ fontSize: '13px', color: B.inkFaint, marginBottom: '24px' }}>{col.sub}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {col.items.map(item => <CheckItem key={item}>{item}</CheckItem>)}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '24px 32px', background: B.surface, borderTop: `1px solid ${B.border}`, textAlign: 'center' }}>
                  <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0 32px', height: '52px', fontSize: '15px', fontWeight: 700, color: '#fff', background: B.primary, borderRadius: '14px', boxShadow: `0 4px 16px ${B.primary}40`, transition: 'background 0.15s, transform 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = B.dark; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = B.primary; e.currentTarget.style.transform = '' }}>
                    Get Started Free →
                  </Link>
                  <p style={{ fontSize: '12px', color: B.inkFaint, marginTop: '10px' }}>1 credit = 1 AI-generated question · Credits never expire</p>
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
            <div style={{ position: 'absolute', inset: 0, background: B.primary, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }} aria-hidden="true" />
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 120%, rgba(255,255,255,0.08) 0%, transparent 55%)' }} aria-hidden="true" />
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative' }}>
              <h2 id="final-cta-heading" style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '20px' }}>
                Every student deserves better feedback.<br />Every teacher deserves more time.
              </h2>
              <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', color: 'rgba(255,255,255,0.78)', maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.7 }}>
                Join K-12 teachers, online tutors, and university lecturers creating assessments in minutes — and watching their students actually learn.
              </p>
              <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0 40px', height: '56px', fontSize: '16px', fontWeight: 700, color: B.primary, background: '#fff', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.20)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)' }}>
                Create Your Free Account →
              </Link>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginTop: '20px' }}>
                No credit card required · Free to start · Works on any device · Takes 1 minute
              </p>
            </div>
          </section>

        </main>

        {/* ── FOOTER ───────────────────────────────────────────────── */}
        <footer role="contentinfo" style={{ background: B.darkDeep, color: '#94A3B8', paddingTop: '64px', paddingBottom: '40px' }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'grid', gap: '40px', marginBottom: '48px' }} className="md:grid-cols-[2fr_1fr_1fr]">
              {/* Brand column */}
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#fff', display: 'block', lineHeight: 1 }}>Grade<span style={{ color: B.amber }}>Mee</span></span>
                  <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: B.inkFaint, display: 'block', marginTop: '4px' }}>Empowering Learning</span>
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.7, maxWidth: '280px', marginBottom: '24px' }}>
                  GradeMee helps teachers, tutors, and lecturers create assessments in minutes and helps students learn through instant feedback and step-by-step explanations.
                </p>
                {/* Social media icons */}
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: B.inkFaint, marginBottom: '12px' }}>Follow us</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[
                      { label: 'Twitter / X',  href: '#', icon: '𝕏',  title: 'Follow GradeMee on X (Twitter)' },
                      { label: 'Instagram',     href: '#', icon: '◎',  title: 'Follow GradeMee on Instagram' },
                      { label: 'LinkedIn',      href: '#', icon: 'in', title: 'Follow GradeMee on LinkedIn' },
                      { label: 'Facebook',      href: '#', icon: 'f',  title: 'Follow GradeMee on Facebook' },
                    ].map(s => (
                      <a key={s.label} href={s.href} aria-label={s.title} title={s.title}
                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#94A3B8', textDecoration: 'none', transition: 'background 0.15s, color 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,166,35,0.15)'; e.currentTarget.style.color = B.amber }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94A3B8' }}>
                        {s.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product links */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: B.inkFaint, marginBottom: '16px' }}>Product</p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
                  {[['Features', '#features'], ['Pricing', '#pricing'], ['Sign Up', '/signup'], ['Sign In', '/login']].map(([l, h]) => (
                    <li key={l}><Link href={h} style={{ fontSize: '14px', color: '#94A3B8', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}>{l}</Link></li>
                  ))}
                </ul>
              </div>

              {/* Company + Legal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: B.inkFaint, marginBottom: '16px' }}>Company</p>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
                    {[['About', '#'], ['Contact Us', '#']].map(([l, h]) => (
                      <li key={l}><Link href={h} style={{ fontSize: '14px', color: '#94A3B8', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}>{l}</Link></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: B.inkFaint, marginBottom: '16px' }}>Legal</p>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
                    {[['Privacy Policy', '#'], ['Terms of Service', '#']].map(([l, h]) => (
                      <li key={l}><Link href={h} style={{ fontSize: '14px', color: '#94A3B8', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}>{l}</Link></li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '32px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px' }}>
              <p style={{ fontSize: '13px', color: B.inkFaint }}>© 2025 GradeMee. All rights reserved.</p>
              <p style={{ fontSize: '13px', color: B.inkFaint }}>Made with ❤️ for educators everywhere.</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}