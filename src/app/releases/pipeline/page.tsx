import { ReleasePipelineClient } from '@/components/release-pipeline-client'
import { getPipelineSnapshot } from '@/lib/watchdog-snapshot'

export const dynamic = 'force-dynamic'

export default async function ReleasePipelinePage() {
  const snapshot = await getPipelineSnapshot()
  return <ReleasePipelineClient initialSnapshot={snapshot} />
}
