'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Radio,
  CreditCard,
  Lock,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  ArrowRightLeft,
  Search,
  Shield,
} from 'lucide-react'

type Tab = 'iso8583' | 'bin' | 'tokenize'

export function SwitchClient() {
  const [activeTab, setActiveTab] = useState<Tab>('iso8583')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Switch ISO 8583"
        description="Simulador del switch de pagos — Protocolo ISO 8583, BIN routing y tokenización"
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-card rounded-lg border border-border w-fit flex-wrap">
        {[
          { key: 'iso8583' as Tab, label: 'ISO 8583 Simulator', icon: Radio },
          { key: 'bin' as Tab, label: 'BIN Lookup', icon: Search },
          { key: 'tokenize' as Tab, label: 'Tokenización', icon: Lock },
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

      {activeTab === 'iso8583' && <ISO8583Panel />}
      {activeTab === 'bin' && <BINPanel />}
      {activeTab === 'tokenize' && <TokenizePanel />}
    </div>
  )
}


// ============================================================
// ISO 8583 Simulator Panel
// ============================================================
function ISO8583Panel() {
  const [mode, setMode] = useState<'build' | 'parse'>('build')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  // Build form state
  const [mti, setMti] = useState('0100')
  const [fields, setFields] = useState<Record<string, string>>({
    '2': '4111111111111111',
    '3': '000000',
    '4': '000000045000',
    '11': '123456',
    '22': '051',
    '25': '00',
    '41': 'TERM0001',
    '42': 'MERCHANT0000001',
    '43': 'COMERCIO DEMO SANTIAGO CL',
    '49': '152',
  })

  // Parse form state
  const [hexInput, setHexInput] = useState('')

  const handleBuild = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/iso8583/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'build', mti, fields }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: 'Error de conexión' })
    }
    setLoading(false)
  }

  const handleParse = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/iso8583/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: hexInput }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: 'Error de conexión' })
    }
    setLoading(false)
  }

  const updateField = (id: string, value: string) => {
    setFields(prev => ({ ...prev, [id]: value }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input */}
      <Card>
        <CardTitle>Mensaje ISO 8583</CardTitle>
        <p className="text-xs text-muted mt-1 mb-4">Construye o parsea mensajes del protocolo estándar de tarjetas</p>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setMode('build')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              mode === 'build' ? 'bg-accent/20 text-accent border border-accent/30' : 'text-muted hover:text-foreground border border-border'
            )}
          >
            Build Message
          </button>
          <button
            onClick={() => setMode('parse')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              mode === 'parse' ? 'bg-accent/20 text-accent border border-accent/30' : 'text-muted hover:text-foreground border border-border'
            )}
          >
            Parse Message
          </button>
        </div>

        {mode === 'build' ? (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">MTI (Message Type Indicator)</label>
              <select value={mti} onChange={e => setMti(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono">
                <option value="0100">0100 - Authorization Request</option>
                <option value="0110">0110 - Authorization Response</option>
                <option value="0200">0200 - Financial Transaction</option>
                <option value="0210">0210 - Financial Response</option>
                <option value="0400">0400 - Reversal Request</option>
                <option value="0410">0410 - Reversal Response</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted mb-2 block">Data Elements</label>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {Object.entries(fields).map(([id, value]) => (
                  <div key={id} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-accent w-8 flex-shrink-0">DE{id}</span>
                    <input
                      type="text"
                      value={value}
                      onChange={e => updateField(id, e.target.value)}
                      className="flex-1 px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground font-mono"
                    />
                    <button
                      onClick={() => {
                        const newFields = { ...fields }
                        delete newFields[id]
                        setFields(newFields)
                      }}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const nextId = Math.max(...Object.keys(fields).map(Number), 0) + 1
                  setFields(prev => ({ ...prev, [nextId.toString()]: '' }))
                }}
                className="mt-2 text-xs text-accent hover:text-accent-hover"
              >
                + Agregar campo
              </button>
            </div>

            <button onClick={handleBuild} disabled={loading} className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-accent to-purple-600 hover:from-accent-hover hover:to-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
              Build ISO 8583 Message
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Hex Message</label>
              <textarea
                value={hexInput}
                onChange={e => setHexInput(e.target.value)}
                placeholder="Paste hex-encoded ISO 8583 message..."
                rows={6}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground font-mono resize-none"
              />
            </div>
            <button onClick={handleParse} disabled={loading || !hexInput} className="w-full px-4 py-3 bg-gradient-to-r from-accent to-purple-600 hover:from-accent-hover hover:to-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
              Parse Message
            </button>
          </div>
        )}
      </Card>

      {/* Result */}
      <Card>
        <CardTitle>Resultado</CardTitle>
        {!result && !loading && (
          <div className="mt-8 text-center text-muted">
            <Radio className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Construye o parsea un mensaje para ver el resultado</p>
          </div>
        )}
        {loading && (
          <div className="mt-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-accent animate-spin" />
            <p className="text-sm text-muted">Procesando...</p>
          </div>
        )}
        {result && !result.error && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* MTI Info */}
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 flex items-center gap-3">
              <Badge variant="bg-accent/10 text-accent border-accent/20">{result.mti as string}</Badge>
              <span className="text-sm text-foreground">{result.mti_description as string}</span>
            </div>

            {/* Hex output */}
            {result.hex_message && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted font-medium">Hex Output</p>
                  <button onClick={() => copyToClipboard(result.hex_message as string)} className="text-xs text-accent hover:text-accent-hover flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <div className="bg-background rounded-lg border border-border p-3 overflow-x-auto">
                  <pre className="text-[10px] font-mono text-emerald-400 break-all whitespace-pre-wrap">{result.hex_message as string}</pre>
                </div>
                <p className="text-[10px] text-muted mt-1">{result.message_length as number} bytes | {result.field_count as number} campos</p>
              </div>
            )}

            {/* Parsed fields */}
            {result.fields && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted mb-2 font-medium">Campos Parseados</p>
                <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
                  {Object.entries(result.fields as Record<string, { value: string; name: string; description?: string }>).map(([id, field]) => (
                    <div key={id} className="flex items-start gap-2 p-2 rounded bg-card-hover/30">
                      <span className="text-[10px] font-mono text-accent w-8 flex-shrink-0">DE{id}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground font-mono truncate">{typeof field === 'object' ? field.value : field}</p>
                        <p className="text-[10px] text-muted">{typeof field === 'object' ? field.name : `Field ${id}`}</p>
                        {typeof field === 'object' && field.description && (
                          <p className="text-[10px] text-accent">{field.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
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


// ============================================================
// BIN Lookup Panel
// ============================================================
function BINPanel() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [pan, setPan] = useState('4111111111111111')

  const handleLookup = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/bin/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: 'Error de conexión' })
    }
    setLoading(false)
  }

  const binInfo = result?.bin_info as Record<string, unknown> | undefined
  const routing = result?.routing as Record<string, unknown> | undefined

  const samplePANs = [
    { pan: '4111111111111111', label: 'Visa Banco de Chile' },
    { pan: '5178051234567890', label: 'MC Black BCI' },
    { pan: '4620001234567890', label: 'Visa Santander' },
    { pan: '6503001234567890', label: 'CuentaRUT Estado' },
    { pan: '3700001234567890', label: 'Amex Chile' },
    { pan: '4917001234567890', label: 'MACH Prepago' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardTitle>BIN Lookup</CardTitle>
        <p className="text-xs text-muted mt-1 mb-4">Identifica el emisor y determina el routing óptimo para una tarjeta</p>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">PAN (Número de Tarjeta)</label>
            <input
              type="text"
              value={pan}
              onChange={e => setPan(e.target.value)}
              placeholder="4111111111111111"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted mb-2 block">PANs de Ejemplo</label>
            <div className="grid grid-cols-2 gap-2">
              {samplePANs.map(sample => (
                <button
                  key={sample.pan}
                  onClick={() => setPan(sample.pan)}
                  className={cn(
                    'p-2 rounded-lg border text-left transition-all text-xs',
                    pan === sample.pan
                      ? 'border-accent/30 bg-accent/5'
                      : 'border-border hover:border-border-hover'
                  )}
                >
                  <p className="font-mono text-foreground">{sample.pan.substring(0, 6)}...</p>
                  <p className="text-[10px] text-muted">{sample.label}</p>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleLookup} disabled={loading || pan.length < 8} className="w-full px-4 py-3 bg-gradient-to-r from-accent to-purple-600 hover:from-accent-hover hover:to-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Consultar BIN
          </button>
        </div>
      </Card>

      {/* Result */}
      <Card>
        <CardTitle>Resultado de BIN & Routing</CardTitle>
        {!result && !loading && (
          <div className="mt-8 text-center text-muted">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Ingresa un PAN para consultar la tabla de BINs</p>
          </div>
        )}
        {loading && (
          <div className="mt-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-accent animate-spin" />
            <p className="text-sm text-muted">Consultando BIN table...</p>
          </div>
        )}
        {binInfo && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* BIN Info */}
            <div className="p-4 rounded-lg border border-border bg-card-hover/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted">Emisor</span>
                <Badge variant={binInfo.found ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}>
                  {binInfo.found ? 'Encontrado' : 'No encontrado'}
                </Badge>
              </div>
              <p className="text-lg font-bold text-foreground">{binInfo.issuer as string}</p>
              <p className="text-xs text-muted mt-1">{binInfo.product_name as string}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-card-hover/50">
                <p className="text-[10px] text-muted uppercase">BIN</p>
                <p className="text-sm font-mono text-foreground">{binInfo.bin as string}</p>
              </div>
              <div className="p-3 rounded-lg bg-card-hover/50">
                <p className="text-[10px] text-muted uppercase">Marca</p>
                <p className="text-sm font-medium text-foreground capitalize">{binInfo.card_brand as string}</p>
              </div>
              <div className="p-3 rounded-lg bg-card-hover/50">
                <p className="text-[10px] text-muted uppercase">Tipo</p>
                <p className="text-sm font-medium text-foreground capitalize">{binInfo.card_type as string}</p>
              </div>
              <div className="p-3 rounded-lg bg-card-hover/50">
                <p className="text-[10px] text-muted uppercase">País</p>
                <p className="text-sm font-medium text-foreground">{binInfo.country as string}</p>
              </div>
              <div className="p-3 rounded-lg bg-card-hover/50 col-span-2">
                <p className="text-[10px] text-muted uppercase">PAN Enmascarado</p>
                <p className="text-sm font-mono text-accent">{binInfo.masked_pan as string}</p>
              </div>
            </div>

            {/* Routing Decision */}
            {routing && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted mb-2 font-medium">Routing Decision</p>
                <div className="p-4 rounded-lg border border-accent/20 bg-accent/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Red</span>
                    <span className="text-sm font-bold text-accent">{routing.network as string}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Procesador</span>
                    <span className="text-xs text-foreground">{routing.processor as string}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Fallback</span>
                    <span className="text-xs text-foreground">{(routing.fallback_network as string) || 'Ninguno'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Costo Est.</span>
                    <span className="text-xs text-foreground">{((routing.estimated_cost_bps as number) / 100).toFixed(2)}%</span>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-[10px] text-muted">{routing.routing_reason as string}</p>
                  </div>
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


// ============================================================
// Tokenization Panel
// ============================================================
function TokenizePanel() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [action, setAction] = useState<'tokenize' | 'detokenize'>('tokenize')
  const [pan, setPan] = useState('4111111111111111')
  const [tokenType, setTokenType] = useState<'permanent' | 'temporary' | 'payment'>('permanent')
  const [tokenInput, setTokenInput] = useState('')

  const handleTokenize = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/tokenize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tokenize', pan, token_type: tokenType }),
      })
      const data = await res.json()
      setResult(data)
      // Auto-populate token field for detokenize
      if (data.token) {
        setTokenInput(data.token)
      }
    } catch {
      setResult({ error: 'Error de conexión' })
    }
    setLoading(false)
  }

  const handleDetokenize = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/tokenize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'detokenize', token: tokenInput }),
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
        <CardTitle>Token Vault</CardTitle>
        <p className="text-xs text-muted mt-1 mb-4">Tokeniza PANs para cumplir con PCI DSS — Los datos reales nunca salen del vault</p>

        {/* Action toggle */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setAction('tokenize')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              action === 'tokenize' ? 'bg-accent/20 text-accent border border-accent/30' : 'text-muted hover:text-foreground border border-border'
            )}
          >
            <Lock className="w-3 h-3 inline mr-1" />
            Tokenizar
          </button>
          <button
            onClick={() => setAction('detokenize')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              action === 'detokenize' ? 'bg-accent/20 text-accent border border-accent/30' : 'text-muted hover:text-foreground border border-border'
            )}
          >
            <Shield className="w-3 h-3 inline mr-1" />
            Detokenizar
          </button>
        </div>

        {action === 'tokenize' ? (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">PAN (Número de Tarjeta)</label>
              <input
                type="text"
                value={pan}
                onChange={e => setPan(e.target.value)}
                placeholder="4111111111111111"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted mb-2 block">Tipo de Token</label>
              <div className="grid grid-cols-3 gap-2">
                {(['permanent', 'temporary', 'payment'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setTokenType(type)}
                    className={cn(
                      'p-2 rounded-lg border text-center transition-all',
                      tokenType === type
                        ? 'border-accent/30 bg-accent/5'
                        : 'border-border hover:border-border-hover'
                    )}
                  >
                    <p className="text-xs font-medium text-foreground capitalize">{type}</p>
                    <p className="text-[10px] text-muted">
                      {type === 'permanent' ? 'No expira' : type === 'temporary' ? '30 min' : '24 hrs'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleTokenize} disabled={loading || pan.length < 13} className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-accent to-purple-600 hover:from-accent-hover hover:to-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Tokenizar PAN
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-muted mb-1 block">Token</label>
              <input
                type="text"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="9999XXXXXXXXXXXX"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono"
              />
              <p className="text-[10px] text-muted mt-1">Los tokens comienzan con 9999 (BIN no enrutable)</p>
            </div>

            <button onClick={handleDetokenize} disabled={loading || !tokenInput} className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Detokenizar
            </button>
          </div>
        )}
      </Card>

      {/* Result */}
      <Card>
        <CardTitle>Resultado</CardTitle>
        {!result && !loading && (
          <div className="mt-8 text-center text-muted">
            <Lock className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Tokeniza un PAN o detokeniza un token existente</p>
          </div>
        )}
        {loading && (
          <div className="mt-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-accent animate-spin" />
            <p className="text-sm text-muted">Procesando...</p>
          </div>
        )}
        {result && result.success && result.action === 'tokenize' && (
          <div className="mt-4 space-y-4 animate-fade-in">
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-400">PAN Tokenizado</p>
                <p className="text-xs text-muted">El PAN original está protegido en el vault</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 rounded-lg bg-card-hover/50">
                <p className="text-[10px] text-muted uppercase">Token</p>
                <p className="text-sm font-mono text-accent">{result.token as string}</p>
              </div>
              <div className="p-3 rounded-lg bg-card-hover/50">
                <p className="text-[10px] text-muted uppercase">PAN Enmascarado</p>
                <p className="text-sm font-mono text-foreground">{result.masked_pan as string}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-card-hover/50">
                  <p className="text-[10px] text-muted uppercase">Marca</p>
                  <p className="text-xs font-medium text-foreground capitalize">{result.card_brand as string}</p>
                </div>
                <div className="p-3 rounded-lg bg-card-hover/50">
                  <p className="text-[10px] text-muted uppercase">Últimos 4</p>
                  <p className="text-xs font-mono text-foreground">{result.last_four as string}</p>
                </div>
                <div className="p-3 rounded-lg bg-card-hover/50">
                  <p className="text-[10px] text-muted uppercase">Tipo</p>
                  <p className="text-xs font-medium text-foreground capitalize">{result.token_type as string}</p>
                </div>
              </div>
              {result.expires_at && (
                <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                  <p className="text-[10px] text-yellow-400 uppercase">Expira</p>
                  <p className="text-xs font-mono text-foreground">{result.expires_at as string}</p>
                </div>
              )}
            </div>
          </div>
        )}
        {result && result.success && result.action === 'detokenize' && (
          <div className="mt-4 space-y-4 animate-fade-in">
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-400">Detokenización Exitosa</p>
                <p className="text-xs text-muted">PAN recuperado del vault</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card-hover/50 border border-border">
              <p className="text-[10px] text-muted uppercase mb-1">PAN Original</p>
              <p className="text-lg font-mono text-foreground tracking-wide">{result.pan as string}</p>
              <p className="text-xs text-muted mt-1">Masked: {result.masked_pan as string}</p>
            </div>
          </div>
        )}
        {result && result.success === false && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/5 border border-red-500/20 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">No encontrado</p>
              <p className="text-xs text-muted">{result.error as string}</p>
            </div>
          </div>
        )}
        {result?.error && !('success' in result) && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <p className="text-sm text-red-400">{result.error as string}</p>
          </div>
        )}
      </Card>
    </div>
  )
}
