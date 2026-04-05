import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuperAdminClient from './SuperAdminClient'

const ADMIN_EMAILS = [
  'irokagolden@gmail.com',
]

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    redirect('/')
  }

  return <SuperAdminClient adminEmail={user.email} />
}