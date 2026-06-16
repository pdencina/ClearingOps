import { sendWebhook, type EventType } from '@/lib/engines/webhooks'
import { getSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { event_type, merchant_id } = await req.json() as {
      event_type: EventType
      merchant_id: string
    }

    const sb = getSupabase()

    // Get merchant name
    const { data: merchant } = await sb
      .from('merchants')
      .select('name')
      .eq('id', merchant_id)
      .single()

    if (!merchant) {
      return NextResponse.json({ error: 'Comercio no encontrado' }, { status: 404 })
    }

    // Generate sample payload based on event type
    const payload: Record<string, unknown> = {
      merchant_id,
      merchant_name: merchant.name,
    }

    if (event_type.startsWith('transaction.')) {
      payload.amount = Math.floor(Math.random() * 500000) + 5000
      payload.currency = 'CLP'
      payload.reference_id = `KLP-${Date.now().toString(36).toUpperCase()}`
    } else if (event_type.startsWith('settlement.')) {
      payload.gross_amount = Math.floor(Math.random() * 5000000) + 100000
      payload.net_amount = Math.floor(Number(payload.gross_amount) * 0.97)
      payload.settlement_date = new Date().toISOString().split('T')[0]
    }

    // Send webhook
    const result = sendWebhook(event_type, merchant_id, merchant.name, payload)

    // Log event
    await sb.from('operational_events').insert({
      event_type: result.status === 'delivered' ? 'info' : 'warning',
      source: 'klap-webhook-engine',
      message: `Webhook ${result.event_type} → ${merchant.name}: ${result.status} (${result.response_time_ms}ms, HTTP ${result.response_code})`,
      status: 'resolved',
    })

    return NextResponse.json(result)
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
