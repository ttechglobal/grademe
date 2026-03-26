'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import StartScreen from '@/components/student/StartScreen'
import TestScreen from '@/components/student/TestScreen'
import ResultScreen from '@/components/student/ResultScreen'
import Spinner from '@/components/ui/Spinner'
import { submitAnswers } from '@/lib/actions/submissions'

export default function TestPage({ params }) {
  // ✅ Unwrap params Promise first
  const { slug } = use(params)

  const [assessment,  setAssessment]  = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)
  const [phase,       setPhase]       = useState('start')
  const [studentName, setStudentName] = useState('')
  const [answers,     setAnswers]     = useState({})
  const [result,      setResult]      = useState(null)

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
        console.error('Load error:', error)
        setNotFound(true)
      } else {
        data.questions.sort((a, b) => a.order_index - b.order_index)
        setAssessment(data)
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
    const res = await submitAnswers({
      assessmentId: assessment.id,
      studentName,
      answers:      finalAnswers,
      questions:    assessment.questions,
    })
    setResult(res)
    setPhase('result')
  }

  const handleRetry = () => {
    setAnswers({})
    setResult(null)
    setPhase('start')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-5xl">🔍</div>
        <h1 className="font-display text-2xl font-bold text-ink">
          Assessment not found
        </h1>
        <p className="text-sm text-ink-3 max-w-sm">
          This link may be incorrect or the assessment may have been removed.
          Check with your teacher.
        </p>
      </div>
    )
  }

  return (
    <>
      {phase === 'start' && (
        <StartScreen
          assessment={{
            title:         assessment.title,
            subject:       assessment.subject,
            classLevel:    assessment.class_level,
            teacherName:   'Your Teacher',
            questionCount: assessment.questions.length,
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
          onRetry={handleRetry}
        />
      )}
    </>
  )
}