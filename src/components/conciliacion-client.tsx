'use client'

import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { MetricCard } from '@/components/ui/metric-card'
import { formatCurrency, formatDateShort, formatNumber, getStatusColor } from '@/lib/utils'
import { Scale, CheckCircle2, AlertTriangle, Search } from 'lucide-react'

interface Props {
  items: Array<Record<string, unknown>>
}

export function ConciliacionClient({ items }: Props) {
  const reconciled = items.filter(i => i.status === 'reconciled').length
  const mismatches = items.filter(i => i.status === 'mismatch').length
  const investigating = items.filter(i => i.status === 'investigating').length
  const totalDiff = items.reduce((sum, i) => sum + Number(i.difference_amount), 0)

  const columns = [
    {
      key: 'reconciliation_date',
      header: 'Fecha',
      render: (row: Record<string, unknown>) => (
        <span className="text-foreground">{formatDateShort(row.reconciliation_date as string)}</span>
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
      key: 'source_klap',
      header: 'KLAP',
      render: (row: Record<string, unknown>) => (
        <span className="text-foreground text-xs">{formatCurrency(row.source_klap as number)}</span>
      ),
    },
    {
      key: 'source_bank',
      header: 'Banco',
      render: (row: Record<string, unknown>) => (
        <span className="text-foreground text-xs">{formatCurrency(row.source_bank as number)}</span>
      ),
    },
    {
      key: 'source_brand',
      header: 'Marca',
      render: (row: Record<string, unknown>) => (
        <span className="text-foreground text-xs">{formatCurrency(row.source_brand as number)}</span>
      ),
    },
    {
      key: 'difference_amount',
      header: 'Diferencia',
      render: (row: Record<string, unknown>) => {
        const diff = Number(row.difference_amount)
        return (
          <span className={diff > 0 ? 'text-red-400 font-medium' : 'text-emerald-400'}>
            {diff > 0 ? formatCurrency(diff) : '—'}
          </span>
        )
      },
    },
    {
      key: 'transaction_count_klap',
      header: 'Txns KLAP',
      render: (row: Record<string, unknown>) => (
        <span className="text-xs text-muted">{formatNumber(row.transaction_count_klap as number)}</span>
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
      key: 'notes',
      header: 'Notas',
      render: (row: Record<string, unknown>) => (
        <span className="text-xs text-muted max-w-[200px] truncate block">{(row.notes as string) || '—'}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Conciliación" description="Comparación KLAP vs Banco vs Marca" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Reconciliados" value={reconciled} icon={CheckCircle2} iconColor="bg-emerald-500/10" />
        <MetricCard title="Descuadres" value={mismatches} icon={AlertTriangle} iconColor="bg-red-500/10" />
        <MetricCard title="En Investigación" value={investigating} icon={Search} iconColor="bg-orange-500/10" />
        <MetricCard title="Diferencia Total" value={formatCurrency(totalDiff)} icon={Scale} iconColor="bg-yellow-500/10" />
      </div>

      <DataTable columns={columns} data={items} />
    </div>
  )
}
