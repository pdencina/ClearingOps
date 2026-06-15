import {
  getDashboardMetrics,
  getTransactionVolume7Days,
  getPaymentMethodDistribution,
  getRecentActivity,
  getTopMerchants,
  getAlerts,
} from '@/lib/supabase'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { DashboardClient } from '@/components/dashboard-client'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [metrics, volume, distribution, activity, topMerchants, alerts] = await Promise.all([
    getDashboardMetrics(),
    getTransactionVolume7Days(),
    getPaymentMethodDistribution(),
    getRecentActivity(),
    getTopMerchants(),
    getAlerts(),
  ])

  return (
    <DashboardClient
      metrics={metrics}
      volume={volume}
      distribution={distribution}
      activity={activity}
      topMerchants={topMerchants}
      alerts={alerts.filter((a: { is_resolved: boolean }) => !a.is_resolved).slice(0, 5)}
    />
  )
}
