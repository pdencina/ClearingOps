'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/ui/metric-card'
import { cn, formatDate } from '@/lib/utils'
import { ScrollText, Shield, Users, Activity, AlertTriangle, ArrowRight } from 'lucide-react'

interface AuditEntry {
  id: string
  timestamp: string
  user: string
  action: string
  resource_type: string
  resource_id: string
  changes: { field: string; old_value: string; new_value: string }[]
  ip_address: string
  user_agent: string
  risk_level: 'low' | 'medium' | 'high'
}

interface AuditSummary {
  events_today: number
  high_risk_actions: number
  unique_users: number
  most_active_user: string
  last_high_risk_event: string | null
}

const riskColors: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const riskLabels: Record<string, string> = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
}

const actionLabels: Record<string, string> = {
  fee_update: 'Actualización de Comisión',
  login: 'Inicio de Sesión',
  settlement_approve: 'Aprobación de Liquidación',
  settlement_reject: 'Rechazo de Liquidación',
  merchant_create: 'Creación de Comercio',
  merchant_update: 'Actualización de Comercio',
  rule_modify: 'Modificación de Regla',
  dispute_advance: 'Avance de Disputa',
  terminal_assign: 'Asignación de Terminal',
  terminal_deactivate: 'Desactivación de Terminal',
  report_generate: 'Generación de Reporte',
  user_role_change: 'Cambio de Rol',
  onboarding_advance: 'Avance de Onboarding',
  kyc_approve: 'Aprobación KYC',
  api_key_rotate: 'Rotación de API Key',
  batch_refund: 'Reembolso Masivo',
  webhook_config: 'Config. de Webhook',
  fraud_rule_disable: 'Desactivación Regla Fraude',
  clearing_generate: 'Generación de Clearing',
}

export function AuditClient() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [summary, setSummary] = useState<AuditSummary | null>(null)
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [filterUser, setFilterUser] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/audit')
      .then(res => res.json())
      .then(data => {
        setEntries(data.entries || [])
        setSummary(data.summary || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const users = [...new Set(entries.map(e => e.user))]

  const filtered = entries.filter(entry => {
    if (filterRisk !== 'all' && entry.risk_level !== filterRisk) return false
    if (filterUser !== 'all' && entry.user !== filterUser) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Audit Trail" description="Registro completo de acciones del sistema">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Shield className="w-3.5 h-3.5" />
          {entries.length} eventos registrados
        </div>
      </PageHeader>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard title="Eventos Hoy" value={summary.events_today} icon={Activity} iconColor="bg-blue-500/10" />
          <MetricCard title="Acciones Alto Riesgo" value={summary.high_risk_actions} icon={AlertTriangle} iconColor="bg-red-500/10" />
          <MetricCard title="Usuarios Únicos" value={summary.unique_users} icon={Users} iconColor="bg-violet-500/10" />
          <MetricCard title="Más Activo" value={summary.most_active_user.split('@')[0]} icon={ScrollText} />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Riesgo:</span>
          {['all', 'low', 'medium', 'high'].map(level => (
            <button
              key={level}
              onClick={() => setFilterRisk(level)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                filterRisk === level
                  ? 'bg-accent/10 text-accent border-accent/20'
                  : 'text-muted hover:text-foreground border-border hover:border-border-hover'
              )}
            >
              {level === 'all' ? 'Todos' : riskLabels[level]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Usuario:</span>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent/50"
          >
            <option value="all">Todos</option>
            {users.map(user => (
              <option key={user} value={user}>{user.split('@')[0]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {filtered.map((entry) => (
          <Card key={entry.id} className="!p-4">
            <div className="flex items-start gap-4">
              {/* Timeline dot */}
              <div className={cn(
                'w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ring-4',
                entry.risk_level === 'high' && 'bg-red-400 ring-red-400/10',
                entry.risk_level === 'medium' && 'bg-yellow-400 ring-yellow-400/10',
                entry.risk_level === 'low' && 'bg-emerald-400 ring-emerald-400/10',
              )} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {actionLabels[entry.action] || entry.action}
                    </span>
                    <Badge variant={riskColors[entry.risk_level]} className="text-[9px]">
                      {riskLabels[entry.risk_level]}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted">{formatDate(entry.timestamp)}</span>
                </div>

                <div className="mt-1 flex items-center gap-3 text-xs text-muted flex-wrap">
                  <span>{entry.user.split('@')[0]}</span>
                  <span>·</span>
                  <span>{entry.resource_type}/{entry.resource_id}</span>
                  <span>·</span>
                  <span>{entry.ip_address}</span>
                </div>

                {entry.changes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.changes.map((change, i) => (
                      <div key={i} className="inline-flex items-center gap-1.5 text-[11px] bg-card border border-border rounded-md px-2 py-1">
                        <span className="text-muted">{change.field}:</span>
                        {change.old_value && <span className="text-red-400 line-through">{change.old_value}</span>}
                        {change.old_value && change.new_value && <ArrowRight className="w-2.5 h-2.5 text-muted" />}
                        <span className="text-emerald-400">{change.new_value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
