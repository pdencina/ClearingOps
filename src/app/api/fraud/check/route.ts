import { detectFraud, type FraudCheckRequest } from '@/lib/engines/fraud'
import { getSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json() as FraudCheckRequest
    const result = detectFraud(body)

    // Log to operational events
    const sb = getSupabase()
    await sb.from('operational_events').insert({
      event_type: result.decision === 'block' ? 'critical' : result.decision === 'review' ? 'warning' : 'info',
      source: 'klap-fraud-engine',
      message: `Fraud check ${result.transaction_id}: score ${result.fraud_score}/100 → ${result.decision.toUpperCase()} (${result.risk_level}) — ${result.processing_time_ms}ms`,
      status: result.decision === 'block' ? 'active' : 'resolved',
      details: {
        fraud_score: result.fraud_score,
        decision: result.decision,
        checks_count: result.checks_performed.length,
        ml_version: result.ml_model_version,
      },
    })

    // If blocked, create an alert
    if (result.decision === 'block') {
      await sb.from('alerts').insert({
        type: 'security',
        severity: 'critical',
        title: `Fraude detectado — Score ${result.fraud_score}/100`,
        description: `Transacción ${result.transaction_id} bloqueada. ${result.recommendations.join('. ')}`,
        is_read: false,
        is_resolved: false,
      })
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
