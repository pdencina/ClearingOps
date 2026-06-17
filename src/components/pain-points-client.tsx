'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/ui/metric-card'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Zap,
  Bug,
  Lock,
  Timer,
  TrendingDown,
} from 'lucide-react'

type Category = 'all' | 'fees' | 'clearing' | 'dependency' | 'access'

interface PainPoint {
  id: string
  reference: string
  summary: string
  category: Category
  status: string
  impact: 'critical' | 'high' | 'medium'
  root_cause: string
  klap_solution: string
  klap_module: string
  resolution_time_bpc: string
  resolution_time_klap: string
  is_resolved_in_klap: boolean
}

const PAIN_POINTS: PainPoint[] = [
  {
    id: '1',
    reference: 'KLAP-1806',
    summary: 'CM Transaction Fee MC — Monto en dólares en Cero',
    category: 'fees',
    status: 'In Progress',
    impact: 'critical',
    root_cause: 'SmartVista no calcula transaction fees para MC cuando el monto está en USD. Bug en la conversión de moneda dentro del módulo de comisiones de BPC.',
    klap_solution: 'El Settlement Engine de KLAP maneja multi-moneda nativamente. Las fee_rules soportan cualquier moneda y la conversión se aplica antes del cálculo de comisión.',
    klap_module: '/engine → Settlement',
    resolution_time_bpc: '2-4 semanas (esperando fix de BPC)',
    resolution_time_klap: '5 minutos (ajustar fee_rule)',
    is_resolved_in_klap: true,
  },
  {
    id: '2',
    reference: 'KLAP-1804',
    summary: 'Venta Cuota Comercio MC — CM Clearing Error de Tramo',
    category: 'fees',
    status: 'In Progress',
    impact: 'critical',
    root_cause: 'BPC aplica tramos de comisión incorrectos para ventas en cuotas MC. La lógica de tramos está hardcodeada en SmartVista y no distingue correctamente entre cuota 1 y siguientes.',
    klap_solution: 'KLAP permite configurar reglas de comisión por tramo con lógica de cuotas explícita: Cuota 1 puede tener un rate diferente a cuotas 2+. Todo configurable sin código.',
    klap_module: '/reglas',
    resolution_time_bpc: '3-6 semanas (requiere release)',
    resolution_time_klap: '2 minutos (editar regla)',
    is_resolved_in_klap: true,
  },
  {
    id: '3',
    reference: 'KLAP-1803',
    summary: 'Venta Cuota Comercio — CM Autorización Errado',
    category: 'fees',
    status: 'In Progress',
    impact: 'high',
    root_cause: 'SmartVista aplica comisión de autorización de forma incorrecta en ventas con cuota comercio. No separa el fee de autorización del fee de clearing.',
    klap_solution: 'KLAP separa explícitamente Authorization Fee y Clearing Fee como reglas independientes. Cada una tiene su propio trigger y cálculo.',
    klap_module: '/engine → Authorization + Settlement',
    resolution_time_bpc: '2-4 semanas',
    resolution_time_klap: '10 minutos (crear regla separada)',
    is_resolved_in_klap: true,
  },
  {
    id: '4',
    reference: 'KLAP-1802',
    summary: 'CM Autorización sólo debe aplicar a Cuota 1',
    category: 'fees',
    status: 'In Progress',
    impact: 'high',
    root_cause: 'BPC aplica comisión de autorización a TODAS las cuotas. Debería aplicar solo a la primera presentación. Falta un filtro por número de cuota en el motor de fees.',
    klap_solution: 'El Settlement Engine tiene campo "installment_number" en las reglas. Se puede configurar: aplicar fee solo cuando installment == 1.',
    klap_module: '/reglas + /engine → Settlement',
    resolution_time_bpc: '4-6 semanas (cambio en core)',
    resolution_time_klap: '3 minutos (condición en regla)',
    is_resolved_in_klap: true,
  },
  {
    id: '5',
    reference: 'KLAP-1801',
    summary: 'Cuota 2+ Todas con CM Volumen en Cero',
    category: 'fees',
    status: 'In Progress',
    impact: 'critical',
    root_cause: 'SmartVista calcula el volumen como $0 para cuotas posteriores a la primera. El campo de monto no se propaga correctamente en el módulo de clearing para cuotas.',
    klap_solution: 'KLAP propaga el monto original de la transacción a todas las cuotas. El Clearing Engine mantiene referencia al monto base independiente del número de cuota.',
    klap_module: '/clearing + /engine → Clearing',
    resolution_time_bpc: '3-5 semanas',
    resolution_time_klap: '0 (ya funciona correctamente)',
    is_resolved_in_klap: true,
  },
  {
    id: '6',
    reference: 'KLAP-1794',
    summary: 'CM Diferencias entre Tag y AMR',
    category: 'clearing',
    status: 'In Progress',
    impact: 'high',
    root_cause: 'Inconsistencia entre datos del Tag (archivo de clearing) y los valores del AMR (Account Management Report). BPC no sincroniza correctamente ambas fuentes.',
    klap_solution: 'KLAP tiene una única fuente de verdad (transactions table) de la cual se derivan tanto los archivos de clearing como los reportes. Imposible que diverjan.',
    klap_module: '/conciliacion + /clearing',
    resolution_time_bpc: '2-3 semanas',
    resolution_time_klap: '0 (problema eliminado por diseño)',
    is_resolved_in_klap: true,
  },
  {
    id: '7',
    reference: 'KLAP-940',
    summary: 'Rechazos deben reflejarse en el Clearing Out',
    category: 'clearing',
    status: 'Waiting for support',
    impact: 'high',
    root_cause: 'SmartVista no incluye transacciones rechazadas en el archivo de clearing saliente. Los rechazos se pierden y no se reportan a las marcas.',
    klap_solution: 'El Clearing Engine de KLAP incluye TODAS las transacciones (approved + rejected) en el batch con su response code correspondiente. El filtro es configurable.',
    klap_module: '/engine → Clearing',
    resolution_time_bpc: '9+ meses (abierto desde Sept 2025)',
    resolution_time_klap: '0 (incluido por defecto)',
    is_resolved_in_klap: true,
  },
  {
    id: '8',
    reference: 'KLAP-1628',
    summary: 'TRX Anulación sin Original debe quedar Frozen',
    category: 'clearing',
    status: 'In Progress',
    impact: 'medium',
    root_cause: 'Cuando llega una anulación pero no existe la transacción original, SmartVista la procesa igual en vez de marcarla como Frozen para revisión manual.',
    klap_solution: 'El Authorization Engine valida existencia de la TRX original antes de procesar reversas. Si no existe → status "frozen" + alerta automática al equipo ops.',
    klap_module: '/engine → Authorization + /monitor',
    resolution_time_bpc: '2+ meses',
    resolution_time_klap: '0 (regla built-in)',
    is_resolved_in_klap: true,
  },
  {
    id: '9',
    reference: 'KLAP-1748',
    summary: 'VISA Release Marca Q2 (Octubre 2026)',
    category: 'dependency',
    status: 'Waiting for support',
    impact: 'high',
    root_cause: 'KLAP debe esperar a que BPC implemente los cambios del release de Visa Q2. No puede adelantarse ni implementar por su cuenta. Bloqueado por calendario de BPC.',
    klap_solution: 'Con switch propio, KLAP implementa releases de marca directamente. CI/CD propio permite deployar cambios en horas, no meses.',
    klap_module: '/independencia + /jobs',
    resolution_time_bpc: 'Meses (depende del roadmap BPC)',
    resolution_time_klap: '1-2 semanas (desarrollo directo)',
    is_resolved_in_klap: true,
  },
  {
    id: '10',
    reference: 'KLAP-1681',
    summary: 'Solicitud acceso a Session_file_id',
    category: 'access',
    status: 'Waiting for Fix',
    impact: 'medium',
    root_cause: 'KLAP necesita acceso a un dato interno de SmartVista (session_file_id) pero BPC no lo expone. Bloqueado esperando que BPC abra el acceso.',
    klap_solution: 'En sistema propio, KLAP tiene acceso total a todos los datos. No existen "datos bloqueados" porque la base de datos es propia.',
    klap_module: '/transacciones (acceso directo)',
    resolution_time_bpc: '5+ semanas (abierto desde Mayo)',
    resolution_time_klap: '0 (sin restricción)',
    is_resolved_in_klap: true,
  },
  {
    id: '11',
    reference: 'KLAP-1674',
    summary: 'Habilitación lectura de Contracargos AMEX',
    category: 'access',
    status: 'Waiting for Fix',
    impact: 'medium',
    root_cause: 'BPC no ha habilitado la lectura de archivos de contracargos AMEX. KLAP no puede procesar disputas AMEX sin este acceso.',
    klap_solution: 'El Dispute Engine de KLAP procesa contracargos de todas las marcas (Visa, MC, AMEX) de forma nativa. Solo necesita el archivo de entrada.',
    klap_module: '/disputas + /engine → Disputes',
    resolution_time_bpc: '6+ semanas',
    resolution_time_klap: '0 (soporte nativo)',
    is_resolved_in_klap: true,
  },
  {
    id: '12',
    reference: 'KLAP-1337',
    summary: 'TRX CC B.Chile anuladas y se continuó enviando cuotas',
    category: 'clearing',
    status: 'Closed',
    impact: 'critical',
    root_cause: 'Transacciones de cuota comercio del Banco de Chile fueron anuladas, pero SmartVista siguió generando cuotas en clearing. No detectó la anulación.',
    klap_solution: 'El Clearing Engine verifica estado de la TRX original antes de generar cada cuota. Si está reversed/cancelled, detiene el envío de cuotas restantes automáticamente.',
    klap_module: '/clearing + /engine → Clearing',
    resolution_time_bpc: 'Semanas (ocurrió y se cerró)',
    resolution_time_klap: '0 (validación automática)',
    is_resolved_in_klap: true,
  },
  {
    id: '13',
    reference: 'KLAP-1086',
    summary: 'Implementar Cuadratura TRX SVXP vs Outgoing',
    category: 'clearing',
    status: 'Waiting for support',
    impact: 'high',
    root_cause: 'No existe cuadratura automática entre las transacciones del archivo SVXP (incoming) y lo que se envía en clearing (outgoing). Dependen de BPC para implementarlo.',
    klap_solution: 'El Reconciliation Engine de KLAP compara automáticamente incoming vs outgoing. Detecta diferencias, genera alertas, y muestra un dashboard de conciliación.',
    klap_module: '/conciliacion + /engine → Reconciliation',
    resolution_time_bpc: '8+ meses (abierto desde Nov 2025)',
    resolution_time_klap: 'Ya implementado',
    is_resolved_in_klap: true,
  },
  {
    id: '14',
    reference: 'KLAP-1703',
    summary: 'MC Prepago Nacional aplica Internacional',
    category: 'fees',
    status: 'Waiting for customer',
    impact: 'high',
    root_cause: 'SmartVista clasifica tarjetas MC prepago nacionales como internacionales, aplicando comisión incorrecta. El BIN table de BPC no tiene la distinción correcta.',
    klap_solution: 'KLAP tiene un BIN Table con 35+ entradas de bancos chilenos que clasifican correctamente por emisor, marca, tipo y si es nacional/internacional.',
    klap_module: '/switch → BIN Lookup',
    resolution_time_bpc: '3-4 semanas',
    resolution_time_klap: '5 minutos (actualizar BIN table)',
    is_resolved_in_klap: true,
  },
]

const categoryConfig = {
  all: { label: 'Todos', color: 'text-foreground' },
  fees: { label: 'Comisiones & Fees', color: 'text-red-400' },
  clearing: { label: 'Clearing & Cuadratura', color: 'text-orange-400' },
  dependency: { label: 'Dependencia de BPC', color: 'text-yellow-400' },
  access: { label: 'Accesos Bloqueados', color: 'text-purple-400' },
}

const impactConfig = {
  critical: { badge: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Crítico' },
  high: { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', label: 'Alto' },
  medium: { badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'Medio' },
}

export function PainPointsClient() {
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = activeCategory === 'all'
    ? PAIN_POINTS
    : PAIN_POINTS.filter(p => p.category === activeCategory)

  const criticalCount = PAIN_POINTS.filter(p => p.impact === 'critical').length
  const resolvedCount = PAIN_POINTS.filter(p => p.is_resolved_in_klap).length
  const waitingBPC = PAIN_POINTS.filter(p => p.status.includes('Waiting')).length

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pain Points → Soluciones KLAP"
        description="Mapeo de problemas operativos reales con BPC y cómo KLAP CORE los resuelve"
      />

      {/* Impact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Issues Identificados" value={PAIN_POINTS.length} icon={Bug} iconColor="bg-red-500/10" />
        <MetricCard title="Impacto Crítico" value={criticalCount} icon={AlertTriangle} iconColor="bg-red-500/10" />
        <MetricCard title="Bloqueados por BPC" value={waitingBPC} icon={Lock} iconColor="bg-yellow-500/10" />
        <MetricCard title="Resueltos en KLAP" value={`${resolvedCount}/${PAIN_POINTS.length}`} icon={CheckCircle2} iconColor="bg-emerald-500/10" />
      </div>

      {/* Time comparison banner */}
      <Card className="border-accent/20 bg-accent/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Tiempo promedio de resolución</p>
            <div className="flex items-center gap-6 mt-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-muted">BPC: <span className="text-red-400 font-bold">3-8 semanas</span></span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted">KLAP: <span className="text-emerald-400 font-bold">0-10 minutos</span></span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-400">100x</p>
            <p className="text-[10px] text-muted">más rápido</p>
          </div>
        </div>
      </Card>

      {/* Category filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {(Object.keys(categoryConfig) as Category[]).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
              activeCategory === cat
                ? 'bg-accent/10 text-accent border-accent/20'
                : 'text-muted hover:text-foreground border-border hover:border-border-hover'
            )}
          >
            {categoryConfig[cat].label}
          </button>
        ))}
      </div>

      {/* Pain Points List */}
      <div className="space-y-3">
        {filtered.map((point) => {
          const isExpanded = expandedId === point.id
          const impact = impactConfig[point.impact]

          return (
            <Card
              key={point.id}
              className={cn('cursor-pointer transition-all', isExpanded && 'border-accent/30')}
              onClick={() => setExpandedId(isExpanded ? null : point.id)}
            >
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Bug className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-accent">{point.reference}</span>
                    <Badge variant={impact.badge}>{impact.label}</Badge>
                    <Badge variant="bg-card-hover text-muted border-border">{point.status}</Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground mt-1">{point.summary}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {point.is_resolved_in_klap && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400 font-medium">KLAP</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className="mt-5 pt-5 border-t border-border space-y-4 animate-fade-in" onClick={e => e.stopPropagation()}>
                  {/* Root Cause */}
                  <div className="p-4 rounded-lg bg-red-500/[0.03] border border-red-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                      <p className="text-xs font-medium text-red-400 uppercase tracking-wide">Causa Raíz (BPC)</p>
                    </div>
                    <p className="text-sm text-foreground/80">{point.root_cause}</p>
                  </div>

                  {/* KLAP Solution */}
                  <div className="p-4 rounded-lg bg-emerald-500/[0.03] border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Solución KLAP CORE</p>
                    </div>
                    <p className="text-sm text-foreground/80">{point.klap_solution}</p>
                    <p className="text-xs text-accent mt-2 font-mono">Módulo: {point.klap_module}</p>
                  </div>

                  {/* Time Comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-red-500/[0.03] border border-red-500/10 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Timer className="w-3 h-3 text-red-400" />
                        <p className="text-[10px] text-red-400 uppercase font-medium">Con BPC</p>
                      </div>
                      <p className="text-sm font-bold text-red-400">{point.resolution_time_bpc}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/[0.03] border border-emerald-500/10 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <p className="text-[10px] text-emerald-400 uppercase font-medium">Con KLAP</p>
                      </div>
                      <p className="text-sm font-bold text-emerald-400">{point.resolution_time_klap}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
