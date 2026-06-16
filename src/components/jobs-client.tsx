'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Timer,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  Loader2,
  Calendar,
  Database,
  FileText,
} from 'lucide-react'

interface ScheduledJob {
  id: string
  name: string
  type: string
  cron: string
  status: 'active' | 'paused' | 'running' | 'failed'
  last_run: string | null
  next_run: string
  duration_ms: number | null
  records_processed: number | null
  error_message: string | null
}

interface JobExecution {
  id: string
  job_id: string
  started_at: string
  finished_at: string
  status: 'success' | 'failed' | 'partial'
  duration_ms: number
  records_processed: number
  error_message: string | null
}

const statusConfig: Record<string, { badge: string; icon: React.ElementType }> = {
  active: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  paused: { badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Pause },
  running: { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Loader2 },
  failed: { badge: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
}

const typeIcons: Record<string, React.ElementType> = {
  clearing: FileText,
  settlement: Database,
  reconciliation: CheckCircle2,
  reporting: FileText,
  fraud_scan: XCircle,
}

export function JobsClient() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([])
  const [history, setHistory] = useState<JobExecution[]>([])
  const [runningJob, setRunningJob] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const res = await fetch('/api/jobs')
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch {
      // fallback
    }
  }

  const executeJob = async (jobId: string) => {
    setRunningJob(jobId)
    try {
      const res = await fetch('/api/jobs/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId }),
      })
      const data = await res.json()
      if (data.execution) {
        setHistory(prev => [data.execution, ...prev].slice(0, 10))
      }
      await loadJobs()
    } catch {
      // error
    } finally {
      setRunningJob(null)
    }
  }

  const loadHistory = async (jobId: string) => {
    setSelectedJob(jobId)
    try {
      const res = await fetch(`/api/jobs/history?job_id=${jobId}`)
      const data = await res.json()
      setHistory(data.history || [])
    } catch {
      // error
    }
  }

  const formatDuration = (ms: number | null): string => {
    if (!ms) return '--'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatCron = (cron: string): string => {
    const parts = cron.split(' ')
    if (parts[0] === '0' && parts[1] !== '*') return `Diario ${parts[1]}:${parts[0].padStart(2, '0')}`
    if (parts[0].startsWith('*/')) return `Cada ${parts[0].replace('*/', '')} min`
    if (parts[1] === '*') return `Cada hora`
    return cron
  }

  const formatTime = (iso: string | null): string => {
    if (!iso) return '--'
    return new Date(iso).toLocaleString('es-CL', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Jobs & Scheduler" description="Programación y ejecución de procesos batch" />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Timer className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Total Jobs</p>
              <p className="text-xl font-bold text-foreground">{jobs.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Activos</p>
              <p className="text-xl font-bold text-foreground">{jobs.filter(j => j.status === 'active').length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Fallidos</p>
              <p className="text-xl font-bold text-foreground">{jobs.filter(j => j.status === 'failed').length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Próxima Ejecución</p>
              <p className="text-sm font-bold text-foreground">
                {jobs.length > 0
                  ? new Date(
                      jobs.reduce((a, b) => (a.next_run < b.next_run ? a : b)).next_run
                    ).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
                  : '--'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardTitle>Jobs Programados</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 text-xs text-muted font-medium">Job</th>
                <th className="pb-3 text-xs text-muted font-medium">Schedule</th>
                <th className="pb-3 text-xs text-muted font-medium">Última Ejecución</th>
                <th className="pb-3 text-xs text-muted font-medium">Próxima</th>
                <th className="pb-3 text-xs text-muted font-medium">Duración</th>
                <th className="pb-3 text-xs text-muted font-medium">Registros</th>
                <th className="pb-3 text-xs text-muted font-medium">Estado</th>
                <th className="pb-3 text-xs text-muted font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => {
                const cfg = statusConfig[job.status]
                const TypeIcon = typeIcons[job.type] || Timer
                const isRunning = runningJob === job.id

                return (
                  <tr key={job.id} className="hover:bg-background/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-muted" />
                        <button
                          onClick={() => loadHistory(job.id)}
                          className="text-sm font-medium text-foreground hover:text-accent transition-colors text-left"
                        >
                          {job.name}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-mono text-muted">{formatCron(job.cron)}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs text-foreground">{formatTime(job.last_run)}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs text-foreground">{formatTime(job.next_run)}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-mono text-foreground">{formatDuration(job.duration_ms)}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-mono text-foreground">
                        {job.records_processed?.toLocaleString('es-CL') ?? '--'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={cfg.badge}>
                        <cfg.icon className={cn('w-3 h-3 mr-1', job.status === 'running' && 'animate-spin')} />
                        {job.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => executeJob(job.id)}
                        disabled={isRunning}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                          'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20',
                          isRunning && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {isRunning ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        Ejecutar Ahora
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {jobs.length === 0 && (
            <div className="flex items-center justify-center py-8 text-muted text-sm">
              <Clock className="w-4 h-4 mr-2" />
              Cargando jobs...
            </div>
          )}
        </div>
      </Card>

      {/* Error Detail */}
      {jobs.filter(j => j.error_message).length > 0 && (
        <Card>
          <CardTitle>Errores Recientes</CardTitle>
          <div className="mt-4 space-y-2">
            {jobs.filter(j => j.error_message).map(job => (
              <div key={job.id} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-sm font-medium text-red-400">{job.name}</span>
                </div>
                <p className="text-xs text-muted pl-5">{job.error_message}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Execution History */}
      {history.length > 0 && (
        <Card>
          <CardTitle>
            Historial de Ejecuciones{selectedJob ? ` — ${jobs.find(j => j.id === selectedJob)?.name || ''}` : ''}
          </CardTitle>
          <div className="mt-4 space-y-2">
            {history.map((exec) => (
              <div
                key={exec.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  {exec.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <div>
                    <p className="text-sm text-foreground">
                      {new Date(exec.started_at).toLocaleString('es-CL')}
                    </p>
                    {exec.error_message && (
                      <p className="text-xs text-red-400 mt-0.5">{exec.error_message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span>{formatDuration(exec.duration_ms)}</span>
                  <span>{exec.records_processed.toLocaleString('es-CL')} reg</span>
                  <Badge variant={exec.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}>
                    {exec.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
