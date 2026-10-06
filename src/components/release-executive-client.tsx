'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  CalendarClock,
  Lock,
  Unlock,
  Bell,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { PHASE_LABELS, type WatchdogSummary } from '@/lib/engines/release-watchdog'
import type { PipelineSnapshot } from '@/lib/watchdog-snapshot'

// Vista ejecutiva para la Gerencia de Operaciones: responde en segundos
// "¿cómo va el proceso de releases?" sin tener que operar nada. Lee los
// mismos datos reales del Pipeline (getPipelineSnapshot) y los resume.

const RISK_STYLES: Record<'green' | 'yellow' | 'red', { label: string; text: string; dot: string; border: string; bar: string }> = {
  green: { label: 'En control', text: 'text-emerald-400', dot: 'bg-emerald-400', border: 'border-emerald-500/30', bar: 'bg-emerald-400' },
  yellow: { label: 'Con riesgo', text: 'text-yellow-400', dot: 'bg-yellow-400', border: 'border-yellow-500/30', bar: 'bg-yellow-400' },
  red: { label: 'Crítico', text: 'text-red-400', dot: 'bg-red-400', border: 'border-red-500/40', bar: 'bg-red-400' },
}

function papLabel(daysToPap: number): string {
  if (daysToPap > 0) return `faltan ${daysToPap} días`
  if (daysToPap === 0) return 'es hoy'
  return `venció hace ${Math.abs(daysToPap)} días`
}

interface Props {
  initialSnapshot: PipelineSnapshot
}

export function ReleaseExecutiveClient({ initialSnapshot }: Props) {
  const [snapshot, setSnapshot] = useState<PipelineSnapshot>(initialSnapshot)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/release/pipeline', { cache: 'no-store' })
      const data = await res.json()
      setSnapshot(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  if (snapshot.data_source === 'unavailable') {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Resumen Ejecutivo" description="Estado general del proceso de releases de BPC." />
        <Card className="border-red-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">No se pudo conectar a la base de datos</p>
              <p className="text-xs text-muted mt-1">{snapshot.data_source_error}</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const { releases } = snapshot

  // Releases que todavía están en el proceso (sin cerrar).
  const activos = releases.filter(r => r.release.phase !== 'closed')
  const red = activos.filter(r => r.risk_level === 'red')
  const yellow = activos.filter(r => r.risk_level === 'yellow')
  const green = activos.filter(r => r.risk_level === 'green')
  const bloqueados = activos.filter(r => !r.can_proceed_to_pap)
  const alertasCriticas = activos.reduce(
    (acc, r) => acc + r.release.alerts.filter(a => !a.is_acknowledged && a.severity === 'critical').length,
    0
  )
  const gatesVencidos = activos.reduce((acc, r) => acc + overdueGates(r), 0)

  // Próximo PaP: el release activo con menor días_to_pap (más urgente).
  const proximo = [...activos].sort((a, b) => a.days_to_pap - b.days_to_pap)[0]

  // Estado global del proceso (lo primero que mira el gerente).
  const estadoGlobal: 'green' | 'yellow' | 'red' =
    red.length > 0 ? 'red' : yellow.length > 0 ? 'yellow' : 'green'
  const estadoStyle = RISK_STYLES[estadoGlobal]
  const EstadoIcon = estadoGlobal === 'green' ? ShieldCheck : ShieldAlert
  const estadoTexto =
    activos.length === 0
      ? 'Sin releases en curso'
      : estadoGlobal === 'red'
      ? 'Requiere atención'
      : estadoGlobal === 'yellow'
      ? 'En seguimiento'
      : 'Todo en control'

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Resumen Ejecutivo"
        description="Estado general del proceso de releases de BPC — una mirada rápida para la Gerencia de Operaciones."
      >
        <Link
          href="/releases/pipeline"
          className="inline-flex items-center gap-1.5 text-xs border border-border text-muted px-3 py-1.5 rounded-lg hover:bg-card-hover transition-colors"
        >
          Ver detalle
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs border border-border text-muted px-3 py-1.5 rounded-lg hover:bg-card-hover disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Actualizar
        </button>
      </PageHeader>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      {activos.length === 0 ? (
        <Card className="text-center py-12">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-foreground mb-1">No hay releases de BPC en curso</h3>
          <p className="text-sm text-muted max-w-md mx-auto">
            Cuando llegue un nuevo Release Note y se inicie su control, el estado del proceso aparecerá aquí.
          </p>
        </Card>
      ) : (
        <>
          {/* Semáforo global del proceso */}
          <Card className={cn('border-2', estadoStyle.border)}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-background flex items-center justify-center shrink-0">
                <EstadoIcon className={cn('w-7 h-7', estadoStyle.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Estado del proceso</p>
                <p className={cn('text-2xl font-bold', estadoStyle.text)}>{estadoTexto}</p>
                <p className="text-sm text-muted mt-0.5">
                  {activos.length} release{activos.length !== 1 ? 's' : ''} en curso ·{' '}
                  {green.length} en control · {yellow.length} con riesgo · {red.length} crítico{red.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </Card>

          {/* Indicadores que requieren decisión gerencial */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Bloqueados para PaP"
              value={bloqueados.length}
              alert={bloqueados.length > 0}
              icon={bloqueados.length > 0 ? Lock : Unlock}
            />
            <StatCard
              label="Gates vencidos"
              value={gatesVencidos}
              alert={gatesVencidos > 0}
              icon={CalendarClock}
            />
            <StatCard
              label="Alertas críticas"
              value={alertasCriticas}
              alert={alertasCriticas > 0}
              icon={Bell}
            />
            <StatCard
              label="Listos para PaP"
              value={activos.filter(r => r.can_proceed_to_pap).length}
              good
              icon={CheckCircle2}
            />
          </div>

          {/* Próximo Paso a Producción */}
          {proximo && (
            <Card className={cn('border-2', RISK_STYLES[proximo.risk_level].border)}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">Próximo Paso a Producción</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-foreground">{proximo.release.name}</p>
                    <span className={cn('w-2.5 h-2.5 rounded-full', RISK_STYLES[proximo.risk_level].dot)} />
                    <span className={cn('text-sm font-medium', RISK_STYLES[proximo.risk_level].text)}>
                      {RISK_STYLES[proximo.risk_level].label}
                    </span>
                  </div>
                  <p className="text-sm text-muted mt-1">
                    PaP {proximo.release.pap_date} ({papLabel(proximo.days_to_pap)}) · fase {PHASE_LABELS[proximo.release.phase]}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn('text-lg font-bold', proximo.can_proceed_to_pap ? 'text-emerald-400' : 'text-red-400')}>
                    {proximo.can_proceed_to_pap ? 'Autorizado' : 'Bloqueado'}
                  </p>
                  <p className="text-xs text-muted">
                    {proximo.gates_blocking_pending} control{proximo.gates_blocking_pending !== 1 ? 'es' : ''} bloqueante{proximo.gates_blocking_pending !== 1 ? 's' : ''} pendiente{proximo.gates_blocking_pending !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Lista de releases por prioridad */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Releases en curso</h3>
            <div className="space-y-2">
              {[...activos]
                .sort((a, b) => {
                  const order = { red: 0, yellow: 1, green: 2 } as const
                  return order[a.risk_level] - order[b.risk_level] || a.days_to_pap - b.days_to_pap
                })
                .map(r => (
                  <ExecutiveRow key={r.release.id} summary={r} />
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function overdueGates(summary: WatchdogSummary): number {
  const today = new Date()
  return summary.release.gates.filter(
    g => g.status !== 'passed' && g.status !== 'waived' && new Date(g.deadline) < today
  ).length
}

function StatCard({
  label,
  value,
  icon: Icon,
  alert,
  good,
}: {
  label: string
  value: number
  icon: typeof Lock
  alert?: boolean
  good?: boolean
}) {
  const emphasize = alert && value > 0
  return (
    <Card className={cn(emphasize && 'border-red-500/40', good && value > 0 && 'border-emerald-500/30')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">{label}</p>
          <p
            className={cn(
              'text-2xl font-bold',
              emphasize ? 'text-red-400' : good && value > 0 ? 'text-emerald-400' : 'text-foreground'
            )}
          >
            {value}
          </p>
        </div>
        <Icon className={cn('w-5 h-5 shrink-0', emphasize ? 'text-red-400' : good && value > 0 ? 'text-emerald-400' : 'text-muted')} />
      </div>
    </Card>
  )
}

function ExecutiveRow({ summary }: { summary: WatchdogSummary }) {
  const { release } = summary
  const risk = RISK_STYLES[summary.risk_level]
  const progressPct = summary.gates_total === 0 ? 0 : Math.round((summary.gates_passed / summary.gates_total) * 100)
  const overdue = overdueGates(summary)
  const criticalAlerts = release.alerts.filter(a => !a.is_acknowledged && a.severity === 'critical').length

  return (
    <Link
      href={`/releases/watchdog?release=${encodeURIComponent(release.id)}`}
      className={cn('block rounded-lg border bg-card/50 hover:bg-card p-4 transition-colors', risk.border)}
    >
      <div className="flex items-center gap-4 flex-wrap">
        <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', risk.dot)} title={risk.label} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{release.name}</span>
            <span className="text-xs text-muted">· {PHASE_LABELS[release.phase]}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="w-32 h-1.5 rounded-full bg-background overflow-hidden">
              <div className={cn('h-full', risk.bar)} style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs text-muted">{summary.gates_passed}/{summary.gates_total} controles</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <p className="text-muted">PaP</p>
            <p className={cn('font-medium', summary.days_to_pap <= 2 ? 'text-red-400' : summary.days_to_pap <= 5 ? 'text-yellow-400' : 'text-foreground')}>
              {papLabel(summary.days_to_pap)}
            </p>
          </div>
          {overdue > 0 && (
            <span className="inline-flex items-center gap-1 text-red-400" title="Controles vencidos">
              <CalendarClock className="w-3.5 h-3.5" />
              {overdue}
            </span>
          )}
          {criticalAlerts > 0 && (
            <span className="inline-flex items-center gap-1 text-red-400" title="Alertas críticas">
              <Bell className="w-3.5 h-3.5" />
              {criticalAlerts}
            </span>
          )}
          <span className={cn('font-medium', summary.can_proceed_to_pap ? 'text-emerald-400' : 'text-red-400')}>
            {summary.can_proceed_to_pap ? 'Autorizado' : 'Bloqueado'}
          </span>
        </div>
      </div>
    </Link>
  )
}
