'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle, XCircle, AlertTriangle, Clock,
  ChevronRight, RefreshCw, DollarSign, TrendingUp
} from 'lucide-react'
import type { Contracargo, ContracargoMetricas } from '@/lib/contracargos-module'
import { ESTADO_CB_LABELS, TIPO_CB_LABELS } from '@/lib/contracargos-module'

const fmtMonto = (n: number) => `$${n.toLocaleString('es-CL')}`
const fmtFecha = (iso: string) => new Date(iso).toLocaleDateString('es-CL', {
  day: '2-digit', month: 'short', year: 'numeric'
})

// ============================================================
// Config visual por estado
// ============================================================
const ESTADO_CFG: Record<string, { badge: string; icon: React.ReactNode; label: string }> = {
  enviado:    { badge: 'bg-blue-50 text-blue-700 border border-blue-200',   icon: <Clock        className="w-4 h-4 text-blue-400 shrink-0"  />, label: 'Esperando' },
  aceptado:   { badge: 'bg-green-50 text-green-700 border border-green-200',icon: <CheckCircle  className="w-4 h-4 text-green-500 shrink-0" />, label: 'Aceptado'  },
  rechazado:  { badge: 'bg-red-50 text-red-700 border border-red-200',      icon: <XCircle      className="w-4 h-4 text-red-500 shrink-0"   />, label: 'Rechazado' },
  en_disputa: { badge: 'bg-amber-50 text-amber-700 border border-amber-200',icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0"/>, label: 'En disputa'},
  vencido:    { badge: 'bg-red-50 text-red-900 border border-red-300',      icon: <XCircle      className="w-4 h-4 text-red-700 shrink-0"   />, label: 'Vencido'   },
  retirado:   { badge: 'bg-gray-100 text-gray-600 border border-gray-200',  icon: <Clock        className="w-4 h-4 text-gray-400 shrink-0"  />, label: 'Retirado'  },
}

// ============================================================
// Barra de días restantes
// ============================================================
function BarraDias({ dias, limite }: { dias: number; limite: string }) {
  if (dias < 0) return (
    <div className="mt-1 text-xs text-red-600 font-medium">
      Venció el {fmtFecha(limite)}
    </div>
  )
  const color = dias <= 3 ? 'bg-red-400' : dias <= 7 ? 'bg-amber-400' : 'bg-blue-300'
  const pct   = Math.min(100, Math.max(0, Math.round((dias / 45) * 100)))
  return (
    <div className="mt-1.5">
      <div className="flex h-1 rounded-full overflow-hidden bg-gray-100 w-32">
        <div style={{ width: `${100 - pct}%` }} className={`${color} transition-all`} />
      </div>
      <span className={`text-xs mt-0.5 ${dias <= 3 ? 'text-red-600 font-medium' : dias <= 7 ? 'text-amber-600' : 'text-gray-400'}`}>
        {dias} día{dias !== 1 ? 's' : ''} para vencer
      </span>
    </div>
  )
}

// ============================================================
// Fila de un contracargo
// ============================================================
function ContracargoRow({ cb, onSelect }: { cb: Contracargo; onSelect: (c: Contracargo) => void }) {
  const cfg = ESTADO_CFG[cb.estado] ?? ESTADO_CFG.enviado
  return (
    <button
      onClick={() => onSelect(cb)}
      className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
        cb.es_urgente ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'
      }`}
    >
      {cfg.icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-mono font-medium text-gray-600">{cb.numero_caso}</span>
          <span className="text-xs text-gray-400">{cb.marca}</span>
          <span className="text-xs text-gray-400">{TIPO_CB_LABELS[cb.tipo_contracargo]}</span>
          {cb.es_urgente && (
            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
              URGENTE
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-800">{cb.nombre_comercio ?? 'Comercio sin nombre'}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className={`text-sm font-semibold ${
            cb.estado === 'aceptado' ? 'text-green-600' :
            cb.estado === 'rechazado' || cb.estado === 'vencido' ? 'text-red-600' :
            'text-gray-700'
          }`}>
            {fmtMonto(cb.monto)}
          </span>
          {cb.estado === 'enviado' && cb.dias_restantes !== undefined && (
            <BarraDias dias={cb.dias_restantes} limite={cb.fecha_limite} />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
          {cfg.label}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </button>
  )
}

// ============================================================
// Modal de detalle
// ============================================================
function ContracargoModal({
  cb, onClose, onActualizar
}: {
  cb: Contracargo
  onClose: () => void
  onActualizar: (id: string, estado: string, notas?: string) => void
}) {
  const [notas, setNotas]   = useState('')
  const [saving, setSaving] = useState(false)
  const cfg = ESTADO_CFG[cb.estado] ?? ESTADO_CFG.enviado

  const actualizar = async (estado: string) => {
    setSaving(true)
    await onActualizar(cb.id, estado, notas)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {cfg.icon}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
            {cb.es_urgente && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">URGENTE</span>}
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-base font-semibold text-gray-900 mb-1">{cb.numero_caso}</h3>
        <p className="text-sm text-gray-500 mb-4">{cb.nombre_comercio} · {TIPO_CB_LABELS[cb.tipo_contracargo]}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Monto disputado</p>
            <p className="text-lg font-semibold text-gray-800">{fmtMonto(cb.monto)}</p>
          </div>
          <div className={`rounded-lg p-3 ${cb.estado === 'aceptado' ? 'bg-green-50' : 'bg-gray-50'}`}>
            <p className="text-xs text-gray-400">Monto recuperado</p>
            <p className={`text-lg font-semibold ${cb.monto_recuperado > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {fmtMonto(cb.monto_recuperado)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Marca</p>
            <p className="text-sm font-medium text-gray-700">{cb.marca}</p>
          </div>
          <div className={`rounded-lg p-3 ${cb.es_urgente ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className="text-xs text-gray-400">Fecha límite</p>
            <p className={`text-sm font-medium ${cb.es_urgente ? 'text-red-600' : 'text-gray-700'}`}>
              {fmtFecha(cb.fecha_limite)}
              {cb.dias_restantes !== undefined && cb.estado === 'enviado' && (
                <span className="block text-xs mt-0.5">
                  {cb.dias_restantes > 0 ? `${cb.dias_restantes} días restantes` : 'Vencido'}
                </span>
              )}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Fecha TRX original</p>
            <p className="text-sm font-medium text-gray-700">{fmtFecha(cb.fecha_transaccion)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Enviado</p>
            <p className="text-sm font-medium text-gray-700">{fmtFecha(cb.fecha_envio)}</p>
          </div>
        </div>

        {cb.arn && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-400 mb-1">ARN</p>
            <p className="text-xs font-mono text-gray-600">{cb.arn}</p>
          </div>
        )}

        {cb.notas && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
            <p className="text-xs text-amber-800">{cb.notas}</p>
          </div>
        )}

        {/* Acciones — solo para contracargos activos */}
        {cb.estado === 'enviado' || cb.estado === 'en_disputa' ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Notas (opcional)</label>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Ej: Marca confirmó recepción vía email..."
                className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none h-16 focus:outline-none focus:border-gray-400"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => actualizar('aceptado')}
                disabled={saving}
                className="py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                Aceptado
              </button>
              <button
                onClick={() => actualizar('rechazado')}
                disabled={saving}
                className="py-2 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                Rechazado
              </button>
              <button
                onClick={() => actualizar('en_disputa')}
                disabled={saving}
                className="py-2 text-xs border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors font-medium disabled:opacity-50"
              >
                En disputa
              </button>
            </div>
          </div>
        ) : (
          <div className={`rounded-lg p-3 text-sm font-medium text-center ${
            cb.estado === 'aceptado' ? 'bg-green-50 text-green-700' :
            cb.estado === 'vencido'  ? 'bg-red-50 text-red-700' :
            'bg-gray-50 text-gray-600'
          }`}>
            {ESTADO_CB_LABELS[cb.estado]}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function ContracargosTab() {
  const [contracargos, setContracargos] = useState<Contracargo[]>([])
  const [metricas,     setMetricas]     = useState<ContracargoMetricas | null>(null)
  const [seleccionado, setSeleccionado] = useState<Contracargo | null>(null)
  const [cargando,     setCargando]     = useState(true)
  const [filtro, setFiltro] = useState<'todos'|'enviado'|'urgente'|'aceptado'|'rechazado'|'vencido'>('todos')

  const cargar = async () => {
    setCargando(true)
    try {
      const res  = await fetch('/api/contracargos')
      const data = await res.json()
      setContracargos(data.contracargos ?? [])
      setMetricas(data.metricas ?? null)
    } catch (e) {
      console.error('[contracargos] Error:', e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const handleActualizar = async (id: string, estado: string, notas?: string) => {
    await fetch('/api/contracargos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado, notas, responsable: 'Operaciones' }),
    })
    await cargar()
  }

  const filtrados = contracargos.filter(c => {
    if (filtro === 'urgente') return c.es_urgente
    if (filtro === 'todos')   return true
    return c.estado === filtro
  })

  const montoRiesgo    = metricas?.monto_en_riesgo   ?? 0
  const montoRecuperado = metricas?.monto_recuperado ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Contracargos</h1>
          <p className="text-xs text-gray-400 mt-0.5">Tracking de disputas con marcas — resuelve KLAP-837/857</p>
        </div>
        <button onClick={cargar} disabled={cargando} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Métricas */}
      {metricas && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Monto en riesgo</p>
            <p className={`text-lg font-semibold ${montoRiesgo > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {fmtMonto(montoRiesgo)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{metricas.enviados} pendientes</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Monto recuperado</p>
            <p className={`text-lg font-semibold ${montoRecuperado > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {fmtMonto(montoRecuperado)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{metricas.aceptados} aceptados</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Próximos a vencer</p>
            <p className={`text-2xl font-semibold ${metricas.proximos_vencer > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {metricas.proximos_vencer}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">en ≤ 7 días</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Tasa de éxito</p>
            <p className={`text-2xl font-semibold ${
              metricas.tasa_exito >= 70 ? 'text-green-600' :
              metricas.tasa_exito >= 40 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {metricas.tasa_exito}%
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{metricas.rechazados} rechazados</p>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex gap-1 flex-wrap">
            {([
              ['todos',     'Todos'],
              ['urgente',   'Urgentes'],
              ['enviado',   'Esperando'],
              ['aceptado',  'Aceptados'],
              ['rechazado', 'Rechazados'],
              ['vencido',   'Vencidos'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFiltro(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filtro === id
                    ? id === 'urgente' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {label}
                {id === 'urgente' && (metricas?.proximos_vencer ?? 0) > 0 && (
                  <span className="ml-1.5 bg-red-100 text-red-700 px-1.5 rounded-full text-xs">
                    {metricas?.proximos_vencer}
                  </span>
                )}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400">{filtrados.length} casos</span>
        </div>

        {cargando ? (
          <div className="flex items-center gap-2 py-8 justify-center text-sm text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" /> Cargando...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-sm text-gray-400">Sin contracargos en esta categoría</p>
          </div>
        ) : (
          filtrados.map(c => (
            <ContracargoRow key={c.id} cb={c} onSelect={setSeleccionado} />
          ))
        )}
      </div>

      {seleccionado && (
        <ContracargoModal
          cb={seleccionado}
          onClose={() => setSeleccionado(null)}
          onActualizar={handleActualizar}
        />
      )}
    </div>
  )
}
