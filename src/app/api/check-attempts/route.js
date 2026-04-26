import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { assessmentId, studentName, sessionKey, maxAttempts } = await request.json()

    if (!assessmentId || !studentName) {
      return NextResponse.json({ allowed: true })
    }

    // No limit set
    if (!maxAttempts) {
      return NextResponse.json({ allowed: true, attemptsLeft: null })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Count existing attempts by this student (name + session key OR just name)
    const { data: existing, error } = await supabase
      .from('submissions')
      .select('id, session_key')
      .eq('assessment_id', assessmentId)
      .ilike('student_name', studentName.trim())

    if (error) {
      console.error('Check attempts error:', error)
      // On error, allow attempt
      return NextResponse.json({ allowed: true })
    }

    const attemptCount = existing?.length ?? 0
    const attemptsLeft = Math.max(0, maxAttempts - attemptCount)

    if (attemptCount >= maxAttempts) {
      return NextResponse.json({
        allowed:      false,
        attemptCount,
        attemptsLeft: 0,
      })
    }

    return NextResponse.json({
      allowed:      true,
      attemptCount,
      attemptsLeft,
    })
  } catch (err) {
    console.error('check-attempts error:', err)
    return NextResponse.json({ allowed: true })
  }
}