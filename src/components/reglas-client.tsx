'use client'

import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { getStatusColor } from '@/lib/utils'
import { Settings, CreditCard, Smartphone, Globe, QrCode } from 'lucide-react'

interface Props {
  rules: Array<Record<string, unknown>>
}

const methodIcons: Record<string, React.ReactNode> = {
  card: <CreditCard className="w-4 h-4" />,
  contactless: <Smartphone className="w-4 h-4" />,
  ecommerce: <Globe className="w-4 h-4" />,
  qr: <QrCode className="w-4 h-4" />,
}

export function ReglasClient({ rules }: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Reglas & Fees" description="Configuración de comisiones por marca y tipo">
        <button className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Nueva Regla
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((rule) => (
          <Card key={rule.id as string} className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  {methodIcons[rule.payment_method as string] || <CreditCard className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{rule.name as string}</p>
                  <p className="text-xs text-muted capitalize">{rule.card_brand as string} · {rule.card_type as string}</p>
                </div>
              </div>
              <Badge variant={rule.is_active ? getStatusColor('active') : getStatusColor('inactive')}>
                {rule.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>

            <div className="mt-4 pt-3 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wide">Porcentaje</p>
                  <p className="text-lg font-bold text-foreground">{((rule.percentage as number) * 100).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wide">Fee Fijo</p>
                  <p className="text-lg font-bold text-foreground">${rule.fixed_fee as number}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-[10px] text-muted">Método: <span className="capitalize">{rule.payment_method as string}</span></p>
              <button className="text-xs text-accent hover:text-accent-hover transition-colors">Editar</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
