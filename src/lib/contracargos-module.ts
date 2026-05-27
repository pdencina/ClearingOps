// ============================================================
// ClearingOps — Módulo Contracargos (KLAP-837/857)
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
export type EstadoContracargo =
  | 'enviado' | 'aceptado' | 'rechazado'
  | 'en_disputa' | 'vencido' | 'retirado'

export type TipoContracargo =
  | 'FRAUDE' | 'NO_RECIBIDO' | 'DUPLICADO'
  | 'MONTO_INCORRECTO' | 'CANCELACION' | 'OTRO'

export interface Contracargo {
  id: string
  numero_caso: string
  arn?: string
  trx_id_original?: string
  monto: number
  moneda: string
  marca: string
  tipo_contracargo: TipoContracargo
  codigo_razon?: string
  cod_comercio?: string
  cod_sucursal?: string
  nombre_comercio?: string
  fecha_transaccion: string
  fecha_envio: string
  fecha_limite: string
  fecha_respuesta?: string
  estado: EstadoContracargo
  monto_recuperado: number
  documentos_adjuntos: number
  notas?: string
  responsable?: string
  created_at: string
  updated_at: string
  // Calculados
  dias_restantes?: number
  es_urgente?: boolean
}

export interface ContracargoMetricas {
  total: number
  enviados: number
  proximos_vencer: number  // ≤ 7 días
  vencidos: number
  aceptados: number
  rechazados: number
  en_disputa: number
  monto_en_riesgo: number  // Enviados + próximos a vencer
  monto_recuperado: number
  tasa_exito: number       // % aceptados vs (aceptados + rechazados)
}

// ============================================================
// Labels
// ============================================================
export const ESTADO_CB_LABELS: Record<EstadoContracargo, string> = {
  enviado:    'Enviado — esperando respuesta',
  aceptado:   'Aceptado por la marca',
  rechazado:  'Rechazado por la marca',
  en_disputa: 'En disputa — documentación requerida',
  vencido:    'Vencido sin respuesta',
  retirado:   'Retirado por KLAP',
}

export const TIPO_CB_LABELS: Record<TipoContracargo, string> = {
  FRAUDE:            'Fraude',
  NO_RECIBIDO:       'Bien/servicio no recibido',
  DUPLICADO:         'Cargo duplicado',
  MONTO_INCORRECTO:  'Monto incorrecto',
  CANCELACION:       'Cancelación no procesada',
  OTRO:              'Otro',
}

// Días límite por marca para responder un contracargo
export const DIAS_LIMITE_MARCA: Record<string, number> = {
  VISA:        30,
  MASTERCARD:  45,
  AMEX:        30,
  MAESTRO:     45,
}

// ============================================================
// Calcular días restantes y urgencia
// ============================================================
function enriquecerContracargo(c: Contracargo): Contracargo {
  const hoy       = new Date()
  const limite    = new Date(c.fecha_limite)
  const diffMs    = limite.getTime() - hoy.getTime()
  const dias      = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return {
    ...c,
    dias_restantes: dias,
    es_urgente: c.estado === 'enviado' && dias <= 7,
  }
}

// ============================================================
// Queries
// ============================================================
export async function getContracargos(filtroEstado?: EstadoContracargo): Promise<Contracargo[]> {
  const sb = getSupabase()
  let query = sb
    .from('contracargos')
    .select('*')
    .order('fecha_limite', { ascending: true })

  if (filtroEstado) query = query.eq('estado', filtroEstado)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(enriquecerContracargo)
}

export async function getContracargoMetricas(): Promise<ContracargoMetricas> {
  const sb   = getSupabase()
  const hoy  = new Date().toISOString().split('T')[0]
  const en7d = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const { data } = await sb.from('contracargos').select('estado, monto, monto_recuperado, fecha_limite')
  const todos = data ?? []

  const enviados       = todos.filter(c => c.estado === 'enviado')
  const aceptados      = todos.filter(c => c.estado === 'aceptado')
  const rechazados     = todos.filter(c => c.estado === 'rechazado')
  const vencidos       = todos.filter(c => c.estado === 'vencido')
  const enDisputa      = todos.filter(c => c.estado === 'en_disputa')
  const proxVencer     = enviados.filter(c => c.fecha_limite <= en7d && c.fecha_limite >= hoy)

  const sum = (arr: typeof todos) => arr.reduce((s, c) => s + (c.monto ?? 0), 0)
  const resueltos = aceptados.length + rechazados.length
  const tasaExito = resueltos > 0
    ? Math.round((aceptados.length / resueltos) * 100)
    : 0

  return {
    total:            todos.length,
    enviados:         enviados.length,
    proximos_vencer:  proxVencer.length,
    vencidos:         vencidos.length,
    aceptados:        aceptados.length,
    rechazados:       rechazados.length,
    en_disputa:       enDisputa.length,
    monto_en_riesgo:  sum(enviados) + sum(proxVencer),
    monto_recuperado: aceptados.reduce((s, c) => s + (c.monto_recuperado ?? 0), 0),
    tasa_exito:       tasaExito,
  }
}

export async function actualizarEstadoContracargo(
  id: string,
  estado: EstadoContracargo,
  datos?: {
    monto_recuperado?: number
    notas?: string
    responsable?: string
  }
): Promise<void> {
  const sb = getSupabase()

  // Obtener estado anterior para el historial
  const { data: actual } = await sb
    .from('contracargos')
    .select('estado, numero_caso, marca, monto')
    .eq('id', id)
    .single()

  const update: Record<string, unknown> = {
    estado,
    updated_at: new Date().toISOString(),
    ...(estado === 'aceptado' || estado === 'rechazado' || estado === 'en_disputa'
      ? { fecha_respuesta: new Date().toISOString() }
      : {}),
    ...datos,
  }

  const { error } = await sb.from('contracargos').update(update).eq('id', id)
  if (error) throw error

  // Registrar evento en historial
  await sb.from('contracargos_eventos').insert({
    contracargo_id: id,
    estado_anterior: actual?.estado,
    estado_nuevo: estado,
    descripcion: datos?.notas,
    usuario: datos?.responsable ?? 'Usuario',
  })

  // Generar alerta si fue rechazado o venció
  if (estado === 'rechazado' || estado === 'vencido') {
    const motivo = estado === 'rechazado' ? 'rechazado por la marca' : 'vencido sin respuesta'
    await sb.from('alertas').insert({
      tipo:      'diferencia_cuadratura',
      severidad: 'alta',
      marca:     actual?.marca,
      titulo:    `Contracargo ${actual?.numero_caso} ${motivo}`,
      detalle:   `Monto no recuperado: $${(actual?.monto ?? 0).toLocaleString('es-CL')} CLP. ${datos?.notas ?? ''}`,
      cantidad_trx: 1,
      estado: 'activa',
    })
  }
}

// ============================================================
// Detectar contracargos próximos a vencer y vencidos
// Llamado por el cron diario
// ============================================================
export async function detectarContracargosVencidos(): Promise<{
  proximos: number
  vencidos: number
  alertas: number
}> {
  const sb  = getSupabase()
  const hoy = new Date().toISOString().split('T')[0]
  const en3d = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]

  // Marcar como vencidos los que ya pasaron su fecha límite
  const { data: vencidos } = await sb
    .from('contracargos')
    .select('id, numero_caso, marca, monto')
    .eq('estado', 'enviado')
    .lt('fecha_limite', hoy)

  for (const cb of vencidos ?? []) {
    await actualizarEstadoContracargo(cb.id, 'vencido', {
      notas: `Venció el plazo sin respuesta de la marca — monto no recuperable`
    })
  }

  // Alertar los que vencen en 3 días o menos
  const { data: urgentes } = await sb
    .from('contracargos')
    .select('id, numero_caso, marca, monto, fecha_limite')
    .eq('estado', 'enviado')
    .gte('fecha_limite', hoy)
    .lte('fecha_limite', en3d)

  let alertasGeneradas = 0
  for (const cb of urgentes ?? []) {
    const dias = Math.ceil(
      (new Date(cb.fecha_limite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    // Verificar si ya existe alerta activa para este contracargo
    const { data: existente } = await sb
      .from('alertas')
      .select('id')
      .ilike('titulo', `%${cb.numero_caso}%`)
      .in('estado', ['activa', 'en_revision'])
      .single()

    if (!existente) {
      await sb.from('alertas').insert({
        tipo:      'ctf_retrasado',
        severidad: dias <= 1 ? 'critica' : 'alta',
        marca:     cb.marca,
        titulo:    `Contracargo ${cb.numero_caso} vence en ${dias} día${dias !== 1 ? 's' : ''}`,
        detalle:   `Monto en riesgo: $${(cb.monto ?? 0).toLocaleString('es-CL')} CLP. Fecha límite: ${cb.fecha_limite}`,
        cantidad_trx: 1,
        estado: 'activa',
      })
      alertasGeneradas++
    }
  }

  return {
    proximos: (urgentes ?? []).length,
    vencidos: (vencidos ?? []).length,
    alertas:  alertasGeneradas,
  }
}
