import { ReleaseWatchdogClient } from '@/components/release-watchdog-client'
import { getWatchdogSnapshot } from '@/lib/watchdog-snapshot'

export const dynamic = 'force-dynamic'

interface PageProps {
  // Next.js 16: searchParams se entrega como Promise.
  searchParams: Promise<{ release?: string }>
}

export default async function ReleaseWatchdogPage({ searchParams }: PageProps) {
  const { release } = await searchParams
  const snapshot = await getWatchdogSnapshot(release)
  return <ReleaseWatchdogClient initialSummary={snapshot} />
}
