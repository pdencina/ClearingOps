// ============================================================
// KLAP CORE — Release Watchdog: capa de datos (Neon / Postgres)
// Reemplaza el acceso vía Supabase para este módulo específico.
// Usa el driver serverless de Neon con SQL parametrizado.
// ============================================================
import { getNeonSql } from '@/lib/neon'

// El driver de Neon devuelve objetos Date nativos para columnas
// DATE/TIMESTAMPTZ (a diferencia de Supabase, que serializa a texto
// ISO vía su API REST). El resto del código (engine, UI) espera
// siempre string. Normalizamos aquí, en el borde con la base.
function serializeDates<T>(row: T): T {
  const out = { ...(row as object) } as Record<string, unknown>
  for (const key in out) {
    if (out[key] instanceof Date) {
      out[key] = (out[key] as Date).toISOString()
    }
  }
  return out as T
}

function serializeRows<T>(rows: unknown[]): T[] {
  return rows.map(r => serializeDates(r as T))
}

export interface DbRelease {
  id: string
  name: string
  bpc_version: string
  pap_date: string
  release_note_received: string
  phase: string
  total_tickets: number
  critical_tickets: number
  klap_dependent_tickets: number
  raw_release_note: string | null
  created_at: string
  updated_at: string
}

export interface DbReleaseGate {
  id: string
  release_id: string
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

export interface DbReleaseAlert {
  id: string
  release_id: string
  gate_id: string | null
  severity: string
  title: string
  detail: string
  is_acknowledged: boolean
  acknowledged_by: string | null
  acknowledged_at: string | null
  created_at: string
}

/**
 * Devuelve el release activo más próximo a su PaP (el que el watchdog
 * debe vigilar), junto con sus gates y alertas.
 */
export async function getActiveRelease(): Promise<{
  release: DbRelease | null
  gates: DbReleaseGate[]
  alerts: DbReleaseAlert[]
}> {
  const sql = getNeonSql()

  const releases = await sql`
    SELECT * FROM releases
    WHERE phase != 'closed'
    ORDER BY pap_date ASC
    LIMIT 1
  `
  const release = releases[0] ? serializeDates(releases[0] as DbRelease) : null
  if (!release) return { release: null, gates: [], alerts: [] }

  const [gates, alerts] = await Promise.all([
    sql`SELECT * FROM release_gates WHERE release_id = ${release.id} ORDER BY id ASC`,
    sql`SELECT * FROM release_alerts WHERE release_id = ${release.id} ORDER BY created_at DESC`,
  ])

  return {
    release,
    gates: serializeRows<DbReleaseGate>(gates),
    alerts: serializeRows<DbReleaseAlert>(alerts),
  }
}

export async function getReleaseById(releaseId: string) {
  const sql = getNeonSql()
  const releases = await sql`SELECT * FROM releases WHERE id = ${releaseId} LIMIT 1`
  const release = releases[0] ? serializeDates(releases[0] as DbRelease) : null
  if (!release) return { release: null, gates: [], alerts: [] }

  const [gates, alerts] = await Promise.all([
    sql`SELECT * FROM release_gates WHERE release_id = ${releaseId} ORDER BY id ASC`,
    sql`SELECT * FROM release_alerts WHERE release_id = ${releaseId} ORDER BY created_at DESC`,
  ])

  return {
    release,
    gates: serializeRows<DbReleaseGate>(gates),
    alerts: serializeRows<DbReleaseAlert>(alerts),
  }
}

export async function listReleases(): Promise<DbRelease[]> {
  const sql = getNeonSql()
  const rows = await sql`SELECT * FROM releases ORDER BY pap_date DESC`
  return serializeRows<DbRelease>(rows)
}

export async function createReleaseRecord(params: {
  name: string
  bpc_version: string
  pap_date: string
  release_note_received: string
  total_tickets: number
  critical_tickets: number
  klap_dependent_tickets: number
  raw_release_note?: string
}): Promise<DbRelease> {
  const sql = getNeonSql()
  const rows = await sql`
    INSERT INTO releases (name, bpc_version, pap_date, release_note_received, phase, total_tickets, critical_tickets, klap_dependent_tickets, raw_release_note)
    VALUES (${params.name}, ${params.bpc_version}, ${params.pap_date}, ${params.release_note_received}, 'intake', ${params.total_tickets}, ${params.critical_tickets}, ${params.klap_dependent_tickets}, ${params.raw_release_note ?? null})
    RETURNING *
  `
  return serializeDates(rows[0] as DbRelease)
}

export async function insertReleaseGates(
  releaseId: string,
  gates: Array<Pick<DbReleaseGate, 'id' | 'name' | 'description' | 'phase' | 'is_blocking' | 'status' | 'owner' | 'deadline'>>
) {
  const sql = getNeonSql()
  for (const g of gates) {
    await sql`
      INSERT INTO release_gates (id, release_id, name, description, phase, is_blocking, status, owner, deadline)
      VALUES (${g.id}, ${releaseId}, ${g.name}, ${g.description}, ${g.phase}, ${g.is_blocking}, ${g.status}, ${g.owner}, ${g.deadline})
    `
  }
}

export async function insertReleaseAlerts(
  releaseId: string,
  alerts: Array<{ gate_id?: string | null; severity: string; title: string; detail: string }>
) {
  if (alerts.length === 0) return
  const sql = getNeonSql()
  for (const a of alerts) {
    await sql`
      INSERT INTO release_alerts (release_id, gate_id, severity, title, detail, is_acknowledged)
      VALUES (${releaseId}, ${a.gate_id ?? null}, ${a.severity}, ${a.title}, ${a.detail}, FALSE)
    `
  }
}

/**
 * Actualiza un gate y registra el cambio en el historial de auditoría.
 * Si el nuevo estado es crítico (failed/blocked) en un gate bloqueante,
 * genera una alerta automática — esto es lo que evita que "se nos pase".
 */
export async function updateReleaseGate(
  releaseId: string,
  gateId: string,
  update: { status: string; completed_by?: string; evidence?: string; notes?: string }
) {
  const sql = getNeonSql()

  const currentRows = await sql`
    SELECT * FROM release_gates WHERE release_id = ${releaseId} AND id = ${gateId} LIMIT 1
  `
  const current = currentRows[0] ? serializeDates(currentRows[0] as DbReleaseGate) : undefined
  const isTerminal = update.status === 'passed' || update.status === 'failed'

  await sql`
    UPDATE release_gates SET
      status = ${update.status},
      completed_by = ${update.completed_by ?? current?.completed_by ?? null},
      evidence = ${update.evidence ?? current?.evidence ?? null},
      notes = ${update.notes ?? current?.notes ?? null},
      completed_at = ${isTerminal ? new Date().toISOString() : current?.completed_at ?? null}
    WHERE release_id = ${releaseId} AND id = ${gateId}
  `

  await sql`
    INSERT INTO release_gate_history (release_id, gate_id, previous_status, new_status, changed_by, notes)
    VALUES (${releaseId}, ${gateId}, ${current?.status ?? null}, ${update.status}, ${update.completed_by || 'system'}, ${update.notes ?? null})
  `

  if (update.status === 'failed' && current?.is_blocking) {
    await sql`
      INSERT INTO release_alerts (release_id, gate_id, severity, title, detail, is_acknowledged)
      VALUES (
        ${releaseId},
        ${gateId},
        'critical',
        ${`Gate bloqueante fallido: ${current.name}`},
        ${update.notes || `El control "${current.name}" (${gateId}) falló. El PaP queda bloqueado hasta resolverlo.`},
        FALSE
      )
    `
  }
}

export async function acknowledgeReleaseAlert(alertId: string, acknowledgedBy: string) {
  const sql = getNeonSql()
  await sql`
    UPDATE release_alerts SET
      is_acknowledged = TRUE,
      acknowledged_by = ${acknowledgedBy},
      acknowledged_at = ${new Date().toISOString()}
    WHERE id = ${alertId}
  `
}

export async function updateReleasePhase(releaseId: string, phase: string) {
  const sql = getNeonSql()
  await sql`UPDATE releases SET phase = ${phase} WHERE id = ${releaseId}`
}
