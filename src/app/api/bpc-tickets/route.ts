import { NextResponse } from 'next/server'
import { listBpcTickets, createManualBpcTicket, updateBpcTicketStatus } from '@/lib/bpc-tickets-db'

export const dynamic = 'force-dynamic'

// GET /api/bpc-tickets?status=pending
// Lista los tickets derivados a BPC (sincronizados de Jira o manuales).
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? undefined
    const tickets = await listBpcTickets(status ? { status } : undefined)
    return NextResponse.json({ tickets, data_source: 'neon' })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Error obteniendo tickets BPC', tickets: [], data_source: 'unavailable' },
      { status: 200 }
    )
  }
}

// POST /api/bpc-tickets
// Acciones:
//   { action: 'create_manual', ...campos }
//   { action: 'update_status', id, status }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const action: string = body.action

    switch (action) {
      case 'create_manual': {
        if (!body.jira_key || !body.summary || !body.project_key) {
          return NextResponse.json(
            { error: 'Faltan campos: jira_key, summary, project_key.' },
            { status: 400 }
          )
        }
        const ticket = await createManualBpcTicket({
          jira_key: body.jira_key,
          summary: body.summary,
          description: body.description,
          project_key: body.project_key,
          priority: body.priority,
          derived_by: body.derived_by,
          jira_url: body.jira_url,
        })
        return NextResponse.json({ ticket })
      }

      case 'update_status': {
        if (!body.id || !body.status) {
          return NextResponse.json({ error: 'Faltan campos: id, status.' }, { status: 400 })
        }
        await updateBpcTicketStatus(body.id, body.status)
        return NextResponse.json({ ok: true })
      }

      default:
        return NextResponse.json(
          { error: `Acción no reconocida: ${action}. Use create_manual | update_status.` },
          { status: 400 }
        )
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Error procesando la acción' },
      { status: 500 }
    )
  }
}
