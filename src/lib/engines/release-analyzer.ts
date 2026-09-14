// ============================================================
// KLAP CORE — Release Analyzer Engine
// Motor de análisis de Release Notes de BPC / SmartVista.
// Clasifica cada ticket por riesgo operacional y define la
// acción que el proceso de release debe tomar antes del PaP.
//
// Objetivo: anticipar el tipo de incidente ocurrido en el
// último release (cambio no comunicado + tag de reporte roto)
// detectando automáticamente los tickets que tocan clearing,
// la interfaz con KLAP, la liquidación y los reportes.
// ============================================================

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

export type ReleaseAction =
  | 'block_until_dual_signoff' // Requiere OK de KLAP y BPC/CLAP antes del PaP
  | 'sanity_check_required'    // Requiere set de transacciones de verificación post-cambio
  | 'functional_validation'    // Validación funcional del PO
  | 'monitor'                  // Solo monitoreo post-PaP
  | 'informational'            // Transparente para KLAP

export interface ReleaseTicketInput {
  id: string
  title: string
  module?: string
  type?: string          // Enhancement | Bug fix
  summary?: string
  complexity?: string    // High | Average
  is_klap_section?: boolean
}

export interface RiskFactor {
  label: string
  weight: number
  matched: string
}

export interface AnalyzedTicket {
  id: string
  title: string
  module: string
  risk: RiskLevel
  score: number
  actions: ReleaseAction[]
  factors: RiskFactor[]
  requires_klap_action: boolean
  touches_clearing: boolean
  touches_reports: boolean
  detail: string
}

export interface ReleaseAnalysis {
  release_name: string
  analyzed_at: string
  total_tickets: number
  by_risk: Record<RiskLevel, number>
  requires_dual_signoff: number
  requires_sanity_check: number
  priority_tickets: AnalyzedTicket[] // critical + high, ordenados por score
  tickets: AnalyzedTicket[]
  summary: string[]
}

// ============================================================
// Diccionario de factores de riesgo (keyword scoring)
// Cada grupo suma peso al score del ticket. Los pesos altos
// disparan bloqueo de PaP y/o sanity check obligatorio.
// ============================================================

interface RiskRule {
  label: string
  weight: number
  patterns: RegExp[]
  flags?: Array<'clearing' | 'reports' | 'klap_action'>
  actions?: ReleaseAction[]
}

const RISK_RULES: RiskRule[] = [
  {
    label: 'Toca clearing / archivos de clearing',
    weight: 40,
    patterns: [/clearing/i, /\bCTF\b/i, /\bIPM\b/i, /BaseII/i, /base ii/i, /\bSVXP\b/i, /outgoing.*message/i],
    flags: ['clearing'],
    actions: ['block_until_dual_signoff', 'sanity_check_required'],
  },
  {
    label: 'Impacta liquidación / settlement',
    weight: 35,
    patterns: [/settlement/i, /liquidaci/i, /net settlement/i, /payf/i, /payfac/i],
    flags: ['clearing'],
    actions: ['sanity_check_required'],
  },
  {
    label: 'Interfaz o dependencia con KLAP',
    weight: 30,
    patterns: [/\bklap\b/i, /svxp/i, /temenos/i, /powercard/i, /\bGIM\b/i, /clearingoperation/i, /clearing web service/i],
    flags: ['klap_action'],
    actions: ['block_until_dual_signoff'],
  },
  {
    label: 'Modifica reportes o tags de reporte',
    weight: 25,
    patterns: [/report/i, /reporte/i, /\btag\b/i, /trans[_ ]?desc/i, /field.*report/i, /report.*field/i],
    flags: ['reports'],
    actions: ['sanity_check_required'],
  },
  {
    label: 'Cambio mandatorio de marca (Visa/Mastercard)',
    weight: 20,
    patterns: [/mandatory change/i, /non-compliance/i, /\bIRD\b/i, /\bDE\d{2}/i, /fee updates/i, /brand fee/i, /card brand fee/i],
    flags: ['reports'],
    actions: ['sanity_check_required'],
  },
  {
    label: 'Cambio de core / migración / versión',
    weight: 18,
    patterns: [/migrat/i, /core/i, /svfe/i, /svbo/i, /new .*version/i, /merge.*custom code/i, /patch/i, /XSD change/i],
    actions: ['functional_validation'],
  },
  {
    label: 'Transacciones ausentes / no procesadas',
    weight: 45,
    patterns: [/not available in the clearing/i, /transaction loss/i, /not processed/i, /no transactions/i, /has not finished/i, /keeps failing/i, /has failed/i],
    flags: ['clearing'],
    actions: ['block_until_dual_signoff', 'sanity_check_required'],
  },
  {
    label: 'Cuotas / installments (formato de montos)',
    weight: 22,
    patterns: [/installment/i, /cuota/i, /monto total/i, /amplified by/i],
    flags: ['reports'],
    actions: ['sanity_check_required'],
  },
]

// Complejidad declarada por BPC como multiplicador de confianza
const COMPLEXITY_BONUS: Record<string, number> = {
  high: 10,
  average: 4,
}

// Umbrales de score → nivel de riesgo
const THRESHOLDS: Array<{ min: number; level: RiskLevel }> = [
  { min: 60, level: 'critical' },
  { min: 35, level: 'high' },
  { min: 15, level: 'medium' },
  { min: 0, level: 'low' },
]

function scoreToRisk(score: number): RiskLevel {
  for (const t of THRESHOLDS) {
    if (score >= t.min) return t.level
  }
  return 'low'
}

// ============================================================
// Core: analiza un ticket individual
// ============================================================

export function analyzeTicket(ticket: ReleaseTicketInput): AnalyzedTicket {
  const haystack = [ticket.title, ticket.module, ticket.summary, ticket.type]
    .filter(Boolean)
    .join(' \u00b7 ')

  const factors: RiskFactor[] = []
  const actionsSet = new Set<ReleaseAction>()
  let score = 0
  let touchesClearing = false
  let touchesReports = false
  let requiresKlapAction = false

  for (const rule of RISK_RULES) {
    const hit = rule.patterns.find(p => p.test(haystack))
    if (!hit) continue

    score += rule.weight
    factors.push({ label: rule.label, weight: rule.weight, matched: matchText(hit, haystack) })

    for (const a of rule.actions ?? []) actionsSet.add(a)
    for (const f of rule.flags ?? []) {
      if (f === 'clearing') touchesClearing = true
      if (f === 'reports') touchesReports = true
      if (f === 'klap_action') requiresKlapAction = true
    }
  }

  // Los tickets de la sección Klap del release siempre requieren doble firma
  if (ticket.is_klap_section) {
    score += 25
    requiresKlapAction = true
    actionsSet.add('block_until_dual_signoff')
    factors.push({ label: 'Listado en sección Klap del Release Note', weight: 25, matched: 'Klap' })
  }

  // Bonus por complejidad declarada
  const complexityKey = (ticket.complexity ?? '').toLowerCase()
  if (COMPLEXITY_BONUS[complexityKey]) {
    score += COMPLEXITY_BONUS[complexityKey]
    factors.push({
      label: `Complejidad declarada: ${ticket.complexity}`,
      weight: COMPLEXITY_BONUS[complexityKey],
      matched: ticket.complexity ?? '',
    })
  }

  const risk = scoreToRisk(score)

  // Si no matcheó nada relevante, es transparente para KLAP
  if (actionsSet.size === 0) {
    actionsSet.add(risk === 'low' ? 'informational' : 'monitor')
  }

  return {
    id: ticket.id,
    title: ticket.title,
    module: ticket.module ?? '—',
    risk,
    score,
    actions: orderActions([...actionsSet]),
    factors,
    requires_klap_action: requiresKlapAction,
    touches_clearing: touchesClearing,
    touches_reports: touchesReports,
    detail: buildDetail(risk, touchesClearing, touchesReports, requiresKlapAction),
  }
}

// ============================================================
// Core: analiza un release completo
// ============================================================

export function analyzeRelease(
  releaseName: string,
  tickets: ReleaseTicketInput[]
): ReleaseAnalysis {
  const analyzed = tickets.map(analyzeTicket)

  const byRisk: Record<RiskLevel, number> = { critical: 0, high: 0, medium: 0, low: 0 }
  let dualSignoff = 0
  let sanityCheck = 0

  for (const t of analyzed) {
    byRisk[t.risk]++
    if (t.actions.includes('block_until_dual_signoff')) dualSignoff++
    if (t.actions.includes('sanity_check_required')) sanityCheck++
  }

  const priority = analyzed
    .filter(t => t.risk === 'critical' || t.risk === 'high')
    .sort((a, b) => b.score - a.score)

  const summary: string[] = [
    `Release ${releaseName}: ${analyzed.length} tickets analizados.`,
    `${byRisk.critical} críticos, ${byRisk.high} altos, ${byRisk.medium} medios, ${byRisk.low} bajos.`,
    `${dualSignoff} requieren doble firma (KLAP + BPC) antes del PaP.`,
    `${sanityCheck} requieren sanity check post-cambio.`,
    priority.length > 0
      ? `Prioridad para el comité: ${priority.slice(0, 5).map(t => t.id).join(', ')}${priority.length > 5 ? '…' : ''}.`
      : 'No se detectaron tickets de alto impacto.',
  ]

  return {
    release_name: releaseName,
    analyzed_at: new Date().toISOString(),
    total_tickets: analyzed.length,
    by_risk: byRisk,
    requires_dual_signoff: dualSignoff,
    requires_sanity_check: sanityCheck,
    priority_tickets: priority,
    tickets: analyzed,
    summary,
  }
}

// ============================================================
// Helpers
// ============================================================

const ACTION_ORDER: ReleaseAction[] = [
  'block_until_dual_signoff',
  'sanity_check_required',
  'functional_validation',
  'monitor',
  'informational',
]

export const ACTION_LABELS: Record<ReleaseAction, string> = {
  block_until_dual_signoff: 'Bloquear PaP hasta doble firma (KLAP + BPC/CLAP)',
  sanity_check_required: 'Sanity check post-cambio obligatorio',
  functional_validation: 'Validación funcional del PO',
  monitor: 'Monitorear operación post-PaP',
  informational: 'Transparente para KLAP',
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
}

function orderActions(actions: ReleaseAction[]): ReleaseAction[] {
  return [...actions].sort((a, b) => ACTION_ORDER.indexOf(a) - ACTION_ORDER.indexOf(b))
}

function matchText(pattern: RegExp, haystack: string): string {
  const m = haystack.match(pattern)
  return m ? m[0] : pattern.source
}

function buildDetail(
  risk: RiskLevel,
  clearing: boolean,
  reports: boolean,
  klap: boolean
): string {
  const parts: string[] = []
  if (clearing) parts.push('toca el flujo de clearing')
  if (reports) parts.push('modifica reportes/tags')
  if (klap) parts.push('depende de acción de KLAP')
  if (parts.length === 0) return `Riesgo ${RISK_LABELS[risk].toLowerCase()}: sin impacto directo en clearing, liquidación o reportes.`
  return `Riesgo ${RISK_LABELS[risk].toLowerCase()}: ${parts.join(', ')}.`
}

// ============================================================
// Parser de Release Note (texto crudo → tickets)
// Reconoce el formato de BPC/SmartVista:
//   "B_PSGB-XXXXX — Título del ticket"
//   Module / Type of Change / Summary / Complexity of Change
// También detecta la sección "Klap" para marcar is_klap_section.
// ============================================================

// El separador entre el ID y el título varía según el generador del PDF:
// guion largo "—", guion corto "-", dos puntos, o mojibake por encoding
// (ej. "â" cuando un PDF sin fuente Unicode representa "—"). Aceptamos
// cualquier secuencia corta de símbolos/no-letras entre el ID y el título.
const TICKET_HEADER = /(B_?PSGB-\d+)\s*[^\w\s]{0,3}\s*(.+)/i

export function parseReleaseNote(raw: string): ReleaseTicketInput[] {
  const lines = raw.split(/\r?\n/)
  const tickets: ReleaseTicketInput[] = []
  const seen = new Set<string>()

  let inKlapSection = false
  let current: ReleaseTicketInput | null = null
  let field: 'module' | 'type' | 'summary' | 'complexity' | null = null

  const flush = () => {
    if (current && !seen.has(current.id)) {
      seen.add(current.id)
      tickets.push(current)
    }
    current = null
    field = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // Detección de sección Klap (encabezado tipo "2.13. Klap")
    if (/^\d+(\.\d+)*\.?\s*Klap\b/i.test(line) || /^Klap$/i.test(line)) {
      inKlapSection = true
      continue
    }
    // Nueva sección numerada que no es Klap → salir de la sección Klap
    if (/^\d+(\.\d+)*\.\s*$/.test(line) || (/^\d+\.\s/.test(line) && !/klap/i.test(line))) {
      inKlapSection = false
    }

    const header = line.match(TICKET_HEADER)
    if (header) {
      // Solo tratamos como nuevo ticket los encabezados de detalle
      // (evita duplicar los del índice de "The following changes...")
      flush()
      current = {
        id: header[1].replace('BPSGB', 'B_PSGB'),
        title: header[2].trim(),
        is_klap_section: inKlapSection,
      }
      continue
    }

    if (!current) continue

    // Campos estructurados del ticket
    if (/^Module$/i.test(line)) { field = 'module'; continue }
    if (/^Type of Change$/i.test(line)) { field = 'type'; continue }
    if (/^Summary$/i.test(line)) { field = 'summary'; continue }
    if (/^Complexity of Change$/i.test(line)) { field = 'complexity'; continue }
    if (/^(Configuration|Impacted Functionality|Spec Change)$/i.test(line)) { field = null; continue }

    switch (field) {
      case 'module':
        current.module = (current.module ? current.module + ', ' : '') + line.replace(/^[•\u2022\-]\s*/, '')
        break
      case 'type':
        current.type = line
        field = null
        break
      case 'complexity':
        current.complexity = line
        field = null
        break
      case 'summary':
        current.summary = (current.summary ? current.summary + ' ' : '') + line
        break
    }
  }
  flush()

  return tickets
}
