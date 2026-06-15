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
  Loader2,
} from 'lucide-react'

interface EventStep {
  id: string
  label: string
  sublabel: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  explanation: string
  details: string[]
  processingMessage: string
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
    explanation: 'Un cliente acerca su tarjeta Visa al terminal contactless del comercio. El POS envía la solicitud de autorización al gateway de KLAP. El emisor aprueba la transacción y retorna un código de autorización. KLAP registra la transacción y emite un evento al bus de mensajes.',
    processingMessage: 'Conectando con el gateway de pagos...',
    details: [
      'Tarjeta: Visa •••• 4521',
      'Monto: $45.230 CLP',
      'Comercio: Supermercado Líder Express',
      'Terminal: TRM-001-LDR (Verifone P400)',
      'Método: Contactless NFC',
      'Auth Code: A00001',
    ],
  },
  {
    id: 'event',
    label: 'TransactionCreated',
    sublabel: 'Evento emitido al Event Bus',
    icon: Zap,
    color: 'text-amber-300',
    bgColor: 'bg-gradient-to-br from-amber-600 to-orange-700',
    borderColor: 'border-amber-500/50',
    explanation: 'KLAP publica el evento "transaction.created" en el bus de mensajes. Este evento contiene toda la información de la transacción y es consumido por múltiples microservicios de forma asíncrona. Cada servicio suscrito recibe una copia independiente del evento para procesarlo según su responsabilidad.',
    processingMessage: 'Publicando evento al message bus...',
    details: [
      'Event: transaction.created',
      'ID: txn_klp_2025_06_15_001',
      'Timestamp: 2025-06-15T14:32:07.342Z',
      'Source: payment-gateway',
      'Schema Version: 2.1',
      'Subscribers: 6 servicios',
    ],
  },
  {
    id: 'settlement',
    label: 'Settlement Service',
    sublabel: 'Calcula liquidación del comercio',
    icon: Wallet,
    color: 'text-emerald-300',
    bgColor: 'bg-gradient-to-br from-emerald-600 to-teal-700',
    borderColor: 'border-emerald-500/50',
    explanation: 'El servicio de liquidación recibe el evento y calcula cuánto se le pagará al comercio. Aplica la regla de comisión correspondiente (Visa Crédito = 2.2%), calcula el IVA sobre la comisión, suma retenciones fiscales si aplican, y determina el monto neto que recibirá el comercio en su próxima liquidación (T+1).',
    processingMessage: 'Calculando comisiones y neto a liquidar...',
    details: [
      'Monto Bruto: $45.230',
      'Regla aplicada: Visa Crédito 2.2%',
      'Comisión: -$995,06',
      'IVA Comisión (19%): -$189,06',
      'Retención: $0 (no aplica)',
      'Neto a liquidar: $44.045,88',
      'Fecha pago: 2025-06-16 (T+1)',
      'Batch: settlement_batch_20250615',
    ],
  },
  {
    id: 'risk',
    label: 'Risk Engine',
    sublabel: 'Evaluación de riesgo en tiempo real',
    icon: ShieldCheck,
    color: 'text-blue-300',
    bgColor: 'bg-gradient-to-br from-blue-600 to-cyan-700',
    borderColor: 'border-blue-500/50',
    explanation: 'El motor de riesgo analiza la transacción contra múltiples reglas y modelos. Verifica la velocidad de transacciones del tarjetahabiente, compara el monto contra su patrón habitual, valida la ubicación geográfica, y asigna un score de riesgo. Si el score supera el umbral, puede disparar alertas o bloqueos automáticos.',
    processingMessage: 'Evaluando reglas de riesgo y velocity checks...',
    details: [
      'Risk Score: 12/100 (Bajo)',
      'Velocity: 2 txns en 24h → OK',
      'Amount Pattern: Dentro de rango normal',
      'Merchant Trust Level: Alto (3+ años)',
      'Geographic: Santiago, CL → Match con historial',
      'Card Status: Vigente, sin alertas',
      'Decisión: ✅ APPROVE — Sin acción requerida',
    ],
  },
  {
    id: 'fraud',
    label: 'Fraud Detection',
    sublabel: 'Análisis antifraude con ML',
    icon: ShieldAlert,
    color: 'text-rose-300',
    bgColor: 'bg-gradient-to-br from-rose-600 to-pink-700',
    borderColor: 'border-rose-500/50',
    explanation: 'El sistema antifraude ejecuta un modelo de machine learning entrenado con millones de transacciones. Analiza patrones como la huella digital del dispositivo, la geolocalización, el comportamiento del tarjetahabiente, y compara contra patrones de fraude conocidos. Si detecta anomalías, puede marcar la transacción para revisión manual.',
    processingMessage: 'Ejecutando modelo ML de detección de fraude...',
    details: [
      'Modelo: FraudNet v3.2.1 (accuracy 99.7%)',
      'Device Fingerprint: fp_a8c3...verified',
      'IP Geolocation: Santiago, CL (match)',
      'Behavioral Pattern: Consistente',
      'Known Fraud Patterns: 0 matches',
      'Card-Not-Present Risk: N/A (presencial)',
      'Resultado: ✅ NO FRAUD — Confianza 98.3%',
    ],
  },
  {
    id: 'reporting',
    label: 'Reporting Service',
    sublabel: 'Actualiza analytics y dashboards',
    icon: BarChart3,
    color: 'text-violet-300',
    bgColor: 'bg-gradient-to-br from-violet-600 to-purple-700',
    borderColor: 'border-violet-500/50',
    explanation: 'El servicio de reporting agrega la transacción a las métricas en tiempo real. Actualiza el volumen diario, la distribución por marca y medio de pago, las estadísticas por comercio, y alimenta los dashboards operacionales. Esto permite que el equipo de operaciones vea la actividad en tiempo real.',
    processingMessage: 'Actualizando métricas y dashboards en tiempo real...',
    details: [
      'Volumen diario: +$45.230 → Total: $12.8M',
      'Transacciones hoy: +1 → Total: 3.247',
      'Visa split: 58.2% (+0.01%)',
      'Merchant ranking: Líder #1 por volumen',
      'Categoría: Retail → 42% del total',
      'Tasa aprobación: 94.8% (estable)',
      'Dashboard: ✅ Actualizado en real-time',
    ],
  },
  {
    id: 'notification',
    label: 'Notification Service',
    sublabel: 'Notifica al comercio y stakeholders',
    icon: Bell,
    color: 'text-sky-300',
    bgColor: 'bg-gradient-to-br from-sky-600 to-blue-700',
    borderColor: 'border-sky-500/50',
    explanation: 'El servicio de notificaciones informa al comercio que la transacción fue procesada exitosamente. Envía un webhook con el detalle al sistema del comercio, opcionalmente un SMS al dueño, y registra la entrega. Si el comercio tiene configurados alertas por monto, también evalúa si debe enviar una notificación especial.',
    processingMessage: 'Enviando webhook y notificaciones al comercio...',
    details: [
      'Webhook: POST https://api.lider.cl/klap/webhook',
      'Payload: { event: "transaction.completed" }',
      'Response: 200 OK (145ms)',
      'SMS: No configurado para este monto',
      'Email: Resumen diario programado 18:00',
      'Push: App Comercio → Notificación enviada',
      'Delivery Status: ✅ CONFIRMED',
    ],
  },
  {
    id: 'accounting',
    label: 'Accounting Service',
    sublabel: 'Registro contable y fiscal',
    icon: Calculator,
    color: 'text-orange-300',
    bgColor: 'bg-gradient-to-br from-orange-600 to-red-700',
    borderColor: 'border-orange-500/50',
    explanation: 'El servicio contable registra la transacción en el libro mayor de KLAP. Crea los asientos contables correspondientes: débito a la cuenta por pagar del comercio, crédito al revenue por comisión, y el registro del IVA asociado. Esto mantiene la trazabilidad fiscal completa y permite la conciliación automática posterior.',
    processingMessage: 'Registrando asientos contables y fiscales...',
    details: [
      'Asiento: #ACT-2025-084721',
      'Débito: Cuentas por Pagar Merchant → $44.046',
      'Crédito: Revenue Comisiones → $995',
      'Crédito: IVA Débito Fiscal → $189',
      'Centro de costo: CC-ACQUIRING-001',
      'Periodo fiscal: Junio 2025',
      'Conciliación: Pendiente T+1 con banco',
      'Estado: ✅ Registrado en ledger',
    ],
  },
]

export function DemoFlowClient() {
  const [activeSteps, setActiveSteps] = useState<string[]>([])
  const [processingStep, setProcessingStep] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const runDemo = useCallback(() => {
    setActiveSteps([])
    setProcessingStep(null)
    setIsRunning(true)
    setIsComplete(false)

    let totalDelay = 0
    EVENT_STEPS.forEach((step, index) => {
      // Show "processing" state first
      const processingDelay = totalDelay + 500
      setTimeout(() => {
        setProcessingStep(step.id)
      }, processingDelay)

      // Then reveal the full step after a pause
      const revealDelay = processingDelay + 2500
      setTimeout(() => {
        setProcessingStep(null)
        setActiveSteps(prev => [...prev, step.id])

        if (index === EVENT_STEPS.length - 1) {
          setTimeout(() => {
            setIsRunning(false)
            setIsComplete(true)
          }, 1000)
        }
      }, revealDelay)

      totalDelay = revealDelay + 800
    })
  }, [])

  const reset = useCallback(() => {
    setActiveSteps([])
    setProcessingStep(null)
    setIsRunning(false)
    setIsComplete(false)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Demo: Event-Driven Architecture"
        description="Flujo completo desde la compra del cliente hasta el registro contable"
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
              <Loader2 className="w-4 h-4 animate-spin" />
              Procesando pipeline...
            </div>
          )}
          {isComplete && (
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-card border border-border hover:border-accent text-foreground text-sm font-medium rounded-lg transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar Demo
            </button>
          )}
        </div>
      </PageHeader>

      {/* Architecture Flow */}
      <div className="max-w-4xl mx-auto">
        {EVENT_STEPS.map((step, index) => {
          const isActive = activeSteps.includes(step.id)
          const isProcessing = processingStep === step.id
          const isVisible = isActive || isProcessing
          const Icon = step.icon
          const isEvent = step.id === 'event'
          const isListener = index > 1

          return (
            <div key={step.id}>
              {/* Connector Arrow */}
              {index > 0 && (
                <div className="flex justify-center py-3">
                  <div className={cn(
                    'flex flex-col items-center transition-all duration-700',
                    isVisible ? 'opacity-100' : 'opacity-15'
                  )}>
                    <div className={cn(
                      'w-0.5 h-8 transition-all duration-700',
                      isVisible ? 'bg-gradient-to-b from-accent to-accent/40' : 'bg-border'
                    )} />
                    <ArrowDown className={cn(
                      'w-4 h-4 transition-all duration-700',
                      isVisible ? 'text-accent' : 'text-border'
                    )} />
                    {isListener && isVisible && (
                      <span className="text-[10px] text-accent/70 font-mono mt-1 tracking-wide">subscribes to event</span>
                    )}
                    {isEvent && isVisible && (
                      <span className="text-[10px] text-amber-400/70 font-mono mt-1 tracking-wide">emit → event bus</span>
                    )}
                  </div>
                </div>
              )}

              {/* Step Card */}
              <div className={cn(
                'transition-all duration-700 transform',
                isVisible
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-[0.08] translate-y-4 scale-[0.97]'
              )}>
                <Card className={cn(
                  'relative overflow-hidden transition-all duration-700',
                  isActive && step.borderColor,
                  isActive && 'shadow-xl',
                  isProcessing && 'border-amber-500/30 shadow-lg shadow-amber-500/5',
                  isEvent && isActive && 'ring-1 ring-amber-500/30',
                )}>
                  {/* Background glow */}
                  {isActive && (
                    <div className={cn('absolute inset-0 opacity-[0.03] rounded-xl', step.bgColor)} />
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 opacity-[0.03] bg-amber-500 rounded-xl animate-pulse" />
                  )}

                  <div className="relative">
                    {/* Header row */}
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-700',
                        isActive ? step.bgColor : isProcessing ? 'bg-amber-600/20' : 'bg-card-hover'
                      )}>
                        {isProcessing ? (
                          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                        ) : (
                          <Icon className={cn(
                            'w-6 h-6 transition-all duration-700',
                            isActive ? step.color : 'text-muted'
                          )} />
                        )}
                      </div>

                      {/* Title and badges */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className={cn(
                            'text-base font-semibold transition-colors',
                            isActive ? 'text-foreground' : isProcessing ? 'text-amber-200' : 'text-muted'
                          )}>
                            {step.label}
                          </h3>
                          {isActive && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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
                        <p className="text-xs text-muted mt-0.5">{step.sublabel}</p>
                      </div>
                    </div>

                    {/* Processing state */}
                    {isProcessing && (
                      <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                          <span className="text-sm text-amber-300 font-medium">{step.processingMessage}</span>
                        </div>
                      </div>
                    )}

                    {/* Revealed content */}
                    {isActive && (
                      <div className="mt-4 space-y-4 animate-fade-in">
                        {/* Explanation */}
                        <div className="p-4 rounded-lg bg-white/[0.02] border border-border">
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {step.explanation}
                          </p>
                        </div>

                        {/* Details grid */}
                        <div className="p-4 rounded-lg bg-card-hover/50">
                          <p className="text-[10px] uppercase tracking-widest text-muted mb-3 font-medium">Detalle de procesamiento</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                            {step.details.map((detail, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent/60 mt-1.5 flex-shrink-0" />
                                <span className="text-xs text-muted font-mono leading-relaxed">{detail}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )
        })}

        {/* Completion */}
        {isComplete && (
          <div className="mt-10 animate-fade-in">
            <Card className="border-emerald-500/30 bg-emerald-500/[0.03]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-400">Pipeline Completado</h3>
                  <p className="text-sm text-muted mt-1 leading-relaxed">
                    Los 6 microservicios procesaron el evento <code className="text-xs bg-card px-1.5 py-0.5 rounded font-mono text-amber-400">TransactionCreated</code> de forma independiente y asíncrona.
                    Cada servicio tiene su propia responsabilidad y puede escalar de forma autónoma sin afectar al resto del pipeline.
                  </p>
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-2 rounded bg-card border border-border text-center">
                      <p className="text-lg font-bold text-foreground">8</p>
                      <p className="text-[10px] text-muted">Pasos ejecutados</p>
                    </div>
                    <div className="p-2 rounded bg-card border border-border text-center">
                      <p className="text-lg font-bold text-foreground">6</p>
                      <p className="text-[10px] text-muted">Servicios notificados</p>
                    </div>
                    <div className="p-2 rounded bg-card border border-border text-center">
                      <p className="text-lg font-bold text-emerald-400">0</p>
                      <p className="text-[10px] text-muted">Errores</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
