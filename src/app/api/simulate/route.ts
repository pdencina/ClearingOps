import { getSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MERCHANTS = [
  'a1b2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0002-4000-8000-000000000002',
  'a1b2c3d4-0003-4000-8000-000000000003',
  'a1b2c3d4-0004-4000-8000-000000000004',
  'a1b2c3d4-0005-4000-8000-000000000005',
]

const BRANDS = ['visa', 'mastercard'] as const
const TYPES = ['credit', 'debit'] as const
const METHODS = ['card', 'contactless', 'ecommerce', 'qr'] as const
const STATUSES = ['authorized', 'captured', 'settled'] as const

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomAmount(): number {
  return Math.floor(Math.random() * 500000) + 1000
}

function randomCard(): string {
  return String(Math.floor(Math.random() * 9000) + 1000)
}

function randomRef(): string {
  const num = Math.floor(Math.random() * 999999)
  return `REF-SIM-${String(num).padStart(6, '0')}`
}

export async function POST() {
  try {
    const sb = getSupabase()

    const transaction = {
      merchant_id: randomChoice(MERCHANTS),
      amount: randomAmount(),
      card_brand: randomChoice(BRANDS),
      card_type: randomChoice(TYPES),
      card_last_four: randomCard(),
      auth_code: `S${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
      reference_id: randomRef(),
      status: randomChoice(STATUSES),
      payment_method: randomChoice(METHODS),
      installments: Math.random() > 0.7 ? Math.floor(Math.random() * 12) + 2 : 1,
      currency: 'CLP',
    }

    const { data, error } = await sb
      .from('transactions')
      .insert(transaction)
      .select('*, merchants(name)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also create an operational event
    await sb.from('operational_events').insert({
      event_type: 'info',
      source: 'simulator',
      message: `Transacción simulada ${transaction.reference_id} — ${transaction.card_brand} ${transaction.card_type} $${transaction.amount.toLocaleString()}`,
      status: 'resolved',
    })

    return NextResponse.json({
      success: true,
      transaction: data,
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
