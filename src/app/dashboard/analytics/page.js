import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts'
import { BarChart2 } from 'lucide-react'

const mockData = {
  totalSubmissions: 143,
  classAverage:      67,
  completionRate:    84,
  needSupport:        6,

  bySubject: [
    { label: 'Maths',   value: 67 },
    { label: 'Biology', value: 58 },
    { label: 'English', value: 74 },
    { label: 'Physics', value: 65 },
    { label: 'Chem',    value: 70 },
    { label: 'Govt',    value: 81 },
  ],

  scoreDistribution: [
    { label: '0–49%',   value: 12 },
    { label: '50–64%',  value: 28 },
    { label: '65–74%',  value: 35 },
    { label: '75–89%',  value: 42 },
    { label: '90–100%', value: 26 },
  ],

  questionDifficulty: [
    { label: 'Solve 2x+5=13',            pct: 93, count: 28 },
    { label: 'Find y when x=5',          pct: 64, count: 28 },
    { label: 'Simultaneous equations',   pct: 31, count: 28 },
    { label: 'Word problem — train',     pct: 55, count: 28 },
    { label: 'Graph a linear equation',  pct: 48, count: 27 },
  ],

  topStudents: [
    { name: 'Kelechi Okonkwo',  class: 'SS2',  score: 88 },
    { name: 'Ngozi Eze',        class: 'SS3',  score: 81 },
    { name: 'Amara Chidinma',   class: 'SS1',  score: 72 },
  ],

  bottomStudents: [
    { name: 'Teniola Nwosu',     class: 'SS2',  score: 46 },
    { name: 'Oluwaseun Adeyemi', class: 'JSS3', score: 61 },
    { name: 'Babatunde Fashola', class: 'SS1',  score: 61 },
  ],
}

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={22} className="text-brand-500" />
          <h1 className="font-display text-3xl font-bold text-ink">Analytics</h1>
        </div>
        <p className="text-ink-3 text-sm">
          Understand how your students are performing across all assessments
        </p>
      </div>

      <AnalyticsCharts data={mockData} />
    </div>
  )
}