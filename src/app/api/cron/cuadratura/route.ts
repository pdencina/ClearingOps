// ============================================================
// ClearingOps — GET /api/cron/cuadratura
// Vercel lo llama automáticamente a las 23:30 hora Chile (02:30 UTC)
// También puede llamarse manualmente con ?fecha=2026-05-11
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { ejecutarCuadraturaCompleta } from '@/lib/cuadratura-engine'
import { enviarEmailCuadratura } from '@/lib/email-service'
import { detectarContracargosVencidos } from '@/lib/contracargos-module'

export async function GET(request: NextRequest) {
  // Verificar token de seguridad — evita que alguien externo lo dispare
  const token = request.nextUrl.searchParams.get('token')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && token !== cronSecret) {
    // Vercel llama con el header Authorization automáticamente
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  // Fecha a procesar — por defecto hoy, o la que venga por parámetro
  const fechaParam = request.nextUrl.searchParams.get('fecha')
  const fecha = fechaParam ?? new Date().toISOString().split('T')[0]

  console.log(`[cron] Iniciando cuadratura automática para ${fecha}`)
  const inicio = Date.now()

  try {
    // 1. Ejecutar cuadratura completa
    const resultado = await ejecutarCuadraturaCompleta(fecha)

    // 2. Detectar contracargos vencidos y próximos a vencer
    const cbResult = await detectarContracargosVencidos()
    console.log(`[cron] Contracargos: ${cbResult.vencidos} vencidos, ${cbResult.proximos} próximos a vencer, ${cbResult.alertas} alertas nuevas`)

    // 2. Enviar email si hay diferencias
    const emailsDestino = (process.env.EMAIL_ALERTAS ?? '').split(',').filter(Boolean)
    let emailEnviado = false

    if (emailsDestino.length > 0) {
      emailEnviado = await enviarEmailCuadratura(
        resultado.resultados,
        fecha,
        emailsDestino
      )
    }

    const duracion = Date.now() - inicio

    return NextResponse.json({
      ok:              resultado.ok,
      fecha,
      resumen:         resultado.resumen,
      marcas:          resultado.resultados.length,
      alertas_nuevas:  resultado.alertas_nuevas,
      email_enviado:   emailEnviado,
      duracion_ms:     duracion,
      resultados:      resultado.resultados.map(r => ({
        marca:       r.marca,
        estado:      r.estado,
        trx_svxp:    r.trx_svxp,
        diferencia:  r.diferencia,
        alertas:     r.alertas.length,
      }))
    })

  } catch (error) {
    console.error('[cron] Error fatal:', error)
    return NextResponse.json(
      {
        ok:     false,
        fecha,
        error:  error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
