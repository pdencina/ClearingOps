import { NextResponse } from 'next/server'
import { searchJiraIssues, testJiraConnection } from '@/lib/jira-client'
import { upsertJiraIssues } from '@/lib/bpc-tickets-db'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// GET /api/bpc-tickets/sync
// Verifica que las credenciales de Jira funcionan (sin traer issues).
export async function GET() {
  const result = await testJiraConnection()
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}

// POST /api/bpc-tickets/sync
// Body opcional: { jql?: string, derived_by?: string }
// Si no se pasa jql, usa JIRA_DERIVED_JQL de .env.local.
// Trae los issues de Jira y los guarda (upsert) en bpc_derived_tickets.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const jql: string | undefined = body.jql || process.env.JIRA_DERIVED_JQL

    if (!jql) {
      return NextResponse.json(
        {
          error:
            'No hay JQL configurado. Pasa { jql } en el body o define JIRA_DERIVED_JQL en .env.local ' +
            '(ej: "project in (KLAP, ESV2) AND labels = derivado-bpc AND statusCategory != Done").',
        },
        { status: 400 }
      )
    }

    const issues = await searchJiraIssues(jql)
    const { inserted, updated } = await upsertJiraIssues(issues, body.derived_by)

    return NextResponse.json({
      jql,
      fetched: issues.length,
      inserted,
      updated,
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Error sincronizando con Jira' },
      { status: 500 }
    )
  }
}
