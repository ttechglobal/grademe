'use client'

import AssessmentWizard from '@/components/assessment/AssessmentWizard'
import { useRouter } from 'next/navigation'

export default function NewAssessmentPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">
          New Assessment
        </h1>
        <p className="text-ink-3 mt-1 text-sm">
          Fill in the details, add your questions, then share with students.
        </p>
      </div>
      <AssessmentWizard onFinish={() => router.push('/dashboard')} />
    </div>
  )
}