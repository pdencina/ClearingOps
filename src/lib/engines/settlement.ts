// ============================================================
// KLAP CORE — Settlement Engine
// Motor de liquidación que calcula comisiones y genera pagos
// ============================================================

export interface SettlementInput {
  merchant_id: string
  merchant_name: string
  transactions: Array<{
    amount: number
    card_brand: string
    card_type: string
    payment_method: string
  }>
  fee_rules: Array<{
    card_brand: string
    card_type: string
    payment_method: string
    percentage: number
    fixed_fee: number
  }>
}

export interface SettlementResult {
  merchant_id: string
  merchant_name: string
  settlement_date: string
  transaction_count: number
  gross_amount: number
  commission_breakdown: CommissionLine[]
  total_commission: number
  iva: number
  withholdings: number
  net_amount: number
  processing_details: string[]
}

export interface CommissionLine {
  description: string
  transaction_count: number
  gross: number
  rate: number
  fixed: number
  commission: number
}

const IVA_RATE = 0.19
const WITHHOLDING_THRESHOLD = 1000000 // Retención sobre $1M
const WITHHOLDING_RATE = 0.005

/**
 * Calcula la liquidación para un comercio.
 * Aplica reglas de comisión por marca/tipo, calcula IVA y retenciones.
 */
export function calculateSettlement(input: SettlementInput): SettlementResult {
  const details: string[] = []
  const breakdown: CommissionLine[] = []

  details.push(`Procesando ${input.transactions.length} transacciones para ${input.merchant_name}`)

  // Agrupar transacciones por combinación de marca + tipo + método
  const groups = input.transactions.reduce((acc, txn) => {
    const key = `${txn.card_brand}|${txn.card_type}|${txn.payment_method}`
    if (!acc[key]) acc[key] = { ...txn, count: 0, total: 0 }
    acc[key].count++
    acc[key].total += txn.amount
    return acc
  }, {} as Record<string, { card_brand: string; card_type: string; payment_method: string; count: number; total: number }>)

  let totalCommission = 0
  const grossAmount = input.transactions.reduce((sum, t) => sum + t.amount, 0)

  // Calcular comisión por grupo
  for (const [key, group] of Object.entries(groups)) {
    const rule = input.fee_rules.find(r =>
      r.card_brand === group.card_brand &&
      r.card_type === group.card_type &&
      r.payment_method === group.payment_method
    ) || input.fee_rules.find(r =>
      r.card_brand === group.card_brand &&
      r.card_type === group.card_type
    )

    const rate = rule?.percentage || 0.022 // Default 2.2%
    const fixed = rule?.fixed_fee || 0
    const commission = (group.total * rate) + (fixed * group.count)

    breakdown.push({
      description: `${group.card_brand} ${group.card_type} (${group.payment_method})`,
      transaction_count: group.count,
      gross: group.total,
      rate,
      fixed,
      commission,
    })

    totalCommission += commission
    details.push(`  ${group.card_brand} ${group.card_type}: ${group.count} txns × ${(rate * 100).toFixed(2)}% = $${Math.round(commission).toLocaleString()}`)
  }

  // IVA sobre comisión
  const iva = totalCommission * IVA_RATE
  details.push(`IVA (19% sobre comisión): $${Math.round(iva).toLocaleString()}`)

  // Retenciones (solo si supera umbral)
  let withholdings = 0
  if (grossAmount > WITHHOLDING_THRESHOLD) {
    withholdings = grossAmount * WITHHOLDING_RATE
    details.push(`Retención (0.5% sobre $${grossAmount.toLocaleString()}): $${Math.round(withholdings).toLocaleString()}`)
  } else {
    details.push('Retención: $0 (monto bajo umbral de $1.000.000)')
  }

  const netAmount = grossAmount - totalCommission - iva - withholdings
  details.push(`Neto a liquidar: $${Math.round(netAmount).toLocaleString()}`)

  return {
    merchant_id: input.merchant_id,
    merchant_name: input.merchant_name,
    settlement_date: new Date().toISOString().split('T')[0],
    transaction_count: input.transactions.length,
    gross_amount: grossAmount,
    commission_breakdown: breakdown,
    total_commission: totalCommission,
    iva,
    withholdings,
    net_amount: netAmount,
    processing_details: details,
  }
}
