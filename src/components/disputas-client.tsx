'use client'

import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { MetricCard } from '@/components/ui/metric-card'
import { formatCurrency, formatDate, formatDateShort, getStatusColor } from '@/lib/utils'
import { ShieldAlert, DollarSign, Clock, Trophy } from 'lucide-react'

interface Props {
  disputes: Array<Record<string, unknown>>
}

export function DisputasClient({ disputes }: Props) {
  const openDisputes = disputes.filter(d => d.status === 'open' || d.status === 'under_review' || d.status === 'representment')
  const totalAmount = openDisputes.reduce((sum, d) => sum + Number(d.amount), 0)
  const wonCount = disputes.filter(d => d.status === 'won').length
  const lostCount = disputes.filter(d => d.status === 'lost').length

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
      key: 'amount',
      header: 'Monto',
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-foreground">{formatCurrency(row.amount as number)}</span>
      ),
    },
    {
      key: 'card_brand',
      header: 'Marca',
      render: (row: Record<string, unknown>) => (
        <span className="uppercase text-xs">{row.card_brand as string}</span>
      ),
    },
    {
      key: 'reason',
      header: 'Motivo',
      render: (row: Record<string, unknown>) => (
        <div>
          <p className="text-xs text-foreground">{row.reason as string}</p>
          <p className="text-[10px] text-muted">Código: {row.reason_code as string}</p>
        </div>
      ),
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (row: Record<string, unknown>) => (
        row.deadline
          ? <span className="text-xs text-warning">{formatDateShort(row.deadline as string)}</span>
          : <span className="text-xs text-muted">—</span>
      ),
    },
    {
      key: 'evidence_submitted',
      header: 'Evidencia',
      render: (row: Record<string, unknown>) => (
        <Badge variant={row.evidence_submitted ? getStatusColor('active') : getStatusColor('inactive')}>
          {row.evidence_submitted ? 'Enviada' : 'Pendiente'}
        </Badge>
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
      header: 'Creada',
      render: (row: Record<string, unknown>) => (
        <span className="text-xs text-muted">{formatDate(row.created_at as string)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Disputas" description="Chargebacks y representaciones" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Abiertas" value={openDisputes.length} icon={ShieldAlert} iconColor="bg-red-500/10" />
        <MetricCard title="Monto en Disputa" value={formatCurrency(totalAmount)} icon={DollarSign} iconColor="bg-orange-500/10" />
        <MetricCard title="Ganadas" value={wonCount} icon={Trophy} iconColor="bg-emerald-500/10" />
        <MetricCard title="Perdidas" value={lostCount} icon={Clock} iconColor="bg-red-500/10" />
      </div>

      <DataTable columns={columns} data={disputes} />
    </div>
  )
}
