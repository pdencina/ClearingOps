// ============================================================
// KLAP CORE — Dispute Management Workflow Engine
// Motor de gestión de disputas y chargebacks con ciclo de vida completo
// ============================================================

export interface DisputeWorkflow {
  id: string
  transaction_id: string
  merchant_id: string
  amount: number
  reason_code: string
  reason_description: string
  card_brand: string
  current_stage: DisputeStage
  stages_completed: StageRecord[]
  deadline: string
  days_remaining: number
  liability: 'merchant' | 'issuer' | 'undetermined'
  recommended_action: string
}

export type DisputeStage = 'received' | 'analysis' | 'evidence_collection' | 'representment' | 'pre_arbitration' | 'arbitration' | 'resolved'

export interface StageRecord {
  stage: DisputeStage
  entered_at: string
  completed_at: string | null
  notes: string
  action_taken: string
}

export interface ReasonCode {
  code: string
  description: string
  category: string
  card_brand: string
  time_limit_days: number
  win_rate_base: number
}

const REASON_CODES: ReasonCode[] = [
  { code: '10.1', description: 'EMV Liability Shift Counterfeit', category: 'Fraud', card_brand: 'Visa', time_limit_days: 120, win_rate_base: 0.35 },
  { code: '10.4', description: 'Card Absent Environment', category: 'Fraud', card_brand: 'Visa', time_limit_days: 120, win_rate_base: 0.40 },
  { code: '12.6', description: 'Duplicate Processing', category: 'Processing Error', card_brand: 'Visa', time_limit_days: 120, win_rate_base: 0.65 },
  { code: '13.1', description: 'Merchandise/Services Not Received', category: 'Consumer Dispute', card_brand: 'Visa', time_limit_days: 120, win_rate_base: 0.50 },
  { code: '13.3', description: 'Not as Described', category: 'Consumer Dispute', card_brand: 'Visa', time_limit_days: 120, win_rate_base: 0.45 },
  { code: '13.6', description: 'Credit Not Processed', category: 'Consumer Dispute', card_brand: 'Visa', time_limit_days: 120, win_rate_base: 0.55 },
  { code: '13.7', description: 'Cancelled Merchandise/Services', category: 'Consumer Dispute', card_brand: 'Visa', time_limit_days: 120, win_rate_base: 0.48 },
  { code: '4834', description: 'Point-of-Interaction Error', category: 'Processing Error', card_brand: 'Mastercard', time_limit_days: 90, win_rate_base: 0.60 },
  { code: '4853', description: 'Cardholder Dispute', category: 'Consumer Dispute', card_brand: 'Mastercard', time_limit_days: 90, win_rate_base: 0.42 },
  { code: '4863', description: 'Cardholder Does Not Recognize', category: 'Fraud', card_brand: 'Mastercard', time_limit_days: 90, win_rate_base: 0.38 },
  { code: '4837', description: 'No Cardholder Authorization', category: 'Fraud', card_brand: 'Mastercard', time_limit_days: 45, win_rate_base: 0.30 },
]

const STAGE_ORDER: DisputeStage[] = ['received', 'analysis', 'evidence_collection', 'representment', 'pre_arbitration', 'arbitration', 'resolved']

// Simulated dispute workflows
const disputes: DisputeWorkflow[] = [
  {
    id: 'DSP-001',
    transaction_id: 'TXN-20240115-001',
    merchant_id: 'MERCH-001',
    amount: 185000,
    reason_code: '13.1',
    reason_description: 'Merchandise/Services Not Received',
    card_brand: 'Visa',
    current_stage: 'evidence_collection',
    stages_completed: [
      { stage: 'received', entered_at: '2024-01-15T10:30:00Z', completed_at: '2024-01-15T11:00:00Z', notes: 'Disputa recibida de Visa', action_taken: 'Registro automático' },
      { stage: 'analysis', entered_at: '2024-01-15T11:00:00Z', completed_at: '2024-01-16T09:00:00Z', notes: 'Transacción verificada en sistema', action_taken: 'Análisis de documentación' },
      { stage: 'evidence_collection', entered_at: '2024-01-16T09:00:00Z', completed_at: null, notes: 'Solicitando comprobante de despacho al comercio', action_taken: 'Recopilación de evidencia' },
    ],
    deadline: '2024-05-15',
    days_remaining: 45,
    liability: 'undetermined',
    recommended_action: 'Solicitar tracking de envío y comprobante de entrega',
  },
  {
    id: 'DSP-002',
    transaction_id: 'TXN-20240112-089',
    merchant_id: 'MERCH-003',
    amount: 52000,
    reason_code: '12.6',
    reason_description: 'Duplicate Processing',
    card_brand: 'Visa',
    current_stage: 'representment',
    stages_completed: [
      { stage: 'received', entered_at: '2024-01-12T14:00:00Z', completed_at: '2024-01-12T14:30:00Z', notes: 'Cargo duplicado reportado', action_taken: 'Registro automático' },
      { stage: 'analysis', entered_at: '2024-01-12T14:30:00Z', completed_at: '2024-01-13T10:00:00Z', notes: 'Confirmado: 2 cargos al mismo monto', action_taken: 'Validación en clearing' },
      { stage: 'evidence_collection', entered_at: '2024-01-13T10:00:00Z', completed_at: '2024-01-14T16:00:00Z', notes: 'Extracto y logs recopilados', action_taken: 'Documentación completa' },
      { stage: 'representment', entered_at: '2024-01-14T16:00:00Z', completed_at: null, notes: 'Presentando caso a Visa', action_taken: 'Representment enviado' },
    ],
    deadline: '2024-05-12',
    days_remaining: 38,
    liability: 'merchant',
    recommended_action: 'Aceptar disputa y procesar reembolso',
  },
  {
    id: 'DSP-003',
    transaction_id: 'TXN-20240110-045',
    merchant_id: 'MERCH-005',
    amount: 320000,
    reason_code: '10.4',
    reason_description: 'Card Absent Environment',
    card_brand: 'Visa',
    current_stage: 'analysis',
    stages_completed: [
      { stage: 'received', entered_at: '2024-01-20T08:15:00Z', completed_at: '2024-01-20T08:45:00Z', notes: 'Fraude reportado en compra online', action_taken: 'Registro automático' },
      { stage: 'analysis', entered_at: '2024-01-20T08:45:00Z', completed_at: null, notes: 'Verificando autenticación 3DS', action_taken: 'Revisión de logs de autenticación' },
    ],
    deadline: '2024-05-20',
    days_remaining: 62,
    liability: 'undetermined',
    recommended_action: 'Verificar si se aplicó 3D Secure en la transacción',
  },
  {
    id: 'DSP-004',
    transaction_id: 'TXN-20240108-112',
    merchant_id: 'MERCH-002',
    amount: 89500,
    reason_code: '4853',
    reason_description: 'Cardholder Dispute',
    card_brand: 'Mastercard',
    current_stage: 'pre_arbitration',
    stages_completed: [
      { stage: 'received', entered_at: '2024-01-08T11:00:00Z', completed_at: '2024-01-08T11:30:00Z', notes: 'Disputa MC recibida', action_taken: 'Registro automático' },
      { stage: 'analysis', entered_at: '2024-01-08T11:30:00Z', completed_at: '2024-01-09T15:00:00Z', notes: 'Cliente alega no haber recibido servicio', action_taken: 'Análisis inicial' },
      { stage: 'evidence_collection', entered_at: '2024-01-09T15:00:00Z', completed_at: '2024-01-11T10:00:00Z', notes: 'Evidencia de servicio prestado recopilada', action_taken: 'Fotos y emails adjuntados' },
      { stage: 'representment', entered_at: '2024-01-11T10:00:00Z', completed_at: '2024-01-18T14:00:00Z', notes: 'Representment rechazado por emisor', action_taken: 'Caso rechazado en primera instancia' },
      { stage: 'pre_arbitration', entered_at: '2024-01-18T14:00:00Z', completed_at: null, notes: 'Escalando a pre-arbitraje', action_taken: 'Documentación adicional solicitada' },
    ],
    deadline: '2024-04-08',
    days_remaining: 22,
    liability: 'undetermined',
    recommended_action: 'Evaluar costo de arbitraje vs aceptar pérdida',
  },
  {
    id: 'DSP-005',
    transaction_id: 'TXN-20240105-078',
    merchant_id: 'MERCH-004',
    amount: 45000,
    reason_code: '13.6',
    reason_description: 'Credit Not Processed',
    card_brand: 'Visa',
    current_stage: 'resolved',
    stages_completed: [
      { stage: 'received', entered_at: '2024-01-05T09:00:00Z', completed_at: '2024-01-05T09:30:00Z', notes: 'Reembolso no procesado', action_taken: 'Registro automático' },
      { stage: 'analysis', entered_at: '2024-01-05T09:30:00Z', completed_at: '2024-01-06T11:00:00Z', notes: 'Verificado: reversa pendiente en sistema', action_taken: 'Confirmación de reversa faltante' },
      { stage: 'evidence_collection', entered_at: '2024-01-06T11:00:00Z', completed_at: '2024-01-06T14:00:00Z', notes: 'Log de reversa encontrado sin procesar', action_taken: 'Evidencia recopilada' },
      { stage: 'representment', entered_at: '2024-01-06T14:00:00Z', completed_at: '2024-01-06T15:00:00Z', notes: 'Se acepta disputa, reembolso emitido', action_taken: 'Aceptación de disputa' },
      { stage: 'resolved', entered_at: '2024-01-06T15:00:00Z', completed_at: '2024-01-06T15:00:00Z', notes: 'Reembolso procesado exitosamente', action_taken: 'Caso cerrado - a favor del tarjetahabiente' },
    ],
    deadline: '2024-05-05',
    days_remaining: 0,
    liability: 'merchant',
    recommended_action: 'Caso resuelto',
  },
]

/**
 * Obtiene el workflow completo de una disputa
 */
export function getDisputeWorkflow(disputeId: string): DisputeWorkflow | null {
  return disputes.find(d => d.id === disputeId) || null
}

/**
 * Retorna todas las disputas activas
 */
export function getAllDisputeWorkflows(): DisputeWorkflow[] {
  return disputes
}

/**
 * Avanza la disputa a la siguiente etapa
 */
export function advanceStage(disputeId: string, action: string, notes: string): DisputeWorkflow | null {
  const dispute = disputes.find(d => d.id === disputeId)
  if (!dispute) return null

  const currentIndex = STAGE_ORDER.indexOf(dispute.current_stage)
  if (currentIndex >= STAGE_ORDER.length - 1) return dispute // Already at final stage

  // Complete current stage
  const currentStageRecord = dispute.stages_completed.find(s => s.stage === dispute.current_stage && !s.completed_at)
  if (currentStageRecord) {
    currentStageRecord.completed_at = new Date().toISOString()
    currentStageRecord.action_taken = action
    currentStageRecord.notes = notes
  }

  // Move to next stage
  const nextStage = STAGE_ORDER[currentIndex + 1]
  dispute.current_stage = nextStage
  dispute.stages_completed.push({
    stage: nextStage,
    entered_at: new Date().toISOString(),
    completed_at: null,
    notes: '',
    action_taken: '',
  })

  return dispute
}

/**
 * Retorna todos los códigos de razón Visa/MC
 */
export function getReasonCodes(): ReasonCode[] {
  return REASON_CODES
}

/**
 * Calcula la probabilidad de ganar la disputa basado en evidencia y razón
 */
export function calculateWinProbability(dispute: DisputeWorkflow): number {
  const reasonCode = REASON_CODES.find(rc => rc.code === dispute.reason_code)
  if (!reasonCode) return 0.3

  let probability = reasonCode.win_rate_base

  // Bonus por evidencia recopilada
  const evidenceStage = dispute.stages_completed.find(s => s.stage === 'evidence_collection')
  if (evidenceStage?.completed_at) {
    probability += 0.15
  }

  // Penalización por tiempo cercano al deadline
  if (dispute.days_remaining < 15) {
    probability -= 0.10
  } else if (dispute.days_remaining < 30) {
    probability -= 0.05
  }

  // Bonus si ya pasó representment exitosamente
  const representmentStage = dispute.stages_completed.find(s => s.stage === 'representment')
  if (representmentStage?.completed_at) {
    probability += 0.10
  }

  // Ajuste por monto (montos altos son más disputados)
  if (dispute.amount > 200000) {
    probability -= 0.05
  }

  return Math.max(0.05, Math.min(0.95, probability))
}
