import { getClearingBatches } from '@/lib/supabase'
import { ClearingClient } from '@/components/clearing-client'

export const dynamic = 'force-dynamic'

export default async function ClearingPage() {
  const batches = await getClearingBatches()
  return <ClearingClient batches={batches} />
}
