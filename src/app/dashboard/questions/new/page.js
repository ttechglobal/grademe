import { createClient } from '@/lib/supabase/server'
import StandaloneQuestionEditor from '@/components/assessment/StandaloneQuestionEditor'
import { BookOpen } from 'lucide-react'

export default async function NewQuestionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('curriculum')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={22} className="text-brand-500" />
          <h1 className="font-display text-3xl font-bold text-ink">
            Add Questions
          </h1>
        </div>
        <p className="text-ink-3 text-sm">
          Add questions directly to your bank — no assessment needed
        </p>
      </div>
      <StandaloneQuestionEditor curriculum={profile?.curriculum ?? 'uk'} />
    </div>
  )
}