import { NextResponse } from 'next/server'
import {
  listRecipients,
  addRecipient,
  setRecipientActive,
  deleteRecipient,
  listNotificationLog,
} from '@/lib/notifications-db'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// GET /api/notifications            → { recipients, log, data_source }
// GET /api/notifications?only=log   → solo el registro
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const only = searchParams.get('only')
    if (only === 'log') {
      const log = await listNotificationLog()
      return NextResponse.json({ log, data_source: 'neon' })
    }
    const [recipients, log] = await Promise.all([listRecipients(), listNotificationLog()])
    return NextResponse.json({ recipients, log, data_source: 'neon' })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message, recipients: [], log: [], data_source: 'unavailable' },
      { status: 200 }
    )
  }
}

// POST /api/notifications
//   { action: 'add', email, name?, role? }
//   { action: 'set_active', id, is_active }
//   { action: 'delete', id }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const action: string = body.action

    switch (action) {
      case 'add': {
        const email = typeof body.email === 'string' ? body.email.trim() : ''
        if (!EMAIL_RE.test(email)) {
          return NextResponse.json({ error: 'Correo inválido.' }, { status: 400 })
        }
        const recipient = await addRecipient({
          email,
          name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : undefined,
          role: typeof body.role === 'string' && body.role.trim() ? body.role.trim() : undefined,
        })
        return NextResponse.json({ recipient })
      }

      case 'set_active': {
        if (!body.id || typeof body.is_active !== 'boolean') {
          return NextResponse.json({ error: 'Faltan campos: id, is_active.' }, { status: 400 })
        }
        await setRecipientActive(body.id, body.is_active)
        return NextResponse.json({ ok: true })
      }

      case 'delete': {
        if (!body.id) {
          return NextResponse.json({ error: 'Falta el campo id.' }, { status: 400 })
        }
        await deleteRecipient(body.id)
        return NextResponse.json({ ok: true })
      }

      default:
        return NextResponse.json(
          { error: `Acción no reconocida: ${action}. Use add | set_active | delete.` },
          { status: 400 }
        )
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || 'Error procesando la acción' }, { status: 500 })
  }
}
