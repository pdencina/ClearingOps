// ============================================================
// KLAP CORE — Watchdog Snapshot
// Punto único que decide el estado del Release Watchdog y arma
// el WatchdogSummary resultante. Se usa tanto desde la página
// server-side como desde el API route (botón "Actualizar").
//
// Nunca se muestran datos simulados: si no hay un release activo
// o la base no está disponible, se informa ese estado tal cual
// en vez de rellenar con un release de ejemplo.
// ============================================================

import { getWatchdogSummary, mapDbToRelease, type WatchdogSummary } from '@/lib/engines/release-watchdog'
import { getActiveRelease, getReleaseById, listReleasesWithGates } from '@/lib/watchdog-db'

export type WatchdogSnapshot =
  | (WatchdogSummary & { data_source: 'neon' })
  | { data_source: 'no_active_release' }
  | { data_source: 'unavailable'; data_source_error: string }

/**
 * Snapshot de UN release para el Watchdog.
 * Sin `releaseId`: el más próximo a su PaP (comportamiento histórico).
 * Con `releaseId`: ese release puntual (usado por el Pipeline para
 * abrir el checklist de una tarjeta específica, no siempre la más urgente).
 */
export async function getWatchdogSnapshot(releaseId?: string): Promise<WatchdogSnapshot> {
  try {
    const { release: dbRelease, gates, alerts } = releaseId
      ? await getReleaseById(releaseId)
      : await getActiveRelease()

    if (!dbRelease) {
      return { data_source: 'no_active_release' }
    }

    const release = mapDbToRelease(dbRelease, gates, alerts)
    return { ...getWatchdogSummary(release), data_source: 'neon' }
  } catch (err: unknown) {
    // Base de datos no configurada o inalcanzable: no se rompe la
    // página, pero tampoco se simula un release — se informa el error.
    return {
      data_source: 'unavailable',
      data_source_error: (err as Error).message,
    }
  }
}

export type PipelineSnapshot =
  | { data_source: 'neon'; releases: WatchdogSummary[] }
  | { data_source: 'unavailable'; data_source_error: string }

/**
 * Snapshot de TODOS los releases (cualquier fase, no solo el activo),
 * para la vista Pipeline — el panorama de todas las entregas de
 * Release Note en curso, cada una en su etapa del proceso.
 */
export async function getPipelineSnapshot(): Promise<PipelineSnapshot> {
  try {
    const rows = await listReleasesWithGates()
    const releases = rows.map(({ release, gates, alerts }) =>
      getWatchdogSummary(mapDbToRelease(release, gates, alerts))
    )
    return { data_source: 'neon', releases }
  } catch (err: unknown) {
    return {
      data_source: 'unavailable',
      data_source_error: (err as Error).message,
    }
  }
}
