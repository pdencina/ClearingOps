import { NextResponse } from 'next/server'
import {
  createRelease,
  updateGate,
  getWatchdogSummary,
  generateGateRows,
  mapDbToRelease,
  type WatchdogRelease,
  type GateStatus,
} from '@/lib/engines/release-watchdog'
import {
  getActiveRelease,
  createReleaseRecord,
  insertReleaseGates,
  insertReleaseAlerts,
  updateReleaseGate,
} from '@/lib/watchdog-db'
import { getWatchdogSnapshot } from '@/lib/watchdog-snapshot'

export const dynamic = 'force-dynamic'

// GET /api/release/watchdog
// Devuelve el release activo (real, desde Supabase) con su resumen.
// Se usa para el botón "Actualizar" del cliente; la carga inicial de
// la página viene server-side (ver src/app/releases/watchdog/page.tsx).
export async function GET() {
  const snapshot = await getWatchdogSnapshot()
  return NextResponse.json(snapshot)
}

// POST /api/release/watchdog
// Acciones sobre el proceso:
//   { action: 'create', params: {...} }        → crea un release nuevo
//   { action: 'update_gate', release, gate_id, update } → actualiza un gate
//   { action: 'summary', release }             → recalcula el resumen
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const action: string = body.action

    switch (action) {
      // Crea un release REAL en Neon con su checklist de 13 gates.
      case 'create': {
        const p = body.params ?? {}
        if (!p.name || !p.pap_date || !p.release_note_received) {
          return NextResponse.json(
            { error: 'Faltan campos: name, pap_date, release_note_received.' },
            { status: 400 }
          )
        }

        const dbRelease = await createReleaseRecord({
          name: p.name,
          bpc_version: p.bpc_version || p.name,
          pap_date: p.pap_date,
          release_note_received: p.release_note_received,
          total_tickets: p.total_tickets ?? 0,
          critical_tickets: p.critical_tickets ?? 0,
          klap_dependent_tickets: p.klap_dependent_tickets ?? 0,
          raw_release_note: p.raw_release_note,
        })

        const gateRows = generateGateRows(p.pap_date)
        await insertReleaseGates(dbRelease.id, gateRows)

        // Alerta inicial si el Release Note llegó con poco margen (< 10 días hábiles)
        const daysMargin = Math.ceil(
          (new Date(p.pap_date).getTime() - new Date(p.release_note_received).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysMargin < 14) {
          await insertReleaseAlerts(dbRelease.id, [{
            severity: daysMargin < 10 ? 'critical' : 'warning',
            title: 'Release Note recibido con poco margen',
            detail: `El Release Note se recibió ${daysMargin} días antes del PaP. El procedimiento exige mínimo 10 días hábiles.`,
          }])
        }

        const { release: freshDb, gates, alerts } = await getActiveRelease()
        const release = freshDb ? mapDbToRelease(freshDb, gates, alerts) : createRelease(p)
        return NextResponse.json({ ...getWatchdogSummary(release), data_source: 'neon' })
      }

      // Actualiza un gate PERSISTIENDO en Neon (historial + alertas automáticas).
      // Si no hay conexión a Neon, opera en memoria sobre el `release` recibido
      // (fallback para seguir usando la demo sin base de datos).
      case 'update_gate': {
        const gateId = body.gate_id as string
        const update = body.update as {
          status: GateStatus
          completed_by?: string
          evidence?: string
          notes?: string
        }
        if (!gateId || !update?.status) {
          return NextResponse.json(
            { error: 'Faltan campos: gate_id, update.status.' },
            { status: 400 }
          )
        }

        const releaseId = body.release_id as string | undefined

        if (releaseId) {
          await updateReleaseGate(releaseId, gateId, update)
          const { release: dbRelease, gates, alerts } = await getActiveRelease()
          if (dbRelease) {
            const release = mapDbToRelease(dbRelease, gates, alerts)
            return NextResponse.json({ ...getWatchdogSummary(release), data_source: 'neon' })
          }
        }

        // Fallback en memoria (demo sin Neon configurado)
        const release = body.release as WatchdogRelease
        if (!release) {
          return NextResponse.json(
            { error: 'Falta release_id (modo real) o release (modo demo).' },
            { status: 400 }
          )
        }
        const updated = updateGate(release, gateId, update)
        return NextResponse.json({ ...getWatchdogSummary(updated), data_source: 'demo_no_active_release' })
      }

      case 'summary': {
        const release = body.release as WatchdogRelease
        if (!release) {
          return NextResponse.json({ error: 'Falta el campo release.' }, { status: 400 })
        }
        return NextResponse.json(getWatchdogSummary(release))
      }

      default:
        return NextResponse.json(
          { error: `Acción no reconocida: ${action}. Use create | update_gate | summary.` },
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
