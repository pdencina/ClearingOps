'use client'

import { MetricCard } from '@/components/ui/metric-card'
import { Card, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { formatCurrency, formatNumber, formatDate, getStatusColor, getSeverityColor } from '@/lib/utils'
import {
  ArrowLeftRight,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldAlert,
  Bell,
  TrendingUp,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']

const methodLabels: Record<string, string> = {
  card: 'Tarjeta',
  contactless: 'Contactless',
  ecommerce: 'E-commerce',
  qr: 'QR',
}

interface DashboardClientProps {
  metrics: {
    totalTxns: number
    totalAmount: number
    totalSettled: number
    totalPending: number
    totalRejected: number
    totalOpenDisputes: number
    totalDisputeAmount: number
    activeAlerts: number
    criticalAlerts: number
  }
  volume: Array<{ amount: number; card_brand: string; created_at: string }>
  distribution: Array<{ method: string; count: number; amount: number }>
  activity: Array<Record<string, unknown>>
  topMerchants: Array<Record<string, unknown>>
  alerts: Array<Record<string, unknown>>
}

export function DashboardClient({ metrics, volume, distribution, activity, topMerchants, alerts }: DashboardClientProps) {
  // Group volume by day for chart
  const volumeByDay = volume.reduce((acc, t) => {
    const day = new Date(t.created_at).toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit' })
    if (!acc[day]) acc[day] = { day, amount: 0, count: 0 }
    acc[day].amount += Number(t.amount)
    acc[day].count++
    return acc
  }, {} as Record<string, { day: string; amount: number; count: number }>)

  const chartData = Object.values(volumeByDay)

  const pieData = distribution.map(d => ({
    name: methodLabels[d.method] || d.method,
    value: d.count,
    amount: d.amount,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Vista general del sistema de pagos KLAP"
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Transacciones Hoy"
          value={formatNumber(metrics.totalTxns)}
          icon={ArrowLeftRight}
          trend={{ value: 12, label: 'vs ayer' }}
        />
        <MetricCard
          title="Monto Transaccionado"
          value={formatCurrency(metrics.totalAmount)}
          icon={DollarSign}
          iconColor="bg-emerald-500/10"
        />
        <MetricCard
          title="Liquidado Hoy"
          value={formatCurrency(metrics.totalSettled)}
          icon={CheckCircle2}
          iconColor="bg-emerald-500/10"
        />
        <MetricCard
          title="Pendiente Liquidación"
          value={formatCurrency(metrics.totalPending)}
          icon={Clock}
          iconColor="bg-yellow-500/10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Rechazadas Hoy"
          value={formatNumber(metrics.totalRejected)}
          icon={XCircle}
          iconColor="bg-red-500/10"
        />
        <MetricCard
          title="Chargebacks Abiertos"
          value={formatNumber(metrics.totalOpenDisputes)}
          subtitle={formatCurrency(metrics.totalDisputeAmount)}
          icon={ShieldAlert}
          iconColor="bg-orange-500/10"
        />
        <MetricCard
          title="Alertas Activas"
          value={formatNumber(metrics.activeAlerts)}
          subtitle={`${metrics.criticalAlerts} críticas`}
          icon={Bell}
          iconColor="bg-red-500/10"
        />
        <MetricCard
          title="Tasa Aprobación"
          value={metrics.totalTxns > 0 ? `${(((metrics.totalTxns - metrics.totalRejected) / metrics.totalTxns) * 100).toFixed(1)}%` : '0%'}
          icon={TrendingUp}
          iconColor="bg-indigo-500/10"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Volume Chart */}
        <Card className="lg:col-span-2">
          <CardTitle>Volumen Transaccional (7 días)</CardTitle>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#8888a0" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8888a0" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#8888a0' }}
                  formatter={(value: number) => [formatCurrency(value), 'Monto']}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" fill="url(#colorAmount)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Payment Distribution */}
        <Card>
          <CardTitle>Distribución por Medio de Pago</CardTitle>
          <div className="h-64 mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#12121a', border: '1px solid #1e1e2e', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number, name: string) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted">{item.name}</span>
                </div>
                <span className="text-foreground font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row: Alerts, Activity, Top Merchants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alerts */}
        <Card>
          <CardTitle>Alertas Activas</CardTitle>
          <div className="mt-4 space-y-3">
            {alerts.map((alert: Record<string, unknown>) => (
              <div key={alert.id as string} className="flex items-start gap-3 p-2 rounded-lg hover:bg-card-hover transition-colors">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  alert.severity === 'critical' ? 'bg-red-500 animate-pulse-slow' :
                  alert.severity === 'high' ? 'bg-orange-500' :
                  alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{alert.title as string}</p>
                  <p className="text-[10px] text-muted mt-0.5">{formatDate(alert.created_at as string)}</p>
                </div>
                <Badge variant={getSeverityColor(alert.severity as string)}>
                  {alert.severity as string}
                </Badge>
              </div>
            ))}
            {alerts.length === 0 && <p className="text-xs text-muted text-center py-4">Sin alertas activas</p>}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardTitle>Actividad Reciente</CardTitle>
          <div className="mt-4 space-y-3">
            {activity.slice(0, 8).map((txn: Record<string, unknown>) => (
              <div key={txn.id as string} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-card-hover flex items-center justify-center">
                    <span className="text-[9px] font-bold text-muted uppercase">
                      {(txn.card_brand as string)?.slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-foreground truncate">{(txn.merchants as Record<string, string>)?.name || 'Comercio'}</p>
                    <p className="text-[10px] text-muted">{(txn.card_brand as string)} •••• {txn.card_last_four as string}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-foreground">{formatCurrency(txn.amount as number)}</p>
                  <Badge variant={getStatusColor(txn.status as string)} className="text-[9px]">
                    {txn.status as string}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Merchants */}
        <Card>
          <CardTitle>Top Comercios</CardTitle>
          <div className="mt-4 space-y-3">
            {topMerchants.map((m: Record<string, unknown>, i: number) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-accent">{i + 1}</span>
                  </div>
                  <p className="text-xs text-foreground">{(m.merchants as Record<string, string>)?.name || 'Comercio'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-foreground">{formatCurrency(m.gross_amount as number)}</p>
                  <p className="text-[10px] text-muted">{m.transaction_count as number} txns</p>
                </div>
              </div>
            ))}
            {topMerchants.length === 0 && <p className="text-xs text-muted text-center py-4">Sin datos</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
