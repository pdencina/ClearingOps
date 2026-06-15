'use client'

import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Activity, AlertCircle, CheckCircle2, XCircle, Info, Zap } from 'lucide-react'

interface Props {
  events: Array<Record<string, unknown>>
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  job: { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  warning: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  info: { icon: Info, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  critical: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-600/10' },
}

export function MonitorClient({ events }: Props) {
  const activeEvents = events.filter(e => e.status === 'active')
  const errors = events.filter(e => e.event_type === 'error' || e.event_type === 'critical')
  const jobs = events.filter(e => e.event_type === 'job')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Monitor Operacional" description="Jobs, eventos y errores del sistema" />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Total Eventos</p>
              <p className="text-xl font-bold text-foreground">{events.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Activos</p>
              <p className="text-xl font-bold text-foreground">{activeEvents.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Errores</p>
              <p className="text-xl font-bold text-foreground">{errors.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Jobs OK</p>
              <p className="text-xl font-bold text-foreground">{jobs.filter(j => j.status === 'resolved').length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Events Timeline */}
      <Card>
        <CardTitle>Eventos Recientes</CardTitle>
        <div className="mt-4 space-y-1">
          {events.map((event) => {
            const config = typeConfig[event.event_type as string] || typeConfig.info
            const Icon = config.icon
            return (
              <div key={event.id as string} className="flex items-start gap-3 p-3 rounded-lg hover:bg-card-hover transition-colors">
                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-foreground">{event.message as string}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-muted">{event.source as string}</span>
                    <span className="text-[10px] text-muted">{formatDate(event.created_at as string)}</span>
                  </div>
                </div>
                <Badge variant={event.status === 'active'
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }>
                  {event.status as string}
                </Badge>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
