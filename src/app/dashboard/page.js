import HeroBanner from '@/components/dashboard/HeroBanner'
import StatsRow from '@/components/dashboard/StatsRow'
import AssessmentCard from '@/components/dashboard/AssessmentCard'
import SubmissionsTable from '@/components/dashboard/SubmissionsTable'
import Link from 'next/link'

const mockStats = [
  { label: 'Assessments',    value: '8',    change: '2 new this week',     positive: true  },
  { label: 'Total Responses',value: '143',  change: '28 since yesterday',  positive: true  },
  { label: 'Class Average',  value: '67%',  change: '12% vs last week',    positive: true  },
]

const mockAssessments = [
  {
    subject:   'Mathematics',
    title:     'Quadratic Equations',
    meta:      'SS2 · 15 questions',
    submitted: 28,
    total:     30,
    avgScore:  72,
    color:     'green',
  },
  {
    subject:   'Biology',
    title:     'Photosynthesis',
    meta:      'JSS3 · 10 questions',
    submitted: 12,
    total:     25,
    avgScore:  58,
    color:     'amber',
  },
  {
    subject:   'English',
    title:     'Comprehension Skills',
    meta:      'SS1 · 8 questions',
    submitted: 0,
    total:     30,
    color:     'red',
    status:    'new',
  },
]

const mockSubmissions = [
  {
    student:    'Amara Chidinma',
    assessment: 'Linear Equations — SS1',
    submittedAt:'2026-03-25',
    score:      72,
  },
  {
    student:    'Kelechi Okonkwo',
    assessment: 'Quadratic Equations — SS2',
    submittedAt:'2026-03-25',
    score:      88,
  },
  {
    student:    'Teniola Nwosu',
    assessment: 'Quadratic Equations — SS2',
    submittedAt:'2026-03-24',
    score:      46,
  },
  {
    student:    'Babatunde Fashola',
    assessment: 'Linear Equations — SS1',
    submittedAt: null,
    score:       null,
  },
  {
    student:    'Oluwaseun Adeyemi',
    assessment: 'Photosynthesis — JSS3',
    submittedAt:'2026-03-24',
    score:      61,
  },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">

      {/* Hero */}
      <HeroBanner name="Ms. Adaeze" />

      {/* Stats */}
      <StatsRow stats={mockStats} />

      {/* Assessments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-ink">
            Recent Assessments
          </h2>
          <Link
            href="/dashboard/assessments"
            className="text-sm font-semibold text-brand-500 hover:text-brand-400 transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockAssessments.map((a) => (
            <AssessmentCard key={a.title} {...a} />
          ))}
        </div>
      </div>

      {/* Submissions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-ink">
            Recent Submissions
          </h2>
          <button className="text-sm font-semibold text-brand-500 hover:text-brand-400 transition-colors">
            Export →
          </button>
        </div>
        <SubmissionsTable submissions={mockSubmissions} />
      </div>

    </div>
  )
}