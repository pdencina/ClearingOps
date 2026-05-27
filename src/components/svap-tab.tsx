'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle, XCircle, AlertTriangle, Clock,
  ChevronRight, RefreshCw, FileX
} from 'lucide-react'
import type { SVAPArchivo, SVAPMetricas, SVAPError } from '@/lib/svap-module'
import { ESTADO_LABELS, TIPO_LABELS } from '@/lib/svap-module'

const fmtNum  = (n: number) => n.toLocaleString('es-CL')
const fmtHora = (iso: string) => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
const fmtFecha = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })

// ============================================================
// Estado visual por tipo de resultado
// ============================================================
const ESTADO_CONFIG = {
  procesado_ok: {
    badge:  'bg-green-50 text-green-700 border border-green-200',
    icon:   <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />,
    label:  'OK',
  },
  procesado_parcial: {
    badge:  'bg-amber-50 text-amber-700 border border-amber-200',
    icon:   <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    label:  'Parcial',
  },
  error: {
    badge:  'bg-red-50 text-red-700 border border-red-200',
    icon:   <XCircle className="w-4 h-4 text-red-500 shrink-0" />,
    label:  'Error',
  },
  enviado: {
    badge:  'bg-blue-50 text-blue-700 border border-blue-200',
    icon:   <Clock className="w-4 h-4 text-blue-400 shrink-0" />,
    label:  'Esperando',
  },
  sin_respuesta: {
    badge:  'bg-red-50 text-red-700 border border-red-200',
    icon:   <FileX className="w-4 h-4 text-red-500 shrink-0" />,
    label:  'Sin respuesta',
  },
}

// ============================================================
// Sub-componente: barra de progreso de registros
// ============================================================
function BarraRegistros({ ok, error, omitidos, total }: {
  ok: number; error: number; omitidos: number; total: number
}) {
  if (total === 0) return null
  const pctOk  = Math.round((ok  / total) * 100)
  const pctErr = Math.round((error / total) * 100)
  return (
    <div className="mt-2">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
        <div style={{ width: `${pctOk}%` }}  className="bg-green-400 transition-all" />
        <div style={{ width: `${pctErr}%` }} className="bg-red-400 transition-all" />
      </div>
      <div className="flex gap-3 mt-1 text-xs text-gray-400">
        {ok > 0  && <span className="text-green-600">{fmtNum(ok)} ok</span>}
        {error > 0 && <span className="text-red-600">{fmtNum(error)} error</span>}
        {omitidos > 0 && <span>{fmtNum(omitidos)} omitidos</span>}
      </div>
    </div>
  )
}

// ============================================================
// Sub-componente: Fila de un archivo SVAP
// ============================================================
function SVAPRow({ svap, onSelect }: { svap: SVAPArchivo; onSelect: (s: SVAPArchivo) => void }) {
  const cfg = ESTADO_CONFIG[svap.estado_envio]
  return (
    <button
      onClick={() => onSelect(svap)}
      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
    >
      {cfg.icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-medium text-gray-500">
            {TIPO_LABELS[svap.tipo_svap]}
          </span>
          {svap.marca && svap.marca !== 'TODOS' && (
            <span className="text-xs text-gray-400">{svap.marca}</span>
          )}
          <span className="text-xs text-gray-300">{fmtFecha(svap.fecha_proceso)}</span>
        </div>
        <p className="text-xs font-mono text-gray-600 truncate">{svap.nombre}</p>
        <BarraRegistros
          ok={svap.registros_ok} error={svap.registros_error}
          omitidos={svap.registros_omitidos} total={svap.total_registros}
        />
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
// Modal de detalle de un SVAP
// ============================================================
function SVAPModal({ svap, onClose }: { svap: SVAPArchivo; onClose: () => void }) {
  const [errores, setErrores] = useState<SVAPError[]>([])
  const [cargandoErr, setCargandoErr] = useState(false)
  const cfg = ESTADO_CONFIG[svap.estado_envio]

  useEffect(() => {
    if (svap.registros_error > 0) {
      setCargandoErr(true)
      fetch('/api/svap/resultado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'errores', svap_id: svap.id })
      })
        .then(r => r.json())
        .then(d => setErrores(d.errores ?? []))
        .finally(() => setCargandoErr(false))
    }
  }, [svap.id, svap.registros_error])

  const tasaExito = svap.total_registros > 0
    ? Math.round((svap.registros_ok / svap.total_registros) * 100)
    : 0

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {cfg.icon}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-gray-400">{TIPO_LABELS[svap.tipo_svap]}</span>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs font-mono text-gray-500 mb-4 break-all">{svap.nombre}</p>

        {/* Mensaje de respuesta */}
        {svap.mensaje_respuesta && (
          <div className={`rounded-lg p-3 mb-4 text-sm ${
            svap.estado_envio === 'procesado_ok'
              ? 'bg-green-50 text-green-800'
              : svap.estado_envio === 'error' || svap.estado_envio === 'sin_respuesta'
              ? 'bg-red-50 text-red-800'
              : 'bg-amber-50 text-amber-800'
          }`}>
            {svap.mensaje_respuesta}
          </div>
        )}

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Total registros</p>
            <p className="text-lg font-medium text-gray-700">{fmtNum(svap.total_registros)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Tasa de éxito</p>
            <p className={`text-lg font-medium ${tasaExito === 100 ? 'text-green-600' : tasaExito > 80 ? 'text-amber-600' : 'text-red-600'}`}>
              {tasaExito}%
            </p>
          </div>
          {svap.registros_ok > 0 && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Procesados ok</p>
              <p className="text-lg font-medium text-green-700">{fmtNum(svap.registros_ok)}</p>
            </div>
          )}
          {svap.registros_error > 0 && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Con error</p>
              <p className="text-lg font-medium text-red-700">{fmtNum(svap.registros_error)}</p>
            </div>
          )}
          {svap.tiempo_proceso_seg && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Tiempo proceso</p>
              <p className="text-sm font-medium text-gray-700">{svap.tiempo_proceso_seg}s</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400">Enviado a las</p>
            <p className="text-sm font-medium text-gray-700">{fmtHora(svap.fecha_envio)}</p>
          </div>
        </div>

        {/* Errores detallados */}
        {svap.registros_error > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Detalle de errores
            </p>
            {cargandoErr ? (
              <div className="flex items-center gap-2 py-4 text-xs text-gray-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Cargando errores...
              </div>
            ) : errores.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Sin detalle de errores disponible</p>
            ) : (
              <div className="space-y-2">
                {errores.map(err => (
                  <div key={err.id} className={`rounded-lg p-3 text-xs border ${
                    err.severidad === 'critico' ? 'bg-red-50 border-red-100' :
                    err.severidad === 'error'   ? 'bg-orange-50 border-orange-100' :
                    'bg-amber-50 border-amber-100'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-medium">{err.codigo_error}</span>
                      {err.linea && <span className="text-gray-400">línea {err.linea}</span>}
                    </div>
                    <p className="text-gray-700">{err.descripcion}</p>
                    {err.dato_afectado && (
                      <p className="text-gray-500 font-mono mt-1">{err.dato_afectado}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE PRINCIPAL — Tab SVAP completo
// ============================================================
export function SVAPTab() {
  const [archivos, setArchivos]   = useState<SVAPArchivo[]>([])
  const [metricas, setMetricas]   = useState<SVAPMetricas | null>(null)
  const [seleccionado, setSeleccionado] = useState<SVAPArchivo | null>(null)
  const [cargando, setCargando]   = useState(true)
  const [filtro, setFiltro]       = useState<'todos' | 'error' | 'parcial' | 'pendiente'>('todos')

  const cargar = async () => {
    setCargando(true)
    try {
      const res  = await fetch('/api/svap')
      const data = await res.json()
      setArchivos(data.archivos ?? [])
      setMetricas(data.metricas ?? null)
    } catch (e) {
      console.error('[svap] Error cargando:', e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const archivosFiltrados = archivos.filter(a => {
    if (filtro === 'error')    return a.estado_envio === 'error' || a.estado_envio === 'sin_respuesta'
    if (filtro === 'parcial')  return a.estado_envio === 'procesado_parcial'
    if (filtro === 'pendiente')return a.estado_envio === 'enviado'
    return true
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Monitor SVAP</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Tracking de archivos enviados a SmartVista — resuelve KLAP-1482
          </p>
        </div>
        <button
          onClick={cargar}
          disabled={cargando}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Métricas */}
      {metricas && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">SVAPs hoy</p>
            <p className="text-2xl font-semibold text-gray-900">{metricas.total_hoy}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Procesados ok</p>
            <p className={`text-2xl font-semibold ${metricas.procesados_ok > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {metricas.procesados_ok}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Con error</p>
            <p className={`text-2xl font-semibold ${metricas.con_error > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {metricas.con_error}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Tasa de éxito</p>
            <p className={`text-2xl font-semibold ${
              metricas.tasa_exito === 100 ? 'text-green-600' :
              metricas.tasa_exito > 80   ? 'text-amber-600' : 'text-red-600'
            }`}>
              {metricas.tasa_exito}%
            </p>
          </div>
        </div>
      )}

      {/* Filtros + lista */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {([
              ['todos',    'Todos'],
              ['pendiente','Esperando'],
              ['error',    'Con error'],
              ['parcial',  'Parciales'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFiltro(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filtro === id
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400">{archivosFiltrados.length} archivos</span>
        </div>

        {cargando ? (
          <div className="flex items-center gap-2 py-8 justify-center text-sm text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Cargando...
          </div>
        ) : archivosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-sm text-gray-400">Sin archivos en esta categoría</p>
          </div>
        ) : (
          archivosFiltrados.map(s => (
            <SVAPRow key={s.id} svap={s} onSelect={setSeleccionado} />
          ))
        )}
      </div>

      {seleccionado && (
        <SVAPModal svap={seleccionado} onClose={() => setSeleccionado(null)} />
      )}
    </div>
  )
}
