import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAILS = ['devg12025@gmail.com']

export async function POST(request) {
  try {
    const { filter, customStart, customEnd, section, adminEmail } = await request.json()

    // Verify admin
    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Service role — bypasses ALL RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ── Date range ─────────────────────────────────────────────────────────
    const now   = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    function getRange() {
      switch (filter) {
        case 'today':
          return { start: today.toISOString(), end: now.toISOString() }
        case 'week': {
          const s = new Date(today)
          s.setDate(today.getDate() - today.getDay())
          return { start: s.toISOString(), end: now.toISOString() }
        }
        case 'month':
          return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), end: now.toISOString() }
        case 'last_month':
          return {
            start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
            end:   new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          }
        case 'year':
          return { start: new Date(now.getFullYear(), 0, 1).toISOString(), end: now.toISOString() }
        case 'custom':
          return {
            start: customStart ? new Date(customStart).toISOString() : new Date('2020-01-01').toISOString(),
            end:   customEnd   ? new Date(customEnd + 'T23:59:59').toISOString() : now.toISOString(),
          }
        default:
          return { start: '2020-01-01T00:00:00Z', end: now.toISOString() }
      }
    }

    const range = getRange()

    if (section === 'totals') {
      // All-time totals using count queries
      const [
        { count: totalTutors,      error: e1 },
        { count: totalAssessments, error: e2 },
        { count: totalSubmissions, error: e3 },
        { count: totalQuestions,   error: e4 },
      ] = await Promise.all([
        supabase.from('profiles')    .select('*', { count: 'exact', head: true }),
        supabase.from('assessments') .select('*', { count: 'exact', head: true }),
        supabase.from('submissions') .select('*', { count: 'exact', head: true }),
        supabase.from('questions')   .select('*', { count: 'exact', head: true }),
      ])

      if (e1 || e2 || e3 || e4) {
        console.error('Totals errors:', { e1, e2, e3, e4 })
      }

      return NextResponse.json({
        tutors:      totalTutors      ?? 0,
        assessments: totalAssessments ?? 0,
        submissions: totalSubmissions ?? 0,
        questions:   totalQuestions   ?? 0,
      })
    }

    if (section === 'period') {
      const [
        { data: pProfiles,    error: pe1 },
        { data: pAssessments, error: pe2 },
        { data: pSubmissions, error: pe3 },
        { data: pQuestions,   error: pe4 },
        { data: allSurveys,   error: pe5 },
      ] = await Promise.all([
        supabase.from('profiles')
          .select('id, created_at')
          .gte('created_at', range.start)
          .lte('created_at', range.end),

        supabase.from('assessments')
          .select('id, created_at, teacher_id, subject')
          .gte('created_at', range.start)
          .lte('created_at', range.end),

        supabase.from('submissions')
          .select('id, completed_at, student_name')
          .gte('completed_at', range.start)
          .lte('completed_at', range.end),

        supabase.from('questions')
          .select('id, created_at')
          .gte('created_at', range.start)
          .lte('created_at', range.end),

        supabase.from('onboarding_surveys')
          .select('teaching_mode, heard_from, school_type, years_teaching, completed_at'),
      ])

      if (pe1 || pe2 || pe3 || pe4 || pe5) {
        console.error('Period errors:', { pe1, pe2, pe3, pe4, pe5 })
      }

      const activeTutors   = new Set((pAssessments ?? []).map((a) => a.teacher_id)).size
      const uniqueStudents = new Set(
        (pSubmissions ?? [])
          .map((s) => s.student_name?.toLowerCase()?.trim())
          .filter(Boolean)
      ).size

      // Subject map
      const subjectMap = {}
      for (const a of pAssessments ?? []) {
        if (!a.subject) continue
        const k = a.subject.replace(/_/g, ' ')
        subjectMap[k] = (subjectMap[k] ?? 0) + 1
      }

      // Survey breakdowns — all time (surveys don't have period filter)
      const heardMap    = {}
      const teachMap    = {}
      const schoolMap   = {}
      const yearsMap    = {}

      for (const s of allSurveys ?? []) {
        if (s.heard_from)     heardMap[s.heard_from]                           = (heardMap[s.heard_from]   ?? 0) + 1
        if (s.teaching_mode)  teachMap[s.teaching_mode]                        = (teachMap[s.teaching_mode] ?? 0) + 1
        if (s.years_teaching) yearsMap[s.years_teaching]                       = (yearsMap[s.years_teaching] ?? 0) + 1
        if (s.school_type) {
          s.school_type.split(',').forEach((t) => {
            const k = t.trim()
            if (k) schoolMap[k] = (schoolMap[k] ?? 0) + 1
          })
        }
      }

      return NextResponse.json({
        newTutors:      pProfiles?.length    ?? 0,
        activeTutors,
        assessments:    pAssessments?.length ?? 0,
        submissions:    pSubmissions?.length ?? 0,
        uniqueStudents,
        questions:      pQuestions?.length   ?? 0,
        subjectMap,
        heardMap,
        teachMap,
        schoolMap,
        yearsMap,
        surveyCount:    allSurveys?.length   ?? 0,
        // Raw data for chart building client-side
        assessmentDates: (pAssessments ?? []).map((a) => a.created_at),
      })
    }

    return NextResponse.json({ error: 'Unknown section' }, { status: 400 })

  } catch (err) {
    console.error('Admin stats API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}