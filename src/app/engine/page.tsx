import { EngineClient } from '@/components/engine-client'
import { getMerchants } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function EnginePage() {
  const merchants = await getMerchants()
  return <EngineClient merchants={merchants} />
}
