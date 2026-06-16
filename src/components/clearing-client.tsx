'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber, formatDate, getStatusColor, cn } from '@/lib/utils'
import { Layers, FileText, Send, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

interface Props {
  batches: Array<Record<string, unknown>>
}

const statusOrder = ['pending', 'processing', 'generated', 'sent', 'confirmed']

function BatchProgress({ status }: { status: string }) {
  const currentIndex = statusOrder.indexOf(status)
  const isFailed = status === 'failed'

  return (
    <div className="flex items-center gap-1 mt-2">
      {statusOrder.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className={cn(
            'w-2 h-2 rounded-full transition-all',
            isFailed ? 'bg-red-500/30' :
            i <= currentIndex ? 'bg-accent' : 'bg-border'
          )} />
          {i < statusOrder.length - 1 && (
            <div className={cn(
              'w-4 h-0.5',
              isFailed ? 'bg-red-500/30' :
              i < currentIndex ? 'bg-accent' : 'bg-border'
            )} />
          )}
        </div>
      ))}
      {isFailed && <XCircle className="w-3 h-3 text-red-400 ml-1" />}
    </div>
  )
}

export function ClearingClient({ batches }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'visa' | 'mastercard'>('all')

  const filteredBatches = activeTab === 'all'
    ? batches
    : batches.filter(b => b.card_brand === activeTab)

  const totalConfirmed = batches.filter(b => b.status === 'confirmed').length
  const totalSent = batches.filter(b => b.status === 'sent').length
  const totalPending = batches.filter(b => b.status === 'pending' || b.status === 'processing').length
  const totalFailed = batches.filter(b => b.status === 'failed').length

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Clearing" description="Batches de compensación Visa y Mastercard">
        <button className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Generar Clearing
        </button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Confirmados</p>
              <p className="text-xl font-bold text-foreground">{totalConfirmed}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Send className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Enviados</p>
              <p className="text-xl font-bold text-foreground">{totalSent}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Pendientes</p>
              <p className="text-xl font-bold text-foreground">{totalPending}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Fallidos</p>
              <p className="text-xl font-bold text-red-400">{totalFailed}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-card rounded-lg border border-border w-fit">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'visa', label: 'Visa' },
          { key: 'mastercard', label: 'Mastercard' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'all' | 'visa' | 'mastercard')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              activeTab === tab.key ? 'bg-accent text-white' : 'text-muted hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Batch Cards */}
      <div className="space-y-3">
        {filteredBatches.map((batch) => (
          <Card key={batch.id as string} className="!p-4">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                batch.card_brand === 'visa' ? 'bg-blue-500/10' : 'bg-orange-500/10'
              )}>
                <FileText className={cn(
                  'w-5 h-5',
                  batch.card_brand === 'visa' ? 'text-blue-400' : 'text-orange-400'
                )} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-accent font-medium">{batch.batch_number as string}</span>
                  <Badge variant={getStatusColor(batch.status as string)}>{batch.status as string}</Badge>
                </div>
                <BatchProgress status={batch.status as string} />
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-sm font-medium text-foreground">{formatCurrency(batch.total_amount as number)}</p>
                <p className="text-xs text-muted">{formatNumber(batch.transaction_count as number)} transacciones</p>
              </div>

              {/* File */}
              <div className="text-right flex-shrink-0 hidden md:block">
                {batch.file_name ? (
                  <p className="font-mono text-[10px] text-muted">{batch.file_name as string}</p>
                ) : (
                  <p className="text-xs text-muted italic">Sin archivo</p>
                )}
                <p className="text-[10px] text-muted mt-0.5">{formatDate(batch.created_at as string)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
