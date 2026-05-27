'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import {
  CheckCircle, Clock, RefreshCw, FileText, TrendingUp,
  Bell, Settings, ChevronRight, XCircle, AlertCircle,
  Activity, Database, AlertTriangle, UploadCloud
} from 'lucide-react'
import {
  getMetricas, getAlertas, getArchivos, getCuadratura7Dias, actualizarAlerta
} from '@/lib/supabase'
import { mockArchivos, mockAlertas, mockCuadratura, getMockMetricas, getMockResumen7Dias } from '@/lib/mock-data'
import { UploadModal } from '@/components/svxp-uploader'
import type { Alerta, CuadraturaDiaria, Archivo, MetricasGlobales, ResumenDia } from '@/types'

// Si no hay Supabase configurado, usar datos mock
const usarMock = !process.env.NEXT_PUBLIC_SUPABASE_URL

const fmtNum = (n: number) => n.toLocaleString('es-CL')
const fmtFecha = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
const fmtHora = (iso: string) => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

const estadoBadge: Record<string, string> = {
  ok: 'bg-green-50 text-green-700 border border-green-200',
  diferencia: 'bg-red-50 text-red-700 border border-red-200',
  pendiente: 'bg-gray-100 text-gray-600 border border-gray-200',
  error: 'bg-red-50 text-red-700 border border-red-200',
  procesando: 'bg-blue-50 text-blue-700 border border-blue-200',
  advertencia: 'bg-amber-50 text-amber-700 border border-amber-200',
}
const sevBadge: Record<string, string> = {
  critica: 'bg-red-50 text-red-700 border border-red-200',
  alta: 'bg-orange-50 text-orange-700 border border-orange-200',
  media: 'bg-amber-50 text-amber-700 border border-amber-200',
  baja: 'bg-gray-100 text-gray-600 border border-gray-200',
}
const alertaBadge: Record<string, string> = {
  activa: 'bg-red-50 text-red-700 border border-red-200',
  en_revision: 'bg-amber-50 text-amber-700 border border-amber-200',
  resuelta: 'bg-green-50 text-green-700 border border-green-200',
  ignorada: 'bg-gray-100 text-gray-500 border border-gray-200',
}

function StateIcon({ estado }: { estado: string }) {
  if (estado === 'ok' || estado === 'resuelta') return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
  if (estado === 'error' || estado === 'diferencia') return <XCircle className="w-4 h-4 text-red-500 shrink-0" />
  if (estado === 'advertencia' || estado === 'en_revision' || estado === 'activa') return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
  return <Clock className="w-4 h-4 text-gray-400 shrink-0" />
}

function MetricCard({ label, value, sub, color = 'default' }: { label: string; value: string | number; sub?: string; color?: 'default'|'red'|'green'|'amber' }) {
  const c = { default: 'text-gray-900', red: 'text-red-600', green: 'text-green-600', amber: 'text-amber-600' }
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${c[color]}`}>{typeof value === 'number' ? fmtNum(value) : value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function CuadRow({ row }: { row: CuadraturaDiaria }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <StateIcon estado={row.estado} />
      <span className="w-20 shrink-0 text-xs font-medium text-gray-500">{row.marca === 'MASTERCARD' ? 'MC' : row.marca}</span>
      <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
        <div><span className="text-gray-400">SVXP </span><span className="font-medium text-gray-700">{fmtNum(row.trx_svxp)}</span></div>
        <div><span className="text-gray-400">CTF/IPM </span><span className="font-medium text-gray-700">{fmtNum(row.trx_ctf + row.trx_ipm)}</span></div>
        <div><span className="text-gray-400">Dif </span><span className={`font-semibold ${row.diferencia === 0 ? 'text-green-600' : 'text-red-600'}`}>{row.diferencia > 0 ? '+' : ''}{fmtNum(row.diferencia)}</span></div>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${estadoBadge[row.estado]}`}>{row.estado}</span>
    </div>
  )
}

function AlertRow({ alerta, onSelect }: { alerta: Alerta; onSelect: (a: Alerta) => void }) {
  return (
    <button onClick={() => onSelect(alerta)} className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
      <StateIcon estado={alerta.estado} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sevBadge[alerta.severidad]}`}>{alerta.severidad}</span>
          {alerta.jira_ticket && <span className="text-xs text-blue-500 font-mono">{alerta.jira_ticket}</span>}
          {alerta.marca && <span className="text-xs text-gray-400">{alerta.marca}</span>}
        </div>
        <p className="text-sm font-medium text-gray-800 leading-tight">{alerta.titulo}</p>
        {alerta.cantidad_trx > 0 && <p className="text-xs text-gray-400 mt-1">{fmtNum(alerta.cantidad_trx)} TRX afectadas</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${alertaBadge[alerta.estado]}`}>{alerta.estado.replace('_', ' ')}</span>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </button>
  )
}

function FileRow({ archivo }: { archivo: Archivo }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <StateIcon estado={archivo.estado} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-gray-600 truncate">{archivo.nombre}</p>
        <p className="text-xs text-gray-400">{fmtHora(archivo.recibido_at)} · {fmtNum(archivo.total_trx)} TRX</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">{archivo.tipo}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadge[archivo.estado]}`}>{archivo.estado}</span>
      </div>
    </div>
  )
}

function AlertModal({ alerta, onClose, onActualizar }: { alerta: Alerta; onClose: () => void; onActualizar: (id: string, estado: 'en_revision'|'resuelta') => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <StateIcon estado={alerta.estado} />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sevBadge[alerta.severidad]}`}>{alerta.severidad}</span>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors"><XCircle className="w-5 h-5" /></button>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">{alerta.titulo}</h3>
        {alerta.detalle && <p className="text-sm text-gray-500 mb-4 leading-relaxed">{alerta.detalle}</p>}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {alerta.marca && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">Marca</p><p className="text-sm font-medium text-gray-700">{alerta.marca}</p></div>}
          {alerta.cantidad_trx > 0 && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">TRX afectadas</p><p className="text-sm font-medium text-gray-700">{fmtNum(alerta.cantidad_trx)}</p></div>}
          {alerta.fecha_proceso && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">Fecha proceso</p><p className="text-sm font-medium text-gray-700">{alerta.fecha_proceso}</p></div>}
          {alerta.jira_ticket && <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs text-blue-400">Ticket Jira</p><p className="text-sm font-semibold text-blue-600 font-mono">{alerta.jira_ticket}</p></div>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onActualizar(alerta.id, 'en_revision')} className="flex-1 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium">Marcar en revisión</button>
          <button onClick={() => onActualizar(alerta.id, 'resuelta')} className="flex-1 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium">Marcar resuelta</button>
        </div>
      </div>
    </div>
  )
}

type Tab = 'dashboard' | 'alertas' | 'cuadratura' | 'archivos'

export default function Home() {
  const [tab,          setTab]          = useState<Tab>('dashboard')
  const [alertaSel,    setAlertaSel]    = useState<Alerta | null>(null)
  const [filtroAlerta, setFiltroAlerta] = useState<'todos'|'activa'|'en_revision'|'resuelta'>('todos')
  const [showUpload,   setShowUpload]   = useState(false)
  const [cargando,     setCargando]     = useState(!usarMock)

  // Datos — mock o Supabase real
  const [metricas,  setMetricas]  = useState<MetricasGlobales>(getMockMetricas())
  const [alertas,   setAlertas]   = useState<Alerta[]>(mockAlertas)
  const [archivos,  setArchivos]  = useState<Archivo[]>(mockArchivos)
  const [cuadratura,setCuadratura]= useState<CuadraturaDiaria[]>(mockCuadratura)
  const [resumen7d, setResumen7d] = useState<ResumenDia[]>(getMockResumen7Dias())

  const cargarDatos = useCallback(async () => {
    if (usarMock) return
    setCargando(true)
    try {
      const [m, al, ar, cuad] = await Promise.all([
        getMetricas(), getAlertas(), getArchivos(), getCuadratura7Dias()
      ])
      setMetricas(m)
      setAlertas(al as Alerta[])
      setArchivos(ar as Archivo[])
      setCuadratura(cuad as CuadraturaDiaria[])

      // Construir resumen7d desde cuadratura real
      const porFecha: Record<string, { visa?: CuadraturaDiaria; mc?: CuadraturaDiaria }> = {}
      ;(cuad as CuadraturaDiaria[]).forEach(c => {
        if (!porFecha[c.fecha]) porFecha[c.fecha] = {}
        if (c.marca === 'VISA') porFecha[c.fecha].visa = c
        else porFecha[c.fecha].mc = c
      })
      const r7d: ResumenDia[] = Object.entries(porFecha).map(([f, { visa, mc }]) => ({
        fecha: f,
        visa:        { svxp: visa?.trx_svxp ?? 0, ctf: visa?.trx_ctf ?? 0, diferencia: visa?.diferencia ?? 0, estado: visa?.estado ?? 'pendiente' },
        mastercard:  { svxp: mc?.trx_svxp   ?? 0, ctf: mc?.trx_ctf   ?? 0, diferencia: mc?.diferencia   ?? 0, estado: mc?.estado   ?? 'pendiente' },
        alertas_activas: (al as Alerta[]).filter(a => a.fecha_proceso === f && (a.estado === 'activa' || a.estado === 'en_revision')).length,
      })).sort((a, b) => a.fecha.localeCompare(b.fecha))
      setResumen7d(r7d)
    } catch (e) {
      console.error('Error cargando datos:', e)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const handleActualizarAlerta = async (id: string, estado: 'en_revision' | 'resuelta') => {
    if (!usarMock) await actualizarAlerta(id, estado)
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, estado } : a))
    setAlertaSel(null)
  }

  const hoy  = new Date().toISOString().split('T')[0]
  const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const cuadHoy           = cuadratura.filter(c => c.fecha === hoy)
  const cuadAyer          = cuadratura.filter(c => c.fecha === ayer)
  const archHoy           = archivos.filter(a => a.fecha_proceso === hoy)
  const alertasActivasHoy = alertas.filter(a => a.estado === 'activa' || a.estado === 'en_revision')
  const alertasFiltradas  = alertas.filter(a => filtroAlerta === 'todos' ? true : a.estado === filtroAlerta)

  const navItems: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard',  label: 'Dashboard',   icon: TrendingUp },
    { id: 'alertas',    label: 'Alertas',      icon: Bell },
    { id: 'cuadratura', label: 'Cuadratura',   icon: Database },
    { id: 'archivos',   label: 'Archivos',     icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">ClearingOps</span>
            <span className="hidden sm:block text-xs text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">MVP v0.1</span>
          </div>
          <nav className="flex gap-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                <Icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowUpload(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors">
              <UploadCloud className="w-3.5 h-3.5" /><span className="hidden sm:inline">Subir SVXP</span>
            </button>
            {metricas.alertas_criticas > 0 && (
              <button onClick={() => setTab('alertas')} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-100 hover:bg-red-100 transition-colors">
                <AlertCircle className="w-3.5 h-3.5" />{metricas.alertas_criticas} crítica{metricas.alertas_criticas > 1 ? 's' : ''}
              </button>
            )}
            <button onClick={cargarDatos} disabled={cargando} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40">
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><Settings className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {tab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="TRX recibidas hoy" value={metricas.total_trx_hoy} sub="VISA + Mastercard" />
              <MetricCard label="Alertas críticas" value={metricas.alertas_criticas} sub="Acción inmediata" color={metricas.alertas_criticas > 0 ? 'red' : 'green'} />
              <MetricCard label="Alertas activas" value={metricas.alertas_activas} sub="Incluyendo en revisión" color={metricas.alertas_activas > 0 ? 'amber' : 'green'} />
              <MetricCard label="Diferencia total" value={metricas.diferencia_total} sub="TRX sin cuadrar ayer" color={metricas.diferencia_total > 0 ? 'red' : 'green'} />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Transacciones — últimos 7 días</h2>
                  <p className="text-xs text-gray-400 mt-0.5">SVXP recibido por marca</p>
                </div>
                <button className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"><RefreshCw className="w-4 h-4" /></button>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={resumen7d} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F97316" stopOpacity={0.15}/><stop offset="95%" stopColor="#F97316" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={fmtFecha} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtNum(v)} />
                  <Tooltip formatter={(v) => [fmtNum(Number(v ?? 0))]} labelFormatter={fmtFecha} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="visa.svxp" name="VISA" stroke="#3B82F6" fill="url(#gV)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="mastercard.svxp" name="Mastercard" stroke="#F97316" fill="url(#gM)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Cuadratura del día</h2>
                {cuadHoy.length > 0 && (<><p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Hoy</p>{cuadHoy.map(c => <CuadRow key={c.id} row={c} />)}</>)}
                {cuadAyer.length > 0 && (<><p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 mt-4">Ayer</p>{cuadAyer.map(c => <CuadRow key={c.id} row={c} />)}</>)}
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">Alertas activas</h2>
                  <button onClick={() => setTab('alertas')} className="text-xs text-blue-500 hover:text-blue-700 transition-colors">Ver todas →</button>
                </div>
                {alertasActivasHoy.length === 0
                  ? <div className="flex flex-col items-center py-8"><CheckCircle className="w-8 h-8 text-green-400 mb-2" /><p className="text-sm text-gray-400">Sin alertas activas</p></div>
                  : alertasActivasHoy.slice(0, 4).map(a => <AlertRow key={a.id} alerta={a} onSelect={setAlertaSel} />)
                }
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Archivos de hoy</h2>
                <button onClick={() => setTab('archivos')} className="text-xs text-blue-500 hover:text-blue-700 transition-colors">Ver todos →</button>
              </div>
              {archHoy.length === 0
                ? <p className="text-sm text-gray-400 text-center py-6">Sin archivos recibidos hoy</p>
                : archHoy.map(a => <FileRow key={a.id} archivo={a} />)
              }
            </div>
          </div>
        )}

        {tab === 'alertas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-base font-semibold text-gray-900">Alertas</h1>
              <div className="flex gap-1">
                {(['todos','activa','en_revision','resuelta'] as const).map(f => (
                  <button key={f} onClick={() => setFiltroAlerta(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroAlerta === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
                    {f === 'todos' ? 'Todas' : f.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {alertasFiltradas.length === 0
                ? <div className="flex flex-col items-center py-12"><CheckCircle className="w-10 h-10 text-green-400 mb-3" /><p className="text-sm text-gray-500">Sin alertas en esta categoría</p></div>
                : alertasFiltradas.map(a => <div key={a.id} className="p-2"><AlertRow alerta={a} onSelect={setAlertaSel} /></div>)
              }
            </div>
          </div>
        )}

        {tab === 'cuadratura' && (
          <div className="space-y-4">
            <h1 className="text-base font-semibold text-gray-900">Cuadratura — últimos 7 días</h1>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Diferencias por marca</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={resumen7d} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={fmtFecha} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [fmtNum(Number(v ?? 0))]} labelFormatter={fmtFecha} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="visa.diferencia" name="VISA diferencia" fill="#3B82F6" radius={[4,4,0,0]} />
                  <Bar dataKey="mastercard.diferencia" name="MC diferencia" fill="#F97316" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Detalle por día</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr className="text-left border-b border-gray-100">
                      {['Fecha','Marca','SVXP','CTF/IPM','Error','Frozen','Diferencia','Estado'].map((h,i) => (
                        <th key={h} className={`pb-2 text-gray-400 font-medium ${i > 1 ? 'text-right' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...mockCuadratura].reverse().map(c => (
                      <tr key={c.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 text-gray-500">{fmtFecha(c.fecha)}</td>
                        <td className="py-2.5 font-medium text-gray-700">{c.marca === 'MASTERCARD' ? 'MC' : c.marca}</td>
                        <td className="py-2.5 text-right text-gray-700">{fmtNum(c.trx_svxp)}</td>
                        <td className="py-2.5 text-right text-gray-700">{fmtNum(c.trx_ctf + c.trx_ipm)}</td>
                        <td className="py-2.5 text-right text-gray-700">{fmtNum(c.trx_error)}</td>
                        <td className="py-2.5 text-right text-gray-700">{fmtNum(c.trx_frozen)}</td>
                        <td className={`py-2.5 text-right font-semibold ${c.diferencia !== 0 ? 'text-red-600' : 'text-green-600'}`}>{c.diferencia > 0 ? '+' : ''}{fmtNum(c.diferencia)}</td>
                        <td className="py-2.5 text-right"><span className={`px-2 py-0.5 rounded-full font-medium ${estadoBadge[c.estado]}`}>{c.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'archivos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-base font-semibold text-gray-900">Archivos recibidos</h1>
              <span className="text-xs text-gray-400">{mockArchivos.length} archivos — últimos 7 días</span>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              {mockArchivos.map(a => <FileRow key={a.id} archivo={a} />)}
            </div>
          </div>
        )}
      </main>

      {alertaSel && <AlertModal alerta={alertaSel} onClose={() => setAlertaSel(null)} onActualizar={handleActualizarAlerta} />}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={cargarDatos} />}
      {usarMock && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-amber-900 text-amber-100 text-xs px-4 py-2 rounded-full shadow-lg">
          Modo demo — conecta Supabase para datos reales
        </div>
      )}
    </div>
  )
}
