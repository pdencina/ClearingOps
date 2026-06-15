// ============================================================
// KLAP CORE — Supabase Client
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase no configurado — agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local')
  _supabase = createClient(url, key)
  return _supabase
}

// ============================================================
// Dashboard Queries
// ============================================================

export async function getDashboardMetrics() {
  const sb = getSupabase()
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: todayTxns },
    { data: settledToday },
    { data: pendingSettlements },
    { data: rejectedToday },
    { data: openDisputes },
    { data: activeAlerts },
  ] = await Promise.all([
    sb.from('transactions').select('id, amount, status').gte('created_at', today + 'T00:00:00'),
    sb.from('settlements').select('net_amount').eq('status', 'paid').gte('created_at', today + 'T00:00:00'),
    sb.from('settlements').select('net_amount').in('status', ['pending', 'processing']),
    sb.from('transactions').select('id').eq('status', 'rejected').gte('created_at', today + 'T00:00:00'),
    sb.from('disputes').select('id, amount').in('status', ['open', 'under_review', 'representment']),
    sb.from('alerts').select('id, severity').eq('is_resolved', false),
  ])

  const totalTxns = todayTxns?.length || 0
  const totalAmount = todayTxns?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const totalSettled = settledToday?.reduce((sum, s) => sum + Number(s.net_amount), 0) || 0
  const totalPending = pendingSettlements?.reduce((sum, s) => sum + Number(s.net_amount), 0) || 0
  const totalRejected = rejectedToday?.length || 0
  const totalOpenDisputes = openDisputes?.length || 0
  const totalDisputeAmount = openDisputes?.reduce((sum, d) => sum + Number(d.amount), 0) || 0

  return {
    totalTxns,
    totalAmount,
    totalSettled,
    totalPending,
    totalRejected,
    totalOpenDisputes,
    totalDisputeAmount,
    activeAlerts: activeAlerts?.length || 0,
    criticalAlerts: activeAlerts?.filter(a => a.severity === 'critical').length || 0,
  }
}

export async function getTransactionVolume7Days() {
  const sb = getSupabase()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data } = await sb
    .from('transactions')
    .select('amount, card_brand, created_at')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  return data || []
}

export async function getPaymentMethodDistribution() {
  const sb = getSupabase()
  const { data } = await sb
    .from('transactions')
    .select('payment_method, amount')

  if (!data) return []

  const grouped = data.reduce((acc, t) => {
    const method = t.payment_method
    if (!acc[method]) acc[method] = { method, count: 0, amount: 0 }
    acc[method].count++
    acc[method].amount += Number(t.amount)
    return acc
  }, {} as Record<string, { method: string; count: number; amount: number }>)

  return Object.values(grouped)
}

export async function getRecentActivity(limit = 10) {
  const sb = getSupabase()
  const { data } = await sb
    .from('transactions')
    .select('*, merchants(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  return data || []
}

export async function getTopMerchants(limit = 5) {
  const sb = getSupabase()
  const { data } = await sb
    .from('settlements')
    .select('gross_amount, transaction_count, merchants(name)')
    .order('gross_amount', { ascending: false })
    .limit(limit)

  return data || []
}

// ============================================================
// Transactions
// ============================================================

export async function getTransactions(filters?: {
  status?: string
  card_brand?: string
  merchant_id?: string
  from_date?: string
  to_date?: string
  limit?: number
}) {
  const sb = getSupabase()
  let query = sb
    .from('transactions')
    .select('*, merchants(name)')
    .order('created_at', { ascending: false })
    .limit(filters?.limit || 50)

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.card_brand) query = query.eq('card_brand', filters.card_brand)
  if (filters?.merchant_id) query = query.eq('merchant_id', filters.merchant_id)
  if (filters?.from_date) query = query.gte('created_at', filters.from_date + 'T00:00:00')
  if (filters?.to_date) query = query.lte('created_at', filters.to_date + 'T23:59:59')

  const { data } = await query
  return data || []
}

// ============================================================
// Clearing
// ============================================================

export async function getClearingBatches() {
  const sb = getSupabase()
  const { data } = await sb
    .from('clearing_batches')
    .select('*')
    .order('created_at', { ascending: false })

  return data || []
}

// ============================================================
// Settlements
// ============================================================

export async function getSettlements() {
  const sb = getSupabase()
  const { data } = await sb
    .from('settlements')
    .select('*, merchants(name)')
    .order('settlement_date', { ascending: false })

  return data || []
}

// ============================================================
// Reconciliation
// ============================================================

export async function getReconciliationItems() {
  const sb = getSupabase()
  const { data } = await sb
    .from('reconciliation_items')
    .select('*')
    .order('reconciliation_date', { ascending: false })

  return data || []
}

// ============================================================
// Fee Rules
// ============================================================

export async function getFeeRules() {
  const sb = getSupabase()
  const { data } = await sb
    .from('fee_rules')
    .select('*')
    .order('card_brand', { ascending: true })

  return data || []
}

export async function toggleFeeRule(id: string, isActive: boolean) {
  const sb = getSupabase()
  const { error } = await sb
    .from('fee_rules')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
  return !error
}

// ============================================================
// Disputes
// ============================================================

export async function getDisputes() {
  const sb = getSupabase()
  const { data } = await sb
    .from('disputes')
    .select('*, merchants(name), transactions(reference_id, card_last_four)')
    .order('created_at', { ascending: false })

  return data || []
}

// ============================================================
// Operational Events
// ============================================================

export async function getOperationalEvents() {
  const sb = getSupabase()
  const { data } = await sb
    .from('operational_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return data || []
}

// ============================================================
// Alerts
// ============================================================

export async function getAlerts() {
  const sb = getSupabase()
  const { data } = await sb
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })

  return data || []
}

// ============================================================
// Merchants
// ============================================================

export async function getMerchants() {
  const sb = getSupabase()
  const { data } = await sb
    .from('merchants')
    .select('*')
    .order('name', { ascending: true })

  return data || []
}
