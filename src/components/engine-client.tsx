'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import {
  Zap,
  CreditCard,
  Layers,
  Wallet,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react'

interface Props {
  merchants: Array<Record<string, unknown>>
}

type Tab = 'authorize' | 'clearing' | 'settlement'

export function EngineClient({ merchants }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('authorize')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="KLAP Engine"
        description="Motores de procesamiento propios — lo que reemplaza a BPC SmartVista"
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-card rounded-lg border border-border w-fit">
        {[
          { key: 'authorize' as Tab, label: 'Authorization Engine', icon: Zap },
          { key: 'clearing' as Tab, label: 'Clearing Engine', icon: Layers },
          { key: 'settlement' as Tab, label: 'Settlement Engine', icon: Wallet },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
              activeTab === tab.key ? 'bg-accent text-white' : 'text-muted hover:text-foreground'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'authorize' && <AuthorizationPanel merchants={merchants} />}
      {activeTab === 'clearing' && <ClearingPanel />}
      {activeTab === 'settlement' && <SettlementPanel merchants={merchants} />}
    </div>
  )
}

// ============================================================
// Authorization Panel
// ============================================================
function AuthorizationPanel({ merchants }: { merchants: Array<Record<string, unknown>> }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState({
    merchant_id: merchants[0]?.id as string || '',
    amount: '45230',
    card_brand: 'visa',
    card_type: 'credit',
    card_last_four: '4521',
    payment_method: 'contactless',
    installments: '1',
    currency: 'CLP',
  })

  const handleSubmit = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          installments: Number(form.installments),
        }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ error: 'Error de conexión' })
    }
    setLoading(false)
  }

  const auth = result?.authorization as Record<string, unknown> | undefined

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <Card>
        <CardTitle>Solicitud de Autorización</CardTitle>
        <p className="text-xs text-muted mt-1 mb-4">Simula una solicitud real al motor de autorización KLAP</p>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Comercio</label>
            <select value={form.merchant_id} onChange={e => setForm({...form, merchant_id: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              {merchants.map(m => <option key={m.id as string} value={m.id as string}>{m.name as string}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Monto (CLP)</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Cuotas</label>
              <input type="number" value={form.installments} onChange={e => setForm({...form, installments: e.target.value})} min="1" max="48" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Marca</label>
              <select value={form.card_brand} onChange={e => setForm({...form, card_brand: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">Amex</option>
                <option value="redcompra">Redcompra</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Tipo</label>
              <select value={form.card_type} onChange={e => setForm({...form, card_type: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                <option value="credit">Crédito</option>
                <option value="debit">Débito</option>
                <option value="prepaid">Prepago</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Método de Pago</label>
              <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                <option value="card">Tarjeta</option>
                <option value="contactless">Contactless</option>
                <option value="ecommerce">E-commerce</option>
                <option value="qr">QR</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Últimos 4</label>
              <input type="text" value={form.card_last_four} onChange={e => setForm({...form, card_last_four: e.target.value})} maxLength={4} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono" />
            </div>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-accent to-purple-600 hover:from-accent-hover hover:to-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Enviar al Authorization Engine
          </button>
        </div>
      </Card>

      {/* Result */}
      <Card className={cn(
        'transition-all',
        auth && (auth.approved ? 'border-emerald-500/30' : 'border-red-500/30')
      )}>
        <CardTitle>Respuesta del Motor</CardTitle>
        {!result && !loading && (
          <div className="mt-8 text-center text-muted">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Envía una solicitud para ver la respuesta del engine</p>
          </div>
        )}
        {loading && (
          <div className="mt-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-accent animate-spin" />
            <p className="text-sm text-muted">Procesando autorización...</p>
          </div>
        )}
        {auth && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Decision */}
            <div className={cn(
              'p-4 rounded-lg border flex items-center gap-4',
              auth.approved
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-red-500/5 border-red-500/20'
            )}>
              {auth.approved
                ? <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                : <XCircle className="w-8 h-8 text-red-400" />
              }
              <div>
                <p className={cn('text-lg font-bold', auth.approved ? 'text-emerald-400' : 'text-red-400')}>
                  {auth.approved ? 'APROBADA' : 'RECHAZADA'}
                </p>
                <p className="text-xs text-muted">{auth.decision_reason as string}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-muted">Tiempo</p>
                <p className="text-sm font-mono text-foreground">{auth.processing_time_ms as number}ms</p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-card-hover/50">
                <p className="text-[10px] text-muted uppercase">Auth Code</p>
                <p className="text-sm font-mono text-foreground">{(auth.auth_code as string) || '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-card-hover/50">
                <p className="text-[10px] text-muted uppercase">Referencia</p>
                <p className="text-sm font-mono text-accent">{auth.reference_id as string}</p>
              </div>
              <div className="p-3 rounded-lg bg-card-hover/50">
                <p className="text-[10px] text-muted uppercase">Risk Score</p>
                <p className={cn('text-sm font-bold', (auth.risk_score as number) < 30 ? 'text-emerald-400' : (auth.risk_score as number) < 50 ? 'text-yellow-400' : 'text-red-400')}>
                  {auth.risk_score as number} / 100
                </p>
              </div>
              <div className="p-3 rounded-lg bg-card-hover/50">
                <p className="text-[10px] text-muted uppercase">Timestamp</p>
                <p className="text-[11px] font-mono text-muted">{(auth.timestamp as string)?.split('T')[1]?.slice(0, 12)}</p>
              </div>
            </div>

            {/* Rules Evaluated */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted mb-2 font-medium">Reglas Evaluadas</p>
              <div className="space-y-1.5">
                {(auth.rules_evaluated as Array<{rule: string; passed: boolean; detail: string}>)?.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded bg-card-hover/30">
                    {rule.passed
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      : <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    }
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-accent">{rule.rule}</span>
                      <p className="text-xs text-muted">{rule.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {result?.error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <p className="text-sm text-red-400">{result.error as string}</p>
          </div>
        )}
      </Card>
    </div>
  )
}

// ============================================================
// Clearing Panel
// ============================================================
function ClearingPanel() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [brand, setBrand] = useState<'visa' | 'mastercard'>('visa')

  const handleGenerate = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/clearing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: 'Error de conexión' })
    }
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardTitle>Generador de Clearing</CardTitle>
        <p className="text-xs text-muted mt-1 mb-4">
          Genera archivos de clearing reales (CTF para Visa, IPM para Mastercard) a partir de transacciones liquidadas.
          Este es el proceso que BPC ejecuta hoy.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted mb-2 block">Marca</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setBrand('visa')}
                className={cn(
                  'p-4 rounded-lg border text-center transition-all',
                  brand === 'visa' ? 'border-blue-500/50 bg-blue-500/5' : 'border-border hover:border-border-hover'
                )}
              >
                <p className="text-lg font-bold text-foreground">VISA</p>
                <p className="text-[10px] text-muted">Formato CTF</p>
              </button>
              <button
                onClick={() => setBrand('mastercard')}
                className={cn(
                  'p-4 rounded-lg border text-center transition-all',
                  brand === 'mastercard' ? 'border-orange-500/50 bg-orange-500/5' : 'border-border hover:border-border-hover'
                )}
              >
                <p className="text-lg font-bold text-foreground">MC</p>
                <p className="text-[10px] text-muted">Formato IPM</p>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-card-hover/50 space-y-1">
            <p className="text-[10px] uppercase text-muted font-medium">El motor ejecutará:</p>
            <div className="flex items-center gap-2 text-xs text-foreground/70">
              <ChevronRight className="w-3 h-3 text-accent" />
              Leer transacciones settled/captured de la marca
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/70">
              <ChevronRight className="w-3 h-3 text-accent" />
              Generar archivo {brand === 'visa' ? 'CTF' : 'IPM'} con formato estándar
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/70">
              <ChevronRight className="w-3 h-3 text-accent" />
              Calcular checksum y registrar batch en DB
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading} className="w-full px-4 py-3 bg-gradient-to-r from-accent to-purple-600 hover:from-accent-hover hover:to-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            Generar Archivo de Clearing
          </button>
        </div>
      </Card>

      {/* Result */}
      <Card>
        <CardTitle>Resultado</CardTitle>
        {!result && !loading && (
          <div className="mt-8 text-center text-muted">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Genera un batch para ver el archivo resultante</p>
          </div>
        )}
        {loading && (
          <div className="mt-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-accent animate-spin" />
            <p className="text-sm text-muted">Generando archivo de clearing...</p>
          </div>
        )}
        {result && !result.error && (
          <div className="mt-4 space-y-4 animate-fade-in">
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Archivo Generado</p>
                  <p className="text-xs font-mono text-muted">{result.file_name as string}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-card-hover/50 text-center">
                <p className="text-lg font-bold text-foreground">{result.transaction_count as number}</p>
                <p className="text-[10px] text-muted">Transacciones</p>
              </div>
              <div className="p-3 rounded-lg bg-card-hover/50 text-center">
                <p className="text-lg font-bold text-foreground">{formatCurrency(result.total_amount as number)}</p>
                <p className="text-[10px] text-muted">Monto Total</p>
              </div>
              <div className="p-3 rounded-lg bg-card-hover/50 text-center">
                <p className="text-lg font-bold text-foreground">{result.total_records as number}</p>
                <p className="text-[10px] text-muted">Records</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted mb-2 font-medium">Checksum</p>
              <p className="font-mono text-xs text-accent bg-card-hover/50 p-2 rounded">{result.checksum as string}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted mb-2 font-medium">Preview del Archivo</p>
              <div className="bg-background rounded-lg border border-border p-3 overflow-x-auto">
                <pre className="text-[10px] font-mono text-muted leading-relaxed">
                  {(result.file_preview as string[])?.map((line, i) => (
                    <div key={i} className="hover:text-foreground transition-colors">{line}</div>
                  ))}
                  <div className="text-accent mt-1">... ({(result.total_records as number) - 5} registros más)</div>
                </pre>
              </div>
            </div>
          </div>
        )}
        {result?.error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <p className="text-sm text-red-400">{result.error as string}</p>
          </div>
        )}
      </Card>
    </div>
  )
}

// ============================================================
// Settlement Panel
// ============================================================
function SettlementPanel({ merchants }: { merchants: Array<Record<string, unknown>> }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [merchantId, setMerchantId] = useState(merchants[0]?.id as string || '')

  const handleCalculate = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/settlement/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_id: merchantId }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: 'Error de conexión' })
    }
    setLoading(false)
  }

  const settlement = result?.settlement as Record<string, unknown> | undefined
  const breakdown = result?.breakdown as Array<Record<string, unknown>> | undefined
  const details = result?.processing_details as string[] | undefined

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardTitle>Calculador de Liquidación</CardTitle>
        <p className="text-xs text-muted mt-1 mb-4">
          Calcula la liquidación de un comercio aplicando reglas de comisión, IVA y retenciones.
          Usa las fee_rules configuradas en el sistema.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Comercio</label>
            <select value={merchantId} onChange={e => setMerchantId(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
              {merchants.map(m => <option key={m.id as string} value={m.id as string}>{m.name as string}</option>)}
            </select>
          </div>

          <div className="p-3 rounded-lg bg-card-hover/50 space-y-1">
            <p className="text-[10px] uppercase text-muted font-medium">El motor ejecutará:</p>
            <div className="flex items-center gap-2 text-xs text-foreground/70">
              <ChevronRight className="w-3 h-3 text-accent" />
              Obtener transacciones settled del comercio
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/70">
              <ChevronRight className="w-3 h-3 text-accent" />
              Agrupar por marca + tipo + método
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/70">
              <ChevronRight className="w-3 h-3 text-accent" />
              Aplicar fee_rules activas
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/70">
              <ChevronRight className="w-3 h-3 text-accent" />
              Calcular IVA (19%) + retenciones si aplica
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground/70">
              <ChevronRight className="w-3 h-3 text-accent" />
              Generar liquidación con neto a pagar
            </div>
          </div>

          <button onClick={handleCalculate} disabled={loading} className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            Calcular Liquidación
          </button>
        </div>
      </Card>

      {/* Result */}
      <Card>
        <CardTitle>Resultado de Liquidación</CardTitle>
        {!result && !loading && (
          <div className="mt-8 text-center text-muted">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Selecciona un comercio y calcula su liquidación</p>
          </div>
        )}
        {loading && (
          <div className="mt-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-emerald-400 animate-spin" />
            <p className="text-sm text-muted">Calculando liquidación...</p>
          </div>
        )}
        {settlement && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-card-hover/50">
                <p className="text-[10px] text-muted uppercase">Bruto</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(settlement.gross_amount as number)}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-[10px] text-emerald-400 uppercase">Neto a Pagar</p>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(settlement.net_amount as number)}</p>
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Comisión</span>
                <span className="text-red-400">-{formatCurrency(settlement.commission as number)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">IVA (19%)</span>
                <span className="text-red-400">-{formatCurrency(settlement.iva as number)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Retenciones</span>
                <span className="text-red-400">-{formatCurrency(settlement.withholdings as number)}</span>
              </div>
              <div className="border-t border-border pt-2 flex items-center justify-between text-xs">
                <span className="text-muted">Transacciones</span>
                <span className="text-foreground font-medium">{settlement.transaction_count as number}</span>
              </div>
            </div>

            {/* Breakdown by brand */}
            {breakdown && breakdown.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted mb-2 font-medium">Desglose por Tipo</p>
                <div className="space-y-2">
                  {breakdown.map((line, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-card-hover/30 text-xs">
                      <div>
                        <span className="text-foreground capitalize">{line.description as string}</span>
                        <span className="text-muted ml-2">({line.transaction_count as number} txns)</span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted">{((line.rate as number) * 100).toFixed(2)}%</span>
                        <span className="text-red-400 ml-2">-{formatCurrency(line.commission as number)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Processing Log */}
            {details && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted mb-2 font-medium">Log de Procesamiento</p>
                <div className="bg-background rounded-lg border border-border p-3 max-h-40 overflow-y-auto">
                  <pre className="text-[10px] font-mono text-muted leading-relaxed">
                    {details.map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
        {result?.error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <p className="text-sm text-red-400">{result.error as string}</p>
          </div>
        )}
      </Card>
    </div>
  )
}
