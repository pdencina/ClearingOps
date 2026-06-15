import { getReconciliationItems } from '@/lib/supabase'
import { ConciliacionClient } from '@/components/conciliacion-client'

export const dynamic = 'force-dynamic'

export default async function ConciliacionPage() {
  const items = await getReconciliationItems()
  return <ConciliacionClient items={items} />
}
