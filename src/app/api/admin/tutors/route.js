// src/app/api/admin/tutors/route.js
// GET — returns per-tutor data for the admin dashboard
// Requires admin session — verified server-side, never trusts client

import { NextResponse }           from 'next/server'
import { createClient as admin }  from '@supabase/supabase-js'
import { createClient }           from '@/lib/supabase/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'devg12025@gmail.com')
  .split(',').map((e) => e.trim().toLowerCase())

function db() {
  return admin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  try {
    // ── Auth check ─────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!ADMIN_EMAILS.includes(user.email.toLowerCase()))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabaseAdmin = db()

    // ── Fetch all profiles ─────────────────────────────────────────────────
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, created_at, use_case_profile, curriculum, teaching_subjects, teaching_classes')
      .order('created_at', { ascending: false })

    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

    const tutorIds = (profiles ?? []).map((p) => p.id)
    if (tutorIds.length === 0) return NextResponse.json({ tutors: [] })

    // ── Fetch assessments per tutor ────────────────────────────────────────
    const { data: assessments } = await supabaseAdmin
      .from('assessments')
      .select('id, teacher_id, created_at, question_type, subject')
      .in('teacher_id', tutorIds)

    // ── Fetch questions per tutor ──────────────────────────────────────────
    const { data: questions } = await supabaseAdmin
      .from('questions')
      .select('id, teacher_id, created_at')
      .in('teacher_id', tutorIds)

    // ── Fetch credit transactions (AI generation events) ───────────────────
    const { data: transactions } = await supabaseAdmin
      .from('credit_transactions')
      .select('id, tutor_id, action, amount, created_at, description')
      .in('tutor_id', tutorIds)
      .in('action', ['mcq_generation', 'true_false_generation', 'calculation_generation'])
      .order('created_at', { ascending: false })

    // ── Fetch submissions (to derive last-active more accurately) ──────────
    const { data: submissions } = await supabaseAdmin
      .from('submissions')
      .select('id, assessment_id')
      .in('assessment_id', (assessments ?? []).map((a) => a.id))

    // ── Build per-tutor lookup maps ────────────────────────────────────────
    const assessmentsByTutor    = {}
    const questionsByTutor      = {}
    const transactionsByTutor   = {}
    const submissionsByAssessment = {}

    for (const a of assessments ?? []) {
      if (!assessmentsByTutor[a.teacher_id]) assessmentsByTutor[a.teacher_id] = []
      assessmentsByTutor[a.teacher_id].push(a)
    }
    for (const q of questions ?? []) {
      if (!questionsByTutor[q.teacher_id]) questionsByTutor[q.teacher_id] = []
      questionsByTutor[q.teacher_id].push(q)
    }
    for (const t of transactions ?? []) {
      if (!transactionsByTutor[t.tutor_id]) transactionsByTutor[t.tutor_id] = []
      transactionsByTutor[t.tutor_id].push(t)
    }
    for (const s of submissions ?? []) {
      submissionsByAssessment[s.assessment_id] = (submissionsByAssessment[s.assessment_id] ?? 0) + 1
    }

    // ── Build enriched tutor list ──────────────────────────────────────────
    const tutors = (profiles ?? []).map((p) => {
      const myAssessments   = assessmentsByTutor[p.id]   ?? []
      const myQuestions     = questionsByTutor[p.id]     ?? []
      const myTransactions  = transactionsByTutor[p.id]  ?? []

      // Total submissions across all their assessments
      const totalSubmissions = myAssessments.reduce(
        (acc, a) => acc + (submissionsByAssessment[a.id] ?? 0), 0
      )

      // Last active = latest of: last assessment created, last question, last transaction
      const dates = [
        ...myAssessments.map((a) => a.created_at),
        ...myQuestions.map((q) => q.created_at),
        ...myTransactions.map((t) => t.created_at),
      ].filter(Boolean).sort().reverse()
      const lastActive = dates[0] ?? null

      // AI generation stats
      const genCount      = myTransactions.length
      const genQuestions  = myTransactions.reduce((acc, t) => acc + (t.amount ?? 0), 0)
      const lastGenDate   = myTransactions[0]?.created_at ?? null

      // Generation sessions (group transactions within 5 minutes of each other)
      let sessions = 0
      let lastTs   = null
      for (const t of [...myTransactions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))) {
        const ts = new Date(t.created_at).getTime()
        if (!lastTs || ts - lastTs > 5 * 60 * 1000) sessions++
        lastTs = ts
      }

      // User segment
      let segment = 'inactive'
      if (genCount >= 10)          segment = 'power'
      else if (genCount >= 3)      segment = 'active'
      else if (genCount >= 1)      segment = 'tried'
      else if (myAssessments.length > 0) segment = 'manual_only'

      return {
        id:                p.id,
        name:              p.full_name ?? '—',
        email:             p.email     ?? '—',
        profile:           p.use_case_profile ?? 'k12_tutor',
        joinedAt:          p.created_at,
        lastActive,
        totalAssessments:  myAssessments.length,
        totalQuestions:    myQuestions.length,
        totalSubmissions,
        aiGenSessions:     sessions,
        aiGenCount:        genCount,
        aiGenQuestions:    genQuestions,
        lastGenDate,
        usesAI:            genCount > 0,
        segment,           // 'power' | 'active' | 'tried' | 'manual_only' | 'inactive'
        recentTransactions: myTransactions.slice(0, 5).map((t) => ({
          action:    t.action,
          amount:    t.amount,
          createdAt: t.created_at,
          description: t.description,
        })),
      }
    })

    return NextResponse.json({ tutors })
  } catch (err) {
    console.error('[/api/admin/tutors]', err.message)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}