'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Layers,
  Server,
  CreditCard,
  GitBranch,
  Users,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Database,
  Code2,
  Clock,
  Target,
} from 'lucide-react'

interface DependencyModule {
  id: string
  title: string
  bpcRole: string
  risk: 'critical' | 'high' | 'medium'
  icon: React.ElementType
  currentState: string
  klapReplacement: string
  strategy: string[]
  timeline: string
  effort: string
  phase: number
}

const MODULES: DependencyModule[] = [
  {
    id: 'clearing',
    title: '1. Clearing / Compensación',
    bpcRole: 'BPC ejecuta el proceso de clearing: genera batches, formatea archivos para Visa/Mastercard, y gestiona la compensación de transacciones entre emisor y adquirente.',
    risk: 'critical',
    icon: Layers,
    currentState: 'KLAP depende 100% de BPC para generar archivos de clearing (CTF para Visa, IPM para Mastercard) y enviarlos a las marcas. Sin BPC, no hay compensación.',
    klapReplacement: 'KLAP Clearing Engine — Motor propio de generación de archivos de clearing',
    strategy: [
      'Construir parser/generador de archivos CTF (Visa) e IPM (Mastercard) internamente',
      'Implementar motor de batching que agrupe transacciones por marca y ciclo',
      'Desarrollar validaciones de formato según especificaciones de cada marca',
      'Conectar directamente con VisaNet y Mastercard Connect sin intermediario',
      'Implementar reconciliación automática post-clearing',
      'Certificar el motor directamente con Visa y Mastercard',
    ],
    timeline: '6-9 meses',
    effort: 'Alto — Requiere certificación directa con marcas',
    phase: 2,
  },
  {
    id: 'smartvista',
    title: '2. SmartVista (Core Platform)',
    bpcRole: 'SmartVista es el core transaccional. BPC lo opera, aplica releases, gestiona la base de datos de tarjetas, parámetros de autorización, y toda la lógica de negocio del switch.',
    risk: 'critical',
    icon: Server,
    currentState: 'KLAP no controla releases, no puede hacer cambios sin BPC, y depende de sus ventanas de mantenimiento. SmartVista es una caja negra operada por terceros.',
    klapReplacement: 'KLAP Core Engine — Switch transaccional propio cloud-native',
    strategy: [
      'Desarrollar un switch de autorización propio (ISO 8583 / ISO 20022)',
      'Migrar la lógica de autorización, validación de tarjetas y routing',
      'Construir BIN table management propio',
      'Implementar HSM integration para criptografía de PINs',
      'Migrar parámetros de comercios y terminales a base propia',
      'Operar releases propios con CI/CD sin depender de ventanas externas',
      'Ejecutar migración gradual: primero shadow mode, luego corte progresivo',
    ],
    timeline: '12-18 meses',
    effort: 'Muy Alto — Es el reemplazo del core, requiere certificación PCI-DSS',
    phase: 3,
  },
  {
    id: 'processing',
    title: '3. Procesamiento Transaccional',
    bpcRole: 'Parte del flujo de adquirencia pasa por servicios que BPC gestiona o soporta: routing de transacciones, aplicación de reglas, conexión con emisores.',
    risk: 'high',
    icon: CreditCard,
    currentState: 'El flujo de una transacción desde el POS hasta el emisor cruza capas controladas por BPC. KLAP no puede modificar routing ni agregar lógica sin coordinación.',
    klapReplacement: 'KLAP Payment Gateway — Gateway de procesamiento independiente',
    strategy: [
      'Desarrollar gateway de adquirencia propio con routing inteligente',
      'Implementar conexión directa a emisores principales (bancos locales)',
      'Construir motor de reglas configurable (fraud rules, limits, velocity)',
      'Integrar tokenización propia para cumplimiento PCI',
      'Implementar fallback y retry logic sin depender de terceros',
      'Agregar soporte multi-protocolo: ISO 8583, API REST, ISO 20022',
    ],
    timeline: '9-12 meses',
    effort: 'Alto — Requiere conexiones directas con emisores',
    phase: 2,
  },
  {
    id: 'releases',
    title: '4. Releases y Cambios',
    bpcRole: 'BPC controla el ciclo de releases (R26.30, R26.40, etc.), define ventanas de cambios, prueba en ambientes previos y decide cuándo se despliega a producción.',
    risk: 'high',
    icon: GitBranch,
    currentState: 'KLAP no puede desplegar cambios a producción sin esperar el ciclo de BPC. Un cambio simple puede tomar semanas. No hay CI/CD propio sobre SmartVista.',
    klapReplacement: 'KLAP DevOps — Pipeline CI/CD propio con releases autónomos',
    strategy: [
      'Implementar infraestructura cloud propia (AWS/GCP) con IaC (Terraform)',
      'Construir pipeline CI/CD: build → test → staging → canary → production',
      'Adoptar feature flags para releases graduales sin ventanas',
      'Implementar observabilidad completa: metrics, logs, traces (OpenTelemetry)',
      'Definir SLOs/SLAs propios sin depender de acuerdos con BPC',
      'Automatizar rollback en caso de degradación',
    ],
    timeline: '3-6 meses',
    effort: 'Medio — Puede empezar inmediatamente en paralelo',
    phase: 1,
  },
  {
    id: 'operations',
    title: '5. Dependencia Operativa',
    bpcRole: 'Cualquier cambio productivo requiere coordinación con BPC: validaciones de impacto, ventanas de mantenimiento, aprobaciones, y comunicación de incidentes.',
    risk: 'medium',
    icon: Users,
    currentState: 'KLAP opera como cliente de BPC. No tiene autonomía para resolver incidentes críticos ni para escalar capacidad sin autorización. Los tiempos de respuesta dependen de BPC.',
    klapReplacement: 'KLAP Operations Center — Centro de operaciones 24/7 autónomo',
    strategy: [
      'Crear equipo de operaciones 24/7 propio (NOC)',
      'Implementar runbooks automatizados para incidentes comunes',
      'Construir dashboards operacionales propios (ya iniciado con KLAP CORE)',
      'Definir procesos de incident management independientes',
      'Migrar monitoreo a herramientas propias (Datadog/Grafana)',
      'Establecer war rooms y escalation paths sin BPC en el loop',
    ],
    timeline: '3-4 meses',
    effort: 'Medio — Principalmente organizacional + tooling',
    phase: 1,
  },
  {
    id: 'risk',
    title: '6. Riesgo de Dependencia Externa',
    bpcRole: 'BPC tiene control sobre procesos críticos del negocio de KLAP. Cualquier problema en BPC (outage, disputa comercial, cambio de prioridades) impacta directamente a KLAP.',
    risk: 'critical',
    icon: AlertTriangle,
    currentState: 'Riesgo de vendor lock-in severo. Si BPC decide aumentar precios, reducir soporte, o tiene problemas financieros, KLAP no tiene plan B inmediato.',
    klapReplacement: 'KLAP Autonomous Platform — Independencia tecnológica total',
    strategy: [
      'Ejecutar roadmap de independencia en 3 fases (ver abajo)',
      'Mantener BPC como fallback durante la migración (shadow mode)',
      'Documentar 100% de las interfaces y protocolos actuales con BPC',
      'Contratar talento clave: arquitectos de pagos, expertos en certificación',
      'Negociar contrato de transición con BPC (soporte decreciente)',
      'Establecer KPIs de migración: % de transacciones en sistema propio',
    ],
    timeline: '18-24 meses (plan completo)',
    effort: 'Estratégico — Decisión de directorio',
    phase: 1,
  },
]

const PHASES = [
  {
    phase: 1,
    title: 'Fase 1: Fundación',
    duration: '0-6 meses',
    description: 'Construir la infraestructura base y capacidad operativa propia sin tocar aún el core transaccional.',
    items: [
      'Pipeline CI/CD propio en cloud',
      'Centro de operaciones 24/7',
      'Observabilidad y dashboards (KLAP CORE)',
      'Documentación completa de interfaces BPC',
      'Contratación de equipo clave',
      'Negociación de contrato de transición',
    ],
    color: 'from-blue-600 to-cyan-600',
    borderColor: 'border-blue-500/30',
  },
  {
    phase: 2,
    title: 'Fase 2: Módulos Periféricos',
    duration: '6-12 meses',
    description: 'Reemplazar clearing y gateway de procesamiento. Correr en shadow mode contra BPC para validar.',
    items: [
      'Motor de clearing propio (CTF/IPM)',
      'Gateway de adquirencia independiente',
      'Certificación directa con Visa y Mastercard',
      'Shadow mode: procesar en paralelo con BPC',
      'Validar paridad de resultados al 100%',
      'Migrar comercios piloto al sistema propio',
    ],
    color: 'from-violet-600 to-purple-600',
    borderColor: 'border-violet-500/30',
  },
  {
    phase: 3,
    title: 'Fase 3: Core Independiente',
    duration: '12-24 meses',
    description: 'Reemplazar SmartVista con switch propio. Migración gradual hasta corte definitivo.',
    items: [
      'Switch de autorización propio (ISO 8583)',
      'Migración de BIN tables y parámetros',
      'Integración HSM para criptografía',
      'Canary deployment: 1% → 10% → 50% → 100%',
      'Certificación PCI-DSS del nuevo core',
      'Corte definitivo y decomisión de SmartVista',
    ],
    color: 'from-emerald-600 to-teal-600',
    borderColor: 'border-emerald-500/30',
  },
]

const riskColors = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Crítico' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', label: 'Alto' },
  medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'Medio' },
}

export function IndependenciaClient() {
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'modules' | 'roadmap'>('modules')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Plan de Independencia de BPC"
        description="Roadmap para eliminar la dependencia de BPC SmartVista y operar de forma autónoma"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Dependencias Críticas</p>
              <p className="text-xl font-bold text-red-400">3</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Timeline Total</p>
              <p className="text-xl font-bold text-foreground">18-24 meses</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted">Fases del Plan</p>
              <p className="text-xl font-bold text-foreground">3</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Objetivo</p>
              <p className="text-xl font-bold text-emerald-400">100%</p>
              <p className="text-[10px] text-muted">Autonomía</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-card rounded-lg border border-border w-fit">
        <button
          onClick={() => setActiveTab('modules')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'modules' ? 'bg-accent text-white' : 'text-muted hover:text-foreground'
          )}
        >
          Módulos de Dependencia
        </button>
        <button
          onClick={() => setActiveTab('roadmap')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'roadmap' ? 'bg-accent text-white' : 'text-muted hover:text-foreground'
          )}
        >
          Roadmap por Fases
        </button>
      </div>

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          {MODULES.map((mod) => {
            const isExpanded = expandedModule === mod.id
            const Icon = mod.icon
            const risk = riskColors[mod.risk]

            return (
              <Card
                key={mod.id}
                className={cn(
                  'cursor-pointer transition-all duration-300',
                  isExpanded && 'border-accent/30'
                )}
                onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
              >
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground">{mod.title}</h3>
                      <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium border', risk.bg, risk.text, risk.border)}>
                        Riesgo {risk.label}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-card-hover text-muted border border-border">
                        Fase {mod.phase}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">{mod.bpcRole}</p>
                  </div>
                  <ArrowRight className={cn(
                    'w-4 h-4 text-muted transition-transform duration-300 flex-shrink-0',
                    isExpanded && 'rotate-90'
                  )} />
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-5 space-y-4 animate-fade-in border-t border-border pt-5">
                    {/* Current State */}
                    <div className="p-4 rounded-lg bg-red-500/[0.03] border border-red-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        <p className="text-xs font-medium text-red-400 uppercase tracking-wide">Estado Actual (con BPC)</p>
                      </div>
                      <p className="text-sm text-foreground/80">{mod.currentState}</p>
                    </div>

                    {/* KLAP Replacement */}
                    <div className="p-4 rounded-lg bg-emerald-500/[0.03] border border-emerald-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Reemplazo KLAP</p>
                      </div>
                      <p className="text-sm font-medium text-foreground">{mod.klapReplacement}</p>
                    </div>

                    {/* Strategy */}
                    <div className="p-4 rounded-lg bg-card-hover/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Code2 className="w-3.5 h-3.5 text-accent" />
                        <p className="text-xs font-medium text-accent uppercase tracking-wide">Estrategia de Migración</p>
                      </div>
                      <div className="space-y-2">
                        {mod.strategy.map((item, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="text-[10px] font-mono text-muted bg-card px-1.5 py-0.5 rounded border border-border mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-sm text-foreground/80">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline & Effort */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-[10px] text-muted uppercase tracking-wide mb-1">Timeline</p>
                        <p className="text-sm font-semibold text-foreground">{mod.timeline}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-[10px] text-muted uppercase tracking-wide mb-1">Esfuerzo</p>
                        <p className="text-sm font-semibold text-foreground">{mod.effort}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Roadmap Tab */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {PHASES.map((phase) => (
            <Card key={phase.phase} className={cn('relative overflow-hidden', phase.borderColor)}>
              {/* Phase gradient accent */}
              <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b', phase.color)} />

              <div className="pl-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', phase.color)}>
                    <span className="text-sm font-bold text-white">{phase.phase}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{phase.title}</h3>
                    <p className="text-xs text-muted">{phase.duration}</p>
                  </div>
                </div>

                <p className="text-sm text-foreground/70 mb-4">{phase.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {phase.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-card-hover/50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                      <span className="text-xs text-foreground/80">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}

          {/* Summary */}
          <Card className="border-accent/20 bg-accent/[0.02]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Resultado Final</h3>
                <p className="text-sm text-muted mt-1 leading-relaxed">
                  KLAP opera su propia plataforma de pagos end-to-end: autorización, clearing, liquidación,
                  y operaciones. Sin dependencia de BPC para releases, cambios, ni soporte. Autonomía total
                  con capacidad de innovar, escalar y deployar cambios en minutos en lugar de semanas.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
                    ✓ Sin vendor lock-in
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400">
                    ✓ Releases propios
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs font-medium text-violet-400">
                    ✓ Cloud-native
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-400">
                    ✓ Escalable
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
