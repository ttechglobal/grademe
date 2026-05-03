'use server'

/**
 * src/lib/actions/assessments.js
 *
 * MIGRATIONS REQUIRED — run in Supabase SQL editor:
 *
 *   ALTER TABLE public.questions
 *     ADD COLUMN IF NOT EXISTS answer_template JSONB;
 *
 *   ALTER TABLE public.assessments
 *     ADD COLUMN IF NOT EXISTS curriculum      TEXT DEFAULT NULL,
 *     ADD COLUMN IF NOT EXISTS assessment_type TEXT DEFAULT 'quiz';
 *
 * Then: Supabase Dashboard → Settings → API → Reload schema
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

  const topic      = (setupData.topic || setupData.title || '').trim()
  const subjectStr = setupData.subject?.replace(/_/g, ' ') ?? ''
  const typeStr    = setupData.assessmentType ?? ''

  const autoTitle = topic
    ? [topic, typeStr].filter(Boolean).join(' ')
    : [subjectStr, typeStr].filter(Boolean).join(' ') || 'Assessment'

  const slug = generateSlug(setupData.title || autoTitle)

  // ── Resolve the canonical question type ───────────────────────────────
  // setupData.questionType is set by AssessmentWizard (new field).
  // setupData.questionMode is the legacy field — still 'mcq' for calculation.
  // Always prefer questionType when present.
  const resolvedQuestionType = (() => {
    const qt = setupData.questionType || setupData.questionMode || 'mcq'
    if (qt === 'true_false') return 'true_false'
    if (qt === 'calculation') return 'calculation'
    return 'mcq'
  })()

  // ── Core assessment insert ─────────────────────────────────────────────
  const coreInsert = {
    teacher_id:        user.id,
    title:             setupData.title || autoTitle,
    subject:           setupData.subject,
    class_level:       setupData.classLevel,
    topic:             setupData.title || autoTitle,
    slug,
    question_mode:     setupData.questionMode || 'mcq',
    question_type:     resolvedQuestionType,
    show_results:      true,
    show_explanations: true,
    require_name:      true,
    is_active:         true,
  }

  if (setupData.timerEnabled && setupData.timeLimitMins) {
    coreInsert.time_limit_mins = setupData.timeLimitMins
  }
  if (setupData.curriculum) {
    coreInsert.curriculum = setupData.curriculum
  }
  if (setupData.assessmentType) {
    coreInsert.assessment_type = setupData.assessmentType
  }
  if (setupData.participant_fields !== undefined && setupData.participant_fields !== null) {
    coreInsert.participant_fields = setupData.participant_fields
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .insert(coreInsert)
    .select()
    .single()

  if (assessmentError) {
    console.error('[createAssessment] assessment error:', assessmentError)
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

  // ── Build question rows ────────────────────────────────────────────────
  const questionsToInsert = questions.map((q, index) => {
    const qType  = q.question_type || q.type || 'mcq'
    const isCalc = qType === 'calculation'
    const isTF   = qType === 'true_false' || qType === 'truefalse'

    // Calculation questions have no single-answer string.
    // Store '' to satisfy the NOT NULL constraint on the `answer` column.
    // The real answers live in answer_template.structure[].answer
    const answerValue = isCalc ? '' : (q.answer ?? q.correct_answer ?? '')

    const row = {
      assessment_id: assessment.id,
      teacher_id:    user.id,
      type:          isCalc ? 'calculation' : (isTF ? 'truefalse' : 'mcq'),
      question_type: isCalc ? 'calculation' : (isTF ? 'true_false' : 'mcq'),
      text:          q.text || q.question || q.question_text || '',
      options:       Array.isArray(q.options) ? q.options : [],
      answer:        answerValue,
      hint:          q.hint        ?? '',
      explanation:   q.explanation ?? '',
      order_index:   index,
      subject:       setupData.subject,
      class_level:   setupData.classLevel,
      topic:         setupData.title || autoTitle,
    }

    // Only set answer_template for calculation questions — leave it out
    // entirely for MCQ/TF so we don't require the column to exist yet.
    if (isCalc && q.answer_template) {
      row.answer_template = q.answer_template
    }

    return row
  })

  const { error: questionsError } = await supabase
    .from('questions')
    .insert(questionsToInsert)

  if (questionsError) {
    console.error('[createAssessment] questions error:', questionsError)
    if (questionsError.message?.includes('answer_template')) {
      return {
        error:
          'Database migration required. Please run:\n' +
          'ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS answer_template JSONB;\n' +
          'Then refresh the Supabase schema cache.',
      }
    }
    return { error: questionsError.message }
  }

  // ── Save to question bank (MCQ and True/False only) ────────────────────
  // Calculation questions are excluded — the bank only supports MCQ/TF.
  if (
    resolvedQuestionType !== 'calculation' &&
    (source === 'manual' || source === 'ai' || source === 'generate')
  ) {
    const bankQuestions = questions.map((q) => {
      const isTF = q.question_type === 'true_false' || q.type === 'truefalse'
      return {
        assessment_id: null,
        teacher_id:    user.id,
        type:          isTF ? 'truefalse' : 'mcq',
        question_type: isTF ? 'true_false' : 'mcq',
        text:          q.text || q.question || '',
        options:       Array.isArray(q.options) ? q.options : [],
        answer:        q.answer ?? q.correct_answer ?? '',
        hint:          q.hint        ?? '',
        explanation:   q.explanation ?? '',
        subject:       setupData.subject,
        class_level:   setupData.classLevel,
        topic:         setupData.title || autoTitle,
      }
    })

    supabase.from('questions').insert(bankQuestions).then(({ error }) => {
      if (error) console.warn('[createAssessment] bank save:', error.message)
    })
  }

  return { id: assessment.id, slug: assessment.slug }
}