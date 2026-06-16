'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/ui/metric-card'
import { cn } from '@/lib/utils'
import { UserPlus, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp, FileText, User } from 'lucide-react'

interface OnboardingStep {
  id: number
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  required_docs: string[]
  completed_docs: string[]
  notes: string | null
}

interface OnboardingProcess {
  id: string
  merchant_name: string
  rut: string
  status: string
  current_step: number
  total_steps: number
  steps: OnboardingStep[]
  risk_score: number
  estimated_completion: string
  assigned_to: string
}

const statusLabels: Record<string, string> = {
  pending_docs: 'Documentación',
  kyc_review: 'Revisión KYC',
  risk_assessment: 'Evaluación de Riesgo',
  contract_signing: 'Firma Contrato',
  terminal_setup: 'Config. Terminal',
  testing: 'Testing',
  active: 'Activo',
}

export function OnboardingClient() {
  const [processes, setProcesses] = useState<OnboardingProcess[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/onboarding')
      .then(res => res.json())
      .then(data => {
        setProcesses(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleAdvance = async (id: string) => {
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'advance', id }),
    })
    if (res.ok) {
      const updated = await res.json()
      setProcesses(prev => prev.map(p => p.id === id ? updated : p))
    }
  }

  const activeCount = processes.filter(p => p.status !== 'active').length
  const completedCount = processes.filter(p => p.status === 'active').length
  const avgProgress = processes.length > 0
    ? Math.round(processes.reduce((sum, p) => sum + (p.current_step / p.total_steps) * 100, 0) / processes.length)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Onboarding" description="Gestión de alta de nuevos comercios">
        <button className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Nuevo Onboarding
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="En Proceso" value={activeCount} icon={Clock} iconColor="bg-blue-500/10" />
        <MetricCard title="Completados" value={completedCount} icon={CheckCircle2} iconColor="bg-emerald-500/10" />
        <MetricCard title="Progreso Promedio" value={`${avgProgress}%`} icon={UserPlus} />
        <MetricCard title="Riesgo Promedio" value={`${processes.length > 0 ? Math.round(processes.reduce((s, p) => s + p.risk_score, 0) / processes.length) : 0}`} icon={AlertTriangle} iconColor="bg-yellow-500/10" />
      </div>

      <div className="space-y-4">
        {processes.map((process) => (
          <Card key={process.id} className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{process.merchant_name}</h3>
                    <Badge variant={process.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'} className="text-[9px]">
                      {statusLabels[process.status] || process.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{process.rut} · {process.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted">Paso {process.current_step} de {process.total_steps}</p>
                  <p className="text-xs text-muted">Est: {process.estimated_completion}</p>
                </div>
                {process.status !== 'active' && (
                  <button
                    onClick={() => handleAdvance(process.id)}
                    className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium rounded-lg transition-colors border border-accent/20"
                  >
                    Avanzar
                  </button>
                )}
                <button
                  onClick={() => setExpandedId(expandedId === process.id ? null : process.id)}
                  className="p-1.5 rounded-lg hover:bg-card text-muted hover:text-foreground transition-colors"
                >
                  {expandedId === process.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 flex items-center gap-1">
              {process.steps.map((step, index) => (
                <div key={step.id} className="flex-1 flex flex-col items-center">
                  <div
                    className={cn(
                      'h-2 w-full rounded-full transition-all',
                      step.status === 'completed' && 'bg-emerald-500',
                      step.status === 'in_progress' && 'bg-accent animate-pulse',
                      step.status === 'pending' && 'bg-border',
                      step.status === 'blocked' && 'bg-red-500/50',
                    )}
                  />
                  <span className={cn(
                    'text-[9px] mt-1 hidden lg:block',
                    step.status === 'in_progress' ? 'text-accent font-medium' : 'text-muted',
                  )}>
                    {step.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Expanded Details */}
            {expandedId === process.id && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {process.assigned_to}</span>
                  <span>Riesgo: <span className={cn(process.risk_score > 70 ? 'text-red-400' : process.risk_score > 50 ? 'text-yellow-400' : 'text-emerald-400')}>{process.risk_score}/100</span></span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {process.steps.map((step) => (
                    <div
                      key={step.id}
                      className={cn(
                        'p-3 rounded-lg border text-xs',
                        step.status === 'completed' && 'border-emerald-500/20 bg-emerald-500/5',
                        step.status === 'in_progress' && 'border-accent/30 bg-accent/5',
                        step.status === 'pending' && 'border-border bg-card',
                        step.status === 'blocked' && 'border-red-500/20 bg-red-500/5',
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{step.id}. {step.name}</span>
                        {step.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {step.status === 'in_progress' && <Clock className="w-3.5 h-3.5 text-accent" />}
                      </div>
                      <div className="space-y-1">
                        {step.required_docs.map((doc) => (
                          <div key={doc} className="flex items-center gap-1.5">
                            <FileText className={cn('w-3 h-3', step.completed_docs.includes(doc) ? 'text-emerald-400' : 'text-muted')} />
                            <span className={step.completed_docs.includes(doc) ? 'text-foreground' : 'text-muted'}>{doc}</span>
                          </div>
                        ))}
                      </div>
                      {step.notes && <p className="mt-2 text-muted italic">{step.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
