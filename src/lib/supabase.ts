// ============================================================
// ClearingOps — Cliente Supabase
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase no configurado — agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY')
  _supabase = createClient(url, key)
  return _supabase
}

// Cliente singleton para uso en componentes cliente
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => getSupabase()[prop as keyof SupabaseClient],
})

// ============================================================
// Queries principales
// ============================================================

export async function getMetricas() {
  const hoy = new Date().toISOString().split('T')[0]

  const [{ data: cuadratura }, { data: alertas }, { data: archivos }] = await Promise.all([
    supabase
      .from('cuadratura_diaria')
      .select('*')
      .eq('fecha', hoy),
    supabase
      .from('alertas')
      .select('severidad, estado')
      .in('estado', ['activa', 'en_revision']),
    supabase
      .from('archivos')
      .select('total_trx')
      .eq('fecha_proceso', hoy),
  ])

  const total_trx_hoy = (archivos ?? [])
    .filter((a: { total_trx: number }) => true)
    .reduce((sum: number, a: { total_trx: number }) => sum + a.total_trx, 0)

  const alertas_criticas = (alertas ?? [])
    .filter((a: { severidad: string }) => a.severidad === 'critica').length

  const diferencia_total = (cuadratura ?? [])
    .reduce((sum: number, c: { diferencia: number }) => sum + (c.diferencia ?? 0), 0)

  return {
    total_trx_hoy,
    alertas_criticas,
    alertas_activas: (alertas ?? []).length,
    diferencia_total,
    archivos_hoy: (archivos ?? []).length,
    ultima_actualizacion: new Date().toISOString(),
  }
}

export async function getCuadratura7Dias() {
  const hace7 = new Date()
  hace7.setDate(hace7.getDate() - 7)

  const { data } = await supabase
    .from('cuadratura_diaria')
    .select('*')
    .gte('fecha', hace7.toISOString().split('T')[0])
    .order('fecha', { ascending: true })

  return data ?? []
}

export async function getAlertas() {
  const { data } = await supabase
    .from('alertas')
    .select('*')
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getArchivos(limit = 50) {
  const { data } = await supabase
    .from('archivos')
    .select('*')
    .order('recibido_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function actualizarAlerta(
  id: string,
  estado: 'activa' | 'en_revision' | 'resuelta' | 'ignorada',
  resuelto_por?: string
) {
  const update: Record<string, unknown> = { estado }
  if (estado === 'resuelta') {
    update.resuelto_at  = new Date().toISOString()
    update.resuelto_por = resuelto_por ?? 'Usuario'
  }
  const { error } = await supabase
    .from('alertas')
    .update(update)
    .eq('id', id)

  return !error
}

export async function insertarArchivo(archivo: {
  nombre: string
  tipo: 'SVXP' | 'CTF' | 'IPM'
  marca: string
  fecha_proceso: string
  total_trx: number
  estado: 'procesando' | 'ok' | 'error' | 'advertencia'
  notas?: string
}) {
  const { data, error } = await supabase
    .from('archivos')
    .insert(archivo)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function insertarTransacciones(
  trxs: Array<{
    archivo_id: string
    trx_id: string
    tipo_trx: string
    marca: string
    monto: number
    moneda: string
    fecha_trx: string
    estado: string
    merchant_number?: string
    nombre_comercio?: string
    mcc?: string
    terminal_number?: string
    originator_refnum?: string
    card_number?: string
    auth_code?: string
    klap_codigo?: string
    klap_codigo_original?: string
    es_cuota?: boolean
    notas?: string
  }>
) {
  // Insertar en lotes de 500 para no exceder límites
  const BATCH = 500
  let insertadas = 0

  for (let i = 0; i < trxs.length; i += BATCH) {
    const lote = trxs.slice(i, i + BATCH)
    const { error } = await supabase.from('transacciones').insert(lote)
    if (error) throw error
    insertadas += lote.length
  }

  return insertadas
}

export async function insertarAlerta(alerta: {
  tipo: string
  severidad: string
  marca?: string
  fecha_proceso?: string
  titulo: string
  detalle?: string
  cantidad_trx?: number
  archivo_id?: string
}) {
  const { error } = await supabase
    .from('alertas')
    .insert({ ...alerta, estado: 'activa' })

  return !error
}

export async function insertarCuadratura(rows: Array<{
  fecha: string
  marca: string
  trx_svxp: number
  trx_ctf: number
  trx_ipm: number
  trx_error: number
  trx_frozen: number
  trx_excluidas: number
  estado: string
  notas?: string
}>) {
  const { error } = await supabase
    .from('cuadratura_diaria')
    .upsert(rows, { onConflict: 'fecha,marca' })

  return !error
}
