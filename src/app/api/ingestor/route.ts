// ============================================================
// ClearingOps — API Route: POST /api/ingestor
// Recibe un archivo SVXP, lo parsea, valida y guarda en Supabase
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { parsearSVXP, resumirSVXP, validarOperacion } from '@/lib/svxp-parser'
import {
  insertarArchivo, insertarTransacciones,
  insertarAlerta, insertarCuadratura
} from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData     = await request.formData()
    const file         = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
    }

    // Validar extensión
    if (!file.name.endsWith('.xml') && !file.name.endsWith('.gpg')) {
      return NextResponse.json(
        { error: 'Solo se aceptan archivos .xml o .gpg' },
        { status: 400 }
      )
    }

    // Leer contenido
    const contenido = await file.text()

    // Parsear SVXP
    const svxp    = parsearSVXP(contenido, file.name)
    const resumen = resumirSVXP(svxp)

    // Determinar estado inicial del archivo
    const conErrores = resumen.con_errores_validacion > 0
    const estadoArchivo = conErrores ? 'advertencia' : 'ok'

    // 1. Insertar registro del archivo en Supabase
    const archivoGuardado = await insertarArchivo({
      nombre:         file.name,
      tipo:           'SVXP',
      marca:          svxp.marca,
      fecha_proceso:  svxp.start_date,
      total_trx:      svxp.operaciones.length,
      estado:         estadoArchivo,
      notas:          conErrores
        ? `${resumen.con_errores_validacion} operaciones con errores de validación`
        : undefined,
    })

    // 2. Preparar transacciones para insertar
    const trxsParaInsertar = svxp.operaciones.map(op => {
      const validacion = validarOperacion(op)
      return {
        archivo_id:          archivoGuardado.id,
        trx_id:              op.klap_codigo || op.originator_refnum || op.external_auth_id,
        tipo_trx:            op.oper_type,
        marca:               svxp.marca,
        monto:               op.monto,
        moneda:              op.moneda,
        fecha_trx:           op.oper_date,
        estado:              mapearEstado(op.status),
        merchant_number:     op.merchant_number || undefined,
        nombre_comercio:     op.merchant_name   || undefined,
        mcc:                 op.mcc             || undefined,
        originator_refnum:   op.originator_refnum || undefined,
        card_number:         op.card_number ? maskCard(op.card_number) : undefined,
        auth_code:           op.auth_code   || undefined,
        es_cuota:            false,
        notas:               validacion.errores.length > 0
          ? validacion.errores.join(' | ')
          : undefined,
      }
    })

    // 3. Insertar transacciones en lotes
    const insertadas = await insertarTransacciones(trxsParaInsertar)

    // 4. Actualizar cuadratura del día
    const cuadraturaRow = {
      fecha:          svxp.start_date,
      marca:          svxp.marca,
      trx_svxp:       svxp.operaciones.length,
      trx_ctf:        0,
      trx_ipm:        0,
      trx_error:      resumen.con_errores_validacion,
      trx_frozen:     0,
      trx_excluidas:  0,
      estado:         conErrores ? 'diferencia' : 'pendiente',
      notas:          `SVXP ingresado a las ${new Date().toLocaleTimeString('es-CL')}`,
    }
    await insertarCuadratura([cuadraturaRow])

    // 5. Generar alertas automáticas si hay problemas
    const alertasGeneradas: string[] = []

    // Alerta: transacciones con fecha futura
    const conFechaFutura = svxp.operaciones.filter(op => {
      const fechaOp = new Date(op.oper_date)
      const manana  = new Date()
      manana.setDate(manana.getDate() + 1)
      return fechaOp > manana
    })
    if (conFechaFutura.length > 0) {
      await insertarAlerta({
        tipo:          'trx_opst500',
        severidad:     'alta',
        marca:         svxp.marca,
        fecha_proceso: svxp.start_date,
        titulo:        `${conFechaFutura.length} TRX con fecha futura — riesgo OPST0500`,
        detalle:       'Transacciones con fecha futura detectadas al ingresar SVXP. Pueden causar error de tarificación en SmartVista.',
        cantidad_trx:  conFechaFutura.length,
        archivo_id:    archivoGuardado.id,
      })
      alertasGeneradas.push('trx_fecha_futura')
    }

    // Alerta: anulaciones sin código original (causa Frozen)
    const anulacionesSinOriginal = svxp.operaciones.filter(op =>
      op.oper_type === 'OPTP0030' &&
      (!op.klap_codigo_original || op.klap_codigo_original === '0')
    )
    if (anulacionesSinOriginal.length > 0) {
      await insertarAlerta({
        tipo:          'trx_frozen',
        severidad:     'alta',
        marca:         svxp.marca,
        fecha_proceso: svxp.start_date,
        titulo:        `${anulacionesSinOriginal.length} anulaciones sin TRX original — quedarán Frozen`,
        detalle:       'Anulaciones con KLAP_CODIGO_ORIGINAL vacío o cero. Sin la referencia original, SmartVista no puede vincular la anulación y la dejará en estado Frozen.',
        cantidad_trx:  anulacionesSinOriginal.length,
        archivo_id:    archivoGuardado.id,
      })
      alertasGeneradas.push('anulaciones_sin_original')
    }

    // 6. Respuesta exitosa
    return NextResponse.json({
      ok:      true,
      archivo: {
        id:             archivoGuardado.id,
        nombre:         file.name,
        marca:          svxp.marca,
        fecha_proceso:  svxp.start_date,
        total_trx:      svxp.operaciones.length,
        insertadas,
        estado:         estadoArchivo,
      },
      resumen: {
        por_tipo:               resumen.por_tipo,
        por_status:             resumen.por_status,
        monto_total:            resumen.monto_total,
        con_errores_validacion: resumen.con_errores_validacion,
        con_advertencias:       resumen.con_advertencias,
        reversales:             resumen.reversales,
      },
      alertas_generadas: alertasGeneradas,
    })

  } catch (error) {
    console.error('[ingestor] Error completo:', JSON.stringify(error))
    let mensaje = 'Error desconocido'
    let detalle = ''
    if (error instanceof Error) {
      mensaje = error.message
    } else if (typeof error === 'object' && error !== null) {
      const e = error as Record<string, unknown>
      mensaje = String(e.message ?? e.code ?? JSON.stringify(e))
      detalle = String(e.details ?? e.hint ?? '')
    } else {
      mensaje = String(error)
    }
    return NextResponse.json(
      { error: 'Error procesando el archivo', detalle: mensaje, hint: detalle },
      { status: 500 }
    )
  }
}

// ============================================================
// Helpers
// ============================================================
function mapearEstado(statusBPC: string): string {
  const map: Record<string, string> = {
    OPST0100: 'procesada',
    OPST0200: 'pendiente',
    OPST0400: 'enviada',
    OPST0500: 'error',
    OPST0600: 'error',
    OPST0700: 'frozen',
  }
  return map[statusBPC] ?? 'pendiente'
}

function maskCard(pan: string): string {
  if (pan.length < 10) return pan
  return pan.slice(0, 6) + '****' + pan.slice(-4)
}
