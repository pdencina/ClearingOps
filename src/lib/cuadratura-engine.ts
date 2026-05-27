// ============================================================
// ClearingOps — Motor de Cuadratura
// Compara TRX recibidas (SVXP) vs enviadas (CTF/IPM) por día y marca
// Esta es la lógica central del sistema — reemplaza la cuadratura manual
// ============================================================

import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

// ============================================================
// Tipos internos del motor
// ============================================================
export interface ResultadoCuadratura {
  fecha: string
  marca: string
  trx_svxp: number
  trx_ctf: number
  trx_ipm: number
  trx_error: number
  trx_frozen: number
  trx_excluidas: number
  diferencia: number
  estado: 'ok' | 'diferencia' | 'error' | 'sin_datos'
  alertas: AlertaCuadratura[]
  detalle: string
}

export interface AlertaCuadratura {
  tipo: string
  severidad: 'critica' | 'alta' | 'media' | 'baja'
  titulo: string
  detalle: string
  cantidad_trx: number
}

// ============================================================
// FUNCIÓN PRINCIPAL — ejecutar cuadratura de un día y marca
// ============================================================
export async function ejecutarCuadratura(
  fecha: string,
  marca: string
): Promise<ResultadoCuadratura> {
  const sb = getSupabase()
  const alertas: AlertaCuadratura[] = []

  // 1. Contar TRX por estado para esa fecha y marca
  const { data: trxs, error } = await sb
    .from('transacciones')
    .select('estado, es_cuota')
    .eq('marca', marca)
    .gte('fecha_trx', `${fecha}T00:00:00`)
    .lte('fecha_trx', `${fecha}T23:59:59`)

  if (error) {
    return {
      fecha, marca,
      trx_svxp: 0, trx_ctf: 0, trx_ipm: 0,
      trx_error: 0, trx_frozen: 0, trx_excluidas: 0,
      diferencia: 0, estado: 'error',
      alertas: [], detalle: `Error consultando DB: ${error.message}`
    }
  }

  if (!trxs || trxs.length === 0) {
    return {
      fecha, marca,
      trx_svxp: 0, trx_ctf: 0, trx_ipm: 0,
      trx_error: 0, trx_frozen: 0, trx_excluidas: 0,
      diferencia: 0, estado: 'sin_datos',
      alertas: [], detalle: 'Sin transacciones para esta fecha y marca'
    }
  }

  // 2. Agrupar por estado
  const conteo: Record<string, number> = {}
  for (const trx of trxs) {
    conteo[trx.estado] = (conteo[trx.estado] ?? 0) + 1
  }

  const trx_svxp     = trxs.length
  const trx_enviadas = (conteo['enviada']   ?? 0) + (conteo['confirmada'] ?? 0)
  const trx_error    = conteo['error']      ?? 0
  const trx_frozen   = conteo['frozen']     ?? 0
  const trx_excluidas= conteo['excluida']   ?? 0

  // Para CTF vs IPM — VISA usa CTF, MC usa IPM
  const trx_ctf = marca === 'VISA'        ? trx_enviadas : 0
  const trx_ipm = marca === 'MASTERCARD'  ? trx_enviadas : 0

  // Diferencia = lo que llegó menos lo que se fue correctamente
  const diferencia = trx_svxp - trx_enviadas - trx_error - trx_frozen - trx_excluidas

  // 3. Generar alertas según las diferencias encontradas
  if (diferencia > 0) {
    const severidad = diferencia > 100 ? 'critica' : diferencia > 10 ? 'alta' : 'media'
    alertas.push({
      tipo:        'diferencia_cuadratura',
      severidad,
      titulo:      `Diferencia de cuadratura ${marca} — ${diferencia.toLocaleString('es-CL')} TRX sin enviar`,
      detalle:     `${trx_svxp.toLocaleString('es-CL')} TRX en SVXP vs ${trx_enviadas.toLocaleString('es-CL')} enviadas a la marca. Diferencia: ${diferencia.toLocaleString('es-CL')} TRX.`,
      cantidad_trx: diferencia,
    })
  }

  if (trx_error > 0) {
    alertas.push({
      tipo:        'trx_opst500',
      severidad:   trx_error > 50 ? 'alta' : 'media',
      titulo:      `${trx_error.toLocaleString('es-CL')} TRX con error en ${marca} — ${fecha}`,
      detalle:     `Transacciones en estado error. Pueden ser OPST0500 por tarifa no encontrada o fecha futura. Revisar en SmartVista.`,
      cantidad_trx: trx_error,
    })
  }

  if (trx_frozen > 0) {
    alertas.push({
      tipo:        'trx_frozen',
      severidad:   trx_frozen > 20 ? 'alta' : 'media',
      titulo:      `${trx_frozen.toLocaleString('es-CL')} TRX en estado Frozen en ${marca} — ${fecha}`,
      detalle:     `Transacciones Frozen. Probable causa: anulaciones sin TRX original o cuotas sin tarifa configurada.`,
      cantidad_trx: trx_frozen,
    })
  }

  // Verificar si llegaron archivos SVXP del día
  const { data: archivos } = await sb
    .from('archivos')
    .select('id, nombre, total_trx, estado')
    .eq('marca', marca)
    .eq('fecha_proceso', fecha)
    .eq('tipo', 'SVXP')

  if (!archivos || archivos.length === 0) {
    alertas.push({
      tipo:        'svxp_no_llegó',
      severidad:   'alta',
      titulo:      `Sin archivos SVXP de ${marca} para el ${fecha}`,
      detalle:     `No se recibió ningún archivo SVXP de ${marca} para la fecha ${fecha}. Verificar con BPC.`,
      cantidad_trx: 0,
    })
  }

  const estado: ResultadoCuadratura['estado'] =
    diferencia === 0 && trx_error === 0 && trx_frozen === 0 ? 'ok' : 'diferencia'

  return {
    fecha, marca,
    trx_svxp, trx_ctf, trx_ipm,
    trx_error, trx_frozen, trx_excluidas,
    diferencia, estado, alertas,
    detalle: `Cuadratura ejecutada. ${trx_svxp} recibidas, ${trx_enviadas} enviadas, ${diferencia} diferencia.`
  }
}

// ============================================================
// Guardar resultado en Supabase
// ============================================================
export async function guardarCuadratura(resultado: ResultadoCuadratura) {
  const sb = getSupabase()

  // Upsert cuadratura_diaria
  const { error: errCuad } = await sb
    .from('cuadratura_diaria')
    .upsert({
      fecha:          resultado.fecha,
      marca:          resultado.marca,
      trx_svxp:       resultado.trx_svxp,
      trx_ctf:        resultado.trx_ctf,
      trx_ipm:        resultado.trx_ipm,
      trx_error:      resultado.trx_error,
      trx_frozen:     resultado.trx_frozen,
      trx_excluidas:  resultado.trx_excluidas,
      estado:         resultado.estado === 'sin_datos' ? 'pendiente' : resultado.estado,
      ejecutado_at:   new Date().toISOString(),
      notas:          resultado.detalle,
    }, { onConflict: 'fecha,marca' })

  if (errCuad) {
    console.error('[cuadratura] Error guardando:', errCuad.message)
    return false
  }

  // Insertar alertas generadas (solo si hay diferencias)
  for (const alerta of resultado.alertas) {
    // Verificar si ya existe una alerta activa del mismo tipo para no duplicar
    const { data: existente } = await sb
      .from('alertas')
      .select('id')
      .eq('tipo', alerta.tipo)
      .eq('marca', resultado.marca)
      .eq('fecha_proceso', resultado.fecha)
      .in('estado', ['activa', 'en_revision'])
      .single()

    if (!existente) {
      await sb.from('alertas').insert({
        tipo:          alerta.tipo,
        severidad:     alerta.severidad,
        marca:         resultado.marca,
        fecha_proceso: resultado.fecha,
        titulo:        alerta.titulo,
        detalle:       alerta.detalle,
        cantidad_trx:  alerta.cantidad_trx,
        estado:        'activa',
      })
    }
  }

  return true
}

// ============================================================
// Ejecutar cuadratura completa — todas las marcas del día
// ============================================================
export async function ejecutarCuadraturaCompleta(fecha?: string): Promise<{
  fecha: string
  resultados: ResultadoCuadratura[]
  resumen: string
  alertas_nuevas: number
  ok: boolean
}> {
  const fechaProceso = fecha ?? new Date().toISOString().split('T')[0]
  const marcas = ['VISA', 'MASTERCARD', 'MAESTRO', 'AMEX']
  const resultados: ResultadoCuadratura[] = []
  let alertas_nuevas = 0

  console.log(`[cuadratura] Iniciando cuadratura completa para ${fechaProceso}`)

  for (const marca of marcas) {
    const resultado = await ejecutarCuadratura(fechaProceso, marca)

    if (resultado.estado !== 'sin_datos') {
      resultados.push(resultado)
      await guardarCuadratura(resultado)
      alertas_nuevas += resultado.alertas.length
      console.log(`[cuadratura] ${marca}: ${resultado.estado} — diferencia: ${resultado.diferencia}`)
    }
  }

  const conDiferencia = resultados.filter(r => r.estado === 'diferencia').length
  const totalTrx      = resultados.reduce((s, r) => s + r.trx_svxp, 0)
  const totalDif      = resultados.reduce((s, r) => s + r.diferencia, 0)

  const resumen = resultados.length === 0
    ? `Sin datos para ${fechaProceso}`
    : `${resultados.length} marcas procesadas. ${totalTrx.toLocaleString('es-CL')} TRX totales. ${conDiferencia} marcas con diferencia. ${totalDif.toLocaleString('es-CL')} TRX sin cuadrar. ${alertas_nuevas} alertas nuevas generadas.`

  console.log(`[cuadratura] Completada: ${resumen}`)

  return {
    fecha:    fechaProceso,
    resultados,
    resumen,
    alertas_nuevas,
    ok: conDiferencia === 0,
  }
}
