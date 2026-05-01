'use server'

/**
 * src/lib/actions/assessments.js
 *
 * MIGRATION REQUIRED — run this SQL in Supabase before deploying:
 *
 *   ALTER TABLE public.assessments
 *     ADD COLUMN IF NOT EXISTS curriculum      TEXT    DEFAULT NULL,
 *     ADD COLUMN IF NOT EXISTS assessment_type TEXT    DEFAULT 'quiz';
 *
 * Once the columns exist, the schema cache may need refreshing:
 *   Supabase Dashboard → Settings → API → Reload schema
 *   (or restart the serverless function / redeploy)
 *
 * Existing assessments without these columns will NOT break — both
 * columns have DEFAULT NULL / DEFAULT 'quiz' so old rows are unaffected.
 */

import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'

function generateSlug(text) {
  const slug = (text || 'assessment')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${slug}-${suffix}`
}

export async function createAssessment(setupData, questions, settings, source = 'manual') {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  // Auto-title priority:
  //   1. topic field (most specific — e.g. "Fractions" → "Fractions Quiz")
  //   2. subject + assessmentType (e.g. "Mathematics Quiz")
  //   3. "Assessment" as last resort
  const topic      = (setupData.topic || setupData.title || '').trim()
  const subjectStr = setupData.subject?.replace(/_/g, ' ') ?? ''
  const typeStr    = setupData.assessmentType ?? ''

  const autoTitle = topic
    ? [topic, typeStr].filter(Boolean).join(' ')
    : [subjectStr, typeStr].filter(Boolean).join(' ') || 'Assessment'

  const slug = generateSlug(setupData.title || autoTitle)

  // ── Core insert — only columns that are guaranteed to exist ───────────
  const coreInsert = {
    teacher_id:      user.id,
    title:           setupData.title || autoTitle,
    subject:         setupData.subject,
    class_level:     setupData.classLevel,
    topic:           setupData.title || autoTitle,
    slug,
    question_mode:   setupData.questionMode || 'mcq',
    show_results:    true,
    show_explanations: true,
    require_name:    true,
    is_active:       true,
  }

  // Timer — only set if enabled
  if (setupData.timerEnabled && setupData.timeLimitMins) {
    coreInsert.time_limit_mins = setupData.timeLimitMins
  }

  // ── Optional extended columns — added via migration ───────────────────
  // These are added safely so the insert succeeds even if the migration
  // hasn't been run yet (Supabase will ignore unknown keys only if using
  // the JS client with the correct schema — if schema cache is stale,
  // remove these until the migration is applied and cache is refreshed).
  if (setupData.curriculum) {
    coreInsert.curriculum = setupData.curriculum
  }
  if (setupData.assessmentType) {
    coreInsert.assessment_type = setupData.assessmentType
  }
  // question_type — 'mcq' | 'true_false' — the type selected on step 0
  if (setupData.questionMode) {
    coreInsert.question_type = setupData.questionMode === 'true_false' ? 'true_false' : 'mcq'
  }
  // participant_fields — custom intake fields; null means use platform defaults
  if (setupData.participant_fields !== undefined && setupData.participant_fields !== null) {
    coreInsert.participant_fields = setupData.participant_fields
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .insert(coreInsert)
    .select()
    .single()

  if (assessmentError) {
    console.error('[createAssessment] error:', assessmentError)

    // If the error is about a missing column, return a clear message
    if (
      assessmentError.message?.includes('curriculum') ||
      assessmentError.message?.includes('assessment_type') ||
      assessmentError.message?.includes('schema cache')
    ) {
      return {
        error:
          'Database migration required. Please run:\n' +
          'ALTER TABLE assessments ADD COLUMN IF NOT EXISTS curriculum TEXT;\n' +
          'ALTER TABLE assessments ADD COLUMN IF NOT EXISTS assessment_type TEXT;\n' +
          'Then refresh the Supabase schema cache.',
      }
    }

    return { error: assessmentError.message }
  }

  // ── Insert questions linked to this assessment ─────────────────────────
  const questionsToInsert = questions.map((q, index) => ({
    assessment_id:  assessment.id,
    teacher_id:     user.id,
    type:           q.type          || 'mcq',
    question_type:  q.question_type || (q.type === 'truefalse' ? 'true_false' : 'mcq'),
    text:           q.text,
    options:        Array.isArray(q.options) ? q.options : [],
    answer:         q.answer,
    hint:           q.hint          ?? '',
    explanation:    q.explanation   ?? '',
    order_index:    index,
    subject:        setupData.subject,
    class_level:    setupData.classLevel,
    topic:          setupData.title || autoTitle,
  }))

  const { error: questionsError } = await supabase
    .from('questions')
    .insert(questionsToInsert)

  if (questionsError) {
    console.error('[createAssessment] questions error:', questionsError)
    return { error: questionsError.message }
  }

  // ── Also save to question bank for manual/AI sources ───────────────────
  if (source === 'manual' || source === 'ai' || source === 'generate') {
    const bankQuestions = questions.map((q) => ({
      assessment_id:  null,
      teacher_id:     user.id,
      type:           q.type          || 'mcq',
      question_type:  q.question_type || (q.type === 'truefalse' ? 'true_false' : 'mcq'),
      text:           q.text,
      options:        Array.isArray(q.options) ? q.options : [],
      answer:         q.answer,
      hint:           q.hint          ?? '',
      explanation:    q.explanation   ?? '',
      subject:        setupData.subject,
      class_level:    setupData.classLevel,
      topic:          setupData.title || autoTitle,
    }))

    supabase.from('questions').insert(bankQuestions).then(({ error }) => {
      if (error) console.warn('[createAssessment] bank save:', error.message)
    })
  }

  return { id: assessment.id, slug: assessment.slug }
}