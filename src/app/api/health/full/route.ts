import { NextResponse } from 'next/server'
import { getMetrics, getHealthStatus } from '@/lib/engines/metrics'

export const dynamic = 'force-dynamic'

interface ServiceCheck {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency_ms: number
  last_check: string
  endpoint: string
}

const SERVICES = [
  { name: 'Authorization Engine', endpoint: '/api/authorize' },
  { name: 'Fraud Engine', endpoint: '/api/fraud/check' },
  { name: 'Clearing Engine', endpoint: '/api/clearing/generate' },
  { name: 'Settlement Engine', endpoint: '/api/settlement/calculate' },
  { name: 'Webhook Engine', endpoint: '/api/webhooks/send' },
  { name: 'Tokenization Vault', endpoint: '/api/tokenize' },
  { name: 'ISO 8583 Switch', endpoint: '/api/iso8583/parse' },
]

export async function POST(request: Request) {
  try {
    const baseUrl = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/$/, '') || 'http://localhost:3000'

    const checks: ServiceCheck[] = await Promise.all(
      SERVICES.map(async (service) => {
        const start = Date.now()
        let status: 'healthy' | 'degraded' | 'down' = 'healthy'

        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 5000)

          const res = await fetch(`${baseUrl}${service.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
            signal: controller.signal,
          })

          clearTimeout(timeout)
          const latency = Date.now() - start

          if (!res.ok && res.status >= 500) {
            status = 'down'
          } else if (latency > 1000) {
            status = 'degraded'
          }

          return {
            name: service.name,
            status,
            latency_ms: latency,
            last_check: new Date().toISOString(),
            endpoint: service.endpoint,
          }
        } catch {
          return {
            name: service.name,
            status: 'down' as const,
            latency_ms: Date.now() - start,
            last_check: new Date().toISOString(),
            endpoint: service.endpoint,
          }
        }
      })
    )

    const metrics = getMetrics()
    const healthStatus = getHealthStatus()

    // Calculate overall system score
    const healthyCount = checks.filter(c => c.status === 'healthy').length
    const degradedCount = checks.filter(c => c.status === 'degraded').length
    const systemScore = Math.round(((healthyCount + degradedCount * 0.5) / checks.length) * 100)

    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy'
    if (checks.some(c => c.status === 'down')) overallStatus = 'critical'
    else if (checks.some(c => c.status === 'degraded')) overallStatus = 'degraded'

    return NextResponse.json({
      overall_status: overallStatus,
      system_score: systemScore,
      services: checks,
      metrics: {
        tps: metrics.tps,
        tps_peak: metrics.tps_peak,
        avg_response_time_ms: metrics.average_response_time_ms,
        error_rate: metrics.error_rate,
        uptime_seconds: metrics.uptime_seconds,
        total_transactions: metrics.total_transactions,
      },
      health: healthStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Health check failed' },
      { status: 500 }
    )
  }
}
