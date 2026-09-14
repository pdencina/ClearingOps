import { ReleaseWatchdogClient } from '@/components/release-watchdog-client'
import { getWatchdogSnapshot } from '@/lib/watchdog-snapshot'

export const dynamic = 'force-dynamic'

export default async function ReleaseWatchdogPage() {
  const snapshot = await getWatchdogSnapshot()
  return <ReleaseWatchdogClient initialSummary={snapshot} />
}
