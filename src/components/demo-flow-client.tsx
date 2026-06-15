'use client'

import { useState, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Play,
  CreditCard,
  Zap,
  Wallet,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  Bell,
  Calculator,
  CheckCircle2,
  ArrowDown,
  RotateCcw,
} from 'lucide-react'

interface EventStep {
  id: string
  label: string
  sublabel: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  details: string[]
  delay: number
}

const EVENT_STEPS: EventStep[] = [
  {
    id: 'purchase',
    label: 'Compra Realizada',
    sublabel: 'Cliente paga en POS',
    icon: CreditCard,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-indigo-600 to-purple-700',
    borderColor: 'border-indigo-500/50',
    details: [
      'Tarjeta: Visa •••• 4521',
      'Monto: $45.230 CLP',
      'Comercio: Supermercado Líder Express',
      'Terminal: TRM-001-LDR',
      'Método: Contactless',
    ],
    delay: 0,
  },
  {
    id: 'event',
    label: 'TransactionCreated',
    sublabel: 'Evento emitido al bus',
    icon: Zap,
    color: 'text-amber-300',
    bgColor: 'bg-gradient-to-br from-amber-600 to-orange-700',
    borderColor: 'border-amber-500/50',
    details: [
      'Event: transaction.created',
      'ID: txn_klp_2025_06_15_001',
      'Timestamp: 2025-06-15T14:32:07Z',
      'Source: payment-gateway',
      'Schema Version: 2.1',
    ],
    delay: 800,
  },
  {
    id: 'settlement',
    label: 'Settlement Service',
    sublabel: 'Calcula liquidación',
    icon: Wallet,
    color: 'text-emerald-300',
    bgColor: 'bg-gradient-to-br from-emerald-600 to-teal-700',
    borderColor: 'border-emerald-500/50',
    details: [
      'Monto Bruto: $45.230',
      'Comisión (2.2%): -$995',
      'IVA Comisión: -$189',
      'Neto a liquidar: $44.046',
      'Fecha liquidación: T+1',
    ],
    delay: 600,
  },
  {
    id: 'risk',
    label: 'Risk Engine',
    sublabel: 'Evalúa riesgo',
    icon: ShieldCheck,
    color: 'text-blue-300',
    bgColor: 'bg-gradient-to-br from-blue-600 to-cyan-700',
    borderColor: 'border-blue-500/50',
    details: [
      'Risk Score: 12/100 (Low)',
      'Velocity Check: OK',
      'Amount Check: Normal range',
      'Merchant History: Trusted',
      'Decision: APPROVE',
    ],
    delay: 400,
  },
  {
    id: 'fraud',
    label: 'Fraud Detection',
    sublabel: 'Análisis antifraude',
    icon: ShieldAlert,
    color: 'text-rose-300',
    bgColor: 'bg-gradient-to-br from-rose-600 to-pink-700',
    borderColor: 'border-rose-500/50',
    details: [
      'ML Model: v3.2.1',
      'Pattern Match: None',
      'Device Fingerprint: Verified',
      'Geolocation: Santiago, CL ✓',
      'Result: NO FRAUD DETECTED',
    ],
    delay: 500,
  },
  {
    id: 'reporting',
    label: 'Reporting Service',
    sublabel: 'Registra en analytics',
    icon: BarChart3,
    color: 'text-violet-300',
    bgColor: 'bg-gradient-to-br from-violet-600 to-purple-700',
    borderColor: 'border-violet-500/50',
    details: [
      'Dashboard: Updated',
      'Daily Volume: +$45.230',
      'Merchant Stats: Refreshed',
      'Brand Split: Visa +1',
      'Category: Retail/Supermarket',
    ],
    delay: 300,
  },
  {
    id: 'notification',
    label: 'Notification Service',
    sublabel: 'Notifica al comercio',
    icon: Bell,
    color: 'text-sky-300',
    bgColor: 'bg-gradient-to-br from-sky-600 to-blue-700',
    borderColor: 'border-sky-500/50',
    details: [
      'Channel: Webhook POST',
      'URL: merchant.api/webhooks',
      'Payload: transaction.completed',
      'SMS: +56 9 8765 4321',
      'Status: DELIVERED ✓',
    ],
    delay: 350,
  },
  {
    id: 'accounting',
    label: 'Accounting Service',
    sublabel: 'Registra contablemente',
    icon: Calculator,
    color: 'text-orange-300',
    bgColor: 'bg-gradient-to-br from-orange-600 to-red-700',
    borderColor: 'border-orange-500/50',
    details: [
      'Ledger Entry: #ACT-2025-84721',
      'Debit: Cta Merchant Payable',
      'Credit: Cta Revenue',
      'Tax Record: IVA $189',
      'Reconciliation: Pending T+1',
    ],
    delay: 450,
  },
]

export function DemoFlowClient() {
  const [activeSteps, setActiveSteps] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const runDemo = useCallback(() => {
    setActiveSteps([])
    setIsRunning(true)
    setIsComplete(false)

    let totalDelay = 0
    EVENT_STEPS.forEach((step, index) => {
      totalDelay += step.delay + 700
      setTimeout(() => {
        setActiveSteps(prev => [...prev, step.id])
        if (index === EVENT_STEPS.length - 1) {
          setTimeout(() => {
            setIsRunning(false)
            setIsComplete(true)
          }, 500)
        }
      }, totalDelay)
    })
  }, [])

  const reset = useCallback(() => {
    setActiveSteps([])
    setIsRunning(false)
    setIsComplete(false)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Demo: Event-Driven Flow"
        description="Simulación del flujo completo cuando un cliente realiza una compra"
      >
        <div className="flex items-center gap-3">
          {!isRunning && !isComplete && (
            <button
              onClick={runDemo}
              className="px-5 py-2.5 bg-gradient-to-r from-accent to-purple-600 hover:from-accent-hover hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-accent/20"
            >
              <Play className="w-4 h-4" />
              Iniciar Demo
            </button>
          )}
          {isRunning && (
            <div className="px-5 py-2.5 bg-amber-600/20 border border-amber-500/30 text-amber-400 text-sm font-medium rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Procesando...
            </div>
          )}
          {isComplete && (
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-card border border-border hover:border-accent text-foreground text-sm font-medium rounded-lg transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar
            </button>
          )}
        </div>
      </PageHeader>

      {/* Architecture Diagram */}
      <div className="max-w-4xl mx-auto">
        {EVENT_STEPS.map((step, index) => {
          const isActive = activeSteps.includes(step.id)
          const Icon = step.icon
          const isEvent = step.id === 'event'
          const isListener = index > 1

          return (
            <div key={step.id}>
              {/* Connector Arrow */}
              {index > 0 && (
                <div className="flex justify-center py-2">
                  <div className={cn(
                    'flex flex-col items-center transition-all duration-500',
                    isActive ? 'opacity-100' : 'opacity-20'
                  )}>
                    <div className={cn(
                      'w-0.5 h-6 transition-all duration-500',
                      isActive ? 'bg-accent' : 'bg-border'
                    )} />
                    <ArrowDown className={cn(
                      'w-4 h-4 transition-all duration-500',
                      isActive ? 'text-accent' : 'text-border'
                    )} />
                    {isListener && isActive && (
                      <span className="text-[9px] text-accent font-mono mt-0.5">subscribes</span>
                    )}
                  </div>
                </div>
              )}

              {/* Step Card */}
              <div className={cn(
                'transition-all duration-700 transform',
                isActive
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-10 translate-y-2 scale-[0.98]'
              )}>
                <Card className={cn(
                  'relative overflow-hidden transition-all duration-500',
                  isActive && 'border-opacity-100 shadow-lg',
                  isActive && step.borderColor,
                  isEvent && isActive && 'ring-1 ring-amber-500/30'
                )}>
                  {/* Glow effect when active */}
                  {isActive && (
                    <div className={cn(
                      'absolute inset-0 opacity-5 rounded-xl',
                      step.bgColor
                    )} />
                  )}

                  <div className="relative flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500',
                      isActive ? step.bgColor : 'bg-card-hover'
                    )}>
                      <Icon className={cn(
                        'w-6 h-6 transition-all duration-500',
                        isActive ? step.color : 'text-muted'
                      )} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={cn(
                          'text-base font-semibold transition-colors',
                          isActive ? 'text-foreground' : 'text-muted'
                        )}>
                          {step.label}
                        </h3>
                        {isActive && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-fade-in" />
                        )}
                        {isEvent && isActive && (
                          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] font-mono text-amber-400">
                            EVENT BUS
                          </span>
                        )}
                        {isListener && isActive && (
                          <span className="px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-[10px] font-mono text-accent">
                            LISTENER
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted mb-3">{step.sublabel}</p>

                      {/* Details */}
                      {isActive && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 animate-fade-in">
                          {step.details.map((detail, i) => (
                            <div key={i} className="flex items-center gap-2 py-0.5">
                              <div className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                              <span className="text-xs text-muted font-mono">{detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Latency indicator */}
                    {isActive && (
                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] text-muted">Latencia</span>
                        <p className="text-xs font-mono text-emerald-400">{step.delay}ms</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )
        })}

        {/* Completion Message */}
        {isComplete && (
          <div className="mt-8 animate-fade-in">
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-emerald-400">Flujo Completado</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Todos los servicios procesaron el evento TransactionCreated exitosamente.
                    Tiempo total del pipeline: ~{EVENT_STEPS.reduce((sum, s) => sum + s.delay, 0) + EVENT_STEPS.length * 700}ms
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
