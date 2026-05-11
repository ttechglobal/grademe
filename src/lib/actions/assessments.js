'use server'

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

  // ── Resolve the canonical question type ──────────────────────────────
  const resolvedQuestionType = (() => {
    const qt = setupData.questionType || setupData.questionMode || 'mcq'
    if (qt === 'true_false')  return 'true_false'
    if (qt === 'calculation') return 'calculation'
    if (qt === 'stepwise')    return 'stepwise'
    return 'mcq'
  })()

  // ── Core assessment insert ────────────────────────────────────────────
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

  // ── Build question rows ───────────────────────────────────────────────
  const questionsToInsert = questions.map((q, index) => {
    const qType      = q.question_type || q.type || 'mcq'
    const isCalc     = qType === 'calculation'
    const isTF       = qType === 'true_false' || qType === 'truefalse'
    const isStepwise = qType === 'stepwise'

    // Calculation and Stepwise have no single answer string
    const answerValue = (isCalc || isStepwise) ? '' : (q.answer ?? q.correct_answer ?? '')

    const row = {
      assessment_id: assessment.id,
      teacher_id:    user.id,
      // 'type' must match the DB check constraint: mcq | truefalse | calculation | stepwise
      type:          isCalc ? 'calculation' : isStepwise ? 'stepwise' : (isTF ? 'truefalse' : 'mcq'),
      question_type: isCalc ? 'calculation' : isStepwise ? 'stepwise' : (isTF ? 'true_false' : 'mcq'),
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

    if (isCalc && q.answer_template) {
      row.answer_template = q.answer_template
    }

    if (isStepwise) {
      if (q.steps     && q.steps.length > 0)     row.steps     = q.steps
      if (q.word_bank && q.word_bank.length > 0) row.word_bank = q.word_bank
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
    if (questionsError.message?.includes('steps') || questionsError.message?.includes('word_bank')) {
      return {
        error:
          'Database migration required for Stepwise. Please run:\n' +
          'ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS steps JSONB;\n' +
          'ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS word_bank JSONB;\n' +
          'Then refresh the Supabase schema cache.',
      }
    }
    if (questionsError.message?.includes('questions_type_check')) {
      return {
        error:
          'Database constraint needs updating. Please run in Supabase SQL editor:\n' +
          "ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_type_check;\n" +
          "ALTER TABLE public.questions ADD CONSTRAINT questions_type_check CHECK (type IN ('mcq', 'truefalse', 'calculation', 'stepwise'));\n" +
          'Then refresh the Supabase schema cache.',
      }
    }
    return { error: questionsError.message }
  }

  // ── Save to question bank (MCQ and True/False only) ───────────────────
  if (
    resolvedQuestionType !== 'calculation' &&
    resolvedQuestionType !== 'stepwise' &&
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