import { NextResponse } from 'next/server'
import {
  getWatchdogSummary,
  generateGateRows,
  mapDbToRelease,
  type GateStatus,
} from '@/lib/engines/release-watchdog'
import {
  getReleaseById,
  createReleaseRecord,
  insertReleaseGates,
  insertReleaseAlerts,
  updateReleaseGate,
  createManualReleaseAlert,
  acknowledgeReleaseAlert,
} from '@/lib/watchdog-db'
import { getWatchdogSnapshot } from '@/lib/watchdog-snapshot'
import {
  notify,
  buildCriticalAlertMessage,
  buildBlockingGateFailedMessage,
  buildPapAtRiskMessage,
} from '@/lib/notifier'

export const dynamic = 'force-dynamic'

type AlertSeverity = 'info' | 'warning' | 'critical'

// Umbral de días al PaP para avisar que un release sigue bloqueado.
const PAP_AT_RISK_DAYS = 2

// Relee un release puntual desde Neon y devuelve su resumen como JSON.
// Se usa tras cada mutación (gate, alerta) para responder con el estado
// fresco del release correcto — no "el activo", que puede ser otro.
async function summaryResponseFor(releaseId: string) {
  const { release: dbRelease, gates, alerts } = await getReleaseById(releaseId)
  if (!dbRelease) {
    return NextResponse.json({ error: 'No se encontró el release en Neon.' }, { status: 404 })
  }
  const release = mapDbToRelease(dbRelease, gates, alerts)
  return NextResponse.json({ ...getWatchdogSummary(release), data_source: 'neon' })
}

// GET /api/release/watchdog?release_id=...
// Devuelve el resumen de un release. Sin release_id, el más próximo a
// su PaP (comportamiento histórico). Con release_id, ese release puntual
// (usado al abrir una tarjeta específica desde el Pipeline). Se usa para
// el botón "Actualizar" del cliente; la carga inicial de la página viene
// server-side (ver src/app/releases/watchdog/page.tsx).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const releaseId = searchParams.get('release_id') ?? undefined
  const snapshot = await getWatchdogSnapshot(releaseId)
  return NextResponse.json(snapshot)
}

// POST /api/release/watchdog
// Acciones sobre el proceso:
//   { action: 'create', params: {...} }                      → crea un release nuevo
//   { action: 'update_gate', release_id, gate_id, update }   → actualiza un gate
//   { action: 'add_alert', release_id, severity, title, ... } → levanta una alerta manual
//   { action: 'acknowledge_alert', release_id, alert_id }    → marca una alerta como revisada
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const action: string = body.action

    switch (action) {
      // Crea un release REAL en Neon con su checklist de gates
      // (13 base + G14/G15 siempre + G16 si corresponde outgoing).
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

        const gateRows = generateGateRows(p.pap_date, Boolean(p.include_outgoing_validation))
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

        return await summaryResponseFor(dbRelease.id)
      }

      // Actualiza un gate del release activo, persistiendo en Neon
      // (historial + alertas automáticas si falla un gate bloqueante).
      case 'update_gate': {
        const releaseId = body.release_id as string | undefined
        const gateId = body.gate_id as string
        const update = body.update as {
          status: GateStatus
          completed_by?: string
          evidence?: string
          notes?: string
        }
        if (!releaseId || !gateId || !update?.status) {
          return NextResponse.json(
            { error: 'Faltan campos: release_id, gate_id, update.status.' },
            { status: 400 }
          )
        }

        await updateReleaseGate(releaseId, gateId, update)

        // Notificar si corresponde (best-effort, no bloquea la respuesta).
        if (update.status === 'failed') {
          const { release: dbRel, gates } = await getReleaseById(releaseId)
          const gate = gates.find(g => g.id === gateId)
          if (dbRel && gate && gate.is_blocking) {
            const msg = buildBlockingGateFailedMessage(dbRel.name, gate.id, gate.name, update.notes)
            await notify({
              event_type: 'blocking_gate_failed',
              release_id: dbRel.id,
              release_name: dbRel.name,
              subject: msg.subject,
              body: msg.body,
            })

            // Si además el PaP está encima y quedan bloqueantes, avisar.
            const summary = await getWatchdogSnapshot(releaseId)
            if (
              summary.data_source === 'neon' &&
              summary.days_to_pap <= PAP_AT_RISK_DAYS &&
              summary.gates_blocking_pending > 0
            ) {
              const papMsg = buildPapAtRiskMessage(dbRel.name, summary.days_to_pap, summary.gates_blocking_pending)
              await notify({
                event_type: 'pap_at_risk',
                release_id: dbRel.id,
                release_name: dbRel.name,
                subject: papMsg.subject,
                body: papMsg.body,
              })
            }
          }
        }

        return await summaryResponseFor(releaseId)
      }

      // Levanta una alerta manual sobre el release (el release manager
      // marca un riesgo que el proceso automático no detecta).
      case 'add_alert': {
        const releaseId = body.release_id as string | undefined
        const title = typeof body.title === 'string' ? body.title.trim() : ''
        const detail = typeof body.detail === 'string' ? body.detail.trim() : ''
        const severity = body.severity as AlertSeverity
        const gateId = typeof body.gate_id === 'string' && body.gate_id ? body.gate_id : null

        if (!releaseId || !title) {
          return NextResponse.json(
            { error: 'Faltan campos: release_id, title.' },
            { status: 400 }
          )
        }
        if (!['info', 'warning', 'critical'].includes(severity)) {
          return NextResponse.json(
            { error: "severity debe ser 'info', 'warning' o 'critical'." },
            { status: 400 }
          )
        }

        await createManualReleaseAlert({
          release_id: releaseId,
          gate_id: gateId,
          severity,
          title,
          detail,
          created_by: typeof body.created_by === 'string' && body.created_by ? body.created_by : 'Release Manager',
        })

        // Solo las alertas críticas disparan correo.
        if (severity === 'critical') {
          const { release: dbRel } = await getReleaseById(releaseId)
          if (dbRel) {
            const msg = buildCriticalAlertMessage(dbRel.name, title, detail)
            await notify({
              event_type: 'critical_alert',
              release_id: dbRel.id,
              release_name: dbRel.name,
              subject: msg.subject,
              body: msg.body,
            })
          }
        }

        return await summaryResponseFor(releaseId)
      }

      // Marca una alerta como revisada (sale del listado de alertas activas).
      case 'acknowledge_alert': {
        const releaseId = body.release_id as string | undefined
        const alertId = body.alert_id as string | undefined
        if (!releaseId || !alertId) {
          return NextResponse.json(
            { error: 'Faltan campos: release_id, alert_id.' },
            { status: 400 }
          )
        }
        await acknowledgeReleaseAlert(
          alertId,
          typeof body.acknowledged_by === 'string' && body.acknowledged_by ? body.acknowledged_by : 'Release Manager'
        )
        return await summaryResponseFor(releaseId)
      }

      default:
        return NextResponse.json(
          { error: `Acción no reconocida: ${action}. Use create | update_gate | add_alert | acknowledge_alert.` },
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
