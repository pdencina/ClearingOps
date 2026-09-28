'use client'

import { useState, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Plus,
  RefreshCw,
  Loader2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Database,
  FlaskConical,
  X,
} from 'lucide-react'

interface BpcTicket {
  id: string
  jira_key: string
  summary: string
  description: string | null
  project_key: string
  status: string
  priority: string | null
  derived_at: string
  jira_url: string | null
  source: string
  last_synced_at: string | null
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  covered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  stale: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  covered: 'Cubierto',
  resolved: 'Resuelto',
  rejected: 'Rechazado',
  stale: 'Sin avance',
}

interface Props {
  initialTickets: BpcTicket[]
  initialDataSource: string
}

export function BpcTicketsClient({ initialTickets, initialDataSource }: Props) {
  const [tickets, setTickets] = useState<BpcTicket[]>(initialTickets)
  const [dataSource, setDataSource] = useState(initialDataSource)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync desde Jira
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [customJql, setCustomJql] = useState('')

  // Agregar manual
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTicket, setNewTicket] = useState({ jira_key: '', summary: '', project_key: '', jira_url: '' })
  const [addingTicket, setAddingTicket] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bpc-tickets', { cache: 'no-store' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTickets(data.tickets)
      setDataSource(data.data_source)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const syncFromJira = useCallback(async () => {
    setSyncing(true)
    setSyncError(null)
    setSyncResult(null)
    try {
      const res = await fetch('/api/bpc-tickets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customJql.trim() ? { jql: customJql.trim() } : {}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error sincronizando con Jira')
      setSyncResult(`${data.fetched} issues traídos · ${data.inserted} nuevos · ${data.updated} actualizados`)
      await refresh()
    } catch (e) {
      setSyncError((e as Error).message)
    } finally {
      setSyncing(false)
    }
  }, [customJql, refresh])

  const addManualTicket = useCallback(async () => {
    if (!newTicket.jira_key.trim() || !newTicket.summary.trim() || !newTicket.project_key.trim()) {
      setAddError('Completa ticket, resumen y proyecto.')
      return
    }
    setAddingTicket(true)
    setAddError(null)
    try {
      const res = await fetch('/api/bpc-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_manual', ...newTicket }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error agregando el ticket')
      setNewTicket({ jira_key: '', summary: '', project_key: '', jira_url: '' })
      setShowAddForm(false)
      await refresh()
    } catch (e) {
      setAddError((e as Error).message)
    } finally {
      setAddingTicket(false)
    }
  }, [newTicket, refresh])

  const markStatus = useCallback(
    async (id: string, status: string) => {
      try {
        await fetch('/api/bpc-tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_status', id, status }),
        })
        await refresh()
      } catch (e) {
        setError((e as Error).message)
      }
    },
    [refresh]
  )

  const isRealData = dataSource === 'neon'
  const pending = tickets.filter(t => t.status === 'pending')
  const others = tickets.filter(t => t.status !== 'pending')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tickets derivados a BPC"
        description="Backlog de issues (Jira) que se le derivaron a BPC para corregir. Se cruza automáticamente contra cada Release Note."
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

      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
          isRealData ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400'
        )}
      >
        {isRealData ? <Database className="w-3.5 h-3.5" /> : <FlaskConical className="w-3.5 h-3.5" />}
        {isRealData ? (
          <span>Conectado a Neon — datos reales.</span>
        ) : (
          <span>No se pudo conectar a la base ({dataSource}). Verifica DATABASE_URL.</span>
        )}
        {error && <span className="text-red-400 ml-2">· {error}</span>}
      </div>

      {/* Sincronizar con Jira */}
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <h3 className="text-sm font-medium text-foreground mb-1">Sincronizar desde Jira</h3>
            <p className="text-xs text-muted mb-3">
              Usa el JQL por defecto (JIRA_DERIVED_JQL en el servidor) o especifica uno puntual para esta sincronización.
            </p>
            <input
              value={customJql}
              onChange={e => setCustomJql(e.target.value)}
              placeholder='Opcional: project in (KLAP, ESV2) AND labels = derivado-bpc AND statusCategory != Done'
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:border-accent outline-none"
            />
          </div>
          <button
            onClick={syncFromJira}
            disabled={syncing}
            className="inline-flex items-center gap-2 bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors shrink-0"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {syncing ? 'Sincronizando…' : 'Sincronizar con Jira'}
          </button>
        </div>
        {syncResult && (
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {syncResult}
          </p>
        )}
        {syncError && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {syncError}
          </p>
        )}
      </Card>

      {/* Agregar manual */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">Agregar ticket manualmente</h3>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="inline-flex items-center gap-1.5 text-xs border border-border text-foreground px-3 py-1.5 rounded-lg hover:bg-card-hover transition-colors"
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showAddForm ? 'Cancelar' : 'Nuevo ticket'}
          </button>
        </div>
        {showAddForm && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={newTicket.jira_key}
                onChange={e => setNewTicket(p => ({ ...p, jira_key: e.target.value }))}
                placeholder="KLAP-2041"
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-accent outline-none"
              />
              <input
                value={newTicket.project_key}
                onChange={e => setNewTicket(p => ({ ...p, project_key: e.target.value }))}
                placeholder="Proyecto (KLAP, ESV2…)"
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-accent outline-none"
              />
              <input
                value={newTicket.jira_url}
                onChange={e => setNewTicket(p => ({ ...p, jira_url: e.target.value }))}
                placeholder="URL de Jira (opcional)"
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-accent outline-none"
              />
            </div>
            <input
              value={newTicket.summary}
              onChange={e => setNewTicket(p => ({ ...p, summary: e.target.value }))}
              placeholder="Resumen del issue derivado a BPC"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-accent outline-none"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={addManualTicket}
                disabled={addingTicket}
                className="inline-flex items-center gap-2 bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {addingTicket ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Agregar
              </button>
              {addError && <span className="text-sm text-red-400">{addError}</span>}
            </div>
          </div>
        )}
      </Card>

      {/* Lista de tickets */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          Pendientes ({pending.length})
        </h3>
        <TicketTable tickets={pending} onMarkStatus={markStatus} />
      </div>

      {others.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">
            Otros estados ({others.length})
          </h3>
          <TicketTable tickets={others} onMarkStatus={markStatus} />
        </div>
      )}
    </div>
  )
}

function TicketTable({
  tickets,
  onMarkStatus,
}: {
  tickets: BpcTicket[]
  onMarkStatus: (id: string, status: string) => void
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-card">
              {['Ticket', 'Resumen', 'Proyecto', 'Estado', 'Origen', 'Derivado', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tickets.map(t => (
              <tr key={t.id} className="bg-card/50 hover:bg-card transition-colors align-top">
                <td className="px-4 py-3 text-xs font-mono text-foreground whitespace-nowrap">
                  {t.jira_url ? (
                    <a href={t.jira_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
                      {t.jira_key}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    t.jira_key
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground max-w-[320px]">{t.summary}</td>
                <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{t.project_key}</td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_BADGE[t.status] ?? ''}>{STATUS_LABELS[t.status] ?? t.status}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                  {t.source === 'jira_sync' ? 'Jira sync' : 'Manual'}
                </td>
                <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{t.derived_at}</td>
                <td className="px-4 py-3">
                  {t.status === 'pending' && (
                    <button
                      onClick={() => onMarkStatus(t.id, 'resolved')}
                      className="text-xs text-emerald-400 hover:underline whitespace-nowrap"
                    >
                      Marcar resuelto
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tickets.length === 0 && (
        <div className="p-8 text-center text-muted text-sm">No hay tickets en esta categoría</div>
      )}
    </div>
  )
}
