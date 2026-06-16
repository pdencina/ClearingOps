import { NextResponse } from 'next/server'
import { authenticateTransaction, ThreeDSRequest } from '@/lib/engines/threeds'
import { getSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ThreeDSRequest

    if (!body.transaction_id || !body.amount || !body.card_brand || !body.card_last_four || !body.merchant_name) {
      return NextResponse.json(
        { error: 'Missing required fields: transaction_id, amount, card_brand, card_last_four, merchant_name' },
        { status: 400 }
      )
    }

    const result = authenticateTransaction(body)

    // Log to operational_events
    try {
      const sb = getSupabase()
      await sb.from('operational_events').insert({
        event_type: result.status === 'failed' ? 'warning' : 'info',
        source: '3ds_engine',
        title: `3DS ${result.status} — ${body.card_brand} ****${body.card_last_four}`,
        description: `Autenticación ${result.authentication_type} v${result.version} — ECI: ${result.eci}, Liability shift: ${result.liability_shift}`,
        metadata: { request: body, response: result },
        status: 'active',
      })
    } catch {
      // Non-critical: don't fail the request if logging fails
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
