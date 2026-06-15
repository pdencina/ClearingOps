import { getDisputes } from '@/lib/supabase'
import { DisputasClient } from '@/components/disputas-client'

export const dynamic = 'force-dynamic'

export default async function DisputasPage() {
  const disputes = await getDisputes()
  return <DisputasClient disputes={disputes} />
}
