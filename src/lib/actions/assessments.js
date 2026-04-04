'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function generateSlug(supabase, userId, topic) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  const namePrefix = profile?.full_name
    ? profile.full_name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '').slice(0, 8)
    : 'teacher'

  const topicSlug = topic
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30)

  const suffix = Math.random().toString(36).slice(2, 6)
  return `${namePrefix}-${topicSlug}-${suffix}`
}

export async function createAssessment(setupData, questions, settings, source = 'manual') {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const slug = await generateSlug(supabase, user.id, setupData.topic)

  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .insert({
      teacher_id:        user.id,
      title:             setupData.title || setupData.topic,
      subject:           setupData.subject,
      class_level:       setupData.classLevel,
      topic:             setupData.topic,
      slug,
      question_mode:     setupData.questionMode || 'mcq',
      show_results:      settings?.showResults      ?? true,
      show_explanations: settings?.showExplanations ?? true,
      require_name:      settings?.requireName      ?? true,
      time_limit_mins:   settings?.timeLimit        ? 30 : null,
    })
    .select()
    .single()

  if (assessmentError) {
    console.error('Assessment error:', assessmentError)
    return { error: assessmentError.message }
  }

  const questionsToInsert = questions.map((q, index) => ({
    assessment_id: assessment.id,
    teacher_id:    user.id,
    type:          q.type,
    text:          q.text,
    options:       Array.isArray(q.options) ? q.options : [],
    answer:        q.answer,
    hint:          q.hint        ?? '',
    explanation:   q.explanation ?? '',
    order_index:   index,
    subject:       setupData.subject,
    class_level:   setupData.classLevel,
    topic:         setupData.topic,
  }))

  const { error: questionsError } = await supabase
    .from('questions')
    .insert(questionsToInsert)

  if (questionsError) {
    console.error('Questions error:', questionsError)
    return { error: questionsError.message }
  }

  if (source === 'manual' || source === 'ai') {
    const bankQuestions = questions.map((q, index) => ({
      assessment_id: null,
      teacher_id:    user.id,
      type:          q.type,
      text:          q.text,
      options:       Array.isArray(q.options) ? q.options : [],
      answer:        q.answer,
      hint:          q.hint        ?? '',
      explanation:   q.explanation ?? '',
      order_index:   index,
      subject:       setupData.subject,
      class_level:   setupData.classLevel,
      topic:         setupData.topic,
    }))
    await supabase.from('questions').insert(bankQuestions)
  }

  return { success: true, slug, id: assessment.id }
}

export async function getAssessments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('assessments')
    .select(`
      id, title, subject, class_level,
      topic, slug, created_at,
      submissions (count)
    `)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  if (error) { console.error('Get assessments error:', error); return [] }
  return data
}

export async function getAssessmentBySlug(slug) {
  const supabase = await createClient()
  const { data: assessment, error } = await supabase
    .from('assessments')
    .select(`
      *,
      questions (
        id, type, text, options,
        answer, hint, explanation, order_index
      )
    `)
    .eq('slug', slug)
    .single()

  if (error) { console.error('Get assessment error:', error); return null }
  if (assessment?.questions) {
    assessment.questions.sort((a, b) => a.order_index - b.order_index)
  }
  return assessment
}

export async function getSubmissions(assessmentId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('completed_at', { ascending: false })

  if (error) { console.error('Get submissions error:', error); return [] }
  return data
}

export async function deleteAssessment(id) {
  const supabase = await createClient()
  const { error } = await supabase.from('assessments').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function getBankQuestions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('teacher_id', user.id)
    .is('assessment_id', null)
    .order('created_at', { ascending: false })

  if (error) { console.error('Get bank questions error:', error); return [] }
  return data
}