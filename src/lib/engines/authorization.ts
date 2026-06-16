// ============================================================
// KLAP CORE — Authorization Engine
// Motor de autorización propio que reemplaza SmartVista
// ============================================================

export interface AuthorizationRequest {
  merchant_id: string
  terminal_id?: string
  amount: number
  currency: string
  card_brand: 'visa' | 'mastercard' | 'amex' | 'redcompra'
  card_type: 'credit' | 'debit' | 'prepaid'
  card_last_four: string
  card_bin?: string
  payment_method: 'card' | 'contactless' | 'ecommerce' | 'qr'
  installments?: number
}

export interface AuthorizationResponse {
  approved: boolean
  auth_code: string | null
  reference_id: string
  decision_reason: string
  risk_score: number
  processing_time_ms: number
  rules_evaluated: RuleResult[]
  timestamp: string
}

export interface RuleResult {
  rule: string
  passed: boolean
  detail: string
}

// BIN Table — determina el emisor y permite routing
const BIN_TABLE: Record<string, { issuer: string; country: string; type: string }> = {
  '4': { issuer: 'Visa International', country: 'CL', type: 'credit' },
  '5': { issuer: 'Mastercard International', country: 'CL', type: 'credit' },
  '3': { issuer: 'American Express', country: 'CL', type: 'credit' },
  '6': { issuer: 'Redcompra / Débito Local', country: 'CL', type: 'debit' },
}

// Velocity limits
const VELOCITY_LIMITS = {
  max_amount_single: 5000000,     // $5M CLP max por transacción
  max_daily_amount: 20000000,      // $20M CLP max diario por tarjeta
  max_daily_count: 50,             // 50 transacciones max por día
  min_amount: 100,                 // Mínimo $100 CLP
}

// Merchant category restrictions
const BLOCKED_COMBINATIONS: Array<{ mcc: string; card_type: string }> = [
  { mcc: '7995', card_type: 'debit' },  // Gambling no acepta débito
]

function generateAuthCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function generateReferenceId(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `KLP-${ts}-${rand}`
}

/**
 * KLAP Authorization Engine
 * Evalúa una solicitud de autorización contra reglas de negocio,
 * límites de velocidad, y validaciones de seguridad.
 * 
 * En producción esto reemplaza la lógica que SmartVista ejecuta:
 * - Validación de BIN
 * - Routing al emisor
 * - Aplicación de reglas
 * - Decisión de autorización
 */
export function authorize(request: AuthorizationRequest): AuthorizationResponse {
  const startTime = performance.now()
  const rules: RuleResult[] = []
  let riskScore = 0

  // Rule 1: Amount validation
  if (request.amount < VELOCITY_LIMITS.min_amount) {
    rules.push({ rule: 'MIN_AMOUNT', passed: false, detail: `Monto $${request.amount} menor al mínimo ($${VELOCITY_LIMITS.min_amount})` })
    return buildResponse(false, 'AMOUNT_BELOW_MINIMUM', riskScore, rules, startTime)
  }
  rules.push({ rule: 'MIN_AMOUNT', passed: true, detail: `Monto $${request.amount.toLocaleString()} ≥ $${VELOCITY_LIMITS.min_amount}` })

  if (request.amount > VELOCITY_LIMITS.max_amount_single) {
    rules.push({ rule: 'MAX_AMOUNT', passed: false, detail: `Monto $${request.amount.toLocaleString()} excede máximo ($${VELOCITY_LIMITS.max_amount_single.toLocaleString()})` })
    riskScore += 40
    return buildResponse(false, 'AMOUNT_EXCEEDED', riskScore, rules, startTime)
  }
  rules.push({ rule: 'MAX_AMOUNT', passed: true, detail: `Monto dentro de límite ($${VELOCITY_LIMITS.max_amount_single.toLocaleString()})` })

  // Rule 2: BIN validation
  const binPrefix = request.card_last_four?.[0] || request.card_brand[0]
  const binInfo = BIN_TABLE[binPrefix]
  if (binInfo) {
    rules.push({ rule: 'BIN_LOOKUP', passed: true, detail: `Emisor: ${binInfo.issuer} | País: ${binInfo.country}` })
  } else {
    rules.push({ rule: 'BIN_LOOKUP', passed: false, detail: 'BIN no encontrado en tabla de emisores' })
    riskScore += 20
  }

  // Rule 3: Card brand + type validation
  const isValidCombination = !BLOCKED_COMBINATIONS.some(
    combo => combo.card_type === request.card_type
  )
  rules.push({
    rule: 'BRAND_TYPE_CHECK',
    passed: isValidCombination,
    detail: isValidCombination
      ? `${request.card_brand} ${request.card_type} — Combinación permitida`
      : `${request.card_brand} ${request.card_type} — Combinación bloqueada`,
  })
  if (!isValidCombination) riskScore += 30

  // Rule 4: Payment method risk assessment
  const methodRisk: Record<string, number> = { card: 5, contactless: 3, qr: 8, ecommerce: 15 }
  const pmRisk = methodRisk[request.payment_method] || 5
  riskScore += pmRisk
  rules.push({
    rule: 'PAYMENT_METHOD_RISK',
    passed: true,
    detail: `Método: ${request.payment_method} → Risk +${pmRisk} (score: ${riskScore})`,
  })

  // Rule 5: Installments validation
  if (request.installments && request.installments > 1) {
    if (request.card_type === 'debit') {
      rules.push({ rule: 'INSTALLMENTS', passed: false, detail: 'Cuotas no permitidas en tarjeta de débito' })
      return buildResponse(false, 'INSTALLMENTS_NOT_ALLOWED_DEBIT', riskScore, rules, startTime)
    }
    if (request.installments > 48) {
      rules.push({ rule: 'INSTALLMENTS', passed: false, detail: `${request.installments} cuotas excede máximo (48)` })
      return buildResponse(false, 'INSTALLMENTS_EXCEEDED', riskScore, rules, startTime)
    }
    rules.push({ rule: 'INSTALLMENTS', passed: true, detail: `${request.installments} cuotas — Dentro de rango permitido` })
    riskScore += Math.min(request.installments, 12)
  } else {
    rules.push({ rule: 'INSTALLMENTS', passed: true, detail: 'Pago sin cuotas' })
  }

  // Rule 6: High-value transaction check
  if (request.amount > 1000000) {
    riskScore += 10
    rules.push({ rule: 'HIGH_VALUE', passed: true, detail: `Transacción de alto valor ($${request.amount.toLocaleString()}) — Risk +10` })
  }

  // Rule 7: E-commerce additional checks
  if (request.payment_method === 'ecommerce') {
    riskScore += 5
    rules.push({ rule: 'ECOMMERCE_CHECK', passed: true, detail: 'Transacción CNP (Card Not Present) — verificación adicional requerida' })
  }

  // Final decision based on risk score
  const approved = riskScore < 50
  const reason = approved ? 'APPROVED' : 'RISK_SCORE_EXCEEDED'

  rules.push({
    rule: 'FINAL_DECISION',
    passed: approved,
    detail: `Risk Score Final: ${riskScore}/100 — Umbral: 50 → ${approved ? 'APROBADA' : 'RECHAZADA'}`,
  })

  return buildResponse(approved, reason, riskScore, rules, startTime)
}

function buildResponse(
  approved: boolean,
  reason: string,
  riskScore: number,
  rules: RuleResult[],
  startTime: number
): AuthorizationResponse {
  return {
    approved,
    auth_code: approved ? generateAuthCode() : null,
    reference_id: generateReferenceId(),
    decision_reason: reason,
    risk_score: riskScore,
    processing_time_ms: Math.round((performance.now() - startTime) * 100) / 100,
    rules_evaluated: rules,
    timestamp: new Date().toISOString(),
  }
}
