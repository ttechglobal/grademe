import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service role key')
  return createAdmin(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ── GET /api/students ──────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = adminClient()

    // All assessments for this teacher
    const { data: assessments, error: aErr } = await db
      .from('assessments')
      .select('id, title, subject, class_level, topic, assessment_type')
      .eq('teacher_id', user.id)
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 })
    if (!assessments?.length) return NextResponse.json({ students: [] })

    const assessmentIds = assessments.map((a) => a.id)
    const assessmentMap = Object.fromEntries(assessments.map((a) => [a.id, a]))

    // Core submissions — only guaranteed columns
    const { data: submissions, error: sErr } = await db
      .from('submissions')
      .select('id, student_name, assessment_id, score, total, completed_at')
      .in('assessment_id', assessmentIds)
      .not('student_name', 'is', null)
      .order('completed_at', { ascending: false })
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })
    if (!submissions?.length) return NextResponse.json({ students: [] })

    // Optional columns — degrade gracefully if missing
    const extraMap = {}
    try {
      const { data: extras } = await db
        .from('submissions')
        .select('id, time_taken_secs, tab_violations, student_profile_id')
        .in('assessment_id', assessmentIds)
      for (const row of extras ?? []) {
        extraMap[row.id] = {
          time_taken_secs:    row.time_taken_secs    ?? null,
          tab_violations:     row.tab_violations     ?? 0,
          student_profile_id: row.student_profile_id ?? null,
        }
      }
    } catch { /* optional */ }

    // Group by student name (or profile_id when available)
    const groupMap = new Map()
    for (const sub of submissions) {
      const assessment = assessmentMap[sub.assessment_id]
      if (!assessment) continue
      const extra    = extraMap[sub.id] ?? {}
      const groupKey = extra.student_profile_id ?? sub.student_name.trim().toLowerCase()

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          displayName: sub.student_name.trim(),
          profileId:   extra.student_profile_id ?? null,
          subs: [], grades: new Set(), subjects: new Set(),
        })
      }
      const g = groupMap.get(groupKey)
      g.subs.push({
        id: sub.id, score: sub.score, total: sub.total,
        completed_at: sub.completed_at,
        time_taken_secs: extra.time_taken_secs ?? null,
        tab_violations:  extra.tab_violations  ?? 0,
        assessmentTitle:   assessment.title,
        assessmentSubject: assessment.subject,
        assessmentGrade:   assessment.class_level,
        assessmentTopic:   assessment.topic,
        assessmentType:    assessment.assessment_type,
      })
      if (assessment.class_level) g.grades.add(assessment.class_level)
      if (assessment.subject)     g.subjects.add(assessment.subject)
    }

    // Enrich each group
    const students = []
    for (const [key, g] of groupMap) {
      const sorted = [...g.subs]
        .filter((s) => s.score !== null)
        .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
      const scores = sorted.map((s) => s.score)
      const avg = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

      let trend = 'stable'
      if (scores.length >= 4) {
        const recent = scores.slice(-3), prev = scores.slice(-6, -3)
        if (prev.length) {
          const ra = recent.reduce((a, b) => a + b, 0) / recent.length
          const pa = prev.reduce((a, b) => a + b, 0) / prev.length
          if (ra > pa + 5) trend = 'improving'
          else if (ra < pa - 5) trend = 'declining'
        }
      }

      const subjectMap = {}
      for (const s of sorted) {
        const subj = s.assessmentSubject ?? 'Unknown'
        if (!subjectMap[subj]) subjectMap[subj] = []
        subjectMap[subj].push(s.score)
      }
      const subjectBreakdown = Object.entries(subjectMap)
        .map(([name, sc]) => ({ name, avg: Math.round(sc.reduce((a, b) => a + b, 0) / sc.length), count: sc.length }))
        .sort((a, b) => b.avg - a.avg)

      students.push({
        id:               key,
        profileId:        g.profileId,
        full_name:        g.displayName,
        grade_class:      [...g.grades][0] ?? null,
        grades_taken:     [...g.grades],
        is_archived:      false,
        last_active:      sorted.at(-1)?.completed_at ?? null,
        avgScore:         avg,
        totalAssessments: sorted.length,
        trend,
        subjectBreakdown,
        submissions: sorted.reverse().map((s) => ({
          id: s.id, score: s.score, total: s.total,
          completed_at: s.completed_at, time_taken_secs: s.time_taken_secs,
          assessments: {
            title: s.assessmentTitle, subject: s.assessmentSubject,
            class_level: s.assessmentGrade, topic: s.assessmentTopic,
            assessment_type: s.assessmentType,
          },
        })),
      })
    }

    students.sort((a, b) => {
      if (!a.last_active) return  1
      if (!b.last_active) return -1
      return new Date(b.last_active) - new Date(a.last_active)
    })

    return NextResponse.json({ students })

  } catch (err) {
    console.error('[/api/students GET]', err.message)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// ── PATCH /api/students ────────────────────────────────────────────────────
// action: 'rename'  — rename one student across all their submissions
// action: 'merge'   — combine multiple students into one name
export async function PATCH(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action, oldName, newName, sourceNames, primaryName } = body

    const db = adminClient()

    // Get this teacher's assessment IDs — ensures we only modify our own data
    const { data: myAssessments } = await db
      .from('assessments')
      .select('id')
      .eq('teacher_id', user.id)
    const myIds = (myAssessments ?? []).map((a) => a.id)
    if (!myIds.length) return NextResponse.json({ success: true })

    // ── Rename ─────────────────────────────────────────────────────────────
    if (action === 'rename' && oldName && newName) {
      await db
        .from('submissions')
        .update({ student_name: newName.trim() })
        .in('assessment_id', myIds)
        .ilike('student_name', oldName.trim())

      return NextResponse.json({ success: true })
    }

    // ── Merge ──────────────────────────────────────────────────────────────
    // sourceNames: array of all names to merge (including primary)
    // primaryName: the name to keep
    if (action === 'merge' && sourceNames?.length >= 2 && primaryName) {
      // Rename every source name (except the primary) to primaryName
      const toRename = sourceNames.filter(
        (n) => n.toLowerCase().trim() !== primaryName.toLowerCase().trim()
      )

      for (const name of toRename) {
        await db
          .from('submissions')
          .update({ student_name: primaryName.trim() })
          .in('assessment_id', myIds)
          .ilike('student_name', name.trim())
      }

      // If primaryName differs from all source names (custom), rename primary source too
      const primaryIsNew = !sourceNames.some(
        (n) => n.toLowerCase().trim() === primaryName.toLowerCase().trim()
      )
      if (primaryIsNew) {
        for (const name of sourceNames) {
          await db
            .from('submissions')
            .update({ student_name: primaryName.trim() })
            .in('assessment_id', myIds)
            .ilike('student_name', name.trim())
        }
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (err) {
    console.error('[/api/students PATCH]', err.message)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}