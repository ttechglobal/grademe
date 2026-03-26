import ImportQuestions from '@/components/assessment/ImportQuestions'
import { Sparkles } from 'lucide-react'

export default function ImportQuestionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={22} className="text-brand-500" />
          <h1 className="font-display text-3xl font-bold text-ink">
            Import Questions
          </h1>
        </div>
        <p className="text-ink-3 text-sm">
          Use any AI tool to extract questions from worksheets, past papers, and textbooks
        </p>
      </div>
      <ImportQuestions />
    </div>
  )
}