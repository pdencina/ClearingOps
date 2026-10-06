// ============================================================
// KLAP CORE — Notifier (envío de correos del proceso de releases)
// ============================================================
// Punto único por donde pasan todas las notificaciones. Decide el
// proveedor según variables de entorno y SIEMPRE deja registro en
// notification_log.
//
// Proveedores:
//  - 'resend' si hay RESEND_API_KEY   → envío real vía Resend HTTP API
//  - 'smtp'   si hay SMTP_HOST + creds → (preparado; requiere nodemailer)
//  - 'log'    si no hay ninguno        → MODO REGISTRO: no envía, solo
//                                        anota a quién se habría enviado.
//
// Mientras no haya proveedor configurado el sistema queda 100% usable:
// la pantalla Notificaciones muestra el registro de lo que se habría
// enviado. Activar el envío real = setear RESEND_API_KEY (o SMTP_*) en
// Vercel, sin cambios de código.
// ============================================================

import {
  listActiveRecipientEmails,
  insertNotificationLog,
  type NotificationEventType,
  type NotificationProvider,
} from '@/lib/notifications-db'

export interface NotificationInput {
  event_type: NotificationEventType
  release_id?: string | null
  release_name?: string | null
  subject: string
  body: string
}

export interface NotificationResult {
  status: 'logged' | 'sent' | 'failed' | 'skipped'
  provider: NotificationProvider
  recipients: string[]
  error?: string
}

function resolveProvider(): NotificationProvider {
  if (process.env.RESEND_API_KEY) return 'resend'
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp'
  return 'log'
}

const FROM = process.env.NOTIFICATIONS_FROM || 'ClearingOps <no-reply@clearingops.local>'

/**
 * Dispara una notificación: resuelve destinatarios activos, intenta
 * enviar según el proveedor configurado y registra el resultado.
 * Nunca lanza: si falla el envío, lo deja como 'failed' en el log y
 * devuelve el error, para no romper la operación que la originó.
 */
export async function notify(input: NotificationInput): Promise<NotificationResult> {
  const provider = resolveProvider()

  let recipients: string[] = []
  try {
    recipients = await listActiveRecipientEmails()
  } catch {
    // Si no se puede leer la lista (ej. Neon caído), no bloqueamos la
    // operación original; devolvemos skipped sin registrar.
    return { status: 'skipped', provider, recipients: [], error: 'No se pudo leer la lista de destinatarios.' }
  }

  // Sin destinatarios activos: no hay a quién avisar. Se registra como
  // 'skipped' para dejar rastro de que el evento ocurrió.
  if (recipients.length === 0) {
    await safeLog(input, provider, 'skipped', [], 'Sin destinatarios activos.')
    return { status: 'skipped', provider, recipients: [], error: 'Sin destinatarios activos.' }
  }

  // Modo registro: no hay proveedor configurado.
  if (provider === 'log') {
    await safeLog(input, provider, 'logged', recipients)
    return { status: 'logged', provider, recipients }
  }

  // Envío real.
  try {
    if (provider === 'resend') {
      await sendViaResend(recipients, input.subject, input.body)
    } else if (provider === 'smtp') {
      await sendViaSmtp(recipients, input.subject, input.body)
    }
    await safeLog(input, provider, 'sent', recipients)
    return { status: 'sent', provider, recipients }
  } catch (err: unknown) {
    const msg = (err as Error).message || 'Error enviando el correo'
    await safeLog(input, provider, 'failed', recipients, msg)
    return { status: 'failed', provider, recipients, error: msg }
  }
}

// Registra en notification_log sin lanzar nunca.
async function safeLog(
  input: NotificationInput,
  provider: NotificationProvider,
  status: 'logged' | 'sent' | 'failed' | 'skipped',
  recipients: string[],
  error?: string
) {
  try {
    await insertNotificationLog({
      event_type: input.event_type,
      release_id: input.release_id ?? null,
      release_name: input.release_name ?? null,
      subject: input.subject,
      body: input.body,
      recipients,
      provider,
      status,
      error: error ?? null,
    })
  } catch {
    // El registro es best-effort: si falla, no rompemos la operación.
  }
}

// ─── Proveedores de envío real ──────────────────────────────

async function sendViaResend(to: string[], subject: string, body: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to,
      subject,
      text: body,
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Resend respondió ${res.status}: ${detail}`)
  }
}

// Preparado para SMTP corporativo. Requiere instalar nodemailer cuando
// se decida usar esta vía (npm i nodemailer). Se deja el import dinámico
// para no agregar la dependencia hasta que haga falta.
async function sendViaSmtp(to: string[], subject: string, body: string): Promise<void> {
  type NodemailerModule = {
    createTransport: (opts: unknown) => { sendMail: (msg: unknown) => Promise<unknown> }
  }
  let nodemailer: NodemailerModule
  try {
    // nodemailer es una dependencia OPCIONAL (solo para la vía SMTP). No
    // está instalada por defecto; se resuelve en runtime. La directiva de
    // abajo evita que el build falle por el módulo ausente.
    // @ts-expect-error dependencia opcional, puede no estar instalada
    nodemailer = (await import('nodemailer')) as unknown as NodemailerModule
  } catch {
    throw new Error('SMTP configurado pero falta la dependencia nodemailer (npm i nodemailer).')
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  await transport.sendMail({ from: FROM, to: to.join(', '), subject, text: body })
}

// ─── Plantillas de mensaje por tipo de evento ───────────────

export function buildCriticalAlertMessage(releaseName: string, title: string, detail: string): { subject: string; body: string } {
  return {
    subject: `[ClearingOps] Alerta crítica — ${releaseName}: ${title}`,
    body: [
      `Se levantó una alerta CRÍTICA en el release ${releaseName}.`,
      ``,
      `Alerta: ${title}`,
      detail ? `Detalle: ${detail}` : ``,
      ``,
      `Revisa el estado del release en ClearingOps → Release Watchdog.`,
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

export function buildBlockingGateFailedMessage(releaseName: string, gateId: string, gateName: string, notes?: string): { subject: string; body: string } {
  return {
    subject: `[ClearingOps] Gate bloqueante fallido — ${releaseName}: ${gateName}`,
    body: [
      `Un control bloqueante del release ${releaseName} quedó en estado FALLIDO.`,
      ``,
      `Control: ${gateId} — ${gateName}`,
      notes ? `Nota: ${notes}` : ``,
      ``,
      `El Paso a Producción queda bloqueado hasta resolverlo.`,
      `Revisa el checklist en ClearingOps → Release Watchdog.`,
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

export function buildPapAtRiskMessage(releaseName: string, daysToPap: number, blockingPending: number): { subject: string; body: string } {
  const cuando = daysToPap > 0 ? `en ${daysToPap} día(s)` : daysToPap === 0 ? 'HOY' : `hace ${Math.abs(daysToPap)} día(s) (vencido)`
  return {
    subject: `[ClearingOps] PaP en riesgo — ${releaseName}`,
    body: [
      `El release ${releaseName} tiene su Paso a Producción ${cuando} y todavía tiene ${blockingPending} control(es) bloqueante(s) pendiente(s).`,
      ``,
      `Si no se resuelven, el PaP no puede autorizarse.`,
      `Revisa el checklist en ClearingOps → Release Watchdog.`,
    ].join('\n'),
  }
}
