import Link from 'next/link'
import Button from '@/components/ui/Button'
import AssessmentCard from '@/components/dashboard/AssessmentCard'
import { Plus } from 'lucide-react'

const mockAssessments = [
  { subject: 'Mathematics', title: 'Quadratic Equations',    meta: 'SS2 · 15 questions', submitted: 28, total: 30, avgScore: 72, color: 'green'  },
  { subject: 'Biology',     title: 'Photosynthesis',         meta: 'JSS3 · 10 questions', submitted: 12, total: 25, avgScore: 58, color: 'amber'  },
  { subject: 'English',     title: 'Comprehension Skills',   meta: 'SS1 · 8 questions',  submitted: 0,  total: 30, color: 'red', status: 'new'    },
  { subject: 'Physics',     title: 'Newton\'s Laws',         meta: 'SS2 · 12 questions', submitted: 20, total: 28, avgScore: 65, color: 'blue'    },
  { subject: 'Chemistry',   title: 'Periodic Table Basics',  meta: 'SS1 · 10 questions', submitted: 15, total: 25, avgScore: 70, color: 'purple'  },
  { subject: 'Government',  title: 'Nigerian Constitution',  meta: 'SS3 · 20 questions', submitted: 30, total: 30, avgScore: 81, color: 'green'   },
]

export default function AssessmentsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Assessments</h1>
          <p className="text-ink-3 mt-1 text-sm">All your assessments in one place</p>
        </div>
        <Link href="/dashboard/assessments/new">
          <Button variant="amber">
            <Plus size={16} />
            New Assessment
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockAssessments.map((a) => (
          <AssessmentCard key={a.title} {...a} />
        ))}
      </div>
    </div>
  )
}