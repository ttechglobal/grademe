import Button from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function HeroBanner({ name }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 px-8 py-8 flex items-center justify-between">
      <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute right-16 -bottom-12 w-36 h-36 rounded-full bg-white/5" />

      <div className="relative z-10">
        <h2 className="font-display text-2xl font-bold text-white leading-snug">
          Welcome back,<br />
          {name} 👋
        </h2>
        <Link href="/dashboard/assessments/new">
          <Button variant="amber" size="md" className="mt-5">
            <Plus size={16} />
            New Assessment
          </Button>
        </Link>
      </div>

      <div className="relative z-10 text-7xl hidden md:block select-none">
        📚
      </div>
    </div>
  )
}