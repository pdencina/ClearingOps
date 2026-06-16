// ============================================================
// KLAP CORE — Batch Scheduler Engine
// Motor de programación y ejecución de jobs batch
// ============================================================

export interface ScheduledJob {
  id: string
  name: string
  type: 'clearing' | 'settlement' | 'reconciliation' | 'reporting' | 'fraud_scan'
  cron: string
  status: 'active' | 'paused' | 'running' | 'failed'
  last_run: string | null
  next_run: string
  duration_ms: number | null
  records_processed: number | null
  error_message: string | null
}

export interface JobExecution {
  id: string
  job_id: string
  started_at: string
  finished_at: string
  status: 'success' | 'failed' | 'partial'
  duration_ms: number
  records_processed: number
  error_message: string | null
}

// ============================================================
// Predefined Jobs
// ============================================================

function getNextRun(hour: number, minute: number): string {
  const now = new Date()
  const next = new Date()
  next.setHours(hour, minute, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next.toISOString()
}

function getLastRun(hoursAgo: number): string {
  const d = new Date()
  d.setHours(d.getHours() - hoursAgo)
  return d.toISOString()
}

const PREDEFINED_JOBS: ScheduledJob[] = [
  {
    id: 'job-clearing-visa',
    name: 'Clearing Visa Diario',
    type: 'clearing',
    cron: '0 6 * * *',
    status: 'active',
    last_run: getLastRun(18),
    next_run: getNextRun(6, 0),
    duration_ms: 45200,
    records_processed: 12847,
    error_message: null,
  },
  {
    id: 'job-clearing-mc',
    name: 'Clearing Mastercard Diario',
    type: 'clearing',
    cron: '30 6 * * *',
    status: 'active',
    last_run: getLastRun(17),
    next_run: getNextRun(6, 30),
    duration_ms: 38900,
    records_processed: 9654,
    error_message: null,
  },
  {
    id: 'job-settlement-batch',
    name: 'Liquidación Batch',
    type: 'settlement',
    cron: '0 8 * * *',
    status: 'active',
    last_run: getLastRun(16),
    next_run: getNextRun(8, 0),
    duration_ms: 67300,
    records_processed: 4521,
    error_message: null,
  },
  {
    id: 'job-reconciliation',
    name: 'Conciliación Automática',
    type: 'reconciliation',
    cron: '0 10 * * *',
    status: 'active',
    last_run: getLastRun(14),
    next_run: getNextRun(10, 0),
    duration_ms: 123400,
    records_processed: 28934,
    error_message: null,
  },
  {
    id: 'job-reporting',
    name: 'Reporte Transaccional',
    type: 'reporting',
    cron: '0 * * * *',
    status: 'active',
    last_run: getLastRun(1),
    next_run: (() => {
      const d = new Date()
      d.setHours(d.getHours() + 1, 0, 0, 0)
      return d.toISOString()
    })(),
    duration_ms: 8700,
    records_processed: 3420,
    error_message: null,
  },
  {
    id: 'job-fraud-scan',
    name: 'Escaneo Antifraude',
    type: 'fraud_scan',
    cron: '*/15 * * * *',
    status: 'active',
    last_run: getLastRun(0.25),
    next_run: (() => {
      const d = new Date()
      d.setMinutes(d.getMinutes() + 15 - (d.getMinutes() % 15), 0, 0)
      return d.toISOString()
    })(),
    duration_ms: 4200,
    records_processed: 1890,
    error_message: null,
  },
  {
    id: 'job-token-cleanup',
    name: 'Limpieza Tokens Expirados',
    type: 'reconciliation',
    cron: '0 2 * * *',
    status: 'active',
    last_run: getLastRun(22),
    next_run: getNextRun(2, 0),
    duration_ms: 15600,
    records_processed: 542,
    error_message: null,
  },
  {
    id: 'job-db-backup',
    name: 'Backup Base de Datos',
    type: 'reporting',
    cron: '0 3 * * *',
    status: 'failed',
    last_run: getLastRun(21),
    next_run: getNextRun(3, 0),
    duration_ms: 340000,
    records_processed: null,
    error_message: 'Connection timeout after 300s — disk space warning on replica',
  },
]

// In-memory state for job runs
const jobHistory: Map<string, JobExecution[]> = new Map()

// Initialize history with sample data
function initializeHistory() {
  if (jobHistory.size > 0) return

  for (const job of PREDEFINED_JOBS) {
    const history: JobExecution[] = []
    for (let i = 0; i < 5; i++) {
      const startedAt = new Date()
      startedAt.setHours(startedAt.getHours() - (i + 1) * 24)
      const duration = Math.floor(Math.random() * 50000) + 5000
      const finishedAt = new Date(startedAt.getTime() + duration)
      const isSuccess = job.id !== 'job-db-backup' || i > 0

      history.push({
        id: `exec-${job.id}-${i}`,
        job_id: job.id,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        status: isSuccess ? 'success' : 'failed',
        duration_ms: duration,
        records_processed: isSuccess ? Math.floor(Math.random() * 15000) + 1000 : 0,
        error_message: isSuccess ? null : job.error_message,
      })
    }
    jobHistory.set(job.id, history)
  }
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Returns all scheduled jobs.
 */
export function getScheduledJobs(): ScheduledJob[] {
  initializeHistory()
  return [...PREDEFINED_JOBS]
}

/**
 * Simulates running a job immediately.
 */
export function runJob(jobId: string): JobExecution {
  initializeHistory()

  const job = PREDEFINED_JOBS.find(j => j.id === jobId)
  if (!job) {
    throw new Error(`Job not found: ${jobId}`)
  }

  // Simulate execution
  const startedAt = new Date()
  const duration = Math.floor(Math.random() * 30000) + 2000
  const finishedAt = new Date(startedAt.getTime() + duration)
  const isSuccess = Math.random() > 0.1 // 90% success rate
  const records = isSuccess ? Math.floor(Math.random() * 10000) + 500 : 0

  const execution: JobExecution = {
    id: `exec-${jobId}-${Date.now()}`,
    job_id: jobId,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    status: isSuccess ? 'success' : 'failed',
    duration_ms: duration,
    records_processed: records,
    error_message: isSuccess ? null : 'Simulated execution error — retry scheduled',
  }

  // Update job state
  const idx = PREDEFINED_JOBS.findIndex(j => j.id === jobId)
  if (idx >= 0) {
    PREDEFINED_JOBS[idx].last_run = startedAt.toISOString()
    PREDEFINED_JOBS[idx].duration_ms = duration
    PREDEFINED_JOBS[idx].records_processed = records
    PREDEFINED_JOBS[idx].status = isSuccess ? 'active' : 'failed'
    PREDEFINED_JOBS[idx].error_message = execution.error_message
  }

  // Add to history
  const history = jobHistory.get(jobId) || []
  history.unshift(execution)
  if (history.length > 10) history.pop()
  jobHistory.set(jobId, history)

  return execution
}

/**
 * Returns the last 5 executions for a given job.
 */
export function getJobHistory(jobId: string): JobExecution[] {
  initializeHistory()
  return (jobHistory.get(jobId) || []).slice(0, 5)
}
