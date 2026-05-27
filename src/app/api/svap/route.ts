// ============================================================
// ClearingOps — GET /api/svap
// Lista archivos SVAP con métricas
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { getSVAPArchivos, getSVAPMetricas, detectarSVAPsSinRespuesta } from '@/lib/svap-module'

export async function GET(request: NextRequest) {
  try {
    const dias = parseInt(request.nextUrl.searchParams.get('dias') ?? '7')

    // Detectar SVAPs sin respuesta antes de devolver los datos
    await detectarSVAPsSinRespuesta(120)

    const [archivos, metricas] = await Promise.all([
      getSVAPArchivos(dias),
      getSVAPMetricas(),
    ])

    return NextResponse.json({ ok: true, archivos, metricas })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
