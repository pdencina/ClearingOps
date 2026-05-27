// ============================================================
// ClearingOps — POST /api/svap/resultado
// BPC llama a este endpoint cuando SmartVista termina de procesar un SVAP
// También puede llamarse manualmente para registrar el resultado
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { actualizarEstadoSVAP, registrarSVAP, getSVAPErrores } from '@/lib/svap-module'
import type { EstadoSVAP, TipoSVAP } from '@/lib/svap-module'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // ============================================================
    // Modo 1: Registrar nuevo SVAP enviado
    // POST /api/svap/resultado { accion: "registrar", ... }
    // ============================================================
    if (body.accion === 'registrar') {
      const svap = await registrarSVAP({
        nombre:          body.nombre,
        tipo_svap:       (body.tipo_svap ?? 'OTRO') as TipoSVAP,
        marca:           body.marca ?? 'TODOS',
        fecha_envio:     new Date().toISOString(),
        fecha_proceso:   body.fecha_proceso ?? new Date().toISOString().split('T')[0],
        total_registros: body.total_registros ?? 0,
        estado_envio:    'enviado',
        registros_ok:    0,
        registros_error: 0,
        registros_omitidos: 0,
        enviado_por:     body.enviado_por ?? 'Manual',
      })
      return NextResponse.json({ ok: true, svap_id: svap.id, mensaje: 'SVAP registrado, esperando resultado de SmartVista' })
    }

    // ============================================================
    // Modo 2: Actualizar resultado de un SVAP ya registrado
    // POST /api/svap/resultado { accion: "resultado", svap_id: "...", ... }
    // ============================================================
    if (body.accion === 'resultado') {
      if (!body.svap_id) {
        return NextResponse.json({ error: 'svap_id requerido' }, { status: 400 })
      }

      const estado: EstadoSVAP =
        body.registros_error > 0 && body.registros_ok === 0 ? 'error' :
        body.registros_error > 0 ? 'procesado_parcial' :
        'procesado_ok'

      await actualizarEstadoSVAP(body.svap_id, estado, {
        registros_ok:       body.registros_ok ?? 0,
        registros_error:    body.registros_error ?? 0,
        registros_omitidos: body.registros_omitidos ?? 0,
        codigo_respuesta:   body.codigo_respuesta,
        mensaje_respuesta:  body.mensaje_respuesta,
        tiempo_proceso_seg: body.tiempo_proceso_seg,
      })

      // Si hay errores detallados, guardarlos
      if (body.errores && Array.isArray(body.errores)) {
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const erroresParaInsertar = body.errores.map((e: {
          linea?: number
          codigo_error: string
          descripcion: string
          dato_afectado?: string
          severidad?: string
        }) => ({
          svap_id:       body.svap_id,
          linea:         e.linea,
          codigo_error:  e.codigo_error,
          descripcion:   e.descripcion,
          dato_afectado: e.dato_afectado,
          severidad:     e.severidad ?? 'error',
        }))
        await sb.from('svap_errores').insert(erroresParaInsertar)
      }

      return NextResponse.json({
        ok:     true,
        estado,
        mensaje: estado === 'procesado_ok'
          ? 'SVAP procesado correctamente por SmartVista'
          : estado === 'procesado_parcial'
          ? `SVAP con proceso parcial — ${body.registros_error} registros con error`
          : 'Error en el procesamiento — se generó alerta automática'
      })
    }

    // ============================================================
    // Modo 3: Consultar errores de un SVAP específico
    // POST /api/svap/resultado { accion: "errores", svap_id: "..." }
    // ============================================================
    if (body.accion === 'errores') {
      if (!body.svap_id) {
        return NextResponse.json({ error: 'svap_id requerido' }, { status: 400 })
      }
      const errores = await getSVAPErrores(body.svap_id)
      return NextResponse.json({ ok: true, errores })
    }

    return NextResponse.json({ error: 'accion no reconocida — usar: registrar, resultado, errores' }, { status: 400 })

  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
