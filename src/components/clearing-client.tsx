'use client'

import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { formatCurrency, formatNumber, formatDate, getStatusColor } from '@/lib/utils'
import { Layers, FileText, Send, CheckCircle2 } from 'lucide-react'

interface Props {
  batches: Array<Record<string, unknown>>
}

export function ClearingClient({ batches }: Props) {
  const visaBatches = batches.filter(b => b.card_brand === 'visa')
  const mcBatches = batches.filter(b => b.card_brand === 'mastercard')

  const columns = [
    {
      key: 'batch_number',
      header: 'Batch',
      render: (row: Record<string, unknown>) => (
        <span className="font-mono text-xs text-accent">{row.batch_number as string}</span>
      ),
    },
    {
      key: 'card_brand',
      header: 'Marca',
      render: (row: Record<string, unknown>) => (
        <span className="uppercase text-xs font-medium">{row.card_brand as string}</span>
      ),
    },
    {
      key: 'transaction_count',
      header: 'Transacciones',
      render: (row: Record<string, unknown>) => (
        <span className="text-foreground">{formatNumber(row.transaction_count as number)}</span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Monto Total',
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-foreground">{formatCurrency(row.total_amount as number)}</span>
      ),
    },
    {
      key: 'file_name',
      header: 'Archivo',
      render: (row: Record<string, unknown>) => (
        row.file_name
          ? <span className="font-mono text-xs text-muted">{row.file_name as string}</span>
          : <span className="text-xs text-muted italic">No generado</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: Record<string, unknown>) => (
        <Badge variant={getStatusColor(row.status as string)}>{row.status as string}</Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Creado',
      render: (row: Record<string, unknown>) => (
        <span className="text-xs text-muted">{formatDate(row.created_at as string)}</span>
      ),
    },
  ]

  const totalConfirmed = batches.filter(b => b.status === 'confirmed').length
  const totalSent = batches.filter(b => b.status === 'sent').length
  const totalPending = batches.filter(b => b.status === 'pending' || b.status === 'processing').length

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
              <Layers className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Pendientes</p>
              <p className="text-xl font-bold text-foreground">{totalPending}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted">Total Batches</p>
              <p className="text-xl font-bold text-foreground">{batches.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Batches Table */}
      <DataTable columns={columns} data={batches} />
    </div>
  )
}
