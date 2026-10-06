import { NotificationsClient } from '@/components/notifications-client'
import { listRecipients, listNotificationLog, type DbRecipient, type DbNotificationLog } from '@/lib/notifications-db'

export const dynamic = 'force-dynamic'

async function load(): Promise<{ recipients: DbRecipient[]; log: DbNotificationLog[]; dataSource: string }> {
  try {
    const [recipients, log] = await Promise.all([listRecipients(), listNotificationLog()])
    return { recipients, log, dataSource: 'neon' }
  } catch (err: unknown) {
    return { recipients: [], log: [], dataSource: (err as Error).message }
  }
}

export default async function NotificacionesPage() {
  const { recipients, log, dataSource } = await load()
  // Hay envío real si está configurado un proveedor (Resend o SMTP) en el server.
  const sendingEnabled = Boolean(
    process.env.RESEND_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  )
  return (
    <NotificationsClient
      initialRecipients={recipients}
      initialLog={log}
      initialDataSource={dataSource}
      sendingEnabled={sendingEnabled}
    />
  )
}
