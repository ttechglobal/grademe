import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      assessmentId,
      studentName,
      answers,
      score,
      total,
      sessionKey,
      timeTakenSecs,
      tabViolations,
    } = body

    if (!assessmentId || !studentName) {
      return NextResponse.json(
        { error: 'assessmentId and studentName are required' },
        { status: 400 }
      )
    }

    const db = adminClient()

    // Verify assessment exists and get teacher context
    const { data: assessment, error: aErr } = await db
      .from('assessments')
      .select('id, teacher_id, title, class_level')
      .eq('id', assessmentId)
      .single()

    if (aErr || !assessment) {
      console.error('[submit] Assessment not found:', aErr?.message)
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    // Try to link a student_profile_id if the table exists
    let profileId = null
    try {
      const { data: existing } = await db
        .from('student_profiles')
        .select('id')
        .eq('teacher_id', assessment.teacher_id)
        .ilike('full_name', studentName.trim())
        .is('merged_into', null)
        .maybeSingle()

      if (existing) {
        profileId = existing.id
        await db.from('student_profiles')
          .update({ last_active: new Date().toISOString() })
          .eq('id', profileId)
      } else {
        const { data: created } = await db
          .from('student_profiles')
          .insert({
            teacher_id:  assessment.teacher_id,
            full_name:   studentName.trim(),
            grade_class: assessment.class_level ?? null,
            last_active: new Date().toISOString(),
          })
          .select('id')
          .single()
        profileId = created?.id ?? null
      }
    } catch {
      // student_profiles table may not exist yet — submission still succeeds
      console.warn('[submit] student_profiles unavailable, submitting without profile link')
    }

    // Insert the submission
    const { data: sub, error: subErr } = await db
      .from('submissions')
      .insert({
        assessment_id:      assessmentId,
        student_name:       studentName.trim(),
        answers,
        score:              score  ?? 0,
        total:              total  ?? 0,
        completed_at:       new Date().toISOString(),
        session_key:        sessionKey    ?? null,
        time_taken_secs:    timeTakenSecs ?? null,
        tab_violations:     tabViolations ?? 0,
        student_profile_id: profileId,
        grade_class:        assessment.class_level ?? null,
        student_identifier: null,
      })
      .select('id, score, total')
      .single()

    if (subErr) {
      console.error('[submit] Insert failed:', subErr.message)
      return NextResponse.json({ error: subErr.message }, { status: 500 })
    }

    console.log(`[submit] ✓ ${studentName} scored ${score}% on ${assessment.title}`)

    return NextResponse.json({
      success: true,
      id:      sub.id,
      score:   sub.score,
      total:   sub.total,
    })

  } catch (err) {
    console.error('[submit] Unhandled:', err.message)
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}