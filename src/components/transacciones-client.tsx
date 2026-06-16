'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric-card'
import { formatCurrency, formatDate, getStatusColor, formatNumber } from '@/lib/utils'
import { Search, Filter, ArrowLeftRight, CheckCircle2, XCircle, Clock, X } from 'lucide-react'

interface Props {
  transactions: Array<Record<string, unknown>>
  merchants: Array<Record<string, unknown>>
}

export function TransaccionesClient({ transactions, merchants }: Props) {
  const [statusFilter, setStatusFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTxn, setSelectedTxn] = useState<Record<string, unknown> | null>(null)

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

  const totalAmount = filtered.reduce((sum, t) => sum + Number(t.amount), 0)
  const settledCount = filtered.filter(t => t.status === 'settled').length
  const rejectedCount = filtered.filter(t => t.status === 'rejected').length
  const pendingCount = filtered.filter(t => t.status === 'authorized' || t.status === 'captured').length

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Transacciones" description="Historial completo de transacciones procesadas" />

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Filtradas" value={formatNumber(filtered.length)} icon={ArrowLeftRight} />
        <MetricCard title="Monto Total" value={formatCurrency(totalAmount)} icon={CheckCircle2} iconColor="bg-emerald-500/10" />
        <MetricCard title="Rechazadas" value={rejectedCount} icon={XCircle} iconColor="bg-red-500/10" />
        <MetricCard title="Pendientes" value={pendingCount} icon={Clock} iconColor="bg-yellow-500/10" />
      </div>

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
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Referencia</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Comercio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Monto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Marca</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Método</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((txn) => (
                <tr
                  key={txn.id as string}
                  onClick={() => setSelectedTxn(txn)}
                  className="bg-card/50 hover:bg-card cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-mono text-xs text-accent">{txn.reference_id as string}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{(txn.merchants as Record<string, string>)?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{formatCurrency(txn.amount as number)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="uppercase text-xs font-medium">{txn.card_brand as string}</span>
                    <span className="text-muted text-xs ml-1">•••• {txn.card_last_four as string}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted capitalize">{txn.payment_method as string}</td>
                  <td className="px-4 py-3"><Badge variant={getStatusColor(txn.status as string)}>{txn.status as string}</Badge></td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDate(txn.created_at as string)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted text-sm">No hay transacciones que coincidan con los filtros</div>
        )}
      </div>

      {/* Transaction Detail Panel */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedTxn(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-sidebar border-l border-border h-full overflow-y-auto animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Detalle de Transacción</h2>
                <button onClick={() => setSelectedTxn(null)} className="p-1 rounded hover:bg-card-hover text-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <Badge variant={getStatusColor(selectedTxn.status as string)} className="text-sm px-3 py-1">
                  {selectedTxn.status as string}
                </Badge>
                <span className="text-2xl font-bold text-foreground">{formatCurrency(selectedTxn.amount as number)}</span>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                <DetailSection title="Transacción">
                  <DetailRow label="Referencia" value={selectedTxn.reference_id as string} mono />
                  <DetailRow label="Auth Code" value={selectedTxn.auth_code as string} mono />
                  <DetailRow label="Fecha" value={formatDate(selectedTxn.created_at as string)} />
                  <DetailRow label="Cuotas" value={`${selectedTxn.installments || 1}`} />
                </DetailSection>

                <DetailSection title="Tarjeta">
                  <DetailRow label="Marca" value={(selectedTxn.card_brand as string)?.toUpperCase()} />
                  <DetailRow label="Tipo" value={(selectedTxn.card_type as string)} />
                  <DetailRow label="Últimos 4" value={`•••• ${selectedTxn.card_last_four}`} />
                  <DetailRow label="Método" value={(selectedTxn.payment_method as string)} />
                </DetailSection>

                <DetailSection title="Comercio">
                  <DetailRow label="Nombre" value={(selectedTxn.merchants as Record<string, string>)?.name || '—'} />
                  <DetailRow label="ID" value={(selectedTxn.merchant_id as string)?.slice(0, 8) + '...'} mono />
                </DetailSection>

                {selectedTxn.rejection_reason && (
                  <DetailSection title="Rechazo">
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                      <p className="text-sm text-red-400">{selectedTxn.rejection_reason as string}</p>
                    </div>
                  </DetailSection>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-4">
      <p className="text-[10px] uppercase tracking-widest text-muted mb-3 font-medium">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-xs text-foreground ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  )
}
