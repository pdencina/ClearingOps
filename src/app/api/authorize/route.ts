import { authorize, type AuthorizationRequest } from '@/lib/engines/authorization'
import { getSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json() as AuthorizationRequest
    
    // Run authorization engine
    const result = authorize(body)

    // Persist to database
    const sb = getSupabase()
    const { data: txn } = await sb.from('transactions').insert({
      merchant_id: body.merchant_id,
      terminal_id: body.terminal_id || null,
      amount: body.amount,
      currency: body.currency || 'CLP',
      card_brand: body.card_brand,
      card_type: body.card_type,
      card_last_four: body.card_last_four,
      auth_code: result.auth_code,
      reference_id: result.reference_id,
      status: result.approved ? 'authorized' : 'rejected',
      payment_method: body.payment_method,
      installments: body.installments || 1,
      rejection_reason: result.approved ? null : result.decision_reason,
    }).select('*').single()

    // Log operational event
    await sb.from('operational_events').insert({
      event_type: result.approved ? 'info' : 'warning',
      source: 'klap-auth-engine',
      message: `${result.approved ? '✓' : '✗'} Auth ${result.reference_id} — ${body.card_brand} $${body.amount.toLocaleString()} — ${result.decision_reason} (${result.processing_time_ms}ms)`,
      status: 'resolved',
      details: { risk_score: result.risk_score, rules: result.rules_evaluated.length },
    })

    return NextResponse.json({
      authorization: result,
      transaction: txn,
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
