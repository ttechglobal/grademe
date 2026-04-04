'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import StartScreen  from '@/components/student/StartScreen'
import TestScreen   from '@/components/student/TestScreen'
import ResultScreen from '@/components/student/ResultScreen'
import ReviewScreen from '@/components/student/ReviewScreen'
import Spinner      from '@/components/ui/Spinner'

export default function TestPage({ params }) {
  const { slug } = use(params)

  const [assessment,  setAssessment]  = useState(null)
  const [teacher,     setTeacher]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)
  const [phase,       setPhase]       = useState('start')
  const [studentName, setStudentName] = useState('')
  const [answers,     setAnswers]     = useState({})
  const [results,     setResults]     = useState([])
  const [submitError, setSubmitError] = useState('')
  const [score,       setScore]       = useState(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data, error } = await supabase
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

      if (error || !data) {
        console.error('Assessment load error:', error)
        setNotFound(true)
        setLoading(false)
        return
      }

      data.questions.sort((a, b) => a.order_index - b.order_index)
      setAssessment(data)

      // Load teacher name
      if (data.teacher_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', data.teacher_id)
          .single()

        setTeacher(profile)
      }

      setLoading(false)
    }
    load()
  }, [slug])

  const handleStart = (name) => {
    setStudentName(name)
    setPhase('test')
  }

  const handleFinish = async (finalAnswers) => {
    setAnswers(finalAnswers)
    setSubmitError('')

    try {
      const response = await fetch('/api/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          assessmentId: assessment.id,
          studentName,
          answers:      finalAnswers,
          questions:    assessment.questions,
          questionMode: assessment.question_mode || 'mcq',
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        console.error('Submission failed:', result.error)
        setSubmitError(result.error || 'Submission failed')
      } else {
        setScore(result.score)
        console.log('Submission saved. Score:', result.score)

        // Cache locally
        try {
          const history = JSON.parse(localStorage.getItem('grademe_submissions') || '[]')
          history.unshift({
            assessmentTitle: assessment.title,
            studentName,
            score:           result.score,
            date:            new Date().toISOString(),
            slug,
          })
          localStorage.setItem('grademe_submissions', JSON.stringify(history.slice(0, 20)))
        } catch {
          // localStorage not critical
        }
      }
    } catch (err) {
      console.error('Network error:', err)
      setSubmitError('Network error — please check your connection and tell your teacher')
    }

    setPhase('result')
  }

  const handleReview = (resultData) => {
    setResults(resultData)
    setPhase('review')
  }

  const handleDone = () => {
    setPhase('start')
    setAnswers({})
    setResults([])
    setStudentName('')
    setSubmitError('')
    setScore(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="w-8 h-8" />
          <p className="text-sm text-ink-4">Loading assessment…</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-5xl">🔍</div>
        <h1 className="font-display text-2xl font-bold text-ink">Assessment not found</h1>
        <p className="text-sm text-ink-3 max-w-sm leading-relaxed">
          This link may be incorrect or the assessment may have been removed.
          Please check with your teacher.
        </p>
      </div>
    )
  }

  const teacherName = teacher?.full_name || 'Your Teacher'
  const teacherRole = teacher?.role || ''

  return (
    <>
      {phase === 'start' && (
        <StartScreen
          assessment={{
            title:         assessment.title,
            subject:       assessment.subject,
            classLevel:    assessment.class_level,
            teacherName,
            teacherRole,
            questionCount: assessment.questions.length,
            questionMode:  assessment.question_mode || 'mcq',
          }}
          onStart={handleStart}
        />
      )}

      {phase === 'test' && (
        <TestScreen
          assessment={assessment}
          studentName={studentName}
          onFinish={handleFinish}
        />
      )}

      {phase === 'result' && (
        <ResultScreen
          assessment={assessment}
          studentName={studentName}
          answers={answers}
          submitError={submitError}
          onReview={handleReview}
          onDone={handleDone}
        />
      )}

      {phase === 'review' && (
        <ReviewScreen
          results={results}
          assessment={assessment}
          onDone={handleDone}
        />
      )}
    </>
  )
}