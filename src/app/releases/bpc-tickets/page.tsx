import { BpcTicketsClient } from '@/components/bpc-tickets-client'
import { listBpcTickets, type DbBpcTicket } from '@/lib/bpc-tickets-db'

export const dynamic = 'force-dynamic'

async function loadTickets(): Promise<{ tickets: DbBpcTicket[]; dataSource: string }> {
  try {
    const tickets = await listBpcTickets()
    return { tickets, dataSource: 'neon' }
  } catch (err: unknown) {
    // Neon no configurado o inalcanzable: la página igual carga, en
    // modo vacío, y el propio cliente informa el estado al usuario.
    return { tickets: [], dataSource: (err as Error).message }
  }
}

export default async function BpcTicketsPage() {
  const { tickets, dataSource } = await loadTickets()
  return <BpcTicketsClient initialTickets={tickets} initialDataSource={dataSource} />
}
