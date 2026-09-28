// ============================================================
// KLAP CORE — Seguimiento BPC: capa de datos (Neon / Postgres)
// Tickets de Jira derivados a BPC + su cobertura contra cada
// Release Note analizado.
// ============================================================
import { getNeonSql, serializeDates, serializeRows } from '@/lib/neon'
import type { JiraIssue } from '@/lib/jira-client'

export interface DbBpcTicket {
  id: string
  jira_key: string
  jira_id: string | null
  summary: string
  description: string | null
  project_key: string
  status: string
  priority: string | null
  derived_at: string
  derived_by: string | null
  jira_url: string | null
  source: string
  raw_labels: string[] | null
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface DbBpcCoverage {
  id: string
  bpc_ticket_id: string
  release_id: string | null
  release_name: string
  matched_bpc_ticket_id: string | null
  matched_bpc_ticket_title: string | null
  match_confidence: number | null
  match_method: string
  covered: boolean
  reviewed_by: string | null
  reviewed_at: string | null
  notes: string | null
  created_at: string
}

// ─── Tickets derivados a BPC ────────────────────────────────

export async function listBpcTickets(filter?: { status?: string }): Promise<DbBpcTicket[]> {
  const sql = getNeonSql()
  const rows = filter?.status
    ? await sql`SELECT * FROM bpc_derived_tickets WHERE status = ${filter.status} ORDER BY derived_at DESC`
    : await sql`SELECT * FROM bpc_derived_tickets ORDER BY derived_at DESC`
  return serializeRows<DbBpcTicket>(rows)
}

export async function getBpcTicketByKey(jiraKey: string): Promise<DbBpcTicket | null> {
  const sql = getNeonSql()
  const rows = await sql`SELECT * FROM bpc_derived_tickets WHERE jira_key = ${jiraKey} LIMIT 1`
  return rows[0] ? serializeDates(rows[0] as DbBpcTicket) : null
}

export async function createManualBpcTicket(params: {
  jira_key: string
  summary: string
  description?: string
  project_key: string
  priority?: string
  derived_by?: string
  jira_url?: string
}): Promise<DbBpcTicket> {
  const sql = getNeonSql()
  const rows = await sql`
    INSERT INTO bpc_derived_tickets (jira_key, summary, description, project_key, priority, derived_by, jira_url, source)
    VALUES (${params.jira_key}, ${params.summary}, ${params.description ?? null}, ${params.project_key}, ${params.priority ?? null}, ${params.derived_by ?? null}, ${params.jira_url ?? null}, 'manual')
    ON CONFLICT (jira_key) DO UPDATE SET
      summary = EXCLUDED.summary,
      description = EXCLUDED.description,
      priority = EXCLUDED.priority
    RETURNING *
  `
  return serializeDates(rows[0] as DbBpcTicket)
}

/**
 * Sincroniza (upsert) los issues traídos de Jira. Los issues que ya
 * existan actualizan summary/status/priority/labels sin perder su
 * historial de cobertura (bpc_ticket_coverage referencia el mismo id).
 */
export async function upsertJiraIssues(issues: JiraIssue[], derivedBy?: string): Promise<{ inserted: number; updated: number }> {
  const sql = getNeonSql()
  let inserted = 0
  let updated = 0

  for (const issue of issues) {
    const existing = await sql`SELECT id FROM bpc_derived_tickets WHERE jira_key = ${issue.jira_key} LIMIT 1`

    if (existing.length > 0) {
      await sql`
        UPDATE bpc_derived_tickets SET
          jira_id = ${issue.jira_id},
          summary = ${issue.summary},
          description = ${issue.description},
          project_key = ${issue.project_key},
          priority = ${issue.priority},
          jira_url = ${issue.jira_url},
          raw_labels = ${issue.labels},
          last_synced_at = ${new Date().toISOString()},
          source = 'jira_sync'
        WHERE jira_key = ${issue.jira_key}
      `
      updated++
    } else {
      await sql`
        INSERT INTO bpc_derived_tickets
          (jira_key, jira_id, summary, description, project_key, priority, jira_url, raw_labels, source, derived_by, last_synced_at)
        VALUES
          (${issue.jira_key}, ${issue.jira_id}, ${issue.summary}, ${issue.description}, ${issue.project_key}, ${issue.priority}, ${issue.jira_url}, ${issue.labels}, 'jira_sync', ${derivedBy ?? null}, ${new Date().toISOString()})
      `
      inserted++
    }
  }

  return { inserted, updated }
}

export async function updateBpcTicketStatus(id: string, status: string) {
  const sql = getNeonSql()
  await sql`UPDATE bpc_derived_tickets SET status = ${status} WHERE id = ${id}`
}

// ─── Cobertura por release ──────────────────────────────────

export async function saveCoverageResults(
  releaseName: string,
  releaseId: string | null,
  results: Array<{
    bpc_ticket_id: string
    matched_bpc_ticket_id: string | null
    matched_bpc_ticket_title: string | null
    match_confidence: number | null
    match_method: 'automatic' | 'manual'
    covered: boolean
    notes?: string
  }>
): Promise<void> {
  const sql = getNeonSql()
  for (const r of results) {
    await sql`
      INSERT INTO bpc_ticket_coverage
        (bpc_ticket_id, release_id, release_name, matched_bpc_ticket_id, matched_bpc_ticket_title, match_confidence, match_method, covered, notes)
      VALUES
        (${r.bpc_ticket_id}, ${releaseId}, ${releaseName}, ${r.matched_bpc_ticket_id}, ${r.matched_bpc_ticket_title}, ${r.match_confidence}, ${r.match_method}, ${r.covered}, ${r.notes ?? null})
    `
    // Si quedó cubierto, refleja el estado en el ticket derivado.
    if (r.covered) {
      await sql`UPDATE bpc_derived_tickets SET status = 'covered' WHERE id = ${r.bpc_ticket_id} AND status = 'pending'`
    }
  }
}

export async function getCoverageForRelease(releaseName: string): Promise<DbBpcCoverage[]> {
  const sql = getNeonSql()
  const rows = await sql`
    SELECT * FROM bpc_ticket_coverage WHERE release_name = ${releaseName} ORDER BY created_at DESC
  `
  return serializeRows<DbBpcCoverage>(rows)
}

export async function reviewCoverage(coverageId: string, covered: boolean, reviewedBy: string, notes?: string) {
  const sql = getNeonSql()
  await sql`
    UPDATE bpc_ticket_coverage SET
      covered = ${covered},
      reviewed_by = ${reviewedBy},
      reviewed_at = ${new Date().toISOString()},
      notes = ${notes ?? null},
      match_method = 'manual'
    WHERE id = ${coverageId}
  `
  if (covered) {
    const rows = await sql`SELECT bpc_ticket_id FROM bpc_ticket_coverage WHERE id = ${coverageId}`
    const ticketId = rows[0]?.bpc_ticket_id
    if (ticketId) {
      await sql`UPDATE bpc_derived_tickets SET status = 'covered' WHERE id = ${ticketId}`
    }
  }
}
