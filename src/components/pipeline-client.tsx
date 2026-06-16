'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import { Zap, ShieldAlert, Wallet, Bell, CheckCircle2, XCircle, Loader2, Play, RotateCcw } from 'lucide-react'

type StepStatus = 'idle' | 'loading' | 'success' | 'error'

interface PipelineStep {
  key: string
  label: string
  icon: typeof Zap
  status: StepStatus
  time_ms?: number
  data?: Record<string, unknown>
}

interface PipelineForm {
  merchant_id: string
  amount: string
  card_brand: string
  card_type: string
  card_last_four: string
  payment_method: string
  installments: string
}

export function PipelineClient() {
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [totalTime, setTotalTime] = useState<number | null>(null)
  const [form, setForm] = useState<PipelineForm>({
    merchant_id: 'a1b2c3d4-0001-4000-8000-000000000001',
    amount: '45230',
    card_brand: 'visa',
    card_type: 'credit',
    card_last_four: '4521',
    payment_method: 'contactless',
    installments: '1',
  })

  const [steps, setSteps] = useState<PipelineStep[]>([
    { key: 'auth', label: 'Autorización', icon: Zap, status: 'idle' },
    { key: 'fraud', label: 'Fraud Check', icon: ShieldAlert, status: 'idle' },
    { key: 'settlement', label: 'Settlement Preview', icon: Wallet, status: 'idle' },
    { key: 'webhook', label: 'Webhook Notification', icon: Bell, status: 'idle' },
    { key: 'complete', label: 'Pipeline Completo', icon: CheckCircle2, status: 'idle' },
  ])

  const updateStep = (key: string, updates: Partial<PipelineStep>) => {
    setSteps(prev => prev.map(s => s.key === key ? { ...s, ...updates } : s))
  }

  const resetPipeline = () => {
    setCompleted(false)
    setTotalTime(null)
    setSteps(prev => prev.map(s => ({ ...s, status: 'idle' as StepStatus, time_ms: undefined, data: undefined })))
  }

  const runPipeline = async () => {
    setRunning(true)
    setCompleted(false)
    setTotalTime(null)
    resetPipeline()

    // Animate steps sequentially with delays for visual effect
    const stepKeys = ['auth', 'fraud', 'settlement', 'webhook', 'complete']

    // Set all to loading initially with delay between each
    for (const key of stepKeys.slice(0, 4)) {
      await delay(300)
      updateStep(key, { status: 'loading' })
    }

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          installments: Number(form.installments),
        }),
      })
      const data = await res.json()

      if (data.error && !data.authorization) {
        // Full pipeline error
        for (const key of stepKeys) {
          updateStep(key, { status: 'error' })
        }
        setRunning(false)
        return
      }

      // Animate results one by one
      await delay(200)
      updateStep('auth', {
        status: data.authorization?.approved ? 'success' : 'error',
        time_ms: data.authorization?.processing_time_ms,
        data: data.authorization,
      })

      await delay(400)
      updateStep('fraud', {
        status: data.fraud?.decision === 'block' ? 'error' : 'success',
        time_ms: data.fraud?.processing_time_ms,
        data: data.fraud,
      })

      await delay(400)
      updateStep('settlement', {
        status: 'success',
        data: data.settlement,
      })

      await delay(400)
      updateStep('webhook', {
        status: data.webhook?.status === 'delivered' ? 'success' : 'error',
        time_ms: data.webhook?.response_time_ms,
        data: data.webhook,
      })

      await delay(400)
      updateStep('complete', { status: 'success' })

      setTotalTime(data.pipeline?.total_time_ms || null)
      setCompleted(true)
    } catch {
      for (const key of stepKeys) {
        updateStep(key, { status: 'error' })
      }
    }

    setRunning(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pipeline Completo"
        description="Ejecuta el flujo completo de pago: Autorización → Fraude → Liquidación → Webhook en un solo request"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel */}
        <Card className="lg:col-span-1">
          <CardTitle>Datos de Transacción</CardTitle>
          <p className="text-xs text-muted mt-1 mb-4">Configura los parámetros de la transacción a procesar</p>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Merchant ID</label>
              <input
                type="text"
                value={form.merchant_id}
                onChange={e => setForm({ ...form, merchant_id: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Monto (CLP)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Cuotas</label>
                <input
                  type="number"
                  value={form.installments}
                  onChange={e => setForm({ ...form, installments: e.target.value })}
                  min="1"
                  max="48"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Marca</label>
                <select
                  value={form.card_brand}
                  onChange={e => setForm({ ...form, card_brand: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                >
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">Amex</option>
                  <option value="redcompra">Redcompra</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Tipo</label>
                <select
                  value={form.card_type}
                  onChange={e => setForm({ ...form, card_type: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                >
                  <option value="credit">Crédito</option>
                  <option value="debit">Débito</option>
                  <option value="prepaid">Prepago</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Método</label>
                <select
                  value={form.payment_method}
                  onChange={e => setForm({ ...form, payment_method: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                >
                  <option value="card">Tarjeta</option>
                  <option value="contactless">Contactless</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="qr">QR</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Últimos 4</label>
                <input
                  type="text"
                  value={form.card_last_four}
                  onChange={e => setForm({ ...form, card_last_four: e.target.value })}
                  maxLength={4}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono"
                />
              </div>
            </div>

            <button
              onClick={runPipeline}
              disabled={running}
              className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-accent to-purple-600 hover:from-accent-hover hover:to-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Ejecutar Pipeline Completo
            </button>

            {completed && (
              <button
                onClick={resetPipeline}
                className="w-full px-4 py-2 border border-border text-muted hover:text-foreground text-sm rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar
              </button>
            )}
          </div>
        </Card>

        {/* Pipeline Steps Panel */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <CardTitle>Ejecución del Pipeline</CardTitle>
            {totalTime && (
              <Badge className="bg-accent/10 text-accent border-accent/20">
                Total: {totalTime}ms
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted mt-1 mb-6">Cada paso se ejecuta en secuencia y muestra el resultado en tiempo real</p>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div
                key={step.key}
                className={cn(
                  'p-4 rounded-lg border transition-all duration-300',
                  step.status === 'idle' && 'border-border bg-card-hover/30 opacity-50',
                  step.status === 'loading' && 'border-accent/30 bg-accent/5 animate-pulse',
                  step.status === 'success' && 'border-emerald-500/30 bg-emerald-500/5',
                  step.status === 'error' && 'border-red-500/30 bg-red-500/5',
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Step number */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                    step.status === 'idle' && 'bg-card-hover text-muted',
                    step.status === 'loading' && 'bg-accent/20 text-accent',
                    step.status === 'success' && 'bg-emerald-500/20 text-emerald-400',
                    step.status === 'error' && 'bg-red-500/20 text-red-400',
                  )}>
                    {step.status === 'loading' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : step.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : step.status === 'error' ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Step info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <step.icon className={cn(
                        'w-4 h-4',
                        step.status === 'idle' && 'text-muted',
                        step.status === 'loading' && 'text-accent',
                        step.status === 'success' && 'text-emerald-400',
                        step.status === 'error' && 'text-red-400',
                      )} />
                      <span className={cn(
                        'text-sm font-medium',
                        step.status === 'idle' && 'text-muted',
                        step.status === 'loading' && 'text-accent',
                        step.status === 'success' && 'text-emerald-400',
                        step.status === 'error' && 'text-red-400',
                      )}>
                        {step.label}
                      </span>
                    </div>

                    {/* Step result details */}
                    {step.data && step.key === 'auth' && (
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span className="text-muted">
                          {(step.data as Record<string, unknown>).approved ? 'APROBADA' : 'RECHAZADA'}
                        </span>
                        <span className="text-muted">
                          Auth: <span className="font-mono text-foreground">{(step.data as Record<string, unknown>).auth_code as string || '—'}</span>
                        </span>
                        <span className="text-muted">
                          Risk: <span className="font-mono text-foreground">{(step.data as Record<string, unknown>).risk_score as number}/100</span>
                        </span>
                      </div>
                    )}
                    {step.data && step.key === 'fraud' && (
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span className="text-muted">
                          Decisión: <span className={cn(
                            'font-medium',
                            (step.data as Record<string, unknown>).decision === 'approve' && 'text-emerald-400',
                            (step.data as Record<string, unknown>).decision === 'review' && 'text-yellow-400',
                            (step.data as Record<string, unknown>).decision === 'block' && 'text-red-400',
                          )}>
                            {((step.data as Record<string, unknown>).decision as string)?.toUpperCase()}
                          </span>
                        </span>
                        <span className="text-muted">
                          Score: <span className="font-mono text-foreground">{(step.data as Record<string, unknown>).fraud_score as number}/100</span>
                        </span>
                        <span className="text-muted">
                          Nivel: <span className="font-mono text-foreground">{(step.data as Record<string, unknown>).risk_level as string}</span>
                        </span>
                      </div>
                    )}
                    {step.data && step.key === 'settlement' && (
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span className="text-muted">
                          Bruto: <span className="font-mono text-foreground">{formatCurrency((step.data as Record<string, unknown>).gross_amount as number)}</span>
                        </span>
                        <span className="text-muted">
                          Comisión: <span className="font-mono text-red-400">-{formatCurrency((step.data as Record<string, unknown>).total_commission as number)}</span>
                        </span>
                        <span className="text-muted">
                          Neto: <span className="font-mono text-emerald-400">{formatCurrency((step.data as Record<string, unknown>).net_amount as number)}</span>
                        </span>
                      </div>
                    )}
                    {step.data && step.key === 'webhook' && (
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span className="text-muted">
                          Status: <span className={cn(
                            'font-medium',
                            (step.data as Record<string, unknown>).status === 'delivered' && 'text-emerald-400',
                            (step.data as Record<string, unknown>).status !== 'delivered' && 'text-yellow-400',
                          )}>
                            {((step.data as Record<string, unknown>).status as string)?.toUpperCase()}
                          </span>
                        </span>
                        <span className="text-muted">
                          HTTP: <span className="font-mono text-foreground">{(step.data as Record<string, unknown>).response_code as number}</span>
                        </span>
                        <span className="text-muted font-mono text-[10px] truncate max-w-[200px]">
                          {(step.data as Record<string, unknown>).endpoint_url as string}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  {step.time_ms !== undefined && (
                    <span className="text-xs font-mono text-muted flex-shrink-0">
                      {step.time_ms}ms
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Card */}
          {completed && (
            <div className="mt-6 p-4 rounded-lg border border-accent/20 bg-accent/5 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-accent">Pipeline Ejecutado Exitosamente</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2 rounded bg-card-hover/50 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {steps[0].data ? ((steps[0].data as Record<string, unknown>).approved ? '✓' : '✗') : '—'}
                  </p>
                  <p className="text-[10px] text-muted">Auth</p>
                </div>
                <div className="p-2 rounded bg-card-hover/50 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {steps[1].data ? (steps[1].data as Record<string, unknown>).fraud_score as number : '—'}/100
                  </p>
                  <p className="text-[10px] text-muted">Fraud Score</p>
                </div>
                <div className="p-2 rounded bg-card-hover/50 text-center">
                  <p className="text-lg font-bold text-emerald-400">
                    {steps[2].data ? formatCurrency((steps[2].data as Record<string, unknown>).net_amount as number) : '—'}
                  </p>
                  <p className="text-[10px] text-muted">Neto</p>
                </div>
                <div className="p-2 rounded bg-card-hover/50 text-center">
                  <p className="text-lg font-bold text-foreground">{totalTime}ms</p>
                  <p className="text-[10px] text-muted">Tiempo Total</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
