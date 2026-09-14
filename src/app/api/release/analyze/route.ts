import { NextResponse } from 'next/server'
import {
  analyzeRelease,
  parseReleaseNote,
  type ReleaseTicketInput,
} from '@/lib/engines/release-analyzer'

export const dynamic = 'force-dynamic'

// POST /api/release/analyze
// Body: { release_name?: string, raw_text?: string, tickets?: ReleaseTicketInput[] }
// Acepta el texto crudo del Release Note (raw_text) o una lista de tickets ya estructurada.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const releaseName: string = body.release_name || 'Release sin nombre'

    let tickets: ReleaseTicketInput[] = []

    if (Array.isArray(body.tickets) && body.tickets.length > 0) {
      tickets = body.tickets
    } else if (typeof body.raw_text === 'string' && body.raw_text.trim().length > 0) {
      tickets = parseReleaseNote(body.raw_text)
    } else {
      return NextResponse.json(
        { error: 'Debe enviar raw_text (texto del Release Note) o tickets[].' },
        { status: 400 }
      )
    }

    if (tickets.length === 0) {
      return NextResponse.json(
        { error: 'No se detectaron tickets en el Release Note. Verifica el formato (B_PSGB-XXXXX — Título).' },
        { status: 422 }
      )
    }

    const analysis = analyzeRelease(releaseName, tickets)
    return NextResponse.json(analysis)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Error analizando el Release Note' },
      { status: 500 }
    )
  }
}
