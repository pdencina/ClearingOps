'use client'

import { useState, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  ShieldCheck,
  ShieldAlert,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Circle,
  Loader2,
  AlertTriangle,
  Lock,
  Unlock,
  Bell,
  Database,
  FlaskConical,
  RefreshCw,
} from 'lucide-react'
import {
  PHASE_LABELS,
  GATE_STATUS_LABELS,
  type WatchdogSummary,
  type ReleaseGate,
  type GateStatus,
  type ReleasePhase,
} from '@/lib/engines/release-watchdog'

const PHASE_ORDER: ReleasePhase[] = ['intake', 'validation', 'pre_pap', 'post_pap']

const RISK_STYLES: Record<'green' | 'yellow' | 'red', { label: string; badge: string; ring: string; icon: typeof ShieldCheck }> = {
  green: { label: 'En control', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', ring: 'border-emerald-500/40', icon: ShieldCheck },
  yellow: { label: 'Con riesgo', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', ring: 'border-yellow-500/40', icon: ShieldAlert },
  red: { label: 'Crítico', badge: 'bg-red-500/10 text-red-400 border-red-500/20', ring: 'border-red-500/40', icon: ShieldAlert },
}

const STATUS_STYLES: Record<GateStatus, { badge: string; icon: typeof CheckCircle2 }> = {
  passed: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  failed: { badge: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
  blocked: { badge: 'bg-red-500/10 text-red-400 border-red-500/20', icon: Lock },
  in_progress: { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Loader2 },
  pending: { badge: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: Circle },
  waived: { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: CheckCircle2 },
}

type ApiSummary = WatchdogSummary & {
  data_source?: 'neon' | 'demo_no_active_release' | 'demo_neon_unavailable'
  data_source_error?: string
}

interface Props {
  initialSummary: ApiSummary
}

export function ReleaseWatchdogClient({ initialSummary }: Props) {
  const [summary, setSummary] = useState<ApiSummary | null>(initialSummary)
  const [loading, setLoading] = useState(false)
  const [updatingGate, setUpdatingGate] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/release/watchdog', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error obteniendo el watchdog')
      setSummary(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const setGate = useCallback(
    async (gateId: string, status: GateStatus) => {
      if (!summary) return
      setUpdatingGate(gateId)
      try {
        const isReal = summary.data_source === 'neon'
        const res = await fetch('/api/release/watchdog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_gate',
            release_id: isReal ? summary.release.id : undefined,
            release: isReal ? undefined : summary.release,
            gate_id: gateId,
            update: {
              status,
              completed_by: 'Pablo Encina',
              evidence: status === 'passed' ? 'Validado vía ClearingOps Watchdog' : undefined,
            },
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error actualizando el gate')
        setSummary(data)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setUpdatingGate(null)
      }
    },
    [summary]
  )

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    )
  }

  if (error && !summary) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Release Watchdog" description="Proceso de control de releases de BPC." />
        <Card className="border-red-500/30">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      </div>
    )
  }

  if (!summary) return null

  const { release } = summary
  const risk = RISK_STYLES[summary.risk_level]
  const RiskIcon = risk.icon
  const activeAlerts = release.alerts.filter(a => !a.is_acknowledged)
  const progressPct = Math.round((summary.gates_passed / summary.gates_total) * 100)
  const isRealData = summary.data_source === 'neon'

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Release Watchdog"
        description="Proceso de control de releases de BPC. Ningún cambio pasa a producción sin cumplir los gates obligatorios."
      >
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs border border-border text-muted px-3 py-1.5 rounded-lg hover:bg-card-hover disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Actualizar
        </button>
      </PageHeader>

      {/* Fuente de datos */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
          isRealData
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
            : 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400'
        )}
      >
        {isRealData ? <Database className="w-3.5 h-3.5" /> : <FlaskConical className="w-3.5 h-3.5" />}
        {isRealData ? (
          <span>Conectado a Neon — datos reales, cambios se guardan en la base.</span>
        ) : summary.data_source === 'demo_neon_unavailable' ? (
          <span>
            Modo demo — Neon no está configurado (falta DATABASE_URL en .env.local). Los cambios de esta sesión no se guardan.
          </span>
        ) : (
          <span>Modo demo — no hay releases activos en la base todavía. Crea uno para operar en real.</span>
        )}
        {error && <span className="text-red-400 ml-2">· {error}</span>}
      </div>

      {/* Panel de estado */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={cn('border-2', risk.ring)}>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">Estado del release</p>
              <p className="text-2xl font-bold text-foreground">{release.name}</p>
              <Badge className={risk.badge}>{risk.label}</Badge>
            </div>
            <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
              <RiskIcon className={cn('w-5 h-5', summary.risk_level === 'green' ? 'text-emerald-400' : summary.risk_level === 'yellow' ? 'text-yellow-400' : 'text-red-400')} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">Días para el PaP</p>
              <p className={cn('text-2xl font-bold', summary.days_to_pap <= 2 ? 'text-red-400' : summary.days_to_pap <= 5 ? 'text-yellow-400' : 'text-foreground')}>
                {summary.days_to_pap}
              </p>
              <p className="text-xs text-muted">{release.pap_date}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-orange-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div className="space-y-2 w-full">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">Gates cumplidos</p>
              <p className="text-2xl font-bold text-foreground">{summary.gates_passed}/{summary.gates_total}</p>
              <div className="w-full h-1.5 rounded-full bg-background overflow-hidden">
                <div className="h-full bg-accent transition-all" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className={cn('border-2', summary.can_proceed_to_pap ? 'border-emerald-500/40' : 'border-red-500/40')}>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">¿Listo para PaP?</p>
              <p className={cn('text-lg font-bold', summary.can_proceed_to_pap ? 'text-emerald-400' : 'text-red-400')}>
                {summary.can_proceed_to_pap ? 'Autorizado' : 'Bloqueado'}
              </p>
              <p className="text-xs text-muted">{summary.gates_blocking_pending} gates bloqueantes pendientes</p>
            </div>
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', summary.can_proceed_to_pap ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
              {summary.can_proceed_to_pap ? <Unlock className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5 text-red-400" />}
            </div>
          </div>
        </Card>
      </div>

      {/* Alertas */}
      {activeAlerts.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-medium text-foreground">Alertas activas ({activeAlerts.length})</h3>
          </div>
          <div className="space-y-2">
            {activeAlerts.map(a => (
              <div
                key={a.id}
                className={cn(
                  'rounded-lg border p-3',
                  a.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' : a.severity === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-blue-500/5 border-blue-500/20'
                )}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className={cn('w-4 h-4 mt-0.5 shrink-0', a.severity === 'critical' ? 'text-red-400' : a.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400')} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted mt-0.5">{a.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Próximas acciones */}
      {summary.next_actions.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium text-foreground mb-3">Próximas acciones</h3>
          <ul className="space-y-1.5">
            {summary.next_actions.map((na, i) => (
              <li key={i} className="text-sm text-muted flex gap-2">
                <span className="text-accent">→</span>
                <span>{na}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Checklist de gates por fase */}
      <div className="space-y-5">
        <h3 className="text-sm font-medium text-foreground">Checklist obligatorio del release</h3>
        {PHASE_ORDER.map(phase => {
          const gates = release.gates.filter(g => g.phase === phase)
          if (gates.length === 0) return null
          const done = gates.filter(g => g.status === 'passed' || g.status === 'waived').length
          return (
            <div key={phase}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{PHASE_LABELS[phase]}</span>
                <span className="text-xs text-muted">{done}/{gates.length}</span>
              </div>
              <div className="space-y-2">
                {gates.map(g => (
                  <GateRow key={g.id} gate={g} updating={updatingGate === g.id} onSetGate={setGate} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GateRow({
  gate,
  updating,
  onSetGate,
}: {
  gate: ReleaseGate
  updating: boolean
  onSetGate: (id: string, s: GateStatus) => void
}) {
  const s = STATUS_STYLES[gate.status]
  const StatusIcon = updating ? Loader2 : s.icon
  const overdue =
    gate.status !== 'passed' && gate.status !== 'waived' && new Date(gate.deadline) < new Date()

  return (
    <div className={cn('rounded-lg border p-3', overdue ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-card/50', updating && 'opacity-70')}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <StatusIcon className={cn('w-4 h-4 mt-0.5 shrink-0', (gate.status === 'in_progress' || updating) && 'animate-spin', gate.status === 'passed' || gate.status === 'waived' ? 'text-emerald-400' : gate.status === 'failed' || gate.status === 'blocked' ? 'text-red-400' : gate.status === 'in_progress' ? 'text-blue-400' : 'text-gray-400')} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted">{gate.id}</span>
              <span className="text-sm font-medium text-foreground">{gate.name}</span>
              {gate.is_blocking && <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Bloqueante</Badge>}
            </div>
            <p className="text-xs text-muted mt-0.5">{gate.description}</p>
            <p className="text-[11px] text-muted mt-1">
              {gate.owner} · deadline {gate.deadline}
              {overdue && <span className="text-red-400 font-medium"> · VENCIDO</span>}
              {gate.evidence && <span className="text-emerald-400"> · {gate.evidence}</span>}
            </p>
            {gate.notes && <p className="text-[11px] text-yellow-400 mt-1">{gate.notes}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={s.badge}>{GATE_STATUS_LABELS[gate.status]}</Badge>
          <div className="flex gap-1">
            <button
              onClick={() => onSetGate(gate.id, 'passed')}
              disabled={updating}
              title="Marcar aprobado"
              className="p-1.5 rounded-md hover:bg-emerald-500/10 text-muted hover:text-emerald-400 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSetGate(gate.id, 'failed')}
              disabled={updating}
              title="Marcar fallido"
              className="p-1.5 rounded-md hover:bg-red-500/10 text-muted hover:text-red-400 disabled:opacity-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
