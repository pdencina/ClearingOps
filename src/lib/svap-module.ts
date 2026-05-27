// ============================================================
// ClearingOps — Módulo SVAP
// Tipos, queries y lógica de negocio
// ============================================================

import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ============================================================
// Tipos
// ============================================================
export type TipoSVAP = 'TARIFAS' | 'BINS' | 'PARAMETROS' | 'COMERCIOS' | 'SUCURSALES' | 'OTRO'
export type EstadoSVAP = 'enviado' | 'procesado_ok' | 'procesado_parcial' | 'error' | 'sin_respuesta'

export interface SVAPArchivo {
  id: string
  nombre: string
  tipo_svap: TipoSVAP
  marca: string
  fecha_envio: string
  fecha_proceso: string
  total_registros: number
  estado_envio: EstadoSVAP
  registros_ok: number
  registros_error: number
  registros_omitidos: number
  codigo_respuesta?: string
  mensaje_respuesta?: string
  tiempo_proceso_seg?: number
  enviado_por?: string
  notas?: string
  created_at: string
  updated_at: string
}

export interface SVAPError {
  id: string
  svap_id: string
  linea?: number
  codigo_error: string
  descripcion: string
  dato_afectado?: string
  severidad: 'critico' | 'error' | 'advertencia'
  created_at: string
}

export interface SVAPMetricas {
  total_hoy: number
  pendientes_respuesta: number
  con_error: number
  procesados_ok: number
  parciales: number
  tasa_exito: number
}

// ============================================================
// Labels y colores por estado
// ============================================================
export const ESTADO_LABELS: Record<EstadoSVAP, string> = {
  enviado:             'Enviado — esperando respuesta',
  procesado_ok:        'Procesado correctamente',
  procesado_parcial:   'Proceso parcial — revisar errores',
  error:               'Error en el procesamiento',
  sin_respuesta:       'Sin respuesta de SmartVista',
}

export const TIPO_LABELS: Record<TipoSVAP, string> = {
  TARIFAS:    'Tarifas',
  BINS:       'BINs',
  PARAMETROS: 'Parámetros',
  COMERCIOS:  'Comercios',
  SUCURSALES: 'Sucursales',
  OTRO:       'Otro',
}

// ============================================================
// Queries
// ============================================================
export async function getSVAPArchivos(dias = 7): Promise<SVAPArchivo[]> {
  const sb = getSupabase()
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)

  const { data, error } = await sb
    .from('svap_archivos')
    .select('*')
    .gte('fecha_proceso', desde.toISOString().split('T')[0])
    .order('fecha_envio', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getSVAPErrores(svapId: string): Promise<SVAPError[]> {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('svap_errores')
    .select('*')
    .eq('svap_id', svapId)
    .order('linea', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getSVAPMetricas(): Promise<SVAPMetricas> {
  const sb = getSupabase()
  const hoy = new Date().toISOString().split('T')[0]

  const { data } = await sb
    .from('svap_archivos')
    .select('estado_envio')
    .gte('fecha_proceso', hoy)

  const archivos = data ?? []
  const total = archivos.length
  const ok = archivos.filter(a => a.estado_envio === 'procesado_ok').length
  const error = archivos.filter(a => a.estado_envio === 'error').length
  const parcial = archivos.filter(a => a.estado_envio === 'procesado_parcial').length
  const pendientes = archivos.filter(a => a.estado_envio === 'enviado' || a.estado_envio === 'sin_respuesta').length

  return {
    total_hoy: total,
    pendientes_respuesta: pendientes,
    con_error: error + parcial,
    procesados_ok: ok,
    parciales: parcial,
    tasa_exito: total > 0 ? Math.round((ok / total) * 100) : 0,
  }
}

export async function registrarSVAP(svap: Omit<SVAPArchivo, 'id' | 'created_at' | 'updated_at'>): Promise<SVAPArchivo> {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('svap_archivos')
    .insert(svap)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function actualizarEstadoSVAP(
  id: string,
  estado: EstadoSVAP,
  resultado?: {
    registros_ok?: number
    registros_error?: number
    registros_omitidos?: number
    codigo_respuesta?: string
    mensaje_respuesta?: string
    tiempo_proceso_seg?: number
  }
): Promise<void> {
  const sb = getSupabase()
  const { error } = await sb
    .from('svap_archivos')
    .update({ estado_envio: estado, updated_at: new Date().toISOString(), ...resultado })
    .eq('id', id)

  if (error) throw error

  // Generar alerta automática si hay error o proceso parcial
  if (estado === 'error' || estado === 'sin_respuesta' || estado === 'procesado_parcial') {
    const { data: svap } = await sb
      .from('svap_archivos')
      .select('nombre, tipo_svap, fecha_proceso, registros_error')
      .eq('id', id)
      .single()

    if (svap) {
      const severidad = estado === 'error' ? 'critica' : 'alta'
      const titulo =
        estado === 'error'
          ? `Error en SVAP ${svap.tipo_svap} — ${svap.nombre}`
          : estado === 'sin_respuesta'
          ? `Sin respuesta de SmartVista para SVAP ${svap.tipo_svap}`
          : `Proceso parcial en SVAP ${svap.tipo_svap} — ${svap.registros_error} registros con error`

      await sb.from('alertas').insert({
        tipo:          'svxp_no_llegó',
        severidad,
        fecha_proceso: svap.fecha_proceso,
        titulo,
        detalle:       resultado?.mensaje_respuesta ?? 'Sin detalle disponible',
        cantidad_trx:  resultado?.registros_error ?? 0,
        estado:        'activa',
      })
    }
  }
}

// ============================================================
// Monitor de SVAPs sin respuesta
// Detecta archivos enviados hace más de X minutos sin confirmación
// ============================================================
export async function detectarSVAPsSinRespuesta(minutosLimite = 120): Promise<SVAPArchivo[]> {
  const sb = getSupabase()
  const limite = new Date()
  limite.setMinutes(limite.getMinutes() - minutosLimite)

  const { data } = await sb
    .from('svap_archivos')
    .select('*')
    .eq('estado_envio', 'enviado')
    .lt('fecha_envio', limite.toISOString())

  const sinRespuesta = data ?? []

  // Actualizar estado y generar alertas para los que superaron el límite
  for (const svap of sinRespuesta) {
    await actualizarEstadoSVAP(svap.id, 'sin_respuesta', {
      mensaje_respuesta: `Sin confirmación de SmartVista después de ${minutosLimite} minutos`
    })
  }

  return sinRespuesta
}
