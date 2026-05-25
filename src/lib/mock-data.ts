// ============================================================
// ClearingOps — Datos mock para desarrollo local
// Reemplazar con cliente Supabase real cuando tengas credenciales
// ============================================================

import type {
  Archivo, CuadraturaDiaria, Alerta, MetricasGlobales, ResumenDia
} from '@/types'

const hoy = new Date()
const fecha = (diasAtras: number) => {
  const d = new Date(hoy)
  d.setDate(d.getDate() - diasAtras)
  return d.toISOString().split('T')[0]
}

// ============================================================
// ARCHIVOS mock
// ============================================================
export const mockArchivos: Archivo[] = [
  { id: 'a7-1', nombre: 'output_file_VISA_20260525.xml.gpg',  tipo: 'SVXP', marca: 'VISA',       fecha_proceso: fecha(0), recibido_at: new Date(hoy.getTime() - 2*3600000).toISOString(), total_trx: 1654, estado: 'ok',          created_at: new Date().toISOString() },
  { id: 'a7-2', nombre: 'MCI.AR.R111.D260525.A001',           tipo: 'SVXP', marca: 'MASTERCARD', fecha_proceso: fecha(0), recibido_at: new Date(hoy.getTime() - 1*3600000).toISOString(), total_trx:  923, estado: 'procesando',  created_at: new Date().toISOString() },
  { id: 'a6-1', nombre: 'output_file_VISA_20260524.xml.gpg',  tipo: 'SVXP', marca: 'VISA',       fecha_proceso: fecha(1), recibido_at: new Date(hoy.getTime() - 26*3600000).toISOString(), total_trx: 3108, estado: 'advertencia', created_at: new Date().toISOString() },
  { id: 'a6-2', nombre: 'MCI.AR.R111.D260524.A001',           tipo: 'SVXP', marca: 'MASTERCARD', fecha_proceso: fecha(1), recibido_at: new Date(hoy.getTime() - 25*3600000).toISOString(), total_trx: 1876, estado: 'error',       created_at: new Date().toISOString() },
  { id: 'a6-3', nombre: 'Outgoing_VISA_20260524160000.ctf',   tipo: 'CTF',  marca: 'VISA',       fecha_proceso: fecha(1), recibido_at: new Date(hoy.getTime() - 18*3600000).toISOString(), total_trx: 3108, estado: 'ok',          created_at: new Date().toISOString() },
  { id: 'a6-4', nombre: 'Outgoing_MC_20260524003000.ctf',     tipo: 'CTF',  marca: 'MASTERCARD', fecha_proceso: fecha(1), recibido_at: new Date(hoy.getTime() - 17*3600000).toISOString(), total_trx:  876, estado: 'error',       created_at: new Date().toISOString() },
  { id: 'a5-1', nombre: 'output_file_VISA_20260523.xml.gpg',  tipo: 'SVXP', marca: 'VISA',       fecha_proceso: fecha(2), recibido_at: new Date(hoy.getTime() - 50*3600000).toISOString(), total_trx: 2341, estado: 'ok',          created_at: new Date().toISOString() },
  { id: 'a5-2', nombre: 'MCI.AR.R111.D260523.A001',           tipo: 'SVXP', marca: 'MASTERCARD', fecha_proceso: fecha(2), recibido_at: new Date(hoy.getTime() - 50*3600000).toISOString(), total_trx: 1102, estado: 'ok',          created_at: new Date().toISOString() },
  { id: 'a4-1', nombre: 'output_file_VISA_20260522.xml.gpg',  tipo: 'SVXP', marca: 'VISA',       fecha_proceso: fecha(3), recibido_at: new Date(hoy.getTime() - 74*3600000).toISOString(), total_trx: 1980, estado: 'ok',          created_at: new Date().toISOString() },
  { id: 'a4-2', nombre: 'MCI.AR.R111.D260522.A001',           tipo: 'SVXP', marca: 'MASTERCARD', fecha_proceso: fecha(3), recibido_at: new Date(hoy.getTime() - 74*3600000).toISOString(), total_trx: 2240, estado: 'ok',          created_at: new Date().toISOString() },
  { id: 'a4-4', nombre: 'Outgoing_MC_20260522160000.ctf',     tipo: 'CTF',  marca: 'MASTERCARD', fecha_proceso: fecha(3), recibido_at: new Date(hoy.getTime() - 66*3600000).toISOString(), total_trx: 2225, estado: 'error',       created_at: new Date().toISOString() },
]

// ============================================================
// CUADRATURA mock
// ============================================================
export const mockCuadratura: CuadraturaDiaria[] = [
  { id: 'c1', fecha: fecha(6), marca: 'VISA',        trx_svxp: 1842, trx_ctf: 1842, trx_ipm:   0, trx_error:  0, trx_frozen:  0, trx_excluidas:   0, diferencia:    0, estado: 'ok',         ejecutado_at: fecha(6), created_at: new Date().toISOString() },
  { id: 'c2', fecha: fecha(6), marca: 'MASTERCARD',  trx_svxp:  934, trx_ctf:    0, trx_ipm: 934, trx_error:  0, trx_frozen:  0, trx_excluidas:   0, diferencia:    0, estado: 'ok',         ejecutado_at: fecha(6), created_at: new Date().toISOString() },
  { id: 'c3', fecha: fecha(5), marca: 'VISA',        trx_svxp: 2103, trx_ctf: 2103, trx_ipm:   0, trx_error:  0, trx_frozen:  0, trx_excluidas:   0, diferencia:    0, estado: 'ok',         ejecutado_at: fecha(5), created_at: new Date().toISOString() },
  { id: 'c4', fecha: fecha(5), marca: 'MASTERCARD',  trx_svxp:  756, trx_ctf:    0, trx_ipm: 756, trx_error:  0, trx_frozen:  0, trx_excluidas:   0, diferencia:    0, estado: 'ok',         ejecutado_at: fecha(5), created_at: new Date().toISOString() },
  { id: 'c5', fecha: fecha(4), marca: 'VISA',        trx_svxp: 1117, trx_ctf: 1117, trx_ipm:   0, trx_error:  0, trx_frozen:  0, trx_excluidas:   0, diferencia:    0, estado: 'ok',         ejecutado_at: fecha(4), created_at: new Date().toISOString() },
  { id: 'c6', fecha: fecha(4), marca: 'MASTERCARD',  trx_svxp:    0, trx_ctf:    0, trx_ipm:   0, trx_error:  0, trx_frozen:  0, trx_excluidas:   0, diferencia:    0, estado: 'pendiente',  ejecutado_at: undefined, created_at: new Date().toISOString() },
  { id: 'c7', fecha: fecha(3), marca: 'VISA',        trx_svxp: 1980, trx_ctf: 1980, trx_ipm:   0, trx_error:  0, trx_frozen:  0, trx_excluidas:   0, diferencia:    0, estado: 'ok',         ejecutado_at: fecha(3), created_at: new Date().toISOString() },
  { id: 'c8', fecha: fecha(3), marca: 'MASTERCARD',  trx_svxp: 2240, trx_ctf: 2225, trx_ipm:   0, trx_error: 15, trx_frozen:  0, trx_excluidas:   0, diferencia:   15, estado: 'diferencia', ejecutado_at: fecha(3), created_at: new Date().toISOString() },
  { id: 'c9', fecha: fecha(2), marca: 'VISA',        trx_svxp: 2341, trx_ctf: 2341, trx_ipm:   0, trx_error:  0, trx_frozen:  0, trx_excluidas:   0, diferencia:    0, estado: 'ok',         ejecutado_at: fecha(2), created_at: new Date().toISOString() },
  { id:'c10', fecha: fecha(2), marca: 'MASTERCARD',  trx_svxp: 1102, trx_ctf:    0, trx_ipm:1102, trx_error:  0, trx_frozen:  0, trx_excluidas:   0, diferencia:    0, estado: 'ok',         ejecutado_at: fecha(2), created_at: new Date().toISOString() },
  { id:'c11', fecha: fecha(1), marca: 'VISA',        trx_svxp: 3108, trx_ctf: 3108, trx_ipm:   0, trx_error:  0, trx_frozen:  0, trx_excluidas:   0, diferencia:    0, estado: 'ok',         ejecutado_at: fecha(1), created_at: new Date().toISOString() },
  { id:'c12', fecha: fecha(1), marca: 'MASTERCARD',  trx_svxp: 1876, trx_ctf:  876, trx_ipm:   0, trx_error: 15, trx_frozen: 85, trx_excluidas: 900, diferencia: 1000, estado: 'diferencia', ejecutado_at: fecha(1), created_at: new Date().toISOString() },
  { id:'c13', fecha: fecha(0), marca: 'VISA',        trx_svxp: 1654, trx_ctf:    0, trx_ipm:   0, trx_error:  0, trx_frozen:  0, trx_excluidas:   0, diferencia: 1654, estado: 'pendiente',  ejecutado_at: undefined, created_at: new Date().toISOString() },
  { id:'c14', fecha: fecha(0), marca: 'MASTERCARD',  trx_svxp:  923, trx_ctf:    0, trx_ipm:   0, trx_error:  0, trx_frozen:  0, trx_excluidas:   0, diferencia:  923, estado: 'pendiente',  ejecutado_at: undefined, created_at: new Date().toISOString() },
]

// ============================================================
// ALERTAS mock
// ============================================================
export const mockAlertas: Alerta[] = [
  {
    id: 'al1', tipo: 'diferencia_cuadratura', severidad: 'critica',
    marca: 'MASTERCARD', fecha_proceso: fecha(1),
    titulo: 'Diferencia de cuadratura MC — 1.000 TRX sin enviar',
    detalle: '1.876 TRX en SVXP vs 876 en CTF. 85 Frozen, 15 OPST0500, 900 cuotas no incluidas.',
    cantidad_trx: 1000, estado: 'activa', jira_ticket: 'KLAP-1712',
    created_at: new Date(hoy.getTime() - 9*3600000).toISOString()
  },
  {
    id: 'al2', tipo: 'trx_opst500', severidad: 'alta',
    marca: 'MASTERCARD', fecha_proceso: fecha(1),
    titulo: '15 TRX en OPST0500 — tarifa no encontrada',
    detalle: 'TRX con fecha futura sin Rate configurada. No se enviaron a la marca.',
    cantidad_trx: 15, estado: 'en_revision', jira_ticket: 'KLAP-1671',
    created_at: new Date(hoy.getTime() - 9*3600000).toISOString()
  },
  {
    id: 'al3', tipo: 'trx_frozen', severidad: 'alta',
    marca: 'MASTERCARD', fecha_proceso: fecha(1),
    titulo: '85 cuotas comercio en estado Frozen',
    detalle: 'Cuotas > 1 sin tarifa asociada. Requieren revisión antes de reenvío.',
    cantidad_trx: 85, estado: 'en_revision', jira_ticket: 'KLAP-1628',
    created_at: new Date(hoy.getTime() - 8*3600000).toISOString()
  },
  {
    id: 'al4', tipo: 'arn_incorrecto', severidad: 'alta',
    marca: 'MASTERCARD', fecha_proceso: fecha(5),
    titulo: 'ARN incorrecto en TRX TC06 y TC26',
    detalle: 'Anulaciones con fecha juliana de la venta en lugar de la anulación.',
    cantidad_trx: 234, estado: 'en_revision', jira_ticket: 'KLAP-1663',
    created_at: new Date(hoy.getTime() - 5*24*3600000).toISOString()
  },
  {
    id: 'al5', tipo: 'diferencia_cuadratura', severidad: 'alta',
    marca: 'MASTERCARD', fecha_proceso: fecha(3),
    titulo: 'Diferencia de 15 TRX en cuadratura MC',
    detalle: '2.240 TRX en SVXP vs 2.225 en CTF.',
    cantidad_trx: 15, estado: 'resuelta', jira_ticket: 'KLAP-1684',
    resuelto_at: fecha(2), resuelto_por: 'Equipo Operaciones',
    created_at: new Date(hoy.getTime() - 3*24*3600000).toISOString()
  },
  {
    id: 'al6', tipo: 'svxp_no_llegó', severidad: 'media',
    marca: 'MASTERCARD', fecha_proceso: fecha(4),
    titulo: 'SVXP Mastercard no recibido en ventana esperada',
    detalle: 'No se recibió SVXP en 60 minutos. BPC realizaba mantención programada.',
    cantidad_trx: 0, estado: 'resuelta',
    resuelto_at: fecha(4), resuelto_por: 'BPC Soporte',
    created_at: new Date(hoy.getTime() - 4*24*3600000).toISOString()
  },
]

// ============================================================
// MÉTRICAS GLOBALES
// ============================================================
export function getMockMetricas(): MetricasGlobales {
  const alertasActivas = mockAlertas.filter(a => a.estado === 'activa' || a.estado === 'en_revision')
  return {
    total_trx_hoy: 1654 + 923,
    alertas_criticas: alertasActivas.filter(a => a.severidad === 'critica').length,
    alertas_activas: alertasActivas.length,
    diferencia_total: 1000,
    archivos_hoy: mockArchivos.filter(a => a.fecha_proceso === fecha(0)).length,
    ultima_actualizacion: new Date().toISOString(),
  }
}

// ============================================================
// RESUMEN 7 DÍAS para el gráfico
// ============================================================
export function getMockResumen7Dias(): ResumenDia[] {
  const cuadPorFecha: Record<string, { visa?: CuadraturaDiaria; mc?: CuadraturaDiaria }> = {}
  mockCuadratura.forEach(c => {
    if (!cuadPorFecha[c.fecha]) cuadPorFecha[c.fecha] = {}
    if (c.marca === 'VISA') cuadPorFecha[c.fecha].visa = c
    else cuadPorFecha[c.fecha].mc = c
  })
  return Object.entries(cuadPorFecha).map(([f, { visa, mc }]) => ({
    fecha: f,
    visa: { svxp: visa?.trx_svxp ?? 0, ctf: visa?.trx_ctf ?? 0, diferencia: visa?.diferencia ?? 0, estado: visa?.estado ?? 'pendiente' },
    mastercard: { svxp: mc?.trx_svxp ?? 0, ctf: mc?.trx_ctf ?? 0, diferencia: mc?.diferencia ?? 0, estado: mc?.estado ?? 'pendiente' },
    alertas_activas: mockAlertas.filter(a => a.fecha_proceso === f && (a.estado === 'activa' || a.estado === 'en_revision')).length,
  })).sort((a, b) => a.fecha.localeCompare(b.fecha))
}
