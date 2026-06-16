'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/ui/metric-card'
import { cn, formatDate } from '@/lib/utils'
import { FileBarChart, Download, Clock, CheckCircle2, FileText, BarChart3 } from 'lucide-react'

interface ReportDefinition {
  id: string
  name: string
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  category: 'transactional' | 'financial' | 'operational' | 'compliance'
  format: 'pdf' | 'csv' | 'xlsx'
  last_generated: string | null
  schedule: string
}

interface GeneratedReport {
  id: string
  report_definition_id: string
  name: string
  generated_at: string
  period: { from: string; to: string }
  data: Record<string, unknown>
  summary: string[]
}

const categoryLabels: Record<string, string> = {
  transactional: 'Transaccional',
  financial: 'Financiero',
  operational: 'Operacional',
  compliance: 'Compliance',
}

const categoryColors: Record<string, string> = {
  transactional: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  financial: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  operational: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  compliance: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

const typeLabels: Record<string, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
  custom: 'Personalizado',
}

export function ReportesClient() {
  const [reports, setReports] = useState<ReportDefinition[]>([])
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports/generate')
      .then(res => res.json())
      .then(data => {
        setReports(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleGenerate = async (reportId: string) => {
    setGenerating(reportId)
    setGeneratedReport(null)
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId }),
      })
      if (res.ok) {
        const data = await res.json()
        setGeneratedReport(data)
        // Update last_generated in local state
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, last_generated: data.generated_at } : r))
      }
    } finally {
      setGenerating(null)
    }
  }

  const filtered = activeCategory === 'all' ? reports : reports.filter(r => r.category === activeCategory)
  const categories = ['all', 'transactional', 'financial', 'operational', 'compliance']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Reportes" description="Centro de reportería y analytics de KLAP">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Clock className="w-3.5 h-3.5" />
          {reports.length} reportes disponibles
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Reportes" value={reports.length} icon={FileBarChart} />
        <MetricCard title="Generados Hoy" value={reports.filter(r => r.last_generated && r.last_generated.startsWith(new Date().toISOString().split('T')[0])).length} icon={CheckCircle2} iconColor="bg-emerald-500/10" />
        <MetricCard title="Programados" value={reports.filter(r => r.schedule).length} icon={Clock} iconColor="bg-blue-500/10" />
        <MetricCard title="Categorías" value={4} icon={BarChart3} iconColor="bg-violet-500/10" />
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map(cat => (
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
            {cat === 'all' ? 'Todos' : categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(report => (
          <Card key={report.id} className="flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <Badge variant={categoryColors[report.category]} className="text-[9px]">
                  {categoryLabels[report.category]}
                </Badge>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{report.name}</h3>
              <div className="space-y-1 text-xs text-muted">
                <p>Tipo: {typeLabels[report.type]} · Formato: {report.format.toUpperCase()}</p>
                <p>{report.schedule}</p>
                {report.last_generated && (
                  <p className="text-[10px]">Último: {formatDate(report.last_generated)}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => handleGenerate(report.id)}
              disabled={generating === report.id}
              className={cn(
                'mt-4 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 border',
                generating === report.id
                  ? 'bg-accent/5 text-accent border-accent/20 cursor-wait'
                  : 'bg-accent/10 hover:bg-accent/20 text-accent border-accent/20'
              )}
            >
              {generating === report.id ? (
                <>
                  <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Generar
                </>
              )}
            </button>
          </Card>
        ))}
      </div>

      {/* Generated Report Result */}
      {generatedReport && (
        <Card className="border-accent/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{generatedReport.name}</h3>
              <p className="text-xs text-muted">Generado: {formatDate(generatedReport.generated_at)} · Período: {generatedReport.period.from} a {generatedReport.period.to}</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted uppercase tracking-wide">Resumen</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {generatedReport.summary.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-foreground bg-card rounded-lg p-2.5 border border-border">
                  <BarChart3 className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
