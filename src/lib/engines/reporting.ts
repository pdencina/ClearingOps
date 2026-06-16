// ============================================================
// KLAP CORE — Reporting & Analytics Engine
// Motor de reportería con generación de reportes transaccionales,
// financieros, operacionales y de compliance
// ============================================================

export interface ReportDefinition {
  id: string
  name: string
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  category: 'transactional' | 'financial' | 'operational' | 'compliance'
  format: 'pdf' | 'csv' | 'xlsx'
  last_generated: string | null
  schedule: string
}

export interface GeneratedReport {
  id: string
  report_definition_id: string
  name: string
  generated_at: string
  period: { from: string; to: string }
  data: Record<string, unknown>
  summary: string[]
}

const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: 'RPT-001',
    name: 'Transacciones Diarias',
    type: 'daily',
    category: 'transactional',
    format: 'csv',
    last_generated: '2024-01-20T06:00:00Z',
    schedule: 'Todos los días a las 06:00',
  },
  {
    id: 'RPT-002',
    name: 'Liquidación Semanal',
    type: 'weekly',
    category: 'financial',
    format: 'xlsx',
    last_generated: '2024-01-19T08:00:00Z',
    schedule: 'Lunes a las 08:00',
  },
  {
    id: 'RPT-003',
    name: 'Conciliación Mensual',
    type: 'monthly',
    category: 'financial',
    format: 'pdf',
    last_generated: '2024-01-01T07:00:00Z',
    schedule: 'Primer día del mes a las 07:00',
  },
  {
    id: 'RPT-004',
    name: 'Reporte de Fraude',
    type: 'daily',
    category: 'compliance',
    format: 'pdf',
    last_generated: '2024-01-20T09:00:00Z',
    schedule: 'Todos los días a las 09:00',
  },
  {
    id: 'RPT-005',
    name: 'Comisiones por Comercio',
    type: 'monthly',
    category: 'financial',
    format: 'xlsx',
    last_generated: '2024-01-01T10:00:00Z',
    schedule: 'Primer día del mes a las 10:00',
  },
  {
    id: 'RPT-006',
    name: 'SLA Performance',
    type: 'weekly',
    category: 'operational',
    format: 'pdf',
    last_generated: '2024-01-19T07:30:00Z',
    schedule: 'Lunes a las 07:30',
  },
  {
    id: 'RPT-007',
    name: 'Volumen por Marca',
    type: 'daily',
    category: 'transactional',
    format: 'csv',
    last_generated: '2024-01-20T06:30:00Z',
    schedule: 'Todos los días a las 06:30',
  },
  {
    id: 'RPT-008',
    name: 'Actividad de Usuarios',
    type: 'weekly',
    category: 'compliance',
    format: 'pdf',
    last_generated: null,
    schedule: 'Viernes a las 18:00',
  },
]

/**
 * Retorna todas las definiciones de reportes disponibles
 */
export function getAvailableReports(): ReportDefinition[] {
  return REPORT_DEFINITIONS
}

/**
 * Genera un reporte con datos simulados según su tipo y categoría
 */
export function generateReport(reportId: string, params?: { from?: string; to?: string }): GeneratedReport | null {
  const definition = REPORT_DEFINITIONS.find(r => r.id === reportId)
  if (!definition) return null

  const now = new Date()
  const from = params?.from || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const to = params?.to || now.toISOString().split('T')[0]

  // Update last_generated
  definition.last_generated = now.toISOString()

  const reportData = generateReportData(definition)

  return {
    id: `GEN-${Date.now()}`,
    report_definition_id: definition.id,
    name: definition.name,
    generated_at: now.toISOString(),
    period: { from, to },
    data: reportData.data,
    summary: reportData.summary,
  }
}

function generateReportData(definition: ReportDefinition): { data: Record<string, unknown>; summary: string[] } {
  switch (definition.category) {
    case 'transactional':
      return {
        data: {
          total_transactions: 12847,
          approved: 11983,
          declined: 864,
          approval_rate: 93.3,
          total_volume: 2450000000,
          avg_ticket: 190650,
          by_brand: { Visa: 7108, Mastercard: 4521, Amex: 893, Diners: 325 },
          by_type: { debit: 8193, credit: 4654 },
          peak_hour: '12:00-13:00',
          peak_transactions: 1247,
        },
        summary: [
          'Total de 12.847 transacciones procesadas en el período',
          'Tasa de aprobación: 93.3% (objetivo: 95%)',
          'Volumen total: $2.450.000.000 CLP',
          'Ticket promedio: $190.650 CLP',
          'Visa lidera con 55.3% del volumen',
          'Hora pico: 12:00-13:00 con 1.247 transacciones',
        ],
      }

    case 'financial':
      return {
        data: {
          gross_volume: 2450000000,
          total_commissions: 53900000,
          avg_rate: 2.2,
          iva_collected: 10241000,
          net_settled: 2385859000,
          merchants_settled: 145,
          pending_settlements: 12,
          by_merchant_top: [
            { name: 'Falabella', volume: 450000000, commission: 9900000 },
            { name: 'Jumbo', volume: 380000000, commission: 7600000 },
            { name: 'Copec', volume: 290000000, commission: 4350000 },
            { name: 'Farmacias Ahumada', volume: 210000000, commission: 4620000 },
            { name: 'LATAM Airlines', volume: 185000000, commission: 4440000 },
          ],
        },
        summary: [
          'Volumen bruto procesado: $2.450.000.000 CLP',
          'Comisiones totales generadas: $53.900.000 CLP',
          'Tasa promedio efectiva: 2.2%',
          'IVA retenido: $10.241.000 CLP',
          'Neto liquidado a comercios: $2.385.859.000 CLP',
          '145 comercios liquidados, 12 pendientes',
        ],
      }

    case 'operational':
      return {
        data: {
          uptime: 99.97,
          avg_response_time_ms: 145,
          p95_response_time_ms: 320,
          p99_response_time_ms: 890,
          errors_total: 23,
          error_rate: 0.03,
          sla_compliance: 99.8,
          incidents: 2,
          resolved_under_sla: 2,
          api_calls: 1284700,
        },
        summary: [
          'Uptime del período: 99.97%',
          'Tiempo de respuesta promedio: 145ms (SLA: <200ms)',
          'P95: 320ms | P99: 890ms',
          'Tasa de error: 0.03% (23 errores de 1.284.700 llamadas)',
          'Cumplimiento SLA: 99.8%',
          '2 incidentes resueltos dentro del SLA',
        ],
      }

    case 'compliance':
      return {
        data: {
          fraud_alerts: 47,
          confirmed_fraud: 8,
          fraud_rate: 0.062,
          blocked_amount: 12500000,
          suspicious_merchants: 3,
          kyc_reviews_pending: 5,
          audit_events: 1247,
          high_risk_actions: 15,
          pci_compliance: 'compliant',
          last_scan: '2024-01-19',
        },
        summary: [
          '47 alertas de fraude generadas, 8 confirmadas',
          'Tasa de fraude: 0.062% (bajo umbral de 0.1%)',
          'Monto bloqueado por fraude: $12.500.000 CLP',
          '3 comercios bajo monitoreo especial',
          '5 revisiones KYC pendientes',
          'Estado PCI DSS: Compliant (último scan: 19/01/2024)',
        ],
      }

    default:
      return { data: {}, summary: ['Reporte generado exitosamente'] }
  }
}
