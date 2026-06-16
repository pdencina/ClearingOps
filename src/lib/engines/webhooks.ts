// ============================================================
// KLAP CORE — Webhook & Notification Engine
// Sistema de notificaciones a comercios
// ============================================================

export interface WebhookEvent {
  id: string
  event_type: string
  merchant_id: string
  merchant_name: string
  payload: Record<string, unknown>
  endpoint_url: string
  status: 'pending' | 'delivered' | 'failed' | 'retrying'
  attempts: number
  max_attempts: number
  response_code?: number
  response_time_ms?: number
  created_at: string
  delivered_at?: string
  next_retry_at?: string
}

export interface WebhookConfig {
  merchant_id: string
  endpoint_url: string
  secret_key: string
  events: string[]
  is_active: boolean
}

export type EventType =
  | 'transaction.authorized'
  | 'transaction.captured'
  | 'transaction.rejected'
  | 'transaction.reversed'
  | 'settlement.created'
  | 'settlement.paid'
  | 'settlement.failed'
  | 'dispute.opened'
  | 'dispute.resolved'
  | 'clearing.batch_generated'

const EVENT_DESCRIPTIONS: Record<string, string> = {
  'transaction.authorized': 'Transacción autorizada exitosamente',
  'transaction.captured': 'Transacción capturada para liquidación',
  'transaction.rejected': 'Transacción rechazada',
  'transaction.reversed': 'Transacción reversada',
  'settlement.created': 'Liquidación generada',
  'settlement.paid': 'Liquidación pagada',
  'settlement.failed': 'Liquidación fallida',
  'dispute.opened': 'Disputa/chargeback abierto',
  'dispute.resolved': 'Disputa resuelta',
  'clearing.batch_generated': 'Batch de clearing generado',
}

/**
 * Simula el envío de un webhook a un comercio.
 * En producción esto haría un HTTP POST real con retry logic.
 */
export function sendWebhook(
  eventType: EventType,
  merchantId: string,
  merchantName: string,
  payload: Record<string, unknown>
): WebhookEvent {
  const id = `whk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`
  const endpoint = `https://api.${merchantName.toLowerCase().replace(/\s+/g, '')}.cl/klap/webhooks`

  // Simulate delivery (90% success rate)
  const isSuccess = Math.random() > 0.1
  const responseTime = Math.floor(Math.random() * 400) + 50

  return {
    id,
    event_type: eventType,
    merchant_id: merchantId,
    merchant_name: merchantName,
    payload: {
      ...payload,
      event: eventType,
      description: EVENT_DESCRIPTIONS[eventType],
      api_version: '2025-06-01',
      timestamp: new Date().toISOString(),
    },
    endpoint_url: endpoint,
    status: isSuccess ? 'delivered' : 'retrying',
    attempts: 1,
    max_attempts: 5,
    response_code: isSuccess ? 200 : 503,
    response_time_ms: responseTime,
    created_at: new Date().toISOString(),
    delivered_at: isSuccess ? new Date().toISOString() : undefined,
    next_retry_at: !isSuccess ? new Date(Date.now() + 60000).toISOString() : undefined,
  }
}

/**
 * Genera un signature HMAC para validar el webhook (simulado).
 */
export function generateSignature(payload: Record<string, unknown>, secret: string): string {
  const data = JSON.stringify(payload)
  let hash = 0
  const combined = data + secret
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `sha256=${Math.abs(hash).toString(16).padStart(64, '0')}`
}

export function getAvailableEvents(): Array<{ type: EventType; description: string }> {
  return Object.entries(EVENT_DESCRIPTIONS).map(([type, description]) => ({
    type: type as EventType,
    description,
  }))
}
