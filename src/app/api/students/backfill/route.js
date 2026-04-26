import { NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * GET /api/students/backfill
 * Check whether this teacher has any submissions not yet linked to a profile.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = adminClient()

    // Count submissions with null student_profile_id belonging to this teacher's assessments
    const { count, error } = await db
      .from('submissions')
      .select('id, assessments!inner(teacher_id)', { count: 'exact', head: true })
      .is('student_profile_id', null)
      .eq('assessments.teacher_id', user.id)

    if (error) {
      console.error('[backfill GET]', error.message)
      return NextResponse.json({ needsBackfill: false, unlinkedCount: 0 })
    }

    return NextResponse.json({
      needsBackfill: (count ?? 0) > 0,
      unlinkedCount: count ?? 0,
    })

  } catch (err) {
    console.error('[backfill GET] Unhandled:', err.message)
    return NextResponse.json({ needsBackfill: false, unlinkedCount: 0 })
  }
}

/**
 * POST /api/students/backfill
 * Safe, idempotent backfill. Can be called multiple times — never duplicates data.
 *
 * Algorithm:
 *  1. Fetch all submissions (with no profile link) for this teacher's assessments
 *  2. Load existing profiles into memory (name → id map)
 *  3. For each unlinked submission:
 *     a. If a profile with that name exists → link it
 *     b. If not → create a new profile, then link it
 *  4. Return counts of created/linked
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = adminClient()

    // ── 1. Unlinked submissions for this teacher ───────────────────────────
    const { data: unlinked, error: fetchErr } = await db
      .from('submissions')
      .select(`
        id,
        student_name,
        assessments!inner (
          teacher_id,
          class_level,
          subject,
          topic
        )
      `)
      .is('student_profile_id', null)
      .eq('assessments.teacher_id', user.id)
      .not('student_name', 'is', null)

    if (fetchErr) {
      console.error('[backfill POST] Fetch error:', fetchErr.message)
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    const toProcess = (unlinked ?? []).filter(
      (s) => s.student_name?.trim() && s.assessments?.teacher_id === user.id
    )

    if (toProcess.length === 0) {
      return NextResponse.json({ created: 0, linked: 0, message: 'Already up to date' })
    }

    // ── 2. Load existing profiles into a name→id map ───────────────────────
    const { data: existingProfiles } = await db
      .from('student_profiles')
      .select('id, full_name')
      .eq('teacher_id', user.id)
      .is('merged_into', null)

    // Normalise name for matching: lowercase + trim
    const profileMap = new Map(
      (existingProfiles ?? []).map((p) => [p.full_name.toLowerCase().trim(), p.id])
    )

    let created = 0
    let linked  = 0

    // ── 3. Process each unlinked submission ───────────────────────────────
    for (const sub of toProcess) {
      const name     = sub.student_name.trim()
      const nameKey  = name.toLowerCase()
      const grade    = sub.assessments?.class_level ?? null

      let profileId = profileMap.get(nameKey)

      if (!profileId) {
        // Create a new profile
        const { data: newProfile, error: createErr } = await db
          .from('student_profiles')
          .insert({
            teacher_id:  user.id,
            full_name:   name,
            grade_class: grade,
            last_active: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (createErr || !newProfile) {
          console.error(`[backfill] Could not create profile for "${name}":`, createErr?.message)
          continue
        }

        profileId = newProfile.id
        profileMap.set(nameKey, profileId)  // cache so subsequent submissions share it
        created++
      }

      // Link the submission
      const { error: linkErr } = await db
        .from('submissions')
        .update({ student_profile_id: profileId })
        .eq('id', sub.id)

      if (linkErr) {
        console.error(`[backfill] Could not link submission ${sub.id}:`, linkErr.message)
      } else {
        linked++
      }
    }

    console.log(`[backfill] ✓ teacher=${user.id}: created=${created}, linked=${linked}`)

    return NextResponse.json({
      created,
      linked,
      message: `Backfill complete. Created ${created} new profile${created !== 1 ? 's' : ''}, linked ${linked} submission${linked !== 1 ? 's' : ''}.`,
    })

  } catch (err) {
    console.error('[backfill POST] Unhandled:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}