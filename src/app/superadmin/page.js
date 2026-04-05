import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuperAdminClient from './SuperAdminClient'

const ADMIN_EMAILS = ['devg12025@gmail.com']

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login?next=/superadmin')
  }

  if (!ADMIN_EMAILS.includes(user.email)) {
    redirect('/')
  }

  return (
    <SuperAdminClient
      adminEmail={user.email}
      adminName={user.user_metadata?.full_name ?? user.email}
    />
  )
}