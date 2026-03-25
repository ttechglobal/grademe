'use client'

import { useState } from 'react'
import StartScreen from '@/components/student/StartScreen'
import TestScreen from '@/components/student/TestScreen'
import ResultScreen from '@/components/student/ResultScreen'

// Mock assessment — we'll replace with real Supabase fetch later
const mockAssessment = {
  title:         'Linear Equations in Two Variables',
  subject:       'Mathematics',
  classLevel:    'SS1',
  teacherName:   'Ms. Adaeze',
  questionCount: 3,
  questions: [
    {
      type:    'mcq',
      text:    'Solve for x: 2x + 5 = 13',
      options: ['x = 3', 'x = 4', 'x = 5', 'x = 6'],
      answer:  'B',
      hint:    'Subtract 5 from both sides first, then divide.',
      explanation: '2x + 5 = 13 → subtract 5 → 2x = 8 → divide by 2 → x = 4',
    },
    {
      type:    'mcq',
      text:    'If y = 3x − 2, what is the value of y when x = 5?',
      options: ['y = 10', 'y = 11', 'y = 13', 'y = 15'],
      answer:  'C',
      hint:    'Substitute x = 5 directly into the equation.',
      explanation: 'y = 3(5) − 2 = 15 − 2 = 13',
    },
    {
      type:    'truefalse',
      text:    'The equation y = 2x + 1 is a linear equation.',
      options: [],
      answer:  'True',
      hint:    'Think about what makes an equation linear.',
      explanation: 'A linear equation has no exponents greater than 1. y = 2x + 1 fits this — it\'s a straight line.',
    },
  ],
}

export default function TestPage({ params }) {
  const [phase, setPhase] = useState('start')
  const [studentName, setStudentName] = useState('')
  const [answers, setAnswers] = useState({})

  const handleStart = (name) => {
    setStudentName(name)
    setPhase('test')
  }

  const handleFinish = (finalAnswers) => {
    setAnswers(finalAnswers)
    setPhase('result')
  }

  const handleRetry = () => {
    setAnswers({})
    setPhase('start')
  }

  return (
    <>
      {phase === 'start' && (
        <StartScreen
          assessment={mockAssessment}
          onStart={handleStart}
        />
      )}
      {phase === 'test' && (
        <TestScreen
          assessment={mockAssessment}
          studentName={studentName}
          onFinish={handleFinish}
        />
      )}
      {phase === 'result' && (
        <ResultScreen
          assessment={mockAssessment}
          studentName={studentName}
          answers={answers}
          onRetry={handleRetry}
        />
      )}
    </>
  )
}