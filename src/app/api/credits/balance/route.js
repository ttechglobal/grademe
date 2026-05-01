import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data } = await supabase
      .from('credits')
      .select('balance, total_earned, total_spent')
      .eq('tutor_id', user.id)
      .single()

    return NextResponse.json({
      balance:      data?.balance      ?? 0,
      total_earned: data?.total_earned ?? 0,
      total_spent:  data?.total_spent  ?? 0,
    })
  } catch (err) {
    console.error('[/api/credits/balance]', err.message)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}