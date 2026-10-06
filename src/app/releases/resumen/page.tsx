import { ReleaseExecutiveClient } from '@/components/release-executive-client'
import { getPipelineSnapshot } from '@/lib/watchdog-snapshot'

export const dynamic = 'force-dynamic'

export default async function ReleaseResumenPage() {
  const snapshot = await getPipelineSnapshot()
  return <ReleaseExecutiveClient initialSnapshot={snapshot} />
}
