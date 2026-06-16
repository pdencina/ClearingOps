import { generateVisaClearing, generateMastercardClearing, type ClearingTransaction } from '@/lib/engines/clearing'
import { getSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { brand } = await req.json() as { brand: 'visa' | 'mastercard' }
    const sb = getSupabase()

    // Fetch settled transactions not yet cleared
    const { data: transactions } = await sb
      .from('transactions')
      .select('id, reference_id, amount, currency, card_brand, card_last_four, auth_code, merchant_id, created_at, merchants(name)')
      .eq('card_brand', brand)
      .in('status', ['settled', 'captured'])
      .order('created_at', { ascending: true })
      .limit(100)

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: 'No hay transacciones para clearing' }, { status: 400 })
    }

    // Map to clearing format
    const clearingTxns: ClearingTransaction[] = transactions.map(t => ({
      id: t.id,
      reference_id: t.reference_id,
      amount: Number(t.amount),
      currency: t.currency,
      card_brand: t.card_brand,
      card_last_four: t.card_last_four,
      auth_code: t.auth_code,
      merchant_id: t.merchant_id,
      merchant_name: (t.merchants as unknown as Record<string, string>)?.name || 'Unknown',
      created_at: t.created_at,
    }))

    // Generate clearing file
    const result = brand === 'visa'
      ? generateVisaClearing(clearingTxns)
      : generateMastercardClearing(clearingTxns)

    // Save batch to database
    const { data: batch } = await sb.from('clearing_batches').insert({
      batch_number: result.batch_id,
      card_brand: brand,
      status: 'generated',
      transaction_count: result.transaction_count,
      total_amount: result.total_amount,
      file_name: result.file_name,
      generated_at: result.generated_at,
    }).select('*').single()

    // Log event
    await sb.from('operational_events').insert({
      event_type: 'job',
      source: 'klap-clearing-engine',
      message: `Batch ${result.batch_id} generado — ${result.transaction_count} txns, $${result.total_amount.toLocaleString()} — Checksum: ${result.checksum}`,
      status: 'resolved',
    })

    return NextResponse.json({
      batch,
      file_preview: result.file_content.split('\n').slice(0, 5),
      file_name: result.file_name,
      checksum: result.checksum,
      total_records: result.records.length,
      total_amount: result.total_amount,
      transaction_count: result.transaction_count,
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
