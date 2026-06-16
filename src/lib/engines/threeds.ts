// ============================================================
// KLAP CORE — 3D Secure Simulator Engine
// Simulador de autenticación 3DS para transacciones con tarjeta
// ============================================================

export interface ThreeDSRequest {
  transaction_id: string
  amount: number
  card_brand: string
  card_last_four: string
  merchant_name: string
  merchant_url?: string
}

export interface ThreeDSResponse {
  enrolled: boolean
  version: '1.0' | '2.1' | '2.2'
  status: 'authenticated' | 'attempted' | 'failed' | 'unavailable' | 'challenge_required'
  eci: string
  cavv: string
  xid: string
  ds_transaction_id: string
  authentication_type: 'frictionless' | 'challenge'
  challenge_url?: string
  processing_time_ms: number
  liability_shift: boolean
  risk_analysis: { score: number; recommendation: string }
}

// ============================================================
// Helpers
// ============================================================

function generateBase64(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function getECI(brand: string, status: string): string {
  if (status === 'authenticated') {
    if (brand.toLowerCase() === 'visa') return '05'
    if (brand.toLowerCase() === 'mastercard') return '02'
    return '05'
  }
  if (status === 'attempted') return '06'
  return '07' // not enrolled or failed
}

function detectVersion(brand: string): '1.0' | '2.1' | '2.2' {
  const b = brand.toLowerCase()
  if (b === 'visa' || b === 'mastercard') return '2.2'
  if (b === 'amex') return '2.1'
  return '1.0'
}

// ============================================================
// Core Function
// ============================================================

/**
 * Simulates the 3D Secure authentication flow.
 * - Amounts < 50,000 → frictionless authentication
 * - Amounts >= 50,000 → challenge_required
 * - ~10% random failure rate
 * - ~5% not enrolled
 */
export function authenticateTransaction(request: ThreeDSRequest): ThreeDSResponse {
  const startTime = Date.now()
  const random = Math.random()

  // 5% chance: card not enrolled
  if (random < 0.05) {
    const processingTime = Math.floor(Math.random() * 100) + 50
    return {
      enrolled: false,
      version: detectVersion(request.card_brand),
      status: 'unavailable',
      eci: '07',
      cavv: '',
      xid: generateBase64(20),
      ds_transaction_id: generateUUID(),
      authentication_type: 'frictionless',
      processing_time_ms: processingTime,
      liability_shift: false,
      risk_analysis: { score: 0, recommendation: 'proceed_without_3ds' },
    }
  }

  // 10% chance: authentication failed
  if (random < 0.15) {
    const processingTime = Math.floor(Math.random() * 200) + 100
    return {
      enrolled: true,
      version: detectVersion(request.card_brand),
      status: 'failed',
      eci: '07',
      cavv: '',
      xid: generateBase64(20),
      ds_transaction_id: generateUUID(),
      authentication_type: 'challenge',
      processing_time_ms: processingTime,
      liability_shift: false,
      risk_analysis: { score: 85, recommendation: 'decline_transaction' },
    }
  }

  // High amount → challenge required
  if (request.amount >= 50000) {
    const processingTime = Math.floor(Math.random() * 500) + 300
    const challengeSuccess = Math.random() > 0.2 // 80% pass challenge

    if (!challengeSuccess) {
      return {
        enrolled: true,
        version: detectVersion(request.card_brand),
        status: 'challenge_required',
        eci: getECI(request.card_brand, 'attempted'),
        cavv: generateBase64(20),
        xid: generateBase64(20),
        ds_transaction_id: generateUUID(),
        authentication_type: 'challenge',
        challenge_url: `https://acs.bank.com/3ds/challenge/${generateUUID()}`,
        processing_time_ms: processingTime,
        liability_shift: false,
        risk_analysis: { score: 65, recommendation: 'challenge_cardholder' },
      }
    }

    return {
      enrolled: true,
      version: detectVersion(request.card_brand),
      status: 'authenticated',
      eci: getECI(request.card_brand, 'authenticated'),
      cavv: generateBase64(20),
      xid: generateBase64(20),
      ds_transaction_id: generateUUID(),
      authentication_type: 'challenge',
      challenge_url: `https://acs.bank.com/3ds/challenge/${generateUUID()}`,
      processing_time_ms: processingTime,
      liability_shift: true,
      risk_analysis: { score: 25, recommendation: 'approve' },
    }
  }

  // Low amount → frictionless
  const processingTime = Math.floor(Math.random() * 150) + 50
  const riskScore = Math.floor(Math.random() * 30) + 5

  // Small chance of "attempted" (card enrolled but issuer not participating)
  if (random < 0.25) {
    return {
      enrolled: true,
      version: detectVersion(request.card_brand),
      status: 'attempted',
      eci: '06',
      cavv: generateBase64(20),
      xid: generateBase64(20),
      ds_transaction_id: generateUUID(),
      authentication_type: 'frictionless',
      processing_time_ms: processingTime,
      liability_shift: true,
      risk_analysis: { score: riskScore, recommendation: 'approve' },
    }
  }

  // Default: frictionless authenticated
  return {
    enrolled: true,
    version: detectVersion(request.card_brand),
    status: 'authenticated',
    eci: getECI(request.card_brand, 'authenticated'),
    cavv: generateBase64(20),
    xid: generateBase64(20),
    ds_transaction_id: generateUUID(),
    authentication_type: 'frictionless',
    processing_time_ms: processingTime,
    liability_shift: true,
    risk_analysis: { score: riskScore, recommendation: 'approve' },
  }
}
