// ============================================================
// KLAP CORE — Clearing Engine
// Generador de archivos de clearing para Visa (CTF) y Mastercard (IPM)
// ============================================================

export interface ClearingTransaction {
  id: string
  reference_id: string
  amount: number
  currency: string
  card_brand: string
  card_last_four: string
  auth_code: string
  merchant_id: string
  merchant_name: string
  created_at: string
}

export interface ClearingBatchResult {
  batch_id: string
  card_brand: string
  transaction_count: number
  total_amount: number
  file_content: string
  file_name: string
  generated_at: string
  checksum: string
  records: ClearingRecord[]
}

export interface ClearingRecord {
  record_type: string
  sequence: number
  data: string
}

/**
 * Genera un batch de clearing para Visa (formato CTF simplificado)
 * En producción, esto genera el archivo real según la especificación de VisaNet.
 */
export function generateVisaClearing(transactions: ClearingTransaction[]): ClearingBatchResult {
  const batchId = `VISA-${formatDate(new Date())}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`
  const records: ClearingRecord[] = []
  let sequence = 0

  // Header Record (TCR0)
  records.push({
    record_type: 'TCR0',
    sequence: sequence++,
    data: formatCTFHeader(batchId, transactions.length),
  })

  // Transaction Records (TCR1-TCR4)
  for (const txn of transactions) {
    records.push({
      record_type: 'TCR1',
      sequence: sequence++,
      data: formatCTFTransaction(txn, sequence),
    })
  }

  // Trailer Record (TCR9)
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
  records.push({
    record_type: 'TCR9',
    sequence: sequence++,
    data: formatCTFTrailer(transactions.length, totalAmount),
  })

  const fileContent = records.map(r => r.data).join('\n')
  const checksum = simpleChecksum(fileContent)

  return {
    batch_id: batchId,
    card_brand: 'visa',
    transaction_count: transactions.length,
    total_amount: totalAmount,
    file_content: fileContent,
    file_name: `CTF_${batchId.replace(/-/g, '_')}.dat`,
    generated_at: new Date().toISOString(),
    checksum,
    records,
  }
}

/**
 * Genera un batch de clearing para Mastercard (formato IPM simplificado)
 */
export function generateMastercardClearing(transactions: ClearingTransaction[]): ClearingBatchResult {
  const batchId = `MC-${formatDate(new Date())}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`
  const records: ClearingRecord[] = []
  let sequence = 0

  // File Header
  records.push({
    record_type: 'IPM-HDR',
    sequence: sequence++,
    data: formatIPMHeader(batchId),
  })

  // First Presentment records
  for (const txn of transactions) {
    records.push({
      record_type: 'IPM-1240',
      sequence: sequence++,
      data: formatIPMTransaction(txn, sequence),
    })
  }

  // File Trailer
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
  records.push({
    record_type: 'IPM-TRL',
    sequence: sequence++,
    data: formatIPMTrailer(transactions.length, totalAmount),
  })

  const fileContent = records.map(r => r.data).join('\n')
  const checksum = simpleChecksum(fileContent)

  return {
    batch_id: batchId,
    card_brand: 'mastercard',
    transaction_count: transactions.length,
    total_amount: totalAmount,
    file_content: fileContent,
    file_name: `IPM_${batchId.replace(/-/g, '_')}.dat`,
    generated_at: new Date().toISOString(),
    checksum,
    records,
  }
}

// ============================================================
// CTF Format Helpers (Visa)
// ============================================================

function formatCTFHeader(batchId: string, count: number): string {
  const lines = [
    `TCR0|${batchId}|${formatDate(new Date())}|KLAP_ACQUIRING`,
    `PROC_ID|KLAP-CL-001|ACQUIRER`,
    `VERSION|CTF.V2.3|STANDARD`,
    `TXN_COUNT|${String(count).padStart(8, '0')}`,
    `CURRENCY|152|CLP`,
  ]
  return lines.join('|')
}

function formatCTFTransaction(txn: ClearingTransaction, seq: number): string {
  const fields = [
    `TCR1`,
    String(seq).padStart(8, '0'),
    txn.reference_id,
    `XXXXXXXXXXXX${txn.card_last_four}`,
    String(Math.round(txn.amount * 100)).padStart(12, '0'),
    '152', // CLP currency code
    txn.auth_code,
    formatDate(new Date(txn.created_at)),
    txn.merchant_id.substring(0, 15),
    '0000', // Reason code
    'PRESENTMENT',
  ]
  return fields.join('|')
}

function formatCTFTrailer(count: number, totalAmount: number): string {
  return [
    'TCR9',
    String(count).padStart(8, '0'),
    String(Math.round(totalAmount * 100)).padStart(15, '0'),
    'HASH:' + simpleChecksum(String(totalAmount)),
    formatDate(new Date()),
    'END_OF_FILE',
  ].join('|')
}

// ============================================================
// IPM Format Helpers (Mastercard)
// ============================================================

function formatIPMHeader(batchId: string): string {
  return [
    'IPM-HDR',
    batchId,
    formatDate(new Date()),
    'KLAP_ACQUIRING_CL',
    'MC_CONNECT',
    'IPM.V3.1',
    'FIRST_PRESENTMENT',
  ].join('|')
}

function formatIPMTransaction(txn: ClearingTransaction, seq: number): string {
  return [
    'IPM-1240',
    String(seq).padStart(8, '0'),
    'DE002:' + `XXXXXXXXXXXX${txn.card_last_four}`,
    'DE004:' + String(Math.round(txn.amount * 100)).padStart(12, '0'),
    'DE049:152',
    'DE025:00',
    'DE038:' + txn.auth_code,
    'DE037:' + txn.reference_id,
    'DE042:' + txn.merchant_id.substring(0, 15),
    'DE012:' + formatDate(new Date(txn.created_at)),
    'MTI:1240',
    'FC:200',
  ].join('|')
}

function formatIPMTrailer(count: number, totalAmount: number): string {
  return [
    'IPM-TRL',
    'TOTAL_RECORDS:' + String(count).padStart(8, '0'),
    'TOTAL_AMOUNT:' + String(Math.round(totalAmount * 100)).padStart(15, '0'),
    'CHECKSUM:' + simpleChecksum(String(count) + String(totalAmount)),
    'GENERATED:' + new Date().toISOString(),
    'STATUS:COMPLETE',
  ].join('|')
}

// ============================================================
// Utilities
// ============================================================

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '')
}

function simpleChecksum(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')
}
