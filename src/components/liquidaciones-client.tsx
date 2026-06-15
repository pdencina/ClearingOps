'use client'

import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { MetricCard } from '@/components/ui/metric-card'
import { formatCurrency, formatDateShort, getStatusColor } from '@/lib/utils'
import { Wallet, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Props {
  settlements: Array<Record<string, unknown>>
}

export function LiquidacionesClient({ settlements }: Props) {
  const totalGross = settlements.reduce((sum, s) => sum + Number(s.gross_amount), 0)
  const totalNet = settlements.reduce((sum, s) => sum + Number(s.net_amount), 0)
  const totalCommission = settlements.reduce((sum, s) => sum + Number(s.commission), 0)
  const paidCount = settlements.filter(s => s.status === 'paid').length

  const columns = [
    {
      key: 'merchant',
      header: 'Comercio',
      render: (row: Record<string, unknown>) => (
        <span className="text-foreground font-medium">
          {(row.merchants as Record<string, string>)?.name || '—'}
        </span>
      ),
    },
    {
      key: 'settlement_date',
      header: 'Fecha',
      render: (row: Record<string, unknown>) => (
        <span className="text-xs text-muted">{formatDateShort(row.settlement_date as string)}</span>
      ),
    },
    {
      key: 'gross_amount',
      header: 'Bruto',
      render: (row: Record<string, unknown>) => (
        <span className="text-foreground">{formatCurrency(row.gross_amount as number)}</span>
      ),
    },
    {
      key: 'commission',
      header: 'Comisión',
      render: (row: Record<string, unknown>) => (
        <span className="text-red-400 text-xs">-{formatCurrency(row.commission as number)}</span>
      ),
    },
    {
      key: 'iva',
      header: 'IVA',
      render: (row: Record<string, unknown>) => (
        <span className="text-red-400 text-xs">-{formatCurrency(row.iva as number)}</span>
      ),
    },
    {
      key: 'withholdings',
      header: 'Retenciones',
      render: (row: Record<string, unknown>) => (
        <span className="text-red-400 text-xs">-{formatCurrency(row.withholdings as number)}</span>
      ),
    },
    {
      key: 'net_amount',
      header: 'Líquido',
      render: (row: Record<string, unknown>) => (
        <span className="text-emerald-400 font-medium">{formatCurrency(row.net_amount as number)}</span>
      ),
    },
    {
      key: 'transaction_count',
      header: 'Txns',
      render: (row: Record<string, unknown>) => (
        <span className="text-muted text-xs">{row.transaction_count as number}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: Record<string, unknown>) => (
        <Badge variant={getStatusColor(row.status as string)}>{row.status as string}</Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Liquidaciones" description="Liquidaciones por comercio con detalle de comisiones" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Bruto" value={formatCurrency(totalGross)} icon={Wallet} />
        <MetricCard title="Total Líquido" value={formatCurrency(totalNet)} icon={TrendingUp} iconColor="bg-emerald-500/10" />
        <MetricCard title="Comisiones Cobradas" value={formatCurrency(totalCommission)} icon={AlertCircle} iconColor="bg-orange-500/10" />
        <MetricCard title="Pagadas" value={`${paidCount} / ${settlements.length}`} icon={CheckCircle2} iconColor="bg-emerald-500/10" />
      </div>

      <DataTable columns={columns} data={settlements} />
    </div>
  )
}
