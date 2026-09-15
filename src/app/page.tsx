import { redirect } from 'next/navigation'

// El sistema está focalizado en el control de releases de BPC.
// El Dashboard original (con métricas de transacciones/liquidación,
// que depende de Supabase) sigue disponible en /dashboard.
export default function RootPage() {
  redirect('/releases')
}
