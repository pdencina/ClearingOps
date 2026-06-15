'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Search, Filter } from 'lucide-react'

interface Props {
  transactions: Array<Record<string, unknown>>
  merchants: Array<Record<string, unknown>>
}

export function TransaccionesClient({ transactions, merchants }: Props) {
  const [statusFilter, setStatusFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = transactions.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false
    if (brandFilter && t.card_brand !== brandFilter) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const merchantName = ((t.merchants as Record<string, string>)?.name || '').toLowerCase()
      const ref = ((t.reference_id as string) || '').toLowerCase()
      if (!merchantName.includes(search) && !ref.includes(search)) return false
    }
    return true
  })

  const columns = [
    {
      key: 'reference_id',
      header: 'Referencia',
      render: (row: Record<string, unknown>) => (
        <span className="font-mono text-xs text-accent">{row.reference_id as string}</span>
      ),
    },
    {
      key: 'merchant',
      header: 'Comercio',
      render: (row: Record<string, unknown>) => (
        <span className="text-foreground">{(row.merchants as Record<string, string>)?.name || '—'}</span>
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
        <div className="flex items-center gap-2">
          <span className="uppercase text-xs font-medium">{row.card_brand as string}</span>
          <span className="text-muted text-xs">•••• {row.card_last_four as string}</span>
        </div>
      ),
    },
    {
      key: 'payment_method',
      header: 'Método',
      render: (row: Record<string, unknown>) => (
        <span className="text-xs text-muted capitalize">{row.payment_method as string}</span>
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
      header: 'Fecha',
      render: (row: Record<string, unknown>) => (
        <span className="text-xs text-muted">{formatDate(row.created_at as string)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Transacciones" description="Historial completo de transacciones procesadas" />

      {/* Filters */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Buscar por comercio o referencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent"
          >
            <option value="">Todos los estados</option>
            <option value="authorized">Authorized</option>
            <option value="captured">Captured</option>
            <option value="settled">Settled</option>
            <option value="rejected">Rejected</option>
            <option value="reversed">Reversed</option>
          </select>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent"
          >
            <option value="">Todas las marcas</option>
            <option value="visa">Visa</option>
            <option value="mastercard">Mastercard</option>
            <option value="amex">Amex</option>
            <option value="redcompra">Redcompra</option>
          </select>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Filter className="w-3.5 h-3.5" />
            {filtered.length} resultados
          </div>
        </div>
      </Card>

      {/* Table */}
      <DataTable columns={columns} data={filtered} />
    </div>
  )
}
