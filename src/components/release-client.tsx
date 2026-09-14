'use client'

import { useState, useCallback, useRef } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric-card'
import { cn } from '@/lib/utils'
import {
  FileSearch,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Loader2,
  Download,
  Trash2,
  Paperclip,
  FileText,
  X,
} from 'lucide-react'
import {
  ACTION_LABELS,
  RISK_LABELS,
  analyzeRelease,
  parseReleaseNote,
  type AnalyzedTicket,
  type ReleaseAnalysis,
  type ReleaseAction,
  type RiskLevel,
} from '@/lib/engines/release-analyzer'

const RISK_BADGE: Record<RiskLevel, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const ACTION_BADGE: Record<ReleaseAction, string> = {
  block_until_dual_signoff: 'bg-red-500/10 text-red-400 border-red-500/20',
  sanity_check_required: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  functional_validation: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  monitor: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  informational: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

const SAMPLE_R2660 = `SmartVista Radar Payments 26.60 — Release Notes (14 August 2026)

2.13. Klap
B_PSGB-94498 — American Express: merchant installment ARN in position 12 must be 8
Module
SVBO
Type of Change
Bug fix
Complexity of Change
High
B_PSGB-106280 — Visa ARN refund must be different from the purchase
Module
SVBO
Type of Change
Bug fix
Complexity of Change
High
B_PSGB-108189 — American Express transactions are not updated after processing a DAF file
Module
SVBO
Type of Change
Bug fix
Complexity of Change
Average
B_PSGB-109771 — Monto total cuotas amplified by 100
Module
SVBO
Type of Change
Bug fix
Summary
The monto_total_cuotas field in the Visa outgoing files is now displayed correctly according to the Visa specification.
Complexity of Change
High
B_PSGB-110131 — Timeout for getting the transaction account currency
Module
SVBO
Type of Change
Bug fix
Complexity of Change
High
2.2.
B_PSGB-97969 — Card issuing, phase 2: matching the L file from Worldline
Module
SVBO
Type of Change
Enhancement
Summary
SVBO can now import L files from Worldline and export the cleared transactions to Temenos in the SVXP clearing files.
Complexity of Change
High
2.5.
B_PSGB-108595 — Mastercard outgoing clearing messages for installments
Module
SVBO
Type of Change
Bug fix
Complexity of Change
High
2.9.
B_PSGB-109528 — Rejections with action code 909 (original SVFE code 96)
Module
SVFE
Type of Change
Bug fix
Complexity of Change
High
2.22.
B_PSGB-111987 — Update the Clearing web service after XSD change
Module
APIGate
Type of Change
Enhancement
Summary
The types of the status and status_reason tags in the operation_result complex tag have been modified.
Complexity of Change
High
2.24.
B_PSGB-107436 — Transactions are not available in the clearing file from 4 June 2026
Module
SVBO
Type of Change
Bug fix
Summary
Processing of Mastercard incoming clearing files has been modified so acquiring institutions and reversals are matched correctly.
Complexity of Change
High
2.20.
B_PSGB-107639 — Process 10001211 — Visa BaseII incoming clearing has not finished
Module
SVBO
Type of Change
Bug fix
Complexity of Change
High
B_PSGB-108732 — SVFE Mastercard mandatory changes 26.Q3
Module
SVFE
Type of Change
Enhancement
Complexity of Change
High
B_PSGB-109363 — Incoming CVV2 from Visa are not sent to GIM
Module
SVFE
Type of Change
Bug fix
Complexity of Change
High
2.10.
B_PSGB-110359 — PayFac Settlement Report: production report issues
Module
SVBO
Type of Change
Bug fix
Summary
Failed settlements are not now included in the Total Net amount in the Settlement Report.
Complexity of Change
High
2.3.
B_PSGB-107373 — ANZ Reconciliation and Summary report
Module
SVBO
Type of Change
Enhancement
Summary
The ANZ Reconciliation and Summary report is generated daily and sent to the ANZ network.
Complexity of Change
Average
2.17.
B_PSGB-107179 — Visa fee updates
Module
SVBO
Type of Change
Enhancement
Complexity of Change
High
2.3.
B_PSGB-105737 — Slow response on card features in the mobile application
Module
SVBO
Type of Change
Bug fix
Complexity of Change
High
2.20.
B_PSGB-110937 — The Terminal ID search field is limited to 9 characters
Module
SVFE
Type of Change
Enhancement
Complexity of Change
Average
2.21.
B_PSGB-104932 — Identity document update behavior
Module
Customer Service Portal
Type of Change
Bug fix
Complexity of Change
High`

// Análisis inicial del R26.60 pre-computado para que la demo arranque
// con la tabla ya visible, sin depender de red ni de un clic.
function initialAnalysis(): ReleaseAnalysis {
  return analyzeRelease('R26.60', parseReleaseNote(SAMPLE_R2660))
}

export function ReleaseClient() {
  const [releaseName, setReleaseName] = useState('R26.60')
  const [rawText, setRawText] = useState(SAMPLE_R2660)
  const [analysis, setAnalysis] = useState<ReleaseAnalysis | null>(initialAnalysis)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRun, setLastRun] = useState<string | null>(null)
  const [attachedFile, setAttachedFile] = useState<{ name: string; pages: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const analyzeText = useCallback((text: string, name: string) => {
    setLoading(true)
    setError(null)
    // pequeño delay para que se vea el spinner y el feedback en la demo
    setTimeout(() => {
      try {
        // El análisis corre en el cliente con el mismo motor del backend,
        // así la demo es instantánea y no depende de la red.
        const tickets = parseReleaseNote(text)
        if (tickets.length === 0) {
          throw new Error('No se detectaron tickets. Verifica el formato (B_PSGB-XXXXX — Título).')
        }
        setAnalysis(analyzeRelease(name, tickets))
        setLastRun(new Date().toLocaleTimeString('es-CL'))
      } catch (e) {
        setError((e as Error).message)
        setAnalysis(null)
      } finally {
        setLoading(false)
      }
    }, 250)
  }, [])

  const runAnalysis = useCallback(() => {
    analyzeText(rawText, releaseName)
  }, [analyzeText, rawText, releaseName])

  const loadSample = useCallback(() => {
    setReleaseName('R26.60')
    setRawText(SAMPLE_R2660)
    analyzeText(SAMPLE_R2660, 'R26.60')
  }, [analyzeText])

  const clearInput = useCallback(() => {
    setRawText('')
    setAnalysis(null)
    setError(null)
    setLastRun(null)
    setAttachedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        setError('Solo se aceptan archivos PDF.')
        return
      }

      setUploading(true)
      setError(null)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/release/extract-pdf', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error extrayendo el PDF')

        // Intenta detectar el nombre del release del propio texto, ej: "26.60" o "R26.60"
        const detected = data.text.match(/\bR?\d{2}\.\d{2}\b/)
        const name = detected ? (detected[0].startsWith('R') ? detected[0] : `R${detected[0]}`) : file.name.replace(/\.pdf$/i, '')

        setAttachedFile({ name: file.name, pages: data.total_pages })
        setReleaseName(name)
        setRawText(data.text)
        analyzeText(data.text, name)
      } catch (e) {
        setError((e as Error).message)
        setAttachedFile(null)
      } finally {
        setUploading(false)
      }
    },
    [analyzeText]
  )

  const removeAttachedFile = useCallback(() => {
    setAttachedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Release Analyzer"
        description="Clasifica los tickets de un Release Note de BPC por riesgo operacional y define la acción antes del PaP"
      />

      {/* Input */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted w-32">Nombre del release</label>
            <input
              value={releaseName}
              onChange={e => setReleaseName(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground w-48 focus:border-accent outline-none"
              placeholder="R26.60"
            />
          </div>
          {/* Adjuntar PDF */}
          <div>
            <label className="text-sm text-muted mb-2 block">Release Note (PDF)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleFileSelected(file)
              }}
            />
            {attachedFile ? (
              <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
                <FileText className="w-5 h-5 text-accent shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{attachedFile.name}</p>
                  <p className="text-xs text-muted">{attachedFile.pages} páginas · texto extraído automáticamente</p>
                </div>
                <button
                  onClick={removeAttachedFile}
                  disabled={uploading}
                  title="Quitar archivo"
                  className="p-1.5 rounded-md hover:bg-red-500/10 text-muted hover:text-red-400 disabled:opacity-50 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted hover:border-accent hover:text-foreground disabled:opacity-50 transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extrayendo texto del PDF…
                  </>
                ) : (
                  <>
                    <Paperclip className="w-4 h-4" />
                    Adjuntar Release Note en PDF
                  </>
                )}
              </button>
            )}
          </div>

          <div>
            <label className="text-sm text-muted mb-2 block">Texto del Release Note</label>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              rows={10}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:border-accent outline-none resize-y"
              placeholder="Pega aquí el texto del Release Note (formato B_PSGB-XXXXX — Título, Module, Type of Change, Summary, Complexity of Change)… o adjunta el PDF arriba."
            />
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={runAnalysis}
              disabled={loading || !rawText.trim()}
              className="inline-flex items-center gap-2 bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
              {loading ? 'Analizando…' : 'Analizar release'}
            </button>

            <button
              onClick={loadSample}
              disabled={loading}
              className="inline-flex items-center gap-2 border border-border text-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-card-hover disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Cargar ejemplo R26.60
            </button>

            <button
              onClick={clearInput}
              disabled={loading || !rawText.trim()}
              className="inline-flex items-center gap-2 border border-border text-muted text-sm font-medium px-4 py-2 rounded-lg hover:bg-card-hover disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar
            </button>

            {/* Feedback */}
            {error ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-red-400">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </span>
            ) : (
              !loading && lastRun && analysis && (
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  {analysis.total_tickets} tickets analizados · {lastRun}
                </span>
              )
            )}
          </div>
        </div>
      </Card>

      {analysis && (
        <>
          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Tickets analizados"
              value={analysis.total_tickets}
              icon={Layers}
              iconColor="bg-accent/10"
            />
            <MetricCard
              title="Críticos + Altos"
              value={analysis.by_risk.critical + analysis.by_risk.high}
              icon={ShieldAlert}
              iconColor="bg-red-500/10"
            />
            <MetricCard
              title="Requieren doble firma"
              value={analysis.requires_dual_signoff}
              icon={AlertTriangle}
              iconColor="bg-orange-500/10"
            />
            <MetricCard
              title="Requieren sanity check"
              value={analysis.requires_sanity_check}
              icon={CheckCircle2}
              iconColor="bg-purple-500/10"
            />
          </div>

          {/* Resumen ejecutivo */}
          <Card>
            <h3 className="text-sm font-medium text-foreground mb-3">Resumen ejecutivo</h3>
            <ul className="space-y-1.5">
              {analysis.summary.map((s, i) => (
                <li key={i} className="text-sm text-muted flex gap-2">
                  <span className="text-accent">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Tabla ticket → riesgo → acción */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              Tickets priorizados (ticket → riesgo → acción)
            </h3>
            <TicketTable tickets={sortByRisk(analysis.tickets)} />
          </div>
        </>
      )}
    </div>
  )
}

const RISK_ORDER: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 }

function sortByRisk(tickets: AnalyzedTicket[]): AnalyzedTicket[] {
  return [...tickets].sort(
    (a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk] || b.score - a.score
  )
}

function TicketTable({ tickets }: { tickets: AnalyzedTicket[] }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-card">
              {['Ticket', 'Título', 'Módulo', 'Riesgo', 'Acción del modelo', 'Motivo'].map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tickets.map(t => (
              <tr key={t.id} className="bg-card/50 hover:bg-card transition-colors align-top">
                <td className="px-4 py-3 text-xs font-mono text-foreground whitespace-nowrap">{t.id}</td>
                <td className="px-4 py-3 text-sm text-foreground max-w-[260px]">{t.title}</td>
                <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{t.module}</td>
                <td className="px-4 py-3">
                  <Badge className={RISK_BADGE[t.risk]}>{RISK_LABELS[t.risk]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {t.actions.map(a => (
                      <Badge key={a} className={cn('w-fit', ACTION_BADGE[a])}>
                        {ACTION_LABELS[a]}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted max-w-[240px]">{t.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tickets.length === 0 && (
        <div className="p-8 text-center text-muted text-sm">No hay tickets analizados</div>
      )}
    </div>
  )
}
