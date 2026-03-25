import StudentsList from '@/components/dashboard/StudentsList'
import { Users } from 'lucide-react'

const mockStudents = [
  {
    id: '1',
    name: 'Kelechi Okonkwo',
    class: 'SS2',
    testsCompleted: 5,
    avgScore: 88,
    lastActive: '25 Mar 2026',
    submissions: [
      { assessment: 'Quadratic Equations', score: 88, date: '25 Mar 2026' },
      { assessment: 'Linear Equations',    score: 91, date: '20 Mar 2026' },
      { assessment: 'Indices & Logs',      score: 84, date: '15 Mar 2026' },
    ],
  },
  {
    id: '2',
    name: 'Amara Chidinma',
    class: 'SS1',
    testsCompleted: 4,
    avgScore: 72,
    lastActive: '25 Mar 2026',
    submissions: [
      { assessment: 'Linear Equations',  score: 72, date: '25 Mar 2026' },
      { assessment: 'Number Bases',      score: 68, date: '18 Mar 2026' },
      { assessment: 'Sets & Venn',       score: 75, date: '12 Mar 2026' },
    ],
  },
  {
    id: '3',
    name: 'Teniola Nwosu',
    class: 'SS2',
    testsCompleted: 3,
    avgScore: 46,
    lastActive: '24 Mar 2026',
    submissions: [
      { assessment: 'Quadratic Equations', score: 46, date: '24 Mar 2026' },
      { assessment: 'Simultaneous Eq.',    score: 40, date: '17 Mar 2026' },
      { assessment: 'Factorisation',       score: 52, date: '10 Mar 2026' },
    ],
  },
  {
    id: '4',
    name: 'Babatunde Fashola',
    class: 'SS1',
    testsCompleted: 2,
    avgScore: 61,
    lastActive: '22 Mar 2026',
    submissions: [
      { assessment: 'Linear Equations', score: 61, date: '22 Mar 2026' },
      { assessment: 'Number Bases',     score: 58, date: '15 Mar 2026' },
    ],
  },
  {
    id: '5',
    name: 'Oluwaseun Adeyemi',
    class: 'JSS3',
    testsCompleted: 3,
    avgScore: 61,
    lastActive: '24 Mar 2026',
    submissions: [
      { assessment: 'Photosynthesis',  score: 61, date: '24 Mar 2026' },
      { assessment: 'Cell Structure',  score: 55, date: '16 Mar 2026' },
      { assessment: 'Reproduction',   score: 66, date: '9 Mar 2026'  },
    ],
  },
  {
    id: '6',
    name: 'Ngozi Eze',
    class: 'SS3',
    testsCompleted: 6,
    avgScore: 79,
    lastActive: '23 Mar 2026',
    submissions: [
      { assessment: 'Nigerian Constitution', score: 81, date: '23 Mar 2026' },
      { assessment: 'Federalism',            score: 78, date: '14 Mar 2026' },
      { assessment: 'Electoral Process',     score: 77, date: '7 Mar 2026'  },
    ],
  },
]

export default function StudentsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={22} className="text-brand-500" />
            <h1 className="font-display text-3xl font-bold text-ink">Students</h1>
          </div>
          <p className="text-ink-3 text-sm">
            Track every student's progress across all assessments
          </p>
        </div>
      </div>

      <StudentsList students={mockStudents} />
    </div>
  )
}