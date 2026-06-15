import { getSettlements } from '@/lib/supabase'
import { LiquidacionesClient } from '@/components/liquidaciones-client'

export const dynamic = 'force-dynamic'

export default async function LiquidacionesPage() {
  const settlements = await getSettlements()
  return <LiquidacionesClient settlements={settlements} />
}
