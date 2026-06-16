// ============================================================
// KLAP CORE — Reconciliation Engine
// Motor de conciliación automática KLAP vs Banco vs Marca
// ============================================================

export interface ReconciliationSource {
  name: 'klap' | 'bank' | 'brand'
  transaction_count: number
  total_amount: number
  transactions: Array<{
    reference_id: string
    amount: number
    date: string
  }>
}

export interface ReconciliationResult {
  date: string
  card_brand: string
  status: 'reconciled' | 'mismatch' | 'partial'
  sources: {
    klap: { count: number; amount: number }
    bank: { count: number; amount: number }
    brand: { count: number; amount: number }
  }
  differences: ReconciliationDifference[]
  match_rate: number
  processing_time_ms: number
  summary: string[]
}

export interface ReconciliationDifference {
  type: 'missing_in_bank' | 'missing_in_brand' | 'amount_mismatch' | 'extra_in_bank'
  reference_id: string
  klap_amount?: number
  bank_amount?: number
  brand_amount?: number
  difference: number
  detail: string
}

/**
 * Ejecuta conciliación automática entre las tres fuentes.
 * Compara transacciones de KLAP contra el reporte del banco y la marca.
 */
export function reconcile(
  klapTransactions: Array<{ reference_id: string; amount: number; date: string }>,
  bankTransactions: Array<{ reference_id: string; amount: number; date: string }>,
  brandTransactions: Array<{ reference_id: string; amount: number; date: string }>,
  cardBrand: string,
  date: string
): ReconciliationResult {
  const startTime = performance.now()
  const differences: ReconciliationDifference[] = []
  const summary: string[] = []

  const klapMap = new Map(klapTransactions.map(t => [t.reference_id, t]))
  const bankMap = new Map(bankTransactions.map(t => [t.reference_id, t]))
  const brandMap = new Map(brandTransactions.map(t => [t.reference_id, t]))

  summary.push(`Iniciando conciliación para ${cardBrand.toUpperCase()} - ${date}`)
  summary.push(`KLAP: ${klapTransactions.length} txns | Banco: ${bankTransactions.length} txns | Marca: ${brandTransactions.length} txns`)

  // Check: transactions in KLAP but not in bank
  for (const [refId, klapTxn] of klapMap) {
    const bankTxn = bankMap.get(refId)
    const brandTxn = brandMap.get(refId)

    if (!bankTxn) {
      differences.push({
        type: 'missing_in_bank',
        reference_id: refId,
        klap_amount: klapTxn.amount,
        difference: klapTxn.amount,
        detail: `Transacción ${refId} existe en KLAP ($${klapTxn.amount.toLocaleString()}) pero no en el reporte bancario`,
      })
    } else if (Math.abs(bankTxn.amount - klapTxn.amount) > 1) {
      differences.push({
        type: 'amount_mismatch',
        reference_id: refId,
        klap_amount: klapTxn.amount,
        bank_amount: bankTxn.amount,
        difference: Math.abs(bankTxn.amount - klapTxn.amount),
        detail: `Diferencia de monto en ${refId}: KLAP=$${klapTxn.amount.toLocaleString()} vs Banco=$${bankTxn.amount.toLocaleString()}`,
      })
    }

    if (!brandTxn) {
      differences.push({
        type: 'missing_in_brand',
        reference_id: refId,
        klap_amount: klapTxn.amount,
        difference: klapTxn.amount,
        detail: `Transacción ${refId} no aparece en reporte de ${cardBrand}`,
      })
    }
  }

  // Check: transactions in bank but not in KLAP
  for (const [refId, bankTxn] of bankMap) {
    if (!klapMap.has(refId)) {
      differences.push({
        type: 'extra_in_bank',
        reference_id: refId,
        bank_amount: bankTxn.amount,
        difference: bankTxn.amount,
        detail: `Transacción ${refId} en banco ($${bankTxn.amount.toLocaleString()}) no registrada en KLAP`,
      })
    }
  }

  const totalKlap = klapTransactions.length
  const matched = totalKlap - differences.filter(d => d.type !== 'extra_in_bank').length
  const matchRate = totalKlap > 0 ? (matched / totalKlap) * 100 : 100

  const status: 'reconciled' | 'mismatch' | 'partial' =
    differences.length === 0 ? 'reconciled' :
    matchRate > 95 ? 'partial' : 'mismatch'

  summary.push(`Diferencias encontradas: ${differences.length}`)
  summary.push(`Match rate: ${matchRate.toFixed(1)}%`)
  summary.push(`Estado: ${status.toUpperCase()}`)

  return {
    date,
    card_brand: cardBrand,
    status,
    sources: {
      klap: { count: klapTransactions.length, amount: klapTransactions.reduce((s, t) => s + t.amount, 0) },
      bank: { count: bankTransactions.length, amount: bankTransactions.reduce((s, t) => s + t.amount, 0) },
      brand: { count: brandTransactions.length, amount: brandTransactions.reduce((s, t) => s + t.amount, 0) },
    },
    differences,
    match_rate: matchRate,
    processing_time_ms: Math.round((performance.now() - startTime) * 100) / 100,
    summary,
  }
}
