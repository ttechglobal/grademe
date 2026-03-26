import { createClient } from '@/lib/supabase/server'
import AssessmentWizard from '@/components/assessment/AssessmentWizard'

export default async function NewAssessmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('curriculum')
    .eq('id', user.id)
    .single()

  const curriculum = profile?.curriculum ?? 'uk'

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
      <AssessmentWizard curriculum={curriculum} />
    </div>
  )
}