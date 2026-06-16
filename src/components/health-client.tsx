'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  HeartPulse,
  Activity,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Gauge,
} from 'lucide-react'

interface ServiceCheck {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency_ms: number
  last_check: string
  endpoint: string
}

interface HealthData {
  overall_status: 'healthy' | 'degraded' | 'critical'
  system_score: number
  services: ServiceCheck[]
  metrics: {
    tps: number
    tps_peak: number
    avg_response_time_ms: number
    error_rate: number
    uptime_seconds: number
    total_transactions: number
  }
  timestamp: string
}

const statusConfig = {
  healthy: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Operativo' },
  degraded: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Degradado' },
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Crítico' },
}

const serviceStatusConfig = {
  healthy: { color: 'text-emerald-400', bg: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  degraded: { color: 'text-yellow-400', bg: 'bg-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  down: { color: 'text-red-400', bg: 'bg-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export function HealthClient() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)

  const runHealthCheck = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/health/full', { method: 'POST' })
      const result = await res.json()
      setData(result)
      setLastRefresh(new Date().toLocaleTimeString('es-CL'))
    } catch {
      // Failed to fetch
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runHealthCheck()
  }, [])

  const formatUptime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Health & SLA" description="Estado del sistema y cumplimiento de SLA en tiempo real">
        <button
          onClick={runHealthCheck}
          disabled={loading}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20',
            loading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Run Health Check
        </button>
      </PageHeader>

      {/* Overall Status Banner */}
      <Card className={cn('relative overflow-hidden', data ? statusConfig[data.overall_status].border : '')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center',
              data ? statusConfig[data.overall_status].bg : 'bg-gray-500/10'
            )}>
              <HeartPulse className={cn('w-8 h-8', data ? statusConfig[data.overall_status].color : 'text-gray-400')} />
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Estado del Sistema</p>
              <p className={cn('text-2xl font-bold', data ? statusConfig[data.overall_status].color : 'text-gray-400')}>
                {data ? statusConfig[data.overall_status].label : 'Verificando...'}
              </p>
              {lastRefresh && (
                <p className="text-xs text-muted mt-1">Última verificación: {lastRefresh}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">System Score</p>
            <p className={cn('text-4xl font-bold', data ? statusConfig[data.overall_status].color : 'text-gray-400')}>
              {data?.system_score ?? '--'}%
            </p>
          </div>
        </div>
      </Card>

      {/* SLA Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Uptime</p>
              <p className="text-xl font-bold text-foreground">99.99%</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Avg Response</p>
              <p className="text-xl font-bold text-foreground">
                {data?.metrics.avg_response_time_ms ? `${data.metrics.avg_response_time_ms.toFixed(0)}ms` : '--'}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted">TPS (actual/peak)</p>
              <p className="text-xl font-bold text-foreground">
                {data ? `${data.metrics.tps}/${data.metrics.tps_peak}` : '--/--'}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Error Rate</p>
              <p className="text-xl font-bold text-foreground">
                {data ? `${(data.metrics.error_rate * 100).toFixed(2)}%` : '--'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Services Grid */}
      <Card>
        <CardTitle>Servicios — Health Checks</CardTitle>
        <div className="mt-4 space-y-3">
          {data?.services ? (
            data.services.map((service) => {
              const cfg = serviceStatusConfig[service.status]
              return (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-2.5 h-2.5 rounded-full', cfg.bg)} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{service.name}</p>
                      <p className="text-xs text-muted">{service.endpoint}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-mono text-foreground">{service.latency_ms}ms</p>
                      <p className="text-xs text-muted">
                        {new Date(service.last_check).toLocaleTimeString('es-CL')}
                      </p>
                    </div>
                    <Badge variant={cfg.badge}>
                      {service.status === 'healthy' ? 'OK' : service.status === 'degraded' ? 'WARN' : 'DOWN'}
                    </Badge>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex items-center justify-center py-8 text-muted text-sm">
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              {loading ? 'Verificando servicios...' : 'Sin datos — ejecuta un health check'}
            </div>
          )}
        </div>
      </Card>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardTitle>Métricas del Motor</CardTitle>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-muted" />
                <span className="text-sm text-foreground">Total Transacciones</span>
              </div>
              <span className="text-sm font-mono text-foreground">{data?.metrics.total_transactions ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted" />
                <span className="text-sm text-foreground">Uptime Engine</span>
              </div>
              <span className="text-sm font-mono text-foreground">
                {data ? formatUptime(data.metrics.uptime_seconds) : '--'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-muted" />
                <span className="text-sm text-foreground">Peak TPS</span>
              </div>
              <span className="text-sm font-mono text-foreground">{data?.metrics.tps_peak ?? 0}</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>SLA Thresholds</CardTitle>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Max Response Time</span>
              <Badge variant="bg-blue-500/10 text-blue-400 border-blue-500/20">&lt; 500ms</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Min Approval Rate</span>
              <Badge variant="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">&gt; 85%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Max Error Rate</span>
              <Badge variant="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">&lt; 5%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Target Uptime</span>
              <Badge variant="bg-purple-500/10 text-purple-400 border-purple-500/20">99.99%</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
