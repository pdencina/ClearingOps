'use client'

import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric-card'
import { getStatusColor } from '@/lib/utils'
import { Store, MapPin, CreditCard, CheckCircle2, Users, Building2 } from 'lucide-react'

interface Props {
  merchants: Array<Record<string, unknown>>
}

const categoryLabels: Record<string, string> = {
  retail: 'Retail',
  pharmacy: 'Farmacia',
  fuel: 'Combustible',
  department_store: 'Tienda por Departamento',
  food_delivery: 'Delivery',
  restaurant: 'Restaurante',
  transport: 'Transporte',
  food: 'Alimentos',
  airlines: 'Aerolíneas',
}

export function ComerciosClient({ merchants }: Props) {
  const active = merchants.filter(m => m.status === 'active').length
  const categories = [...new Set(merchants.map(m => m.category as string))].length

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Comercios" description="Directorio de comercios afiliados a KLAP">
        <button className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
          <Store className="w-4 h-4" />
          Nuevo Comercio
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Comercios" value={merchants.length} icon={Building2} />
        <MetricCard title="Activos" value={active} icon={CheckCircle2} iconColor="bg-emerald-500/10" />
        <MetricCard title="Categorías" value={categories} icon={Users} iconColor="bg-violet-500/10" />
        <MetricCard title="Terminales" value={merchants.length * 2} icon={CreditCard} iconColor="bg-blue-500/10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {merchants.map((merchant) => (
          <Card key={merchant.id as string} className="hover:border-accent/30 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground truncate">{merchant.name as string}</h3>
                  <Badge variant={getStatusColor(merchant.status as string)} className="text-[9px]">
                    {merchant.status as string}
                  </Badge>
                </div>
                <p className="text-xs text-muted mt-0.5">{merchant.rut as string}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <MapPin className="w-3 h-3" />
                    <span>{merchant.city as string || 'Sin ubicación'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Building2 className="w-3 h-3" />
                    <span>{categoryLabels[merchant.category as string] || merchant.category as string}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <CreditCard className="w-3 h-3" />
                    <span>MCC: {merchant.mcc as string}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
