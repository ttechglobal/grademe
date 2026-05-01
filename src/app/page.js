'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Menu, X, CheckCircle, Zap, Link2, MessageSquare,
  BarChart2, Brain, Shield, ChevronDown, Star,
  GraduationCap, Monitor, BookOpen, Users, ArrowRight,
} from 'lucide-react'

function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [threshold])
  return scrolled
}

function useInView() {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

const FAQS = [
  { q: 'Do students need to create an account?', a: 'No. Students click the link, enter their name, and start immediately. No signup, no password, no app to download. It works on any phone or computer.' },
  { q: 'How long does it take to create an assessment?', a: 'Most teachers create their first assessment in under 5 minutes. With AI generation, it can take less than 2 minutes.' },
  { q: 'Is GradeMee free?', a: 'Yes — you can create unlimited assessments and share them for free. AI question generation uses credits which you can earn or purchase in small, affordable packs.' },
  { q: 'I teach online — does it work via WhatsApp?', a: 'Yes. Share your assessment link in any WhatsApp group or DM. Students open it on their phone — no download, no login, no friction. Results come directly to your dashboard.' },
  { q: "I'm a university lecturer with hundreds of students. Can GradeMee handle that?", a: 'Yes. GradeMee collects matric numbers, tracks performance across large cohorts, and gives every student instant individual feedback — no matter how many students you have.' },
  { q: 'Are the questions and explanations age-appropriate?', a: 'Absolutely. GradeMee matches questions and explanations to the exact grade level you select. A Grade 4 student and a university student get completely different language, complexity, and depth.' },
  { q: 'Can I use it for private tutoring with just one or two students?', a: 'Yes. GradeMee works whether you have 1 student or 1,000. Many private tutors use it to give weekly practice assessments and track improvement session by session.' },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#E2E8F0] last:border-0">
      <button onClick={() => setOpen(v => !v)} aria-expanded={open}
        className="w-full flex items-center justify-between py-5 text-left gap-4 focus-visible:outline-2 focus-visible:outline-[#217070] focus-visible:outline-offset-2 rounded">
        <span className="text-[15px] font-semibold text-[#0F172A] leading-snug">{q}</span>
        <ChevronDown size={18} className="flex-shrink-0 text-[#64748B] transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      <div className="overflow-hidden transition-all duration-200 ease-in-out" style={{ maxHeight: open ? '400px' : '0' }}>
        <p className="pb-5 text-[14px] text-[#64748B] leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const scrolled = useScrolled()
  const [menuOpen, setMenuOpen] = useState(false)
  const [heroRef,         heroInView]         = useInView()
  const [featuresRef,     featuresInView]     = useInView()
  const [testimonialsRef, testimonialsInView] = useInView()
  const [pricingRef,      pricingInView]      = useInView()

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const G = '#217070'

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'GradeMee', applicationCategory: 'EducationalApplication',
        description: 'GradeMee helps teachers, tutors, and lecturers create assessments in under 5 minutes. Students get instant feedback and step-by-step explanations.',
        url: 'https://grademee.app',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN', description: 'Free to start' },
        operatingSystem: 'Web, iOS, Android',
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
      })}} />

      <style>{`
        @keyframes gradeFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        .hero-float { animation: gradeFloat 6s ease-in-out infinite; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ fontFamily:"'Nunito',system-ui,sans-serif", color:'#0F172A', background:'#fff', minHeight:'100vh' }}>

        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[#217070] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm font-semibold">Skip to main content</a>

        {/* NAV */}
        <header role="banner" className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
          style={{ background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', boxShadow: scrolled ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
          <nav aria-label="Main navigation" className="max-w-6xl mx-auto px-5 md:px-8 flex items-center justify-between" style={{ height: '68px' }}>
            <Link href="/" aria-label="GradeMee home" className="flex flex-col leading-none select-none">
              <span style={{ fontSize:'22px', fontWeight:800, color:'#0f2e2e' }}>Grade<span style={{ color:G }}>Mee</span></span>
              <span style={{ fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'#7a9898', marginTop:'2px' }}>Empowering Learning</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              {[['How It Works','how-it-works'],['Features','features'],['Pricing','pricing'],['FAQ','faq']].map(([l,id])=>(
                <button key={id} onClick={()=>scrollTo(id)} className="text-sm font-semibold text-[#64748B] hover:text-[#217070] transition-colors">{l}</button>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="px-5 h-10 flex items-center text-sm font-semibold rounded-full border transition-colors hover:bg-[#f4fbfb]" style={{ color:G, borderColor:G }}>Sign In</Link>
              <Link href="/signup" className="px-5 h-10 flex items-center text-sm font-bold text-white rounded-full transition-all hover:-translate-y-0.5" style={{ background:G, boxShadow:'0 4px 12px rgba(33,112,112,0.3)' }}>Start Free →</Link>
            </div>
            <button onClick={()=>setMenuOpen(true)} aria-label="Open menu" className="md:hidden w-10 h-10 flex items-center justify-center"><Menu size={22} /></button>
          </nav>
        </header>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-[60] bg-white flex flex-col p-6" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <div className="flex items-center justify-between mb-10">
              <span style={{ fontSize:'22px', fontWeight:800, color:'#0f2e2e' }}>Grade<span style={{ color:G }}>Mee</span></span>
              <button onClick={()=>setMenuOpen(false)} aria-label="Close menu" className="w-10 h-10 flex items-center justify-center"><X size={22}/></button>
            </div>
            <div className="flex flex-col gap-1">
              {[['How It Works','how-it-works'],['Features','features'],['Pricing','pricing'],['FAQ','faq']].map(([l,id])=>(
                <button key={id} onClick={()=>scrollTo(id)} className="text-left py-4 text-lg font-semibold border-b border-[#E2E8F0] hover:text-[#217070] transition-colors">{l}</button>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-3">
              <Link href="/login" onClick={()=>setMenuOpen(false)} className="w-full py-4 text-center text-base font-semibold rounded-2xl border-2 hover:bg-[#f4fbfb] transition-colors" style={{ color:G, borderColor:G }}>Sign In</Link>
              <Link href="/signup" onClick={()=>setMenuOpen(false)} className="w-full py-4 text-center text-base font-bold text-white rounded-2xl transition-colors" style={{ background:G }}>Create Free Account →</Link>
            </div>
          </div>
        )}

        <main id="main">

          {/* HERO */}
          <section aria-labelledby="hero-heading" className="relative overflow-hidden" style={{ paddingTop:'112px', paddingBottom:'96px' }}>
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <div style={{ position:'absolute', top:0, right:0, width:'60%', height:'80%', background:'radial-gradient(circle at 80% 20%, rgba(33,112,112,0.06) 0%, transparent 65%)' }}/>
              <div style={{ position:'absolute', bottom:0, left:'10%', width:'40%', height:'50%', background:'radial-gradient(circle at 20% 80%, rgba(245,166,35,0.04) 0%, transparent 60%)' }}/>
            </div>
            <div ref={heroRef} className="max-w-6xl mx-auto px-5 md:px-8 relative">
              <div className="grid md:grid-cols-[58%_42%] gap-12 items-center">
                <div style={{ opacity: heroInView?1:0, transform: heroInView?'translateY(0)':'translateY(24px)', transition:'opacity 0.7s ease, transform 0.7s ease' }}>
                  <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border" style={{ background:'#f4fbfb', borderColor:'#a8e6e6' }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background:G }}/>
                    <span style={{ fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:G }}>Free to start — no credit card needed</span>
                  </div>
                  <h1 id="hero-heading" style={{ fontSize:'clamp(28px,5vw,52px)', fontWeight:800, lineHeight:1.12, letterSpacing:'-0.02em', color:'#0F172A', marginBottom:'24px' }}>
                    Create assessments<br/>in minutes.{' '}
                    <span style={{ color:G }}>Students actually<br/>learn from them.</span>
                  </h1>
                  <p style={{ fontSize:'clamp(16px,2vw,18px)', color:'#475569', lineHeight:1.7, maxWidth:'540px', marginBottom:'32px' }}>
                    Whether you teach 3 students online or 300 in a lecture hall — GradeMee lets you create and share assessments in under 5 minutes. The moment your students submit, they get their score, instant feedback, and step-by-step explanations. <strong style={{ fontWeight:600, color:'#334155' }}>No marking. No grading. Just learning.</strong>
                  </p>
                  <div className="flex flex-wrap gap-3 mb-8">
                    <Link href="/signup" className="inline-flex items-center gap-2 px-7 text-[15px] font-bold text-white rounded-2xl transition-all hover:-translate-y-0.5" style={{ height:'54px', background:G, boxShadow:'0 4px 16px rgba(33,112,112,0.35)' }}>
                      Create Your Free Account <ArrowRight size={16}/>
                    </Link>
                    <button onClick={()=>scrollTo('how-it-works')} className="inline-flex items-center gap-2 px-7 text-[15px] font-semibold rounded-2xl border-2 transition-colors hover:bg-[#f4fbfb]" style={{ height:'54px', color:G, borderColor:G }}>
                      See How It Works ↓
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {['Free to start','No credit card needed','Takes less than 1 minute'].map(t=>(
                      <span key={t} className="flex items-center gap-1.5" style={{ fontSize:'13px', color:'#64748B' }}>
                        <CheckCircle size={14} style={{ color:G, flexShrink:0 }}/>{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center md:justify-end" style={{ opacity: heroInView?1:0, transform: heroInView?'translateY(0)':'translateY(32px)', transition:'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s' }}>
                  <div className="hero-float w-full" style={{ maxWidth:'380px' }}>
                    <div className="rounded-2xl overflow-hidden" style={{ boxShadow:'0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)' }}>
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E2E8F0]" style={{ background:'#F1F5F9' }}>
                        <div className="flex gap-1.5">
                          {['#FC5F5A','#FDBC40','#34C84A'].map(c=><div key={c} className="w-3 h-3 rounded-full" style={{ background:c }}/>)}
                        </div>
                        <div className="flex-1 bg-white rounded h-6 mx-2 flex items-center px-3">
                          <span style={{ fontSize:'10px', color:'#94A3B8', fontWeight:500 }}>grademee.app/t/physics-q4</span>
                        </div>
                      </div>
                      <div className="bg-white p-5">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#F1F5F9]">
                          <div>
                            <p style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#94A3B8' }}>Physics Quiz</p>
                            <p style={{ fontSize:'18px', fontWeight:800, color:'#0F172A' }}>Your Results</p>
                          </div>
                          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background:'conic-gradient(#217070 306deg, #E2E8F0 0deg)', flexShrink:0 }}>
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                              <span style={{ fontSize:'14px', fontWeight:800, color:G }}>85%</span>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-xl p-3.5 mb-3" style={{ background:'#FFF7ED', border:'1px solid #FED7AA' }}>
                          <p style={{ fontSize:'11px', fontWeight:700, color:'#92400E', marginBottom:'4px' }}>Question 4 — Your answer was incorrect</p>
                          <p style={{ fontSize:'12px', color:'#78350F', lineHeight:1.5 }}>What is the distance to the cliff if the echo returns after 3.5s?</p>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                          {[
                            { n:'1', text:'Formula: d = (v × t) ÷ 2 — divide by 2 because sound travels both ways' },
                            { n:'2', text:'d = (250 × 3.5) ÷ 2 = 875 ÷ 2' },
                            { n:'3', text:'d = 437.5 metres ✓' },
                          ].map(s=>(
                            <div key={s.n} style={{ display:'flex', gap:'8px' }}>
                              <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:G, color:'white', fontSize:'10px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'2px' }}>{s.n}</div>
                              <p style={{ fontSize:'11px', color:'#334155', lineHeight:1.5 }}>{s.text}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 rounded-xl p-3 flex gap-2" style={{ background:'#F0FDF4', border:'1px solid #BBF7D0' }}>
                          <span style={{ flexShrink:0, fontSize:'14px' }}>💡</span>
                          <p style={{ fontSize:'11px', color:'#166534' }}><strong>Remember:</strong> Always divide by 2 in echo questions</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SOCIAL PROOF */}
          <section aria-label="Social proof" style={{ background:'#F8FAFC', borderTop:'1px solid #E2E8F0', borderBottom:'1px solid #E2E8F0', padding:'40px 0' }}>
            <div className="max-w-6xl mx-auto px-5 md:px-8">
              <p className="text-center mb-8" style={{ fontSize:'13px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'#94A3B8' }}>Trusted by tutors and lecturers across Nigeria and beyond</p>
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {['"Students finally understand their mistakes — not just their score."','"Saves me hours every week. Genuinely life-changing for a busy tutor."','"My students love the explanations. This is a real game changer."'].map((q,i)=>(
                  <div key={i} className="flex flex-col items-center text-center gap-2">
                    <div className="flex gap-0.5">{[...Array(5)].map((_,j)=><Star key={j} size={14} style={{ fill:'#F59E0B', color:'#F59E0B' }}/>)}</div>
                    <p style={{ fontSize:'14px', color:'#475569', fontStyle:'italic', lineHeight:1.7 }}>{q}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PAIN */}
          <section aria-labelledby="pain-heading" style={{ padding:'80px 0' }}>
            <div className="max-w-6xl mx-auto px-5 md:px-8">
              <div className="text-center mb-4" style={{ maxWidth:'640px', margin:'0 auto 48px' }}>
                <h2 id="pain-heading" style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, lineHeight:1.2, color:'#0F172A', marginBottom:'16px' }}>
                  You became a teacher to help students learn.<br/><span style={{ color:'#64748B', fontWeight:600 }}>Not to spend your evenings marking scripts.</span>
                </h2>
                <p style={{ fontSize:'16px', color:'#64748B', fontWeight:600 }}>Sound familiar?</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon:'⏰', q:'"I spend hours every week creating tests and assignments from scratch — and half of them never get used again."' },
                  { icon:'📝', q:'"I mark 30 papers and half my students don\'t even read the feedback I spent hours writing."' },
                  { icon:'📉', q:'"My students see their score and never actually learn from their mistakes. The feedback comes too late."' },
                ].map((c,i)=>(
                  <div key={i} className="rounded-2xl p-6" style={{ background:'#FFFBF5', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background:'#FFF3CD' }}>{c.icon}</div>
                    <p style={{ fontSize:'15px', color:'#475569', fontStyle:'italic', lineHeight:1.7 }}>{c.q}</p>
                  </div>
                ))}
              </div>
              <p className="text-center mt-12" style={{ fontSize:'19px', fontWeight:600, color:G }}>GradeMee gives you the time back — and makes sure your students actually learn.</p>
            </div>
          </section>

          {/* WHO IT'S FOR */}
          <section aria-labelledby="audience-heading" style={{ background:'#F8FAFC', borderTop:'1px solid #E2E8F0', borderBottom:'1px solid #E2E8F0', padding:'80px 0' }}>
            <div className="max-w-6xl mx-auto px-5 md:px-8">
              <div className="text-center mb-14">
                <h2 id="audience-heading" style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0F172A', marginBottom:'16px' }}>Built for every educator</h2>
                <p style={{ fontSize:'16px', color:'#64748B', maxWidth:'480px', margin:'0 auto', lineHeight:1.6 }}>Whether you teach privately, online, in a classroom, or a lecture hall — GradeMee works for you.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  { Icon:GraduationCap, color:'#217070', bg:'rgba(33,112,112,0.1)', title:'K-12 Teachers & Private Tutors', desc:'Create tests, assignments, and quizzes in minutes. Students get instant feedback and step-by-step explanations — your marking pile disappears.', accent:'#217070' },
                  { Icon:Monitor, color:'#3B82F6', bg:'rgba(59,130,246,0.1)', title:'Online Tutors', desc:'Share your assessment link via WhatsApp, Telegram, or email. Students open it on any phone — no login, no download. Results come to you automatically.', accent:'#3B82F6' },
                  { Icon:BookOpen, color:'#6366F1', bg:'rgba(99,102,241,0.1)', title:'University & College Lecturers', desc:'Academic-standard questions. Collect matric numbers. Give every student instant explanations — even in a class of 200. No extra work from you.', accent:'#6366F1' },
                  { Icon:Users, color:'#F59E0B', bg:'rgba(245,158,11,0.1)', title:'Tutoring Centres & Training Institutes', desc:"Run assessments across multiple students and groups. Track every learner's progress over time, automatically, without any manual data entry.", accent:'#F59E0B' },
                ].map((c,i)=>(
                  <div key={i} className="bg-white rounded-2xl p-6 cursor-default" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)', borderLeft:`3px solid ${c.accent}`, transition:'box-shadow 0.2s, transform 0.2s' }}
                    onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.10)';e.currentTarget.style.transform='translateY(-3px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)';e.currentTarget.style.transform=''}}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background:c.bg }}>
                      <c.Icon size={22} style={{ color:c.color }}/>
                    </div>
                    <h3 style={{ fontSize:'16px', fontWeight:700, color:'#0F172A', marginBottom:'8px' }}>{c.title}</h3>
                    <p style={{ fontSize:'14px', color:'#64748B', lineHeight:1.6 }}>{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section aria-labelledby="how-it-works-heading" id="how-it-works" style={{ padding:'80px 0' }}>
            <div className="max-w-6xl mx-auto px-5 md:px-8">
              <div className="text-center mb-16">
                <h2 id="how-it-works-heading" style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0F172A', marginBottom:'16px' }}>From zero to assessment in under 5 minutes</h2>
                <p style={{ fontSize:'16px', color:'#64748B' }}>Three steps. That's all.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8 relative">
                <div className="hidden md:block absolute h-px border-dashed border-t-2 border-[#a8e6e6]" style={{ top:'28px', left:'33%', right:'33%' }} aria-hidden="true"/>
                {[
                  { n:1, emoji:'✍️', title:'Create your assessment', desc:'Pick your subject, add questions manually, or let AI generate them for you on any topic in seconds.' },
                  { n:2, emoji:'🔗', title:'Share one link with your class', desc:'No apps. No logins for students. Copy the link — send it via WhatsApp, email, or any channel you use.' },
                  { n:3, emoji:'🎓', title:'Students submit and learn', desc:'Instant scores. Step-by-step explanations at their grade level. You see every result in your dashboard.' },
                ].map((s,i)=>(
                  <div key={i} className="flex flex-col items-center text-center relative z-10">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-[22px] font-extrabold text-white mb-5" style={{ background:G, boxShadow:'0 4px 14px rgba(33,112,112,0.35)', flexShrink:0 }}>{s.n}</div>
                    <div className="text-4xl mb-4">{s.emoji}</div>
                    <h3 style={{ fontSize:'18px', fontWeight:700, color:'#0F172A', marginBottom:'12px' }}>{s.title}</h3>
                    <p style={{ fontSize:'14px', color:'#64748B', lineHeight:1.7, maxWidth:'260px' }}>{s.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-center mt-14" style={{ fontSize:'17px', color:'#64748B', fontStyle:'italic' }}>That's it. No training needed. No IT setup. No manual marking.</p>
            </div>
          </section>

          {/* STUDENT EXPERIENCE */}
          <section aria-labelledby="student-exp-heading" style={{ background:'#F8FAFC', borderTop:'1px solid #E2E8F0', borderBottom:'1px solid #E2E8F0', padding:'80px 0' }}>
            <div className="max-w-5xl mx-auto px-5 md:px-8">
              <div className="text-center mb-14">
                <h2 id="student-exp-heading" style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0F172A', marginBottom:'20px', lineHeight:1.2 }}>Students don't just get a score.<br/>They get an explanation.</h2>
                <p style={{ fontSize:'16px', color:'#64748B', maxWidth:'600px', margin:'0 auto', lineHeight:1.7 }}>The moment a student submits, GradeMee gives them instant, personalised feedback — step-by-step — written in their own grade level language.</p>
              </div>
              <div className="bg-white rounded-3xl mx-auto overflow-hidden" style={{ maxWidth:'640px', boxShadow:'0 20px 60px rgba(0,0,0,0.10)' }}>
                <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center justify-between">
                  <div><p style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#94A3B8' }}>Physics — Grade 10</p><p style={{ fontSize:'20px', fontWeight:800, color:'#0F172A' }}>Your Results</p></div>
                  <div className="text-right"><p style={{ fontSize:'11px', color:'#94A3B8' }}>Score</p><p style={{ fontSize:'24px', fontWeight:800, color:G }}>85%</p></div>
                </div>
                <div className="p-6">
                  <div className="rounded-2xl p-4 mb-5 flex gap-3" style={{ background:'#FFF7ED', border:'1px solid #FED7AA' }}>
                    <span style={{ flexShrink:0, fontSize:'18px' }}>❌</span>
                    <div>
                      <p style={{ fontSize:'13px', fontWeight:700, color:'#92400E', marginBottom:'4px' }}>Question 4 — You selected: B. 350 m</p>
                      <p style={{ fontSize:'13px', color:'#78350F' }}>What is the distance to the cliff if an echo returns after 3.5 seconds? (speed of sound = 250 m/s)</p>
                    </div>
                  </div>
                  <p style={{ fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#94A3B8', marginBottom:'16px' }}>Let's look at this together ↓</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'20px' }}>
                    {[
                      { n:1, text:'We use the formula:', math:'d = (v × t) ÷ 2', note:'We divide by 2 because sound travels to the cliff AND back.' },
                      { n:2, text:'Substituting the values:', math:'d = (250 × 3.5) ÷ 2 = 875 ÷ 2', note:null },
                      { n:3, text:'Final answer:', math:'d = 437.5 metres', note:null },
                    ].map(s=>(
                      <div key={s.n} style={{ display:'flex', gap:'12px' }}>
                        <div style={{ width:'24px', height:'24px', borderRadius:'50%', background:G, color:'white', fontSize:'11px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'2px' }}>{s.n}</div>
                        <div>
                          <p style={{ fontSize:'14px', color:'#334155', lineHeight:1.6 }}>{s.text}</p>
                          <p style={{ fontSize:'14px', fontWeight:700, color:'#0F172A', fontFamily:'monospace', marginTop:'2px' }}>{s.math}</p>
                          {s.note && <p style={{ fontSize:'13px', color:'#64748B', marginTop:'2px' }}>{s.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl p-4 mb-4 flex gap-3" style={{ background:'#F0FDF4', border:'1px solid #BBF7D0' }}>
                    <span style={{ flexShrink:0, fontSize:'16px' }}>✅</span>
                    <p style={{ fontSize:'14px', color:'#166534', lineHeight:1.6 }}><strong>The answer is 437.5 m</strong> because the sound makes a return journey — to the cliff and back.</p>
                  </div>
                  <div className="rounded-2xl p-4 flex gap-3" style={{ background:'#FFFBEB', border:'1px solid #FDE68A' }}>
                    <span style={{ flexShrink:0, fontSize:'16px' }}>💡</span>
                    <p style={{ fontSize:'14px', color:'#92400E' }}><strong>Remember:</strong> Always divide by 2 in echo questions.</p>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-8 mt-16">
                {[
                  { icon:'🧠', title:'No teacher needed to explain again', desc:'Students understand immediately — not days later when marking is returned.' },
                  { icon:'📏', title:'Grade-appropriate language', desc:'Whether Grade 4 or university level — they can follow every step of the explanation.' },
                  { icon:'📚', title:'Every subject covered', desc:'Maths, Sciences, English, History, Languages, and more — STEM and non-STEM.' },
                ].map((c,i)=>(
                  <div key={i} className="text-center">
                    <div style={{ fontSize:'36px', marginBottom:'12px' }}>{c.icon}</div>
                    <h3 style={{ fontSize:'15px', fontWeight:700, color:'#0F172A', marginBottom:'8px' }}>{c.title}</h3>
                    <p style={{ fontSize:'14px', color:'#64748B', lineHeight:1.6 }}>{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section aria-labelledby="features-heading" id="features" style={{ padding:'80px 0' }}>
            <div ref={featuresRef} className="max-w-6xl mx-auto px-5 md:px-8">
              <div className="text-center mb-14">
                <h2 id="features-heading" style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0F172A', marginBottom:'16px' }}>Built for how teachers actually work</h2>
                <p style={{ fontSize:'16px', color:'#64748B' }}>Everything you need. Nothing you don't.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { Icon:Zap, color:'#217070', bg:'rgba(33,112,112,0.1)', title:'Under 5 Minutes', desc:'Create a full assessment with AI assistance in the time it takes to make a cup of tea.' },
                  { Icon:Link2, color:'#3B82F6', bg:'rgba(59,130,246,0.1)', title:'One Link. No Logins.', desc:'Students click the link, enter their name, and start. No accounts, no passwords, no IT support needed.' },
                  { Icon:MessageSquare, color:'#8B5CF6', bg:'rgba(139,92,246,0.1)', title:'Instant Explanations', desc:"Every wrong answer comes with a step-by-step explanation written at the student's grade level." },
                  { Icon:BarChart2, color:'#F59E0B', bg:'rgba(245,158,11,0.1)', title:'Track Every Student', desc:'See how each student is improving across every assessment — automatically, without any extra work.' },
                  { Icon:Brain, color:'#0D9488', bg:'rgba(13,148,136,0.1)', title:'AI Question Generation', desc:'Generate grade-appropriate questions on any topic in seconds. MCQ, True/False, and more coming soon.' },
                  { Icon:Shield, color:'#475569', bg:'rgba(71,85,105,0.1)', title:'Academic Integrity', desc:'Timer, test mode, and copy protection keep your assessments honest and your results reliable.' },
                ].map((f,i)=>(
                  <div key={i} className="bg-white rounded-2xl p-6 cursor-default"
                    style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)', opacity: featuresInView?1:0, transform: featuresInView?'translateY(0)':'translateY(20px)', transition:`opacity 0.5s ease ${i*0.07}s, transform 0.5s ease ${i*0.07}s, box-shadow 0.2s` }}
                    onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.10)';e.currentTarget.style.transform='translateY(-2px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)';e.currentTarget.style.transform='translateY(0)'}}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background:f.bg }}><f.Icon size={22} style={{ color:f.color }}/></div>
                    <h3 style={{ fontSize:'15px', fontWeight:700, color:'#0F172A', marginBottom:'8px' }}>{f.title}</h3>
                    <p style={{ fontSize:'14px', color:'#64748B', lineHeight:1.6 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* TESTIMONIALS */}
          <section aria-labelledby="testimonials-heading" style={{ background:'#F8FAFC', borderTop:'1px solid #E2E8F0', borderBottom:'1px solid #E2E8F0', padding:'80px 0' }}>
            <div ref={testimonialsRef} className="max-w-6xl mx-auto px-5 md:px-8">
              <div className="text-center mb-14">
                <h2 id="testimonials-heading" style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0F172A', marginBottom:'16px' }}>Tutors and lecturers love it</h2>
                <p style={{ fontSize:'16px', color:'#64748B' }}>Real feedback from real educators.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-5 overflow-x-auto md:overflow-visible pb-4 md:pb-0" style={{ scrollSnapType:'x mandatory' }}>
                {[
                  { quote:'My JSS2 students were actually excited to review their answers because the explanations made sense to them. That has never happened with a paper test.', name:'Secondary School Teacher', loc:'Lagos', role:'K-12 Teacher' },
                  { quote:'I teach students online across three different cities. GradeMee is the only tool that lets me share one link and see every result in one place — instantly.', name:'Online Tutor', loc:'Nigeria', role:'Online Tutor' },
                  { quote:'As a lecturer with over 100 students per semester, giving individual feedback was impossible. GradeMee gives every student instant explanations without any extra work from me.', name:'University Lecturer', loc:'Nigeria', role:'University Lecturer' },
                ].map((t,i)=>(
                  <div key={i} className="relative bg-white rounded-2xl p-6 flex-shrink-0 md:flex-shrink"
                    style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)', scrollSnapAlign:'start', minWidth:'80vw', maxWidth:'100%', opacity:testimonialsInView?1:0, transform:testimonialsInView?'translateY(0)':'translateY(20px)', transition:`opacity 0.5s ease ${i*0.1}s, transform 0.5s ease ${i*0.1}s` }}
                    // Remove minWidth override on md
                  >
                    <div style={{ position:'absolute', top:'16px', right:'20px', fontSize:'72px', fontWeight:800, lineHeight:1, color:'rgba(33,112,112,0.07)', fontFamily:'Georgia, serif', userSelect:'none', pointerEvents:'none' }} aria-hidden="true">"</div>
                    <div className="flex gap-0.5 mb-4">{[...Array(5)].map((_,j)=><Star key={j} size={14} style={{ fill:'#F59E0B', color:'#F59E0B' }}/>)}</div>
                    <p style={{ fontSize:'15px', color:'#334155', fontStyle:'italic', lineHeight:1.7, marginBottom:'20px' }}>"{t.quote}"</p>
                    <div><p style={{ fontSize:'13px', fontWeight:700, color:'#0F172A' }}>{t.name}</p><p style={{ fontSize:'12px', color:'#94A3B8' }}>{t.role} · {t.loc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PRICING */}
          <section aria-labelledby="pricing-heading" id="pricing" style={{ padding:'80px 0' }}>
            <div ref={pricingRef} className="max-w-4xl mx-auto px-5 md:px-8">
              <div className="text-center mb-12">
                <h2 id="pricing-heading" style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0F172A', marginBottom:'16px' }}>Start free. Upgrade when you're ready.</h2>
                <p style={{ fontSize:'16px', color:'#64748B', maxWidth:'480px', margin:'0 auto', lineHeight:1.6 }}>The core of GradeMee is free — forever. Credits unlock AI generation for when you need it.</p>
              </div>
              <div className="bg-white rounded-3xl overflow-hidden" style={{ border:`1.5px solid ${G}`, boxShadow:'0 8px 32px rgba(33,112,112,0.12)', opacity:pricingInView?1:0, transform:pricingInView?'translateY(0)':'translateY(20px)', transition:'opacity 0.6s ease, transform 0.6s ease' }}>
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
                  {[
                    { head:'Always Free', sub:'No credit card ever required', items:['Create unlimited assessments','Share via any channel — one link','Students get instant results','Step-by-step explanations for every question','Student performance tracking'] },
                    { head:'Credits', sub:'Buy only what you need — credits never expire', items:['AI question generation','In-app generation — no copy-paste','Advanced question types (coming soon)','Priority support','Bulk generation'] },
                  ].map((col,i)=>(
                    <div key={i} className="p-8">
                      <h3 style={{ fontSize:'18px', fontWeight:700, color:G, marginBottom:'4px' }}>{col.head}</h3>
                      <p style={{ fontSize:'13px', color:'#64748B', marginBottom:'24px' }}>{col.sub}</p>
                      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                        {col.items.map(item=>(
                          <div key={item} className="flex items-start gap-2.5">
                            <CheckCircle size={16} style={{ color:G, flexShrink:0, marginTop:'2px' }}/>
                            <span style={{ fontSize:'14px', color:'#334155' }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-8 py-7 border-t border-[#E2E8F0] text-center" style={{ background:'#F8FAFC' }}>
                  <Link href="/signup" className="inline-flex items-center gap-2 px-8 font-bold text-white rounded-2xl transition-all hover:-translate-y-0.5" style={{ height:'52px', fontSize:'15px', background:G, boxShadow:'0 4px 14px rgba(33,112,112,0.30)' }}>
                    Get Started Free →
                  </Link>
                  <p style={{ fontSize:'12px', color:'#94A3B8', marginTop:'12px' }}>1 credit = 1 AI-generated question · Credits never expire · No subscription required</p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section aria-labelledby="faq-heading" id="faq" style={{ background:'#F8FAFC', borderTop:'1px solid #E2E8F0', borderBottom:'1px solid #E2E8F0', padding:'80px 0' }}>
            <div className="max-w-3xl mx-auto px-5 md:px-8">
              <div className="text-center mb-12">
                <h2 id="faq-heading" style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0F172A', marginBottom:'16px' }}>Questions educators ask us</h2>
              </div>
              <div className="bg-white rounded-2xl px-6 md:px-8" style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                {FAQS.map((item,i)=><FAQItem key={i} q={item.q} a={item.a}/>)}
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section aria-labelledby="final-cta-heading" className="relative overflow-hidden" style={{ padding:'96px 0' }}>
            <div className="absolute inset-0" style={{ background:G, backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize:'24px 24px' }} aria-hidden="true"/>
            <div className="absolute inset-0 pointer-events-none" style={{ background:'radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.08) 0%, transparent 60%)' }} aria-hidden="true"/>
            <div className="relative max-w-4xl mx-auto px-5 md:px-8 text-center">
              <h2 id="final-cta-heading" style={{ fontSize:'clamp(26px,4vw,40px)', fontWeight:800, color:'white', lineHeight:1.2, marginBottom:'20px' }}>
                Every student deserves better feedback.<br/>Every teacher deserves more time.
              </h2>
              <p style={{ fontSize:'clamp(15px,2vw,17px)', color:'rgba(255,255,255,0.8)', maxWidth:'600px', margin:'0 auto 40px', lineHeight:1.7 }}>
                Join K-12 teachers, online tutors, and university lecturers who are creating assessments in minutes and watching their students actually learn from every mistake.
              </p>
              <Link href="/signup" className="inline-flex items-center gap-2 px-10 font-bold rounded-2xl transition-all hover:-translate-y-1" style={{ height:'56px', fontSize:'16px', color:G, background:'white', boxShadow:'0 8px 24px rgba(0,0,0,0.15)' }}>
                Create Your Free Account →
              </Link>
              <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.6)', marginTop:'20px' }}>No credit card required · Free to start · Works on any device · Takes 1 minute</p>
            </div>
          </section>

        </main>

        {/* FOOTER */}
        <footer role="contentinfo" style={{ background:'#0F172A', color:'#94A3B8', paddingTop:'64px', paddingBottom:'40px' }}>
          <div className="max-w-6xl mx-auto px-5 md:px-8">
            <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
              <div>
                <div style={{ marginBottom:'16px' }}>
                  <span style={{ fontSize:'22px', fontWeight:800, color:'white', display:'block', lineHeight:1 }}>Grade<span style={{ color:'#4db8b8' }}>Mee</span></span>
                  <span style={{ fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'#64748B', display:'block', marginTop:'4px' }}>Empowering Learning</span>
                </div>
                <p style={{ fontSize:'14px', lineHeight:1.7, maxWidth:'280px' }}>GradeMee helps teachers, tutors, and lecturers create assessments in minutes and helps students learn through instant feedback and step-by-step explanations.</p>
              </div>
              {[
                { head:'Product', links:[{l:'Features',h:'#features'},{l:'Pricing',h:'#pricing'},{l:'Sign Up',h:'/signup'},{l:'Sign In',h:'/login'}] },
                { head:'Company', links:[{l:'About',h:'#'},{l:'Contact Us',h:'#'},{l:'Blog',h:'#'}] },
                { head:'Legal', links:[{l:'Privacy Policy',h:'#'},{l:'Terms of Service',h:'#'}] },
              ].map(col=>(
                <div key={col.head}>
                  <p style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#64748B', marginBottom:'16px' }}>{col.head}</p>
                  <ul style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                    {col.links.map(link=>(
                      <li key={link.l}><Link href={link.h} style={{ fontSize:'14px', color:'#94A3B8', textDecoration:'none', transition:'color 0.15s' }} onMouseEnter={e=>e.currentTarget.style.color='white'} onMouseLeave={e=>e.currentTarget.style.color='#94A3B8'}>{link.l}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-3" style={{ borderTop:'1px solid #1E293B', paddingTop:'32px' }}>
              <p style={{ fontSize:'13px', color:'#64748B' }}>© 2025 GradeMee. All rights reserved.</p>
              <p style={{ fontSize:'13px', color:'#64748B' }}>Made with ❤️ for educators everywhere.</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}