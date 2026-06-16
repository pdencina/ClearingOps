import { authorize, type AuthorizationRequest } from '@/lib/engines/authorization'
import { detectFraud, type FraudCheckRequest } from '@/lib/engines/fraud'
import { calculateSettlement } from '@/lib/engines/settlement'
import { sendWebhook } from '@/lib/engines/webhooks'
import { getSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const pipelineStart = performance.now()

  try {
    const body = await req.json()
    const {
      merchant_id,
      amount,
      card_brand,
      card_type,
      card_last_four,
      payment_method,
      installments = 1,
    } = body

    const sb = getSupabase()

    // ─── Step 1: Authorization ───────────────────────────────────
    const authRequest: AuthorizationRequest = {
      merchant_id,
      amount,
      currency: 'CLP',
      card_brand,
      card_type,
      card_last_four,
      payment_method,
      installments,
    }
    const authResult = authorize(authRequest)

    // Persist transaction
    const { data: txn } = await sb.from('transactions').insert({
      merchant_id,
      amount,
      currency: 'CLP',
      card_brand,
      card_type,
      card_last_four,
      auth_code: authResult.auth_code,
      reference_id: authResult.reference_id,
      status: authResult.approved ? 'authorized' : 'rejected',
      payment_method,
      installments,
      rejection_reason: authResult.approved ? null : authResult.decision_reason,
    }).select('*').single()

    // ─── Step 2: Fraud Check ─────────────────────────────────────
    const fraudRequest: FraudCheckRequest = {
      transaction_id: authResult.reference_id,
      amount,
      card_brand,
      card_type,
      card_last_four,
      payment_method,
      merchant_id,
      merchant_category: 'retail',
      installments,
    }
    const fraudResult = detectFraud(fraudRequest)

    // ─── Step 3: Settlement Preview ──────────────────────────────
    const settlementResult = calculateSettlement({
      merchant_id,
      merchant_name: 'Pipeline Merchant',
      transactions: [{ amount, card_brand, card_type, payment_method }],
      fee_rules: [
        { card_brand, card_type, payment_method, percentage: 0.022, fixed_fee: 0 },
      ],
    })

    // ─── Step 4: Webhook Notification ────────────────────────────
    const eventType = authResult.approved ? 'transaction.authorized' : 'transaction.rejected'
    const webhookResult = sendWebhook(
      eventType as 'transaction.authorized' | 'transaction.rejected',
      merchant_id,
      'Pipeline Merchant',
      {
        reference_id: authResult.reference_id,
        amount,
        card_brand,
        status: authResult.approved ? 'authorized' : 'rejected',
        fraud_score: fraudResult.fraud_score,
      }
    )

    // ─── Step 5: Log Operational Event ───────────────────────────
    await sb.from('operational_events').insert({
      event_type: authResult.approved ? 'info' : 'warning',
      source: 'klap-pipeline',
      message: `Pipeline ${authResult.reference_id} — ${card_brand} $${amount.toLocaleString()} — Auth:${authResult.approved ? 'OK' : 'DENIED'} Fraud:${fraudResult.decision} Settlement:$${Math.round(settlementResult.net_amount).toLocaleString()}`,
      status: 'resolved',
      details: {
        auth_code: authResult.auth_code,
        risk_score: authResult.risk_score,
        fraud_score: fraudResult.fraud_score,
        fraud_decision: fraudResult.decision,
        net_amount: settlementResult.net_amount,
        webhook_status: webhookResult.status,
      },
    })

    const totalPipelineTime = Math.round((performance.now() - pipelineStart) * 100) / 100

    return NextResponse.json({
      pipeline: {
        status: 'completed',
        total_time_ms: totalPipelineTime,
        steps: 5,
      },
      authorization: authResult,
      fraud: fraudResult,
      settlement: {
        gross_amount: settlementResult.gross_amount,
        total_commission: settlementResult.total_commission,
        iva: settlementResult.iva,
        withholdings: settlementResult.withholdings,
        net_amount: settlementResult.net_amount,
        commission_breakdown: settlementResult.commission_breakdown,
      },
      webhook: {
        id: webhookResult.id,
        event_type: webhookResult.event_type,
        status: webhookResult.status,
        response_code: webhookResult.response_code,
        response_time_ms: webhookResult.response_time_ms,
        endpoint_url: webhookResult.endpoint_url,
      },
      transaction: txn,
    })
  } catch (err: unknown) {
    const totalPipelineTime = Math.round((performance.now() - pipelineStart) * 100) / 100
    return NextResponse.json({
      pipeline: { status: 'error', total_time_ms: totalPipelineTime },
      error: (err as Error).message,
    }, { status: 500 })
  }
}
