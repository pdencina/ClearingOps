import { calculateSettlement } from '@/lib/engines/settlement'
import { getSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { merchant_id } = await req.json() as { merchant_id: string }
    const sb = getSupabase()

    // Get merchant info
    const { data: merchant } = await sb
      .from('merchants')
      .select('*')
      .eq('id', merchant_id)
      .single()

    if (!merchant) {
      return NextResponse.json({ error: 'Comercio no encontrado' }, { status: 404 })
    }

    // Get settled transactions for today
    const today = new Date().toISOString().split('T')[0]
    const { data: transactions } = await sb
      .from('transactions')
      .select('amount, card_brand, card_type, payment_method')
      .eq('merchant_id', merchant_id)
      .eq('status', 'settled')
      .limit(200)

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: 'No hay transacciones para liquidar' }, { status: 400 })
    }

    // Get fee rules
    const { data: feeRules } = await sb
      .from('fee_rules')
      .select('card_brand, card_type, payment_method, percentage, fixed_fee')
      .eq('is_active', true)

    // Calculate settlement
    const result = calculateSettlement({
      merchant_id,
      merchant_name: merchant.name,
      transactions: transactions.map(t => ({
        amount: Number(t.amount),
        card_brand: t.card_brand,
        card_type: t.card_type,
        payment_method: t.payment_method,
      })),
      fee_rules: (feeRules || []).map(r => ({
        card_brand: r.card_brand,
        card_type: r.card_type,
        payment_method: r.payment_method,
        percentage: Number(r.percentage),
        fixed_fee: Number(r.fixed_fee),
      })),
    })

    // Save settlement
    const { data: settlement } = await sb.from('settlements').insert({
      merchant_id,
      settlement_date: today,
      gross_amount: result.gross_amount,
      commission: result.total_commission,
      iva: result.iva,
      withholdings: result.withholdings,
      net_amount: result.net_amount,
      transaction_count: result.transaction_count,
      status: 'pending',
    }).select('*').single()

    return NextResponse.json({
      settlement,
      breakdown: result.commission_breakdown,
      processing_details: result.processing_details,
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
