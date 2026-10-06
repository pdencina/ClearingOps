// ============================================================
// KLAP CORE — Notificaciones: capa de datos (Neon / Postgres)
// Destinatarios administrables + registro de notificaciones.
// ============================================================
import { getNeonSql, serializeDates, serializeRows } from '@/lib/neon'

export interface DbRecipient {
  id: string
  email: string
  name: string | null
  role: string | null
  is_active: boolean
  created_at: string
}

export type NotificationEventType = 'critical_alert' | 'blocking_gate_failed' | 'pap_at_risk'
export type NotificationStatus = 'logged' | 'sent' | 'failed' | 'skipped'
export type NotificationProvider = 'log' | 'resend' | 'smtp'

export interface DbNotificationLog {
  id: string
  event_type: string
  release_id: string | null
  release_name: string | null
  subject: string
  body: string
  recipients: string[]
  provider: string
  status: string
  error: string | null
  created_at: string
}

// ─── Destinatarios ──────────────────────────────────────────

export async function listRecipients(): Promise<DbRecipient[]> {
  const sql = getNeonSql()
  const rows = await sql`SELECT * FROM notification_recipients ORDER BY created_at ASC`
  return serializeRows<DbRecipient>(rows)
}

/** Solo los correos activos — a quienes efectivamente se les notifica. */
export async function listActiveRecipientEmails(): Promise<string[]> {
  const sql = getNeonSql()
  const rows = await sql`SELECT email FROM notification_recipients WHERE is_active = TRUE ORDER BY email ASC`
  return rows.map(r => (r as { email: string }).email)
}

export async function addRecipient(params: {
  email: string
  name?: string
  role?: string
}): Promise<DbRecipient> {
  const sql = getNeonSql()
  const rows = await sql`
    INSERT INTO notification_recipients (email, name, role)
    VALUES (${params.email.toLowerCase()}, ${params.name ?? null}, ${params.role ?? null})
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      is_active = TRUE
    RETURNING *
  `
  return serializeDates(rows[0] as DbRecipient)
}

export async function setRecipientActive(id: string, isActive: boolean): Promise<void> {
  const sql = getNeonSql()
  await sql`UPDATE notification_recipients SET is_active = ${isActive} WHERE id = ${id}`
}

export async function deleteRecipient(id: string): Promise<void> {
  const sql = getNeonSql()
  await sql`DELETE FROM notification_recipients WHERE id = ${id}`
}

// ─── Registro de notificaciones ─────────────────────────────

export async function insertNotificationLog(params: {
  event_type: NotificationEventType
  release_id?: string | null
  release_name?: string | null
  subject: string
  body: string
  recipients: string[]
  provider: NotificationProvider
  status: NotificationStatus
  error?: string | null
}): Promise<DbNotificationLog> {
  const sql = getNeonSql()
  const rows = await sql`
    INSERT INTO notification_log (event_type, release_id, release_name, subject, body, recipients, provider, status, error)
    VALUES (
      ${params.event_type}, ${params.release_id ?? null}, ${params.release_name ?? null},
      ${params.subject}, ${params.body}, ${params.recipients}, ${params.provider}, ${params.status}, ${params.error ?? null}
    )
    RETURNING *
  `
  return serializeDates(rows[0] as DbNotificationLog)
}

export async function listNotificationLog(limit = 50): Promise<DbNotificationLog[]> {
  const sql = getNeonSql()
  const rows = await sql`SELECT * FROM notification_log ORDER BY created_at DESC LIMIT ${limit}`
  return serializeRows<DbNotificationLog>(rows)
}
