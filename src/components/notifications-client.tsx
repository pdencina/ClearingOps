'use client'

import { useState, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Plus,
  Loader2,
  Trash2,
  Mail,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  BellRing,
  Info,
} from 'lucide-react'
import type { DbRecipient, DbNotificationLog } from '@/lib/notifications-db'

const EVENT_LABELS: Record<string, string> = {
  critical_alert: 'Alerta crítica',
  blocking_gate_failed: 'Gate bloqueante fallido',
  pap_at_risk: 'PaP en riesgo',
}

const STATUS_BADGE: Record<string, string> = {
  logged: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  sent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  skipped: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  logged: 'Registrado',
  sent: 'Enviado',
  failed: 'Falló',
  skipped: 'Omitido',
}

interface Props {
  initialRecipients: DbRecipient[]
  initialLog: DbNotificationLog[]
  initialDataSource: string
  // true si hay un proveedor de correo configurado (Resend/SMTP) en el server.
  sendingEnabled: boolean
}

export function NotificationsClient({ initialRecipients, initialLog, initialDataSource, sendingEnabled }: Props) {
  const [recipients, setRecipients] = useState(initialRecipients)
  const [log, setLog] = useState(initialLog)
  const [dataSource, setDataSource] = useState(initialDataSource)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      const data = await res.json()
      setRecipients(data.recipients ?? [])
      setLog(data.log ?? [])
      setDataSource(data.data_source)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const addRecipient = useCallback(async () => {
    if (!email.trim()) {
      setAddError('Ingresa un correo.')
      return
    }
    setAdding(true)
    setAddError(null)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', email, name, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error agregando el destinatario')
      setEmail('')
      setName('')
      setRole('')
      await refresh()
    } catch (e) {
      setAddError((e as Error).message)
    } finally {
      setAdding(false)
    }
  }, [email, name, role, refresh])

  const toggleActive = useCallback(
    async (id: string, isActive: boolean) => {
      setBusyId(id)
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set_active', id, is_active: isActive }),
        })
        await refresh()
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setBusyId(null)
      }
    },
    [refresh]
  )

  const removeRecipient = useCallback(
    async (id: string) => {
      setBusyId(id)
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id }),
        })
        await refresh()
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setBusyId(null)
      }
    },
    [refresh]
  )

  const isReal = dataSource === 'neon'
  const activeCount = recipients.filter(r => r.is_active).length

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Notificaciones"
        description="A quién avisa el sistema cuando algo requiere atención en un release (alertas críticas, gates bloqueantes, PaP en riesgo)."
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

      {!isReal && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          No se pudo conectar a la base de datos. Avisa a quien administra el sistema.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      {/* Estado del envío */}
      <div
        className={cn(
          'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs',
          sendingEnabled
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
            : 'border-blue-500/20 bg-blue-500/5 text-blue-400'
        )}
      >
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        {sendingEnabled ? (
          <span>Envío de correos activo. Los avisos se envían a los destinatarios activos.</span>
        ) : (
          <span>
            Modo registro: el sistema anota cada aviso y a quién correspondería enviarlo (ver tabla de abajo), pero
            todavía no está conectado un proveedor de correo. Al activarlo, estos mismos avisos empezarán a enviarse.
          </span>
        )}
      </div>

      {/* Agregar destinatario */}
      <Card>
        <h3 className="text-sm font-medium text-foreground mb-3">Agregar destinatario</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="correo@klap.cl"
            type="email"
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-accent outline-none"
          />
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre (opcional)"
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-accent outline-none"
          />
          <input
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="Rol (ej: Gerente de Operaciones)"
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-accent outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={addRecipient}
            disabled={adding || !isReal}
            className="inline-flex items-center gap-2 bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Agregar
          </button>
          {addError && <span className="text-sm text-red-400">{addError}</span>}
        </div>
      </Card>

      {/* Lista de destinatarios */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          Destinatarios ({activeCount} activo{activeCount !== 1 ? 's' : ''} de {recipients.length})
        </h3>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-card">
                {['Correo', 'Nombre', 'Rol', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recipients.map(r => (
                <tr key={r.id} className="bg-card/50 hover:bg-card transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted" />
                      {r.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{r.name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted">{r.role || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(r.id, !r.is_active)}
                      disabled={busyId === r.id}
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-colors disabled:opacity-50',
                        r.is_active
                          ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
                          : 'border-gray-500/20 bg-gray-500/5 text-gray-400 hover:bg-gray-500/10'
                      )}
                    >
                      {r.is_active ? <CheckCircle2 className="w-3 h-3" /> : null}
                      {r.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removeRecipient(r.id)}
                      disabled={busyId === r.id}
                      title="Quitar"
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-muted hover:text-red-400 disabled:opacity-50 transition-colors"
                    >
                      {busyId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recipients.length === 0 && (
            <div className="p-8 text-center text-muted text-sm">
              Sin destinatarios. Agrega al menos uno para que el sistema avise cuando algo requiera atención.
            </div>
          )}
        </div>
      </div>

      {/* Registro de notificaciones */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <BellRing className="w-4 h-4 text-muted" />
          Registro de avisos ({log.length})
        </h3>
        <div className="space-y-2">
          {log.map(entry => (
            <Card key={entry.id} className="py-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{entry.subject}</span>
                    <Badge className={STATUS_BADGE[entry.status] ?? ''}>{STATUS_LABELS[entry.status] ?? entry.status}</Badge>
                    <span className="text-[11px] text-muted">{EVENT_LABELS[entry.event_type] ?? entry.event_type}</span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {entry.recipients.length > 0 ? `Para: ${entry.recipients.join(', ')}` : 'Sin destinatarios'}
                    {entry.error ? ` · ${entry.error}` : ''}
                  </p>
                </div>
                <span className="text-[11px] text-muted whitespace-nowrap">{formatWhen(entry.created_at)}</span>
              </div>
            </Card>
          ))}
          {log.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted text-sm">
              Todavía no se ha generado ningún aviso. Cuando se levante una alerta crítica o falle un gate bloqueante,
              aparecerá aquí.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}
