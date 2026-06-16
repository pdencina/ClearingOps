// ============================================================
// KLAP CORE — Fraud Detection Engine
// Motor antifraude con reglas, velocity checks, y ML scoring
// ============================================================

export interface FraudCheckRequest {
  transaction_id: string
  amount: number
  card_brand: string
  card_type: string
  card_last_four: string
  payment_method: string
  merchant_id: string
  merchant_category: string
  installments: number
  ip_address?: string
  device_fingerprint?: string
  geolocation?: { country: string; city: string }
}

export interface FraudCheckResult {
  transaction_id: string
  fraud_score: number
  max_score: number
  decision: 'approve' | 'review' | 'block'
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  checks_performed: FraudCheck[]
  ml_model_version: string
  processing_time_ms: number
  recommendations: string[]
  timestamp: string
}

export interface FraudCheck {
  name: string
  category: 'velocity' | 'pattern' | 'device' | 'geo' | 'amount' | 'ml'
  score: number
  max_score: number
  passed: boolean
  detail: string
}

/**
 * KLAP Fraud Detection Engine
 * Ejecuta múltiples checks antifraude y retorna un score consolidado.
 * En producción, el ML model correría en un servicio dedicado (SageMaker/Vertex).
 */
export function detectFraud(request: FraudCheckRequest): FraudCheckResult {
  const startTime = performance.now()
  const checks: FraudCheck[] = []
  let totalScore = 0
  const maxPossibleScore = 100

  // Check 1: Amount anomaly detection
  const amountCheck = checkAmountAnomaly(request.amount, request.card_type)
  checks.push(amountCheck)
  totalScore += amountCheck.score

  // Check 2: Velocity — transactions frequency
  const velocityCheck = checkVelocity(request.card_last_four)
  checks.push(velocityCheck)
  totalScore += velocityCheck.score

  // Check 3: High-risk merchant category
  const merchantCheck = checkMerchantRisk(request.merchant_category)
  checks.push(merchantCheck)
  totalScore += merchantCheck.score

  // Check 4: Payment method risk
  const methodCheck = checkPaymentMethodRisk(request.payment_method)
  checks.push(methodCheck)
  totalScore += methodCheck.score

  // Check 5: Geolocation consistency
  const geoCheck = checkGeolocation(request.geolocation)
  checks.push(geoCheck)
  totalScore += geoCheck.score

  // Check 6: Device fingerprint
  const deviceCheck = checkDevice(request.device_fingerprint)
  checks.push(deviceCheck)
  totalScore += deviceCheck.score

  // Check 7: Installment fraud patterns
  const installmentCheck = checkInstallmentPattern(request.installments, request.amount)
  checks.push(installmentCheck)
  totalScore += installmentCheck.score

  // Check 8: ML Model prediction (simulated)
  const mlCheck = runMLModel(request)
  checks.push(mlCheck)
  totalScore += mlCheck.score

  // Decision logic
  const fraudScore = Math.min(totalScore, maxPossibleScore)
  let decision: 'approve' | 'review' | 'block'
  let riskLevel: 'low' | 'medium' | 'high' | 'critical'
  const recommendations: string[] = []

  if (fraudScore < 20) {
    decision = 'approve'
    riskLevel = 'low'
  } else if (fraudScore < 40) {
    decision = 'approve'
    riskLevel = 'medium'
    recommendations.push('Monitorear siguiente transacción de esta tarjeta')
  } else if (fraudScore < 60) {
    decision = 'review'
    riskLevel = 'high'
    recommendations.push('Enviar a revisión manual')
    recommendations.push('Solicitar verificación adicional (3DS/OTP)')
  } else {
    decision = 'block'
    riskLevel = 'critical'
    recommendations.push('Bloquear transacción')
    recommendations.push('Notificar al emisor')
    recommendations.push('Activar monitoreo reforzado en merchant')
  }

  return {
    transaction_id: request.transaction_id,
    fraud_score: fraudScore,
    max_score: maxPossibleScore,
    decision,
    risk_level: riskLevel,
    checks_performed: checks,
    ml_model_version: 'FraudNet-KLAP-v2.4.1',
    processing_time_ms: Math.round((performance.now() - startTime) * 100) / 100,
    recommendations,
    timestamp: new Date().toISOString(),
  }
}

// ============================================================
// Individual Check Functions
// ============================================================

function checkAmountAnomaly(amount: number, cardType: string): FraudCheck {
  const thresholds: Record<string, number> = { credit: 2000000, debit: 500000, prepaid: 200000 }
  const threshold = thresholds[cardType] || 1000000
  const isHigh = amount > threshold
  const score = isHigh ? Math.min(Math.floor((amount / threshold - 1) * 15), 20) : 0

  return {
    name: 'Amount Anomaly Detection',
    category: 'amount',
    score,
    max_score: 20,
    passed: score < 10,
    detail: isHigh
      ? `Monto $${amount.toLocaleString()} supera umbral de ${cardType} ($${threshold.toLocaleString()}) — Score: ${score}`
      : `Monto $${amount.toLocaleString()} dentro de rango normal para ${cardType}`,
  }
}

function checkVelocity(cardLastFour: string): FraudCheck {
  // Simulación: en producción se consulta un cache Redis con historial
  const simulatedTxnCount = Math.floor(Math.random() * 5) + 1
  const isHighVelocity = simulatedTxnCount > 3
  const score = isHighVelocity ? 15 : Math.floor(simulatedTxnCount * 2)

  return {
    name: 'Velocity Check',
    category: 'velocity',
    score,
    max_score: 20,
    passed: !isHighVelocity,
    detail: `${simulatedTxnCount} transacciones en últimas 2 horas para tarjeta ****${cardLastFour} — ${isHighVelocity ? 'Alta frecuencia detectada' : 'Frecuencia normal'}`,
  }
}

function checkMerchantRisk(category: string): FraudCheck {
  const highRiskCategories = ['gambling', 'crypto', 'adult', 'travel_agency']
  const mediumRiskCategories = ['electronics', 'jewelry', 'airlines']
  const isHighRisk = highRiskCategories.includes(category)
  const isMedium = mediumRiskCategories.includes(category)
  const score = isHighRisk ? 15 : isMedium ? 7 : 0

  return {
    name: 'Merchant Category Risk',
    category: 'pattern',
    score,
    max_score: 15,
    passed: !isHighRisk,
    detail: isHighRisk
      ? `Categoría "${category}" es de ALTO riesgo`
      : isMedium
      ? `Categoría "${category}" es de riesgo medio`
      : `Categoría "${category}" es de bajo riesgo`,
  }
}

function checkPaymentMethodRisk(method: string): FraudCheck {
  const riskScores: Record<string, number> = { card: 2, contactless: 3, qr: 5, ecommerce: 12 }
  const score = riskScores[method] || 3

  return {
    name: 'Payment Method Risk',
    category: 'pattern',
    score,
    max_score: 15,
    passed: score < 10,
    detail: method === 'ecommerce'
      ? 'CNP (Card Not Present) — Mayor exposición a fraude'
      : `Método "${method}" — Riesgo ${score < 5 ? 'bajo' : 'moderado'}`,
  }
}

function checkGeolocation(geo?: { country: string; city: string }): FraudCheck {
  if (!geo) {
    return {
      name: 'Geolocation Check',
      category: 'geo',
      score: 5,
      max_score: 15,
      passed: true,
      detail: 'Sin datos de geolocalización — Score moderado por defecto',
    }
  }
  const isLocal = geo.country === 'CL'
  const score = isLocal ? 0 : 12

  return {
    name: 'Geolocation Check',
    category: 'geo',
    score,
    max_score: 15,
    passed: isLocal,
    detail: isLocal
      ? `Transacción desde ${geo.city}, ${geo.country} — Consistente con perfil`
      : `Transacción desde ${geo.country} — País diferente al perfil habitual`,
  }
}

function checkDevice(fingerprint?: string): FraudCheck {
  const isKnown = fingerprint ? fingerprint.length > 5 : false
  const score = isKnown ? 0 : 8

  return {
    name: 'Device Fingerprint',
    category: 'device',
    score,
    max_score: 10,
    passed: isKnown || !fingerprint,
    detail: fingerprint
      ? `Device ${fingerprint.substring(0, 8)}... — ${isKnown ? 'Dispositivo reconocido' : 'Dispositivo nuevo'}`
      : 'Sin fingerprint (transacción presencial) — N/A',
  }
}

function checkInstallmentPattern(installments: number, amount: number): FraudCheck {
  const isSuspicious = installments > 12 && amount < 50000
  const score = isSuspicious ? 12 : installments > 6 ? 3 : 0

  return {
    name: 'Installment Pattern',
    category: 'pattern',
    score,
    max_score: 12,
    passed: !isSuspicious,
    detail: isSuspicious
      ? `${installments} cuotas para monto bajo ($${amount.toLocaleString()}) — Patrón sospechoso`
      : installments > 1
      ? `${installments} cuotas — Patrón normal para el monto`
      : 'Sin cuotas',
  }
}

function runMLModel(request: FraudCheckRequest): FraudCheck {
  // Simulación de ML model — en producción es un endpoint de inferencia
  const features = [
    request.amount / 1000000,
    request.payment_method === 'ecommerce' ? 1 : 0,
    request.installments > 6 ? 1 : 0,
    request.card_type === 'prepaid' ? 1 : 0,
  ]
  const prediction = features.reduce((sum, f) => sum + f * (Math.random() * 5), 0)
  const score = Math.min(Math.floor(prediction), 15)

  return {
    name: 'ML Model Prediction',
    category: 'ml',
    score,
    max_score: 15,
    passed: score < 8,
    detail: `FraudNet-KLAP-v2.4.1 prediction: ${(score / 15 * 100).toFixed(1)}% probability — Features: amount_norm=${features[0].toFixed(3)}, cnp=${features[1]}, high_inst=${features[2]}`,
  }
}
