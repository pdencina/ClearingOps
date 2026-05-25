// ============================================================
// ClearingOps — Tipos TypeScript
// ============================================================

export type Marca = 'VISA' | 'MASTERCARD' | 'MAESTRO' | 'AMEX'
export type TipoArchivo = 'SVXP' | 'CTF' | 'IPM'
export type EstadoArchivo = 'procesando' | 'ok' | 'error' | 'advertencia'
export type EstadoTrx = 'pendiente' | 'procesada' | 'enviada' | 'confirmada' | 'error' | 'frozen' | 'excluida'
export type EstadoCuadratura = 'ok' | 'diferencia' | 'pendiente' | 'error'
export type SeveridadAlerta = 'critica' | 'alta' | 'media' | 'baja'
export type EstadoAlerta = 'activa' | 'en_revision' | 'resuelta' | 'ignorada'
export type TipoAlerta =
  | 'svxp_no_llegó'
  | 'diferencia_cuadratura'
  | 'trx_opst500'
  | 'arn_incorrecto'
  | 'trx_frozen'
  | 'ctf_retrasado'
  | 'ipm_diferencia'

export interface Archivo {
  id: string
  nombre: string
  tipo: TipoArchivo
  marca: Marca
  fecha_proceso: string
  recibido_at: string
  total_trx: number
  estado: EstadoArchivo
  ruta?: string
  notas?: string
  created_at: string
}

export interface Transaccion {
  id: string
  archivo_id: string
  trx_id: string
  tipo_trx: string
  marca: Marca
  monto: number
  moneda: string
  fecha_trx: string
  estado: EstadoTrx
  codigo_op?: string
  arn?: string
  fecha_arn?: string
  cod_comercio?: string
  cod_sucursal?: string
  nombre_comercio?: string
  mcc?: string
  archivo_ctf_id?: string
  file_id?: string
  es_cuota: boolean
  numero_cuota?: number
  total_cuotas?: number
  trx_original_id?: string
  notas?: string
  created_at: string
}

export interface CuadraturaDiaria {
  id: string
  fecha: string
  marca: Marca
  trx_svxp: number
  trx_ctf: number
  trx_ipm: number
  trx_error: number
  trx_frozen: number
  trx_excluidas: number
  diferencia: number
  estado: EstadoCuadratura
  ejecutado_at?: string
  notas?: string
  created_at: string
}

export interface Alerta {
  id: string
  tipo: TipoAlerta
  severidad: SeveridadAlerta
  marca?: Marca
  fecha_proceso?: string
  titulo: string
  detalle?: string
  cantidad_trx: number
  estado: EstadoAlerta
  archivo_id?: string
  jira_ticket?: string
  resuelto_at?: string
  resuelto_por?: string
  created_at: string
}

// ============================================================
// Tipos para el Dashboard
// ============================================================

export interface ResumenDia {
  fecha: string
  visa: { svxp: number; ctf: number; diferencia: number; estado: EstadoCuadratura }
  mastercard: { svxp: number; ctf: number; diferencia: number; estado: EstadoCuadratura }
  alertas_activas: number
}

export interface MetricasGlobales {
  total_trx_hoy: number
  alertas_criticas: number
  alertas_activas: number
  diferencia_total: number
  archivos_hoy: number
  ultima_actualizacion: string
}
