import { getFeeRules } from '@/lib/supabase'
import { ReglasClient } from '@/components/reglas-client'

export const dynamic = 'force-dynamic'

export default async function ReglasPage() {
  const rules = await getFeeRules()
  return <ReglasClient rules={rules} />
}
