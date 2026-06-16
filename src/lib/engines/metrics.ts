// ============================================================
// KLAP CORE — Real-time Metrics Engine
// Motor de métricas en tiempo real para monitoreo del switch
// ============================================================

export interface TransactionResult {
  success: boolean
  response_time_ms: number
  timestamp?: number
  transaction_type?: string
  response_code?: string
}

export interface MetricsSnapshot {
  tps: number
  tps_peak: number
  approval_rate: number
  average_response_time_ms: number
  p95_response_time_ms: number
  p99_response_time_ms: number
  error_rate: number
  total_transactions: number
  total_approved: number
  total_declined: number
  total_errors: number
  uptime_seconds: number
  window_seconds: number
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'critical'
  checks: HealthCheck[]
  overall_score: number
  timestamp: string
}

export interface HealthCheck {
  name: string
  status: 'pass' | 'warn' | 'fail'
  value: string
  threshold: string
  detail: string
}

// ============================================================
// SLA thresholds
// ============================================================

const SLA = {
  max_response_time_ms: 500,       // > 500ms = degraded
  critical_response_time_ms: 2000, // > 2000ms = critical
  min_approval_rate: 0.85,         // < 85% = degraded
  critical_approval_rate: 0.70,    // < 70% = critical
  max_error_rate: 0.05,            // > 5% = degraded
  critical_error_rate: 0.15,       // > 15% = critical
  min_tps: 10,                     // < 10 TPS = degraded (low throughput)
  max_tps: 5000,                   // > 5000 TPS = capacity warning
}

// ============================================================
// In-memory metrics storage (rolling window)
// ============================================================

interface MetricEntry {
  timestamp: number
  success: boolean
  response_time_ms: number
  transaction_type: string
  response_code: string
}

const WINDOW_MS = 60_000 // 60-second rolling window
const ENTRIES: MetricEntry[] = []
let startTime = Date.now()
let peakTPS = 0

// ============================================================
// Core functions
// ============================================================

/**
 * Records a transaction result into the metrics engine.
 */
export function recordTransaction(result: TransactionResult): void {
  const entry: MetricEntry = {
    timestamp: result.timestamp || Date.now(),
    success: result.success,
    response_time_ms: result.response_time_ms,
    transaction_type: result.transaction_type || 'authorization',
    response_code: result.response_code || (result.success ? '00' : '05'),
  }

  ENTRIES.push(entry)

  // Cleanup old entries beyond 5 minutes
  const cutoff = Date.now() - 5 * 60_000
  while (ENTRIES.length > 0 && ENTRIES[0].timestamp < cutoff) {
    ENTRIES.shift()
  }

  // Update peak TPS
  const currentTPS = calculateTPS()
  if (currentTPS > peakTPS) {
    peakTPS = currentTPS
  }
}

/**
 * Returns a snapshot of current metrics.
 */
export function getMetrics(): MetricsSnapshot {
  const now = Date.now()
  const windowStart = now - WINDOW_MS

  // Filter to rolling window
  const windowEntries = ENTRIES.filter(e => e.timestamp >= windowStart)
  const total = windowEntries.length

  if (total === 0) {
    return {
      tps: 0,
      tps_peak: peakTPS,
      approval_rate: 1.0,
      average_response_time_ms: 0,
      p95_response_time_ms: 0,
      p99_response_time_ms: 0,
      error_rate: 0,
      total_transactions: ENTRIES.length,
      total_approved: ENTRIES.filter(e => e.success).length,
      total_declined: ENTRIES.filter(e => !e.success).length,
      total_errors: ENTRIES.filter(e => e.response_code === '96').length,
      uptime_seconds: Math.floor((now - startTime) / 1000),
      window_seconds: WINDOW_MS / 1000,
    }
  }

  const approved = windowEntries.filter(e => e.success).length
  const errors = windowEntries.filter(e => e.response_code === '96').length
  const responseTimes = windowEntries.map(e => e.response_time_ms).sort((a, b) => a - b)

  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / total
  const p95Index = Math.floor(total * 0.95)
  const p99Index = Math.floor(total * 0.99)

  return {
    tps: calculateTPS(),
    tps_peak: peakTPS,
    approval_rate: total > 0 ? approved / total : 1.0,
    average_response_time_ms: Math.round(avgResponseTime * 100) / 100,
    p95_response_time_ms: responseTimes[p95Index] || 0,
    p99_response_time_ms: responseTimes[p99Index] || 0,
    error_rate: total > 0 ? errors / total : 0,
    total_transactions: ENTRIES.length,
    total_approved: ENTRIES.filter(e => e.success).length,
    total_declined: ENTRIES.filter(e => !e.success).length,
    total_errors: ENTRIES.filter(e => e.response_code === '96').length,
    uptime_seconds: Math.floor((now - startTime) / 1000),
    window_seconds: WINDOW_MS / 1000,
  }
}

/**
 * Returns system health status based on current metrics vs SLA.
 */
export function getHealthStatus(): HealthStatus {
  const metrics = getMetrics()
  const checks: HealthCheck[] = []

  // Check 1: Response Time
  if (metrics.average_response_time_ms > SLA.critical_response_time_ms) {
    checks.push({
      name: 'Response Time',
      status: 'fail',
      value: `${metrics.average_response_time_ms.toFixed(0)}ms`,
      threshold: `< ${SLA.max_response_time_ms}ms`,
      detail: `Tiempo de respuesta CRÍTICO (>${SLA.critical_response_time_ms}ms)`,
    })
  } else if (metrics.average_response_time_ms > SLA.max_response_time_ms) {
    checks.push({
      name: 'Response Time',
      status: 'warn',
      value: `${metrics.average_response_time_ms.toFixed(0)}ms`,
      threshold: `< ${SLA.max_response_time_ms}ms`,
      detail: `Tiempo de respuesta degradado (>${SLA.max_response_time_ms}ms)`,
    })
  } else {
    checks.push({
      name: 'Response Time',
      status: 'pass',
      value: `${metrics.average_response_time_ms.toFixed(0)}ms`,
      threshold: `< ${SLA.max_response_time_ms}ms`,
      detail: 'Dentro de SLA',
    })
  }

  // Check 2: Approval Rate
  if (metrics.approval_rate < SLA.critical_approval_rate) {
    checks.push({
      name: 'Approval Rate',
      status: 'fail',
      value: `${(metrics.approval_rate * 100).toFixed(1)}%`,
      threshold: `> ${SLA.min_approval_rate * 100}%`,
      detail: `Tasa de aprobación CRÍTICA (<${SLA.critical_approval_rate * 100}%)`,
    })
  } else if (metrics.approval_rate < SLA.min_approval_rate) {
    checks.push({
      name: 'Approval Rate',
      status: 'warn',
      value: `${(metrics.approval_rate * 100).toFixed(1)}%`,
      threshold: `> ${SLA.min_approval_rate * 100}%`,
      detail: `Tasa de aprobación por debajo del SLA`,
    })
  } else {
    checks.push({
      name: 'Approval Rate',
      status: 'pass',
      value: `${(metrics.approval_rate * 100).toFixed(1)}%`,
      threshold: `> ${SLA.min_approval_rate * 100}%`,
      detail: 'Dentro de SLA',
    })
  }

  // Check 3: Error Rate
  if (metrics.error_rate > SLA.critical_error_rate) {
    checks.push({
      name: 'Error Rate',
      status: 'fail',
      value: `${(metrics.error_rate * 100).toFixed(1)}%`,
      threshold: `< ${SLA.max_error_rate * 100}%`,
      detail: `Tasa de error CRÍTICA (>${SLA.critical_error_rate * 100}%)`,
    })
  } else if (metrics.error_rate > SLA.max_error_rate) {
    checks.push({
      name: 'Error Rate',
      status: 'warn',
      value: `${(metrics.error_rate * 100).toFixed(1)}%`,
      threshold: `< ${SLA.max_error_rate * 100}%`,
      detail: `Tasa de error elevada`,
    })
  } else {
    checks.push({
      name: 'Error Rate',
      status: 'pass',
      value: `${(metrics.error_rate * 100).toFixed(1)}%`,
      threshold: `< ${SLA.max_error_rate * 100}%`,
      detail: 'Dentro de SLA',
    })
  }

  // Check 4: TPS
  if (metrics.tps > SLA.max_tps) {
    checks.push({
      name: 'Throughput (TPS)',
      status: 'warn',
      value: `${metrics.tps}`,
      threshold: `< ${SLA.max_tps}`,
      detail: 'Capacidad cercana al límite',
    })
  } else {
    checks.push({
      name: 'Throughput (TPS)',
      status: 'pass',
      value: `${metrics.tps}`,
      threshold: `< ${SLA.max_tps}`,
      detail: 'Capacidad normal',
    })
  }

  // Determine overall status
  const hasFailure = checks.some(c => c.status === 'fail')
  const hasWarning = checks.some(c => c.status === 'warn')

  let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
  if (hasFailure) status = 'critical'
  else if (hasWarning) status = 'degraded'

  // Score: 100 = healthy, 50 = degraded, 0 = critical
  const passCount = checks.filter(c => c.status === 'pass').length
  const overallScore = Math.round((passCount / checks.length) * 100)

  return {
    status,
    checks,
    overall_score: overallScore,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Resets the metrics engine (useful for testing).
 */
export function resetMetrics(): void {
  ENTRIES.length = 0
  peakTPS = 0
  startTime = Date.now()
}

// ============================================================
// Internal helpers
// ============================================================

function calculateTPS(): number {
  const now = Date.now()
  const oneSecondAgo = now - 1000
  return ENTRIES.filter(e => e.timestamp >= oneSecondAgo).length
}
