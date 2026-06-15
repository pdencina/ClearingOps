import { getTransactions, getMerchants } from '@/lib/supabase'
import { TransaccionesClient } from '@/components/transacciones-client'

export const dynamic = 'force-dynamic'

export default async function TransaccionesPage() {
  const [transactions, merchants] = await Promise.all([
    getTransactions({ limit: 100 }),
    getMerchants(),
  ])

  return <TransaccionesClient transactions={transactions} merchants={merchants} />
}
