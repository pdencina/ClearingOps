// ============================================================
// KLAP CORE — Watchdog Snapshot
// Punto único que decide si el Release Watchdog opera con datos
// reales (Supabase) o cae a modo demo, y arma el WatchdogSummary
// resultante. Se usa tanto desde la página server-side como
// desde el API route (botón "Actualizar" en el cliente).
// ============================================================

import { getWatchdogSummary, createDemoRelease, mapDbToRelease, type WatchdogSummary } from '@/lib/engines/release-watchdog'
import { getActiveRelease } from '@/lib/watchdog-db'

export type DataSource = 'neon' | 'demo_no_active_release' | 'demo_neon_unavailable'

export interface WatchdogSnapshot extends WatchdogSummary {
  data_source: DataSource
  data_source_error?: string
}

export async function getWatchdogSnapshot(): Promise<WatchdogSnapshot> {
  try {
    const { release: dbRelease, gates, alerts } = await getActiveRelease()

    if (!dbRelease) {
      const demo = createDemoRelease()
      return { ...getWatchdogSummary(demo), data_source: 'demo_no_active_release' }
    }

    const release = mapDbToRelease(dbRelease, gates, alerts)
    return { ...getWatchdogSummary(release), data_source: 'neon' }
  } catch (err: unknown) {
    // Neon no configurado (.env.local sin DATABASE_URL) u otro error de conexión:
    // no rompemos la app, caemos a modo demo y lo dejamos explícito.
    const demo = createDemoRelease()
    return {
      ...getWatchdogSummary(demo),
      data_source: 'demo_neon_unavailable',
      data_source_error: (err as Error).message,
    }
  }
}
