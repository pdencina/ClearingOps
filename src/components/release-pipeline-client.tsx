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
  CalendarClock,
  Bell,
  ArrowRight,
} from 'lucide-react'
import { PHASE_LABELS, type ReleasePhase, type WatchdogSummary } from '@/lib/engines/release-watchdog'
import type { PipelineSnapshot } from '@/lib/watchdog-snapshot'

// Orden de columnas del kanban: el recorrido completo de un Release
// Note, desde que llega hasta que el ciclo se cierra.
const PHASE_ORDER: ReleasePhase[] = ['intake', 'validation', 'pre_pap', 'pap', 'post_pap', 'closed']

const RISK_STYLES: Record<'green' | 'yellow' | 'red', { label: string; dot: string; border: string; bar: string }> = {
  green: { label: 'En control', dot: 'bg-emerald-400', border: 'border-border', bar: 'bg-accent' },
  yellow: { label: 'Con riesgo', dot: 'bg-yellow-400', border: 'border-yellow-500/30', bar: 'bg-yellow-400' },
  red: { label: 'Crítico', dot: 'bg-red-400', border: 'border-red-500/40', bar: 'bg-red-400' },
}

function papLabel(daysToPap: number): string {
  if (daysToPap > 0) return `${daysToPap} días al PaP`
  if (daysToPap === 0) return 'PaP es hoy'
  return `PaP hace ${Math.abs(daysToPap)} días`
}

interface Props {
  initialSnapshot: PipelineSnapshot
}

export function ReleasePipelineClient({ initialSnapshot }: Props) {
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

  // La base de datos no está disponible: se informa, no se simula.
  if (snapshot.data_source === 'unavailable') {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Pipeline de Releases" description="Panorama de todos los Release Note de BPC en curso." />
        <Card className="border-red-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">No se pudo conectar a la base de datos</p>
              <p className="text-xs text-muted mt-1">{snapshot.data_source_error}</p>
              <p className="text-xs text-muted mt-2">Avisa a quien administra el sistema para revisar la conexión.</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const { releases } = snapshot

  const byPhase = new Map<ReleasePhase, WatchdogSummary[]>()
  for (const phase of PHASE_ORDER) byPhase.set(phase, [])
  for (const r of releases) {
    byPhase.get(r.release.phase)?.push(r)
  }

  const redCount = releases.filter(r => r.risk_level === 'red').length
  const yellowCount = releases.filter(r => r.risk_level === 'yellow').length
  const alertCount = releases.reduce((acc, r) => acc + r.release.alerts.filter(a => !a.is_acknowledged).length, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pipeline de Releases"
        description="Panorama de todos los Release Note de BPC en curso, por etapa del proceso."
      >
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

      {releases.length === 0 ? (
        <Card className="text-center py-12">
          <ShieldCheck className="w-10 h-10 text-muted mx-auto mb-3" />
          <h3 className="text-sm font-medium text-foreground mb-1">No hay releases en el pipeline todavía</h3>
          <p className="text-sm text-muted max-w-md mx-auto mb-4">
            Cuando llegue un Release Note nuevo, analízalo en Release Analyzer y crea el checklist de gates desde ahí.
          </p>
          <Link href="/releases" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
            Ir a Release Analyzer
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>
      ) : (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">Releases en curso</p>
              <p className="text-2xl font-bold text-foreground">{releases.length}</p>
            </Card>
            <Card className={cn(redCount > 0 && 'border-red-500/40')}>
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">Críticos</p>
              <p className={cn('text-2xl font-bold', redCount > 0 ? 'text-red-400' : 'text-foreground')}>{redCount}</p>
            </Card>
            <Card className={cn(yellowCount > 0 && 'border-yellow-500/40')}>
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">Con riesgo</p>
              <p className={cn('text-2xl font-bold', yellowCount > 0 ? 'text-yellow-400' : 'text-foreground')}>{yellowCount}</p>
            </Card>
            <Card className={cn(alertCount > 0 && 'border-red-500/40')}>
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">Alertas activas</p>
              <p className={cn('text-2xl font-bold', alertCount > 0 ? 'text-red-400' : 'text-foreground')}>{alertCount}</p>
            </Card>
          </div>

          {/* Kanban por fase */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {PHASE_ORDER.map(phase => {
              const items = byPhase.get(phase) ?? []
              return (
                <div key={phase} className="w-72 shrink-0">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      {PHASE_LABELS[phase]}
                    </span>
                    <span className="text-xs text-muted bg-card border border-border rounded-full px-2 py-0.5">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-3 min-h-[80px]">
                    {items.map(summary => (
                      <ReleaseCard key={summary.release.id} summary={summary} />
                    ))}
                    {items.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted">
                        Sin releases
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function ReleaseCard({ summary }: { summary: WatchdogSummary }) {
  const { release } = summary
  const risk = RISK_STYLES[summary.risk_level]
  const activeAlerts = release.alerts.filter(a => !a.is_acknowledged).length
  const progressPct = summary.gates_total === 0 ? 0 : Math.round((summary.gates_passed / summary.gates_total) * 100)

  return (
    <Link
      href={`/releases/watchdog?release=${encodeURIComponent(release.id)}`}
      className={cn(
        'block rounded-lg border bg-card/50 hover:bg-card p-3 transition-colors',
        risk.border
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{release.name}</span>
        <span className={cn('w-2 h-2 rounded-full shrink-0', risk.dot)} title={risk.label} />
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted mb-2">
        <CalendarClock className="w-3 h-3" />
        {papLabel(summary.days_to_pap)}
      </div>
      <div className="w-full h-1.5 rounded-full bg-background overflow-hidden mb-2">
        <div className={cn('h-full transition-all', risk.bar)} style={{ width: `${progressPct}%` }} />
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted">
        <span>{summary.gates_passed}/{summary.gates_total} gates</span>
        {activeAlerts > 0 && (
          <span className="inline-flex items-center gap-1 text-red-400">
            <Bell className="w-3 h-3" />
            {activeAlerts}
          </span>
        )}
      </div>
    </Link>
  )
}
