import { NextResponse } from 'next/server'
import { computeCoverage, type BpcDerivedTicketInput } from '@/lib/engines/bpc-coverage'
import type { AnalyzedTicket } from '@/lib/engines/release-analyzer'
import { listBpcTickets, saveCoverageResults, getCoverageForRelease } from '@/lib/bpc-tickets-db'

export const dynamic = 'force-dynamic'

// GET /api/bpc-tickets/coverage?release_name=R26.60
// Devuelve la cobertura ya calculada/guardada para ese release.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const releaseName = searchParams.get('release_name')
    if (!releaseName) {
      return NextResponse.json({ error: 'Falta el parámetro release_name.' }, { status: 400 })
    }
    const coverage = await getCoverageForRelease(releaseName)
    return NextResponse.json({ coverage })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Error obteniendo cobertura' },
      { status: 500 }
    )
  }
}

// POST /api/bpc-tickets/coverage
// Body: { release_name, release_id?, release_tickets: AnalyzedTicket[] }
// Cruza los tickets PENDIENTES derivados a BPC contra los tickets del
// Release Note ya analizado (release_tickets viene del Release Analyzer)
// y persiste el resultado del match en Neon.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const releaseName: string = body.release_name
    const releaseId: string | null = body.release_id ?? null
    const releaseTickets: AnalyzedTicket[] = body.release_tickets ?? []

    if (!releaseName || releaseTickets.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos: release_name, release_tickets[] (no vacío).' },
        { status: 400 }
      )
    }

    const pending = await listBpcTickets({ status: 'pending' })
    const pendingInput: BpcDerivedTicketInput[] = pending.map(t => ({
      id: t.id,
      jira_key: t.jira_key,
      summary: t.summary,
      description: t.description,
      status: t.status,
    }))

    const result = computeCoverage(releaseName, pendingInput, releaseTickets)

    await saveCoverageResults(
      releaseName,
      releaseId,
      result.matches.map(m => ({
        bpc_ticket_id: m.bpc_ticket_id,
        matched_bpc_ticket_id: m.matched_ticket_id,
        matched_bpc_ticket_title: m.matched_ticket_title,
        match_confidence: m.confidence,
        match_method: 'automatic' as const,
        covered: m.status === 'covered',
        notes: m.reason,
      }))
    )

    return NextResponse.json(result)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Error calculando cobertura' },
      { status: 500 }
    )
  }
}
