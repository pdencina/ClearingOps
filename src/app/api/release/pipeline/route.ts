import { NextResponse } from 'next/server'
import { getPipelineSnapshot } from '@/lib/watchdog-snapshot'

export const dynamic = 'force-dynamic'

// GET /api/release/pipeline
// Devuelve TODOS los releases (cualquier fase) con su resumen, para
// la vista Pipeline. A diferencia de /api/release/watchdog (que solo
// trae el release más próximo a su PaP), esto da el panorama completo.
export async function GET() {
  const snapshot = await getPipelineSnapshot()
  return NextResponse.json(snapshot)
}
