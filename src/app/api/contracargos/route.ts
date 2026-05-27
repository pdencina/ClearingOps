// ============================================================
// ClearingOps — GET /api/contracargos
// Lista contracargos con métricas y detección de vencidos
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import {
  getContracargos, getContracargoMetricas,
  detectarContracargosVencidos, actualizarEstadoContracargo
} from '@/lib/contracargos-module'
import type { EstadoContracargo } from '@/lib/contracargos-module'

export async function GET(request: NextRequest) {
  try {
    const estado = request.nextUrl.searchParams.get('estado') as EstadoContracargo | null

    // Detectar vencidos y próximos a vencer antes de devolver datos
    await detectarContracargosVencidos()

    const [contracargos, metricas] = await Promise.all([
      getContracargos(estado ?? undefined),
      getContracargoMetricas(),
    ])

    return NextResponse.json({ ok: true, contracargos, metricas })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.id || !body.estado) {
      return NextResponse.json(
        { error: 'id y estado son requeridos' },
        { status: 400 }
      )
    }

    await actualizarEstadoContracargo(body.id, body.estado as EstadoContracargo, {
      monto_recuperado: body.monto_recuperado,
      notas:           body.notas,
      responsable:     body.responsable,
    })

    return NextResponse.json({ ok: true, mensaje: `Estado actualizado a: ${body.estado}` })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
