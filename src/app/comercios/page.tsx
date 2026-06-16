import { getMerchants } from '@/lib/supabase'
import { ComerciosClient } from '@/components/comercios-client'

export const dynamic = 'force-dynamic'

export default async function ComerciosPage() {
  const merchants = await getMerchants()
  return <ComerciosClient merchants={merchants} />
}
