import { getSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sb = getSupabase()

    const [
      { data: merchants, error: e1 },
      { data: transactions, error: e2 },
      { data: alerts, error: e3 },
    ] = await Promise.all([
      sb.from('merchants').select('id, name').limit(3),
      sb.from('transactions').select('id, amount, status').limit(3),
      sb.from('alerts').select('id, title').limit(3),
    ])

    return NextResponse.json({
      status: 'ok',
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'MISSING',
      results: {
        merchants: { count: merchants?.length || 0, error: e1?.message || null, sample: merchants },
        transactions: { count: transactions?.length || 0, error: e2?.message || null, sample: transactions },
        alerts: { count: alerts?.length || 0, error: e3?.message || null, sample: alerts },
      },
    })
  } catch (err: unknown) {
    return NextResponse.json({
      status: 'error',
      message: (err as Error).message,
    }, { status: 500 })
  }
}
