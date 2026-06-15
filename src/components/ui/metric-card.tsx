import { cn } from '@/lib/utils'
import { Card } from './card'
import { type LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  className?: string
  iconColor?: string
}

export function MetricCard({ title, value, subtitle, icon: Icon, trend, className, iconColor }: MetricCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          {trend && (
            <p className={cn(
              'text-xs font-medium',
              trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          iconColor || 'bg-accent/10'
        )}>
          <Icon className={cn('w-5 h-5', iconColor ? 'text-white/80' : 'text-accent')} />
        </div>
      </div>
    </Card>
  )
}
