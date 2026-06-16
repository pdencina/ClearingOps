// ============================================================
// KLAP CORE — Audit Trail Engine
// Motor de auditoría que registra todas las acciones del sistema
// ============================================================

export interface AuditEntry {
  id: string
  timestamp: string
  user: string
  action: string
  resource_type: string
  resource_id: string
  changes: { field: string; old_value: string; new_value: string }[]
  ip_address: string
  user_agent: string
  risk_level: 'low' | 'medium' | 'high'
}

export interface AuditFilters {
  user?: string
  action?: string
  resource_type?: string
  risk_level?: 'low' | 'medium' | 'high'
  from?: string
  to?: string
}

export interface AuditSummary {
  events_today: number
  high_risk_actions: number
  unique_users: number
  most_active_user: string
  last_high_risk_event: string | null
}

// Pre-populated audit entries with realistic data
const auditLog: AuditEntry[] = [
  {
    id: 'AUD-001',
    timestamp: '2024-01-20T14:32:00Z',
    user: 'pablo.encina@klap.cl',
    action: 'fee_update',
    resource_type: 'fee_rule',
    resource_id: 'FEE-VISA-CREDIT',
    changes: [{ field: 'percentage', old_value: '2.20', new_value: '2.35' }],
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 Chrome/120',
    risk_level: 'high',
  },
  {
    id: 'AUD-002',
    timestamp: '2024-01-20T14:15:00Z',
    user: 'maria.gonzalez@klap.cl',
    action: 'login',
    resource_type: 'session',
    resource_id: 'SES-MGZ-001',
    changes: [],
    ip_address: '192.168.1.105',
    user_agent: 'Mozilla/5.0 Chrome/120',
    risk_level: 'low',
  },
  {
    id: 'AUD-003',
    timestamp: '2024-01-20T13:45:00Z',
    user: 'carlos.munoz@klap.cl',
    action: 'settlement_approve',
    resource_type: 'settlement',
    resource_id: 'STL-20240120-001',
    changes: [{ field: 'status', old_value: 'pending', new_value: 'approved' }],
    ip_address: '192.168.1.110',
    user_agent: 'Mozilla/5.0 Firefox/121',
    risk_level: 'high',
  },
  {
    id: 'AUD-004',
    timestamp: '2024-01-20T13:30:00Z',
    user: 'andrea.soto@klap.cl',
    action: 'merchant_create',
    resource_type: 'merchant',
    resource_id: 'MERCH-NEW-001',
    changes: [{ field: 'status', old_value: '', new_value: 'pending_docs' }],
    ip_address: '192.168.1.115',
    user_agent: 'Mozilla/5.0 Chrome/120',
    risk_level: 'medium',
  },
  {
    id: 'AUD-005',
    timestamp: '2024-01-20T12:50:00Z',
    user: 'pablo.encina@klap.cl',
    action: 'rule_modify',
    resource_type: 'fraud_rule',
    resource_id: 'RULE-VELOCITY-001',
    changes: [{ field: 'max_transactions', old_value: '5', new_value: '10' }, { field: 'time_window', old_value: '60', new_value: '30' }],
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 Chrome/120',
    risk_level: 'high',
  },
  {
    id: 'AUD-006',
    timestamp: '2024-01-20T12:20:00Z',
    user: 'maria.gonzalez@klap.cl',
    action: 'dispute_advance',
    resource_type: 'dispute',
    resource_id: 'DSP-002',
    changes: [{ field: 'stage', old_value: 'evidence_collection', new_value: 'representment' }],
    ip_address: '192.168.1.105',
    user_agent: 'Mozilla/5.0 Chrome/120',
    risk_level: 'medium',
  },
  {
    id: 'AUD-007',
    timestamp: '2024-01-20T11:45:00Z',
    user: 'roberto.diaz@klap.cl',
    action: 'terminal_assign',
    resource_type: 'terminal',
    resource_id: 'TERM-1234',
    changes: [{ field: 'merchant_id', old_value: '', new_value: 'MERCH-005' }],
    ip_address: '192.168.1.120',
    user_agent: 'Mozilla/5.0 Safari/17',
    risk_level: 'low',
  },
  {
    id: 'AUD-008',
    timestamp: '2024-01-20T11:15:00Z',
    user: 'carlos.munoz@klap.cl',
    action: 'report_generate',
    resource_type: 'report',
    resource_id: 'RPT-003',
    changes: [],
    ip_address: '192.168.1.110',
    user_agent: 'Mozilla/5.0 Firefox/121',
    risk_level: 'low',
  },
  {
    id: 'AUD-009',
    timestamp: '2024-01-20T10:30:00Z',
    user: 'pablo.encina@klap.cl',
    action: 'user_role_change',
    resource_type: 'user',
    resource_id: 'USR-ASOTO',
    changes: [{ field: 'role', old_value: 'analyst', new_value: 'senior_analyst' }],
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 Chrome/120',
    risk_level: 'high',
  },
  {
    id: 'AUD-010',
    timestamp: '2024-01-20T10:00:00Z',
    user: 'andrea.soto@klap.cl',
    action: 'login',
    resource_type: 'session',
    resource_id: 'SES-ASO-001',
    changes: [],
    ip_address: '192.168.1.115',
    user_agent: 'Mozilla/5.0 Chrome/120',
    risk_level: 'low',
  },
  {
    id: 'AUD-011',
    timestamp: '2024-01-20T09:45:00Z',
    user: 'roberto.diaz@klap.cl',
    action: 'onboarding_advance',
    resource_type: 'onboarding',
    resource_id: 'ONB-004',
    changes: [{ field: 'current_step', old_value: '1', new_value: '2' }],
    ip_address: '192.168.1.120',
    user_agent: 'Mozilla/5.0 Safari/17',
    risk_level: 'low',
  },
  {
    id: 'AUD-012',
    timestamp: '2024-01-20T09:30:00Z',
    user: 'maria.gonzalez@klap.cl',
    action: 'merchant_update',
    resource_type: 'merchant',
    resource_id: 'MERCH-003',
    changes: [{ field: 'mcc', old_value: '5411', new_value: '5412' }],
    ip_address: '192.168.1.105',
    user_agent: 'Mozilla/5.0 Chrome/120',
    risk_level: 'medium',
  },
  {
    id: 'AUD-013',
    timestamp: '2024-01-20T09:00:00Z',
    user: 'pablo.encina@klap.cl',
    action: 'login',
    resource_type: 'session',
    resource_id: 'SES-PEN-001',
    changes: [],
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 Chrome/120',
    risk_level: 'low',
  },
  {
    id: 'AUD-014',
    timestamp: '2024-01-19T18:00:00Z',
    user: 'carlos.munoz@klap.cl',
    action: 'settlement_reject',
    resource_type: 'settlement',
    resource_id: 'STL-20240119-005',
    changes: [{ field: 'status', old_value: 'pending', new_value: 'rejected' }, { field: 'reason', old_value: '', new_value: 'Discrepancia en montos' }],
    ip_address: '192.168.1.110',
    user_agent: 'Mozilla/5.0 Firefox/121',
    risk_level: 'high',
  },
  {
    id: 'AUD-015',
    timestamp: '2024-01-19T17:30:00Z',
    user: 'andrea.soto@klap.cl',
    action: 'kyc_approve',
    resource_type: 'onboarding',
    resource_id: 'ONB-002',
    changes: [{ field: 'kyc_status', old_value: 'pending', new_value: 'approved' }],
    ip_address: '192.168.1.115',
    user_agent: 'Mozilla/5.0 Chrome/120',
    risk_level: 'medium',
  },
  {
    id: 'AUD-016',
    timestamp: '2024-01-19T16:45:00Z',
    user: 'pablo.encina@klap.cl',
    action: 'api_key_rotate',
    resource_type: 'api_key',
    resource_id: 'KEY-PROD-001',
    changes: [{ field: 'key_hash', old_value: '***a3f2', new_value: '***b7c9' }],
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 Chrome/120',
    risk_level: 'high',
  },
  {
    id: 'AUD-017',
    timestamp: '2024-01-19T16:00:00Z',
    user: 'roberto.diaz@klap.cl',
    action: 'login',
    resource_type: 'session',
    resource_id: 'SES-RDZ-001',
    changes: [],
    ip_address: '192.168.1.120',
    user_agent: 'Mozilla/5.0 Safari/17',
    risk_level: 'low',
  },
  {
    id: 'AUD-018',
    timestamp: '2024-01-19T15:00:00Z',
    user: 'maria.gonzalez@klap.cl',
    action: 'batch_refund',
    resource_type: 'refund_batch',
    resource_id: 'BATCH-REF-001',
    changes: [{ field: 'count', old_value: '0', new_value: '12' }, { field: 'total_amount', old_value: '0', new_value: '3450000' }],
    ip_address: '192.168.1.105',
    user_agent: 'Mozilla/5.0 Chrome/120',
    risk_level: 'high',
  },
  {
    id: 'AUD-019',
    timestamp: '2024-01-19T14:00:00Z',
    user: 'carlos.munoz@klap.cl',
    action: 'login',
    resource_type: 'session',
    resource_id: 'SES-CMZ-001',
    changes: [],
    ip_address: '192.168.1.110',
    user_agent: 'Mozilla/5.0 Firefox/121',
    risk_level: 'low',
  },
  {
    id: 'AUD-020',
    timestamp: '2024-01-19T13:30:00Z',
    user: 'pablo.encina@klap.cl',
    action: 'webhook_config',
    resource_type: 'webhook',
    resource_id: 'WH-MERCH-003',
    changes: [{ field: 'url', old_value: 'https://old.api.cl/hook', new_value: 'https://new.api.cl/hook' }],
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 Chrome/120',
    risk_level: 'medium',
  },
  {
    id: 'AUD-021',
    timestamp: '2024-01-19T12:00:00Z',
    user: 'andrea.soto@klap.cl',
    action: 'fraud_rule_disable',
    resource_type: 'fraud_rule',
    resource_id: 'RULE-GEO-002',
    changes: [{ field: 'enabled', old_value: 'true', new_value: 'false' }],
    ip_address: '192.168.1.115',
    user_agent: 'Mozilla/5.0 Chrome/120',
    risk_level: 'high',
  },
  {
    id: 'AUD-022',
    timestamp: '2024-01-19T11:00:00Z',
    user: 'roberto.diaz@klap.cl',
    action: 'terminal_deactivate',
    resource_type: 'terminal',
    resource_id: 'TERM-0987',
    changes: [{ field: 'status', old_value: 'active', new_value: 'inactive' }],
    ip_address: '192.168.1.120',
    user_agent: 'Mozilla/5.0 Safari/17',
    risk_level: 'medium',
  },
  {
    id: 'AUD-023',
    timestamp: '2024-01-19T10:00:00Z',
    user: 'maria.gonzalez@klap.cl',
    action: 'clearing_generate',
    resource_type: 'clearing_file',
    resource_id: 'CLR-20240119-001',
    changes: [{ field: 'status', old_value: '', new_value: 'generated' }],
    ip_address: '192.168.1.105',
    user_agent: 'Mozilla/5.0 Chrome/120',
    risk_level: 'low',
  },
]

/**
 * Registra un nuevo evento de auditoría
 */
export function logAuditEvent(event: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
  const entry: AuditEntry = {
    ...event,
    id: `AUD-${String(auditLog.length + 1).padStart(3, '0')}`,
    timestamp: new Date().toISOString(),
  }
  auditLog.unshift(entry)
  return entry
}

/**
 * Retorna el trail de auditoría filtrado
 */
export function getAuditTrail(filters?: AuditFilters): AuditEntry[] {
  let entries = [...auditLog]

  if (filters?.user) {
    entries = entries.filter(e => e.user.includes(filters.user!))
  }
  if (filters?.action) {
    entries = entries.filter(e => e.action === filters.action)
  }
  if (filters?.resource_type) {
    entries = entries.filter(e => e.resource_type === filters.resource_type)
  }
  if (filters?.risk_level) {
    entries = entries.filter(e => e.risk_level === filters.risk_level)
  }
  if (filters?.from) {
    entries = entries.filter(e => e.timestamp >= filters.from!)
  }
  if (filters?.to) {
    entries = entries.filter(e => e.timestamp <= filters.to!)
  }

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

/**
 * Retorna un resumen del audit trail
 */
export function getAuditSummary(): AuditSummary {
  const today = new Date().toISOString().split('T')[0]
  const todayEvents = auditLog.filter(e => e.timestamp.startsWith(today))
  const highRisk = auditLog.filter(e => e.risk_level === 'high')
  const users = [...new Set(auditLog.map(e => e.user))]

  // Most active user
  const userCounts = auditLog.reduce((acc, e) => {
    acc[e.user] = (acc[e.user] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const mostActive = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0]

  return {
    events_today: todayEvents.length,
    high_risk_actions: highRisk.length,
    unique_users: users.length,
    most_active_user: mostActive?.[0] || 'N/A',
    last_high_risk_event: highRisk[0]?.timestamp || null,
  }
}
