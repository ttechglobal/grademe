'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function generateSlug(supabase, userId, topic) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    const namePrefix = profile?.full_name
      ? profile.full_name
          .split(' ')[0]
          .toLowerCase()
          .replace(/[^a-z]/g, '')
          .slice(0, 8)
      : 'teacher'

    const topicSlug = (topic || 'assessment')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30)

    const suffix = Math.random().toString(36).slice(2, 6)
    return `${namePrefix}-${topicSlug}-${suffix}`
  } catch (err) {
    console.error('generateSlug error:', err)
    const suffix = Math.random().toString(36).slice(2, 8)
    return `assessment-${suffix}`
  }
}

export async function createAssessment(setupData, questions, settings, source = 'manual') {
  let supabase
  let user

  try {
    supabase = await createClient()
    const { data: authData, error: userError } = await supabase.auth.getUser()

    if (userError || !authData?.user) {
      console.error('Auth error:', userError)
      redirect('/login')
    }

    user = authData.user
  } catch (err) {
    console.error('Client/auth setup error:', err)
    return { error: 'Authentication error. Please sign in again.' }
  }

  try {
    // Use topic from setupData, fall back to assessmentType
    const topicForSlug = setupData.topic || setupData.assessmentType || 'assessment'
    const slug = await generateSlug(supabase, user.id, topicForSlug)

    console.log('Creating assessment with data:', {
      teacher_id:      user.id,
      title:           setupData.title || setupData.assessmentType || 'Assessment',
      subject:         setupData.subject,
      class_level:     setupData.classLevel,
      topic:           setupData.topic || '',
      assessment_type: setupData.assessmentType || 'quiz',
      question_mode:   'mcq',
      slug,
    })

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        teacher_id:        user.id,
        title:             setupData.title || setupData.topic || setupData.assessmentType || 'Assessment',
        subject:           setupData.subject     || '',
        class_level:       setupData.classLevel  || '',
        topic:             setupData.topic       || '',
        assessment_type:   setupData.assessmentType || 'quiz',
        slug,
        question_mode:     'mcq',
        show_results:      settings?.showResults      ?? true,
        show_explanations: settings?.showExplanations ?? true,
        require_name:      settings?.requireName      ?? true,
        time_limit_mins:   settings?.timeLimit        ? 30 : null,
      })
      .select()
      .single()

    if (assessmentError) {
      console.error('Assessment insert error:', JSON.stringify(assessmentError, null, 2))
      return { error: `Failed to create assessment: ${assessmentError.message}` }
    }

    console.log('Assessment created:', assessment.id)

    // Insert questions linked to assessment
    if (questions && questions.length > 0) {
      const questionsToInsert = questions.map((q, index) => ({
        assessment_id: assessment.id,
        teacher_id:    user.id,
        type:          q.type          || 'mcq',
        text:          q.text          || '',
        options:       Array.isArray(q.options) ? q.options : [],
        answer:        q.answer        || '',
        hint:          q.hint          ?? '',
        explanation:   q.explanation   ?? '',
        order_index:   index,
        subject:       setupData.subject     || '',
        class_level:   setupData.classLevel  || '',
        topic:         setupData.topic       || '',
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) {
        console.error('Questions insert error:', JSON.stringify(questionsError, null, 2))
        return { error: `Questions could not be saved: ${questionsError.message}` }
      }

      console.log('Questions saved:', questionsToInsert.length)

      // Also save to question bank if source is manual or ai
      if (source === 'manual' || source === 'ai' || source === 'generate') {
        const bankQuestions = questions.map((q, index) => ({
          assessment_id: null,
          teacher_id:    user.id,
          type:          q.type          || 'mcq',
          text:          q.text          || '',
          options:       Array.isArray(q.options) ? q.options : [],
          answer:        q.answer        || '',
          hint:          q.hint          ?? '',
          explanation:   q.explanation   ?? '',
          order_index:   index,
          subject:       setupData.subject     || '',
          class_level:   setupData.classLevel  || '',
          topic:         setupData.topic       || '',
        }))

        const { error: bankError } = await supabase
          .from('questions')
          .insert(bankQuestions)

        if (bankError) {
          // Non-critical — log but don't fail
          console.error('Bank save error (non-critical):', bankError.message)
        }
      }
    }

    return { success: true, slug, id: assessment.id }

  } catch (err) {
    console.error('createAssessment unexpected error:', err)
    return { error: `Unexpected error: ${err.message}` }
  }
}

export async function getAssessments() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('assessments')
      .select(`
        id, title, subject, class_level,
        topic, slug, created_at, assessment_type,
        submissions (count)
      `)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (error) { console.error('getAssessments error:', error); return [] }
    return data ?? []
  } catch (err) {
    console.error('getAssessments exception:', err)
    return []
  }
}

export async function getAssessmentBySlug(slug) {
  try {
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

    if (error) { console.error('getAssessmentBySlug error:', error); return null }

    if (assessment?.questions) {
      assessment.questions.sort((a, b) => a.order_index - b.order_index)
    }
    return assessment
  } catch (err) {
    console.error('getAssessmentBySlug exception:', err)
    return null
  }
}

export async function getSubmissions(assessmentId) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('completed_at', { ascending: false })

    if (error) { console.error('getSubmissions error:', error); return [] }
    return data ?? []
  } catch (err) {
    console.error('getSubmissions exception:', err)
    return []
  }
}

export async function deleteAssessment(id) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('assessments').delete().eq('id', id)
    if (error) return { error: error.message }
    return { success: true }
  } catch (err) {
    return { error: err.message }
  }
}

export async function getBankQuestions() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('teacher_id', user.id)
      .is('assessment_id', null)
      .order('created_at', { ascending: false })

    if (error) { console.error('getBankQuestions error:', error); return [] }
    return data ?? []
  } catch (err) {
    console.error('getBankQuestions exception:', err)
    return []
  }
}