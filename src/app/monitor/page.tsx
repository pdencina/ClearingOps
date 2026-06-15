import { getOperationalEvents } from '@/lib/supabase'
import { MonitorClient } from '@/components/monitor-client'

export const dynamic = 'force-dynamic'

export default async function MonitorPage() {
  const events = await getOperationalEvents()
  return <MonitorClient events={events} />
}
