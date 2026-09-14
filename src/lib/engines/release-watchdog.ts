// ============================================================
// KLAP CORE — Release Watchdog Engine
// Proceso de vigilancia de releases de BPC / SmartVista.
//
// Objetivo: que NO SE NOS PASE NADA. Cada release pasa por un
// checklist obligatorio con gates (compuertas) que bloquean el
// PaP si no se cumplen. Alertas automáticas por deadline.
//
// Diseñado a partir de los incidentes reales:
// - Ticket de proyecto no comunicado a CLAP → rompió operación
// - Cambio de core SmartVista → reporte dejó de generarse
// - BPC apagó transparency report durante migración → faltaron 700K trxs
// - Ticket KLAP-2024 atrasó 4 días → riesgo de perder deadline Oct/Nov
// ============================================================

// ─── Types ──────────────────────────────────────────────────

export type GateStatus = 'pending' | 'in_progress' | 'passed' | 'failed' | 'blocked' | 'waived'
export type ReleasePhase = 'intake' | 'validation' | 'pre_pap' | 'pap' | 'post_pap' | 'closed'
export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface ReleaseGate {
  id: string
  name: string
  description: string
  phase: ReleasePhase
  is_blocking: boolean          // Si falla, bloquea el PaP
  status: GateStatus
  owner: string                 // Responsable (persona o área)
  deadline: string              // ISO date
  completed_at?: string
  completed_by?: string
  evidence?: string             // Link o descripción de la evidencia
  notes?: string
}

export interface ReleaseAlert {
  id: string
  release_id: string
  severity: AlertSeverity
  title: string
  detail: string
  created_at: string
  is_acknowledged: boolean
  gate_id?: string
}

export interface WatchdogRelease {
  id: string
  name: string                  // Ej: "R26.60"
  bpc_version: string           // Ej: "SmartVista 26.60"
  pap_date: string              // Fecha programada de PaP (ISO date)
  release_note_received: string // Fecha de recepción del Release Note
  phase: ReleasePhase
  gates: ReleaseGate[]
  alerts: ReleaseAlert[]
  total_tickets: number
  critical_tickets: number
  klap_dependent_tickets: number
  created_at: string
  updated_at: string
}

export interface WatchdogSummary {
  release: WatchdogRelease
  days_to_pap: number
  gates_passed: number
  gates_total: number
  gates_blocking_pending: number
  can_proceed_to_pap: boolean
  risk_level: 'green' | 'yellow' | 'red'
  next_actions: string[]
}

// ─── Checklist Template ─────────────────────────────────────
// Este es el proceso que se aplica a CADA release.
// Basado en el Procedimiento de Promoción de Software 2.0
// y los aprendizajes de los incidentes.

interface GateTemplate {
  id: string
  name: string
  description: string
  phase: ReleasePhase
  is_blocking: boolean
  owner: string
  days_before_pap: number  // Deadline = pap_date - N días hábiles
}

const GATE_TEMPLATES: GateTemplate[] = [
  // ── INTAKE (recepción) ────────────────────────────────────
  {
    id: 'G01',
    name: 'Release Note recibido',
    description: 'BPC entregó el Release Note con al menos 10 días hábiles de anticipación.',
    phase: 'intake',
    is_blocking: true,
    owner: 'Release Management KLAP',
    days_before_pap: 10,
  },
  {
    id: 'G02',
    name: 'Contenido del Release Note completo',
    description: 'Incluye: versión, funcionalidades, impacto, plan de rollback y fecha de go-live.',
    phase: 'intake',
    is_blocking: true,
    owner: 'Release Management KLAP',
    days_before_pap: 10,
  },
  {
    id: 'G03',
    name: 'Tickets KLAP identificados',
    description: 'Se identificaron todos los tickets de la sección Klap y los que impactan clearing/liquidación/reportes.',
    phase: 'intake',
    is_blocking: true,
    owner: 'Release Management KLAP',
    days_before_pap: 9,
  },

  // ── VALIDATION (validación técnica y funcional) ───────────
  {
    id: 'G04',
    name: 'Validación técnica QA',
    description: 'QA KLAP ejecutó pruebas de integración, regresión y cobertura técnica.',
    phase: 'validation',
    is_blocking: true,
    owner: 'QA KLAP',
    days_before_pap: 5,
  },
  {
    id: 'G05',
    name: 'Validación funcional PO',
    description: 'Product Owner SmartVista KLAP validó funcionalidad de los cambios.',
    phase: 'validation',
    is_blocking: true,
    owner: 'PO SmartVista KLAP',
    days_before_pap: 5,
  },
  {
    id: 'G06',
    name: 'Validación impacto operativo',
    description: 'Gerencia de Operaciones Adquirentes revisó impacto operativo y alineación estratégica.',
    phase: 'validation',
    is_blocking: true,
    owner: 'Gerencia Operaciones',
    days_before_pap: 5,
  },
  {
    id: 'G07',
    name: 'Dependencias KLAP/CLAP confirmadas',
    description: 'Todos los tickets que requieren acción de KLAP o CLAP tienen confirmación explícita de que el cambio fue realizado.',
    phase: 'validation',
    is_blocking: true,
    owner: 'Release Management KLAP',
    days_before_pap: 4,
  },

  // ── PRE-PAP (confirmación final) ─────────────────────────
  {
    id: 'G08',
    name: 'Presentación en Comité de Cambios',
    description: 'Cada ticket del release fue presentado al comité con ámbito, pruebas, aprobación bilateral y rollback.',
    phase: 'pre_pap',
    is_blocking: true,
    owner: 'Release Management KLAP',
    days_before_pap: 2,
  },
  {
    id: 'G09',
    name: 'Plan de rollback validado',
    description: 'El plan de rollback fue revisado y aprobado. BPC confirmó que puede ejecutarlo.',
    phase: 'pre_pap',
    is_blocking: true,
    owner: 'BPC / Release Management',
    days_before_pap: 2,
  },
  {
    id: 'G10',
    name: 'Congelamiento confirmado',
    description: 'No hay cambios pendientes. Código congelado. Release listo para PaP.',
    phase: 'pre_pap',
    is_blocking: true,
    owner: 'BPC',
    days_before_pap: 1,
  },

  // ── POST-PAP (verificación post-cambio) ───────────────────
  {
    id: 'G11',
    name: 'Sanity check post-PaP ejecutado',
    description: 'Set de transacciones de verificación ejecutado: operación transaccional normal, reportes y tags correctos.',
    phase: 'post_pap',
    is_blocking: true,
    owner: 'QA KLAP / Operaciones',
    days_before_pap: -1,  // 1 día DESPUÉS del PaP
  },
  {
    id: 'G12',
    name: 'Monitor de gap transaccional OK',
    description: 'Verificación de que las trxs enviadas a BPC vía SVXP cuadran con las recibidas vía ClearingOut. Sin faltantes.',
    phase: 'post_pap',
    is_blocking: true,
    owner: 'Operaciones Adquirentes',
    days_before_pap: -1,
  },
  {
    id: 'G13',
    name: 'Transparency report activo',
    description: 'Confirmación de que BPC no dejó procesos apagados tras la migración (transparency report, clearing out, etc.).',
    phase: 'post_pap',
    is_blocking: true,
    owner: 'Operaciones / BPC',
    days_before_pap: -1,
  },
]

// ─── DB Row Shapes ──────────────────────────────────────────
// Formas mínimas que este engine espera recibir desde la capa
// de datos (src/lib/supabase.ts). El engine no conoce Supabase,
// solo trabaja con estos objetos planos (mismo patrón que
// reconciliation.ts / settlement.ts).

export interface DbReleaseRow {
  id: string
  name: string
  bpc_version: string
  pap_date: string
  release_note_received: string
  phase: string
  total_tickets: number
  critical_tickets: number
  klap_dependent_tickets: number
  created_at: string
  updated_at: string
}

export interface DbGateRow {
  id: string
  name: string
  description: string
  phase: string
  is_blocking: boolean
  status: string
  owner: string
  deadline: string
  completed_at: string | null
  completed_by: string | null
  evidence: string | null
  notes: string | null
}

export interface DbAlertRow {
  id: string
  gate_id: string | null
  severity: string
  title: string
  detail: string
  is_acknowledged: boolean
  created_at: string
}

export interface NewGateRow {
  id: string
  name: string
  description: string
  phase: ReleasePhase
  is_blocking: boolean
  status: GateStatus
  owner: string
  deadline: string
}

// ─── Core Functions ─────────────────────────────────────────

/**
 * Genera las filas de gates (checklist completo) para insertar
 * en la tabla release_gates al crear un release nuevo.
 */
export function generateGateRows(papDateISO: string): NewGateRow[] {
  const papDate = new Date(papDateISO)
  return GATE_TEMPLATES.map(tpl => ({
    id: tpl.id,
    name: tpl.name,
    description: tpl.description,
    phase: tpl.phase,
    is_blocking: tpl.is_blocking,
    status: 'pending' as GateStatus,
    owner: tpl.owner,
    deadline: addBusinessDays(papDate, -tpl.days_before_pap).toISOString().split('T')[0],
  }))
}

/**
 * Convierte filas de la base de datos (release + gates + alerts)
 * en el modelo de dominio WatchdogRelease usado por el motor.
 */
export function mapDbToRelease(
  dbRelease: DbReleaseRow,
  dbGates: DbGateRow[],
  dbAlerts: DbAlertRow[]
): WatchdogRelease {
  return {
    id: dbRelease.id,
    name: dbRelease.name,
    bpc_version: dbRelease.bpc_version,
    pap_date: dbRelease.pap_date,
    release_note_received: dbRelease.release_note_received,
    phase: dbRelease.phase as ReleasePhase,
    total_tickets: dbRelease.total_tickets,
    critical_tickets: dbRelease.critical_tickets,
    klap_dependent_tickets: dbRelease.klap_dependent_tickets,
    created_at: dbRelease.created_at,
    updated_at: dbRelease.updated_at,
    gates: dbGates.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      phase: g.phase as ReleasePhase,
      is_blocking: g.is_blocking,
      status: g.status as GateStatus,
      owner: g.owner,
      deadline: g.deadline,
      completed_at: g.completed_at ?? undefined,
      completed_by: g.completed_by ?? undefined,
      evidence: g.evidence ?? undefined,
      notes: g.notes ?? undefined,
    })),
    alerts: dbAlerts.map(a => ({
      id: a.id,
      release_id: dbRelease.id,
      severity: a.severity as AlertSeverity,
      title: a.title,
      detail: a.detail,
      created_at: a.created_at,
      is_acknowledged: a.is_acknowledged,
      gate_id: a.gate_id ?? undefined,
    })),
  }
}

/**
 * Crea un nuevo release con el checklist completo pre-armado.
 */
export function createRelease(params: {
  name: string
  bpc_version: string
  pap_date: string
  release_note_received: string
  total_tickets?: number
  critical_tickets?: number
  klap_dependent_tickets?: number
}): WatchdogRelease {
  const now = new Date().toISOString()
  const papDate = new Date(params.pap_date)

  const gates: ReleaseGate[] = GATE_TEMPLATES.map(tpl => ({
    id: tpl.id,
    name: tpl.name,
    description: tpl.description,
    phase: tpl.phase,
    is_blocking: tpl.is_blocking,
    status: 'pending',
    owner: tpl.owner,
    deadline: addBusinessDays(papDate, -tpl.days_before_pap).toISOString().split('T')[0],
  }))

  const alerts = generateInitialAlerts(params.name, params.pap_date, params.release_note_received)

  return {
    id: `REL-${params.name.replace(/[^a-zA-Z0-9]/g, '')}`,
    name: params.name,
    bpc_version: params.bpc_version,
    pap_date: params.pap_date,
    release_note_received: params.release_note_received,
    phase: 'intake',
    gates,
    alerts,
    total_tickets: params.total_tickets ?? 0,
    critical_tickets: params.critical_tickets ?? 0,
    klap_dependent_tickets: params.klap_dependent_tickets ?? 0,
    created_at: now,
    updated_at: now,
  }
}

/**
 * Actualiza el estado de un gate (compuerta).
 */
export function updateGate(
  release: WatchdogRelease,
  gateId: string,
  update: { status: GateStatus; completed_by?: string; evidence?: string; notes?: string }
): WatchdogRelease {
  const now = new Date().toISOString()
  const gates = release.gates.map(g => {
    if (g.id !== gateId) return g
    return {
      ...g,
      ...update,
      completed_at: update.status === 'passed' || update.status === 'failed' ? now : g.completed_at,
    }
  })

  // Recalcular fase
  const phase = calculatePhase(gates)

  return { ...release, gates, phase, updated_at: now }
}

/**
 * Genera el resumen ejecutivo con risk level y próximas acciones.
 */
export function getWatchdogSummary(release: WatchdogRelease): WatchdogSummary {
  const today = new Date()
  const papDate = new Date(release.pap_date)
  const diffMs = papDate.getTime() - today.getTime()
  const daysToPap = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  const gatesPassed = release.gates.filter(g => g.status === 'passed' || g.status === 'waived').length
  const gatesTotal = release.gates.length
  const blockingPending = release.gates.filter(
    g => g.is_blocking && g.status !== 'passed' && g.status !== 'waived'
  ).length

  // No se puede pasar a producción si hay gates bloqueantes pendientes del pre-PaP
  const prePapBlocking = release.gates.filter(
    g => g.is_blocking && g.phase !== 'post_pap' && g.status !== 'passed' && g.status !== 'waived'
  ).length
  const canProceed = prePapBlocking === 0

  // Risk level
  let riskLevel: 'green' | 'yellow' | 'red' = 'green'
  if (daysToPap <= 2 && prePapBlocking > 0) riskLevel = 'red'
  else if (daysToPap <= 5 && prePapBlocking > 2) riskLevel = 'red'
  else if (prePapBlocking > 0) riskLevel = 'yellow'

  // Overdue gates → siempre rojo
  const hasOverdue = release.gates.some(g => {
    if (g.status === 'passed' || g.status === 'waived') return false
    return new Date(g.deadline) < today
  })
  if (hasOverdue) riskLevel = 'red'

  // Próximas acciones
  const nextActions: string[] = []
  const pendingGates = release.gates
    .filter(g => g.status === 'pending' || g.status === 'in_progress')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())

  for (const g of pendingGates.slice(0, 3)) {
    const dl = new Date(g.deadline)
    const daysLeft = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const urgency = daysLeft <= 0 ? '⚠️ VENCIDO' : daysLeft <= 2 ? '🔴 Urgente' : '🟡 Pendiente'
    nextActions.push(`${urgency} — ${g.name} (${g.owner}, deadline ${g.deadline})`)
  }

  if (canProceed && release.phase !== 'post_pap' && release.phase !== 'closed') {
    nextActions.push('✅ Todos los gates pre-PaP cumplidos. Listo para PaP.')
  }

  return {
    release,
    days_to_pap: daysToPap,
    gates_passed: gatesPassed,
    gates_total: gatesTotal,
    gates_blocking_pending: blockingPending,
    can_proceed_to_pap: canProceed,
    risk_level: riskLevel,
    next_actions: nextActions,
  }
}

// ─── Demo: release R26.60 pre-armado ────────────────────────

export function createDemoRelease(): WatchdogRelease {
  // PaP a 6 días de hoy: margen realista para mostrar el proceso en vivo.
  const pap = addBusinessDays(new Date(), 6)
  const received = addBusinessDays(new Date(), -4) // recibido hace 4 días (poco margen → alerta)
  const base = createRelease({
    name: 'R26.60',
    bpc_version: 'SmartVista Radar Payments 26.60',
    pap_date: pap.toISOString().split('T')[0],
    release_note_received: received.toISOString().split('T')[0],
    total_tickets: 20,
    critical_tickets: 5,
    klap_dependent_tickets: 7,
  })

  // Simular progreso parcial para la demo:
  // Intake completado, validación en progreso, pre-PaP pendiente
  const gates = base.gates.map(g => {
    if (g.id === 'G01') return { ...g, status: 'passed' as GateStatus, completed_at: '2026-08-14T10:00:00Z', completed_by: 'Release Management', evidence: 'Release Note recibido vía email de BPC' }
    if (g.id === 'G02') return { ...g, status: 'passed' as GateStatus, completed_at: '2026-08-14T11:30:00Z', completed_by: 'Pablo Encina', evidence: 'Verificado con Release Analyzer de ClearingOps' }
    if (g.id === 'G03') return { ...g, status: 'passed' as GateStatus, completed_at: '2026-08-15T09:00:00Z', completed_by: 'Pablo Encina', evidence: '5 tickets sección Klap + 7 con dependencia KLAP identificados' }
    if (g.id === 'G04') return { ...g, status: 'in_progress' as GateStatus, notes: 'QA ejecutando regresión en T6' }
    if (g.id === 'G05') return { ...g, status: 'in_progress' as GateStatus, notes: 'PO revisando tickets de clearing' }
    if (g.id === 'G07') return { ...g, status: 'failed' as GateStatus, notes: '⚠️ KLAP-2024: cambio requerido por CLAP no confirmado. Ticket atrasado 4 días.' }
    return g
  })

  const alerts: ReleaseAlert[] = [
    ...base.alerts,
    {
      id: 'ALT-KLAP2024',
      release_id: base.id,
      severity: 'critical',
      title: 'Dependencia KLAP-2024 no resuelta',
      detail: 'El ticket KLAP-2024 requiere un cambio de CLAP que no ha sido confirmado. Atrasado 4 días. Si no se resuelve antes del PaP, la operación se rompe en producción — mismo tipo de incidente que ocurrió en el release anterior.',
      created_at: new Date().toISOString(),
      is_acknowledged: false,
      gate_id: 'G07',
    },
    {
      id: 'ALT-TRANSPARENCY',
      release_id: base.id,
      severity: 'warning',
      title: 'Verificar transparency report post-migración',
      detail: 'En el release anterior, BPC apagó el transparency report durante una migración sin avisarnos. Asegurar que el gate G13 se valide inmediatamente después del PaP.',
      created_at: new Date().toISOString(),
      is_acknowledged: false,
      gate_id: 'G13',
    },
  ]

  return { ...base, gates, alerts, updated_at: new Date().toISOString() }
}

// ─── Helpers ────────────────────────────────────────────────

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let remaining = Math.abs(days)
  const direction = days >= 0 ? 1 : -1

  while (remaining > 0) {
    result.setDate(result.getDate() + direction)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) remaining--
  }
  return result
}

function calculatePhase(gates: ReleaseGate[]): ReleasePhase {
  const byPhase = (p: ReleasePhase) => gates.filter(g => g.phase === p)
  const allDone = (gs: ReleaseGate[]) => gs.every(g => g.status === 'passed' || g.status === 'waived')

  if (allDone(byPhase('post_pap'))) return 'closed'
  if (allDone(byPhase('pre_pap'))) return 'post_pap'
  if (allDone(byPhase('validation'))) return 'pre_pap'
  if (allDone(byPhase('intake'))) return 'validation'
  return 'intake'
}

function generateInitialAlerts(name: string, papDate: string, receivedDate: string): ReleaseAlert[] {
  const alerts: ReleaseAlert[] = []
  const received = new Date(receivedDate)
  const pap = new Date(papDate)
  const diffDays = Math.ceil((pap.getTime() - received.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 14) {
    alerts.push({
      id: `ALT-${name}-LATE`,
      release_id: `REL-${name.replace(/[^a-zA-Z0-9]/g, '')}`,
      severity: diffDays < 10 ? 'critical' : 'warning',
      title: 'Release Note recibido con poco margen',
      detail: `El Release Note se recibió ${diffDays} días antes del PaP. El procedimiento exige mínimo 10 días hábiles. Riesgo de validación incompleta.`,
      created_at: new Date().toISOString(),
      is_acknowledged: false,
    })
  }

  return alerts
}

// ─── Constants for UI ───────────────────────────────────────

export const PHASE_LABELS: Record<ReleasePhase, string> = {
  intake: 'Recepción',
  validation: 'Validación',
  pre_pap: 'Pre-PaP',
  pap: 'Paso a Producción',
  post_pap: 'Post-PaP',
  closed: 'Cerrado',
}

export const GATE_STATUS_LABELS: Record<GateStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  passed: 'Aprobado',
  failed: 'Fallido',
  blocked: 'Bloqueado',
  waived: 'Exceptuado',
}
