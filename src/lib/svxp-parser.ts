// ============================================================
// ClearingOps — Parser de archivos SVXP
// Basado en estructura real: 2957772_AMEX_20260511_OPTP0020_TEST.xml
// ============================================================

import { XMLParser } from 'fast-xml-parser'

// ============================================================
// Tipos que mapean 1:1 con el XML de BPC
// ============================================================
export interface SVXPArchivo {
  file_type: string        // FLTP1700
  inst_id: string          // 1001
  start_date: string       // 2026-05-11
  marca: string            // Detectada del nombre del archivo
  nombre_archivo: string
  operaciones: SVXPOperacion[]
}

export interface SVXPOperacion {
  // Campos del nodo <operation>
  oper_type: string        // OPTP0020 (venta), OPTP0030 (anulación), etc.
  msg_type: string         // MSGTAUTH
  sttl_type: string        // STTT0200
  oper_date: string        // 2026-05-11T14:45:00
  host_date: string        // 2026-05-11T14:45:02
  status: string           // OPST0100

  // Montos
  monto: number            // amount_value de oper_amount
  moneda: string           // código ISO (152 = CLP, 840 = USD)

  // Comercio
  merchant_number: string  // cod_sucursal
  mcc: string
  merchant_name: string
  merchant_city: string
  merchant_country: string
  terminal_number: string

  // Referencias
  originator_refnum: string
  network_refnum: string
  is_reversal: boolean

  // Emisor
  card_number: string
  auth_code: string
  issuer_inst_id: string
  issuer_network_id: string

  // Tags KLAP personalizados
  klap_codigo: string             // KLAP_CODIGO
  klap_codigo_original: string    // KLAP_CODIGO_ORIGINAL
  klap_issuer_code: string        // KLAP_ISSUER_CODE
  klap_id_canal: string           // KLAP_ID_CANAL
  klap_bin: string                // KLAP_BIN
  klap_tipo_multiservicio: string // KLAP_TIPO_MULTISERVICIO
  klap_multiservices: string      // KLAP_MULTISERVICES

  // Tags técnicos
  external_auth_id: string
  system_trace_audit_number: string
  is_advice: boolean

  // Raw tags para auditoría
  auth_tags: Record<string, string>
}

// ============================================================
// Detectar marca desde el nombre del archivo
// Ejemplo: 2957772_AMEX_20260511_OPTP0020_TEST.xml
// ============================================================
export function detectarMarca(nombreArchivo: string): string {
  const nombre = nombreArchivo.toUpperCase()
  if (nombre.includes('AMEX') || nombre.includes('AMERICAN'))  return 'AMEX'
  if (nombre.includes('VISA'))                                  return 'VISA'
  if (nombre.includes('MASTERCARD') || nombre.includes('MCI')) return 'MASTERCARD'
  if (nombre.includes('MAESTRO'))                              return 'MAESTRO'
  return 'UNKNOWN'
}

// ============================================================
// Extraer fecha del nombre del archivo
// Ejemplo: 2957772_AMEX_20260511_OPTP0020_TEST.xml → 2026-05-11
// ============================================================
export function extraerFechaArchivo(nombreArchivo: string): string {
  const match = nombreArchivo.match(/(\d{8})/)
  if (match) {
    const raw = match[1]
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  }
  return new Date().toISOString().split('T')[0]
}

// ============================================================
// Extraer auth_tags como diccionario clave→valor
// ============================================================
function parsearAuthTags(authData: Record<string, unknown>): Record<string, string> {
  const tags: Record<string, string> = {}
  if (!authData?.auth_tag) return tags

  const rawTags = Array.isArray(authData.auth_tag)
    ? authData.auth_tag
    : [authData.auth_tag]

  for (const tag of rawTags) {
    const nombre = String(tag.tag_name ?? '').trim()
    const valor  = String(tag.tag_value ?? '').trim()
    if (nombre) tags[nombre] = valor
  }
  return tags
}

// ============================================================
// Parsear una sola <operation> del XML
// ============================================================
function parsearOperacion(op: Record<string, unknown>): SVXPOperacion {
  const authData  = (op.auth_data  ?? {}) as Record<string, unknown>
  const issuer    = (op.issuer     ?? {}) as Record<string, unknown>
  const operAmt   = (op.oper_amount ?? {}) as Record<string, unknown>
  const tags      = parsearAuthTags(authData)

  return {
    oper_type:       String(op.oper_type  ?? ''),
    msg_type:        String(op.msg_type   ?? ''),
    sttl_type:       String(op.sttl_type  ?? ''),
    oper_date:       String(op.oper_date  ?? ''),
    host_date:       String(op.host_date  ?? ''),
    status:          String(op.status     ?? ''),

    monto:           Number(operAmt.amount_value ?? 0),
    moneda:          String(operAmt.currency     ?? '152'),

    merchant_number: String(op.merchant_number  ?? ''),
    mcc:             String(op.mcc              ?? ''),
    merchant_name:   String(op.merchant_name    ?? '').trim(),
    merchant_city:   String(op.merchant_city    ?? ''),
    merchant_country:String(op.merchant_country ?? ''),
    terminal_number: String(op.terminal_number  ?? ''),

    originator_refnum: String(op.originator_refnum ?? ''),
    network_refnum:    String(op.network_refnum    ?? ''),
    is_reversal:       Number(op.is_reversal ?? 0) === 1,

    card_number:       String(issuer.card_number  ?? ''),
    auth_code:         String(issuer.auth_code    ?? ''),
    issuer_inst_id:    String(issuer.inst_id      ?? ''),
    issuer_network_id: String(issuer.network_id   ?? ''),

    // Tags KLAP personalizados
    klap_codigo:             tags['KLAP_CODIGO']              ?? '',
    klap_codigo_original:    tags['KLAP_CODIGO_ORIGINAL']     ?? '',
    klap_issuer_code:        tags['KLAP_ISSUER_CODE']         ?? '',
    klap_id_canal:           tags['KLAP_ID_CANAL']            ?? '',
    klap_bin:                tags['KLAP_BIN']                 ?? '',
    klap_tipo_multiservicio: tags['KLAP_TIPO_MULTISERVICIO']  ?? '',
    klap_multiservices:      tags['KLAP_MULTISERVICES']       ?? '',

    external_auth_id:          String(authData.external_auth_id          ?? ''),
    system_trace_audit_number: String(authData.system_trace_audit_number ?? ''),
    is_advice:                 Number(authData.is_advice ?? 0) === 1,

    auth_tags: tags,
  }
}

// ============================================================
// FUNCIÓN PRINCIPAL — parsear archivo SVXP completo
// Entrada: contenido XML como string
// Salida: SVXPArchivo con todas las operaciones
// ============================================================
export function parsearSVXP(xmlContent: string, nombreArchivo: string): SVXPArchivo {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => name === 'auth_tag' || name === 'operation',
    parseTagValue: true,
    trimValues: true,
  })

  const parsed = parser.parse(xmlContent)
  const clearing = parsed.clearing ?? {}

  // Operaciones — puede ser una sola o un array
  const rawOps = clearing.operation
  const operaciones: SVXPOperacion[] = Array.isArray(rawOps)
    ? rawOps.map((op: Record<string, unknown>) => parsearOperacion(op))
    : rawOps
      ? [parsearOperacion(rawOps as Record<string, unknown>)]
      : []

  return {
    file_type:      String(clearing.file_type  ?? ''),
    inst_id:        String(clearing.inst_id    ?? ''),
    start_date:     String(clearing.start_date ?? extraerFechaArchivo(nombreArchivo)),
    marca:          detectarMarca(nombreArchivo),
    nombre_archivo: nombreArchivo,
    operaciones,
  }
}

// ============================================================
// Mapear tipo de operación a nombre legible
// ============================================================
export const OPER_TYPE_LABELS: Record<string, string> = {
  OPTP0010: 'Venta normal',
  OPTP0020: 'Venta con autorización',
  OPTP0030: 'Anulación',
  OPTP0040: 'Reversa',
  OPTP0050: 'Venta cuotas comercio',
  OPTP0060: 'Venta cuotas emisor',
  OPTP0070: 'Prepago',
  OPTP0080: 'Retiro',
}

export const STATUS_LABELS: Record<string, string> = {
  OPST0100: 'Autorizada',
  OPST0200: 'En proceso',
  OPST0400: 'Procesada / Enviada',
  OPST0500: 'Error — sin tarifa',
  OPST0600: 'Rechazada',
  OPST0700: 'Frozen',
}

// ============================================================
// Validaciones sobre las operaciones parseadas
// ============================================================
export interface ResultadoValidacion {
  valida: boolean
  errores: string[]
  advertencias: string[]
}

export function validarOperacion(op: SVXPOperacion): ResultadoValidacion {
  const errores: string[] = []
  const advertencias: string[] = []

  // Monto no puede ser negativo ni cero en ventas
  if (op.monto <= 0 && !op.is_reversal) {
    errores.push(`Monto inválido: ${op.monto}`)
  }

  // Fecha de operación no puede ser futura (más de 1 día)
  const fechaOp = new Date(op.oper_date)
  const manana   = new Date()
  manana.setDate(manana.getDate() + 1)
  if (fechaOp > manana) {
    errores.push(`Fecha futura detectada: ${op.oper_date} — puede causar OPST0500`)
  }

  // KLAP_CODIGO debe estar presente
  if (!op.klap_codigo) {
    advertencias.push('KLAP_CODIGO vacío — puede afectar el matching de anulaciones')
  }

  // Anulación sin referencia original
  if (op.oper_type === 'OPTP0030' && !op.klap_codigo_original) {
    errores.push('Anulación sin KLAP_CODIGO_ORIGINAL — quedará Frozen en SmartVista')
  }

  // Card number debe estar presente
  if (!op.card_number) {
    advertencias.push('card_number vacío')
  }

  return {
    valida: errores.length === 0,
    errores,
    advertencias,
  }
}

// ============================================================
// Resumen del archivo para mostrar en el dashboard
// ============================================================
export interface ResumenSVXP {
  nombre_archivo: string
  marca: string
  fecha_proceso: string
  total_operaciones: number
  por_tipo: Record<string, number>
  por_status: Record<string, number>
  monto_total: number
  con_errores_validacion: number
  con_advertencias: number
  reversales: number
}

export function resumirSVXP(archivo: SVXPArchivo): ResumenSVXP {
  const por_tipo:   Record<string, number> = {}
  const por_status: Record<string, number> = {}
  let monto_total = 0
  let con_errores_validacion = 0
  let con_advertencias = 0
  let reversales = 0

  for (const op of archivo.operaciones) {
    por_tipo[op.oper_type]   = (por_tipo[op.oper_type]   ?? 0) + 1
    por_status[op.status]    = (por_status[op.status]    ?? 0) + 1
    monto_total             += op.monto
    if (op.is_reversal) reversales++

    const val = validarOperacion(op)
    if (!val.valida)               con_errores_validacion++
    if (val.advertencias.length > 0) con_advertencias++
  }

  return {
    nombre_archivo:        archivo.nombre_archivo,
    marca:                 archivo.marca,
    fecha_proceso:         archivo.start_date,
    total_operaciones:     archivo.operaciones.length,
    por_tipo,
    por_status,
    monto_total,
    con_errores_validacion,
    con_advertencias,
    reversales,
  }
}
