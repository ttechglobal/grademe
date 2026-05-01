import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)

    const { data, error } = await supabase
      .from('credit_transactions')
      .select('id, type, amount, balance_after, description, action, created_at')
      .eq('tutor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ transactions: data ?? [] })
  } catch (err) {
    console.error('[/api/credits/history]', err.message)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}