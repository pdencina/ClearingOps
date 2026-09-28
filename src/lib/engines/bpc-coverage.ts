// ============================================================
// KLAP CORE — BPC Coverage Engine
// Cruza el backlog de tickets derivados a BPC (Jira: KLAP-XXXX,
// ESV2-XXXX, etc.) contra los tickets de un Release Note ya
// analizado por el Release Analyzer, para responder:
// "de lo que le pedimos a BPC, ¿qué quedó resuelto en este release
// y qué sigue pendiente?"
//
// Es un motor puro (sin DB): recibe listas planas y devuelve el
// resultado del cruce. La persistencia vive en bpc-tickets-db.ts.
// ============================================================

import type { AnalyzedTicket } from '@/lib/engines/release-analyzer'

export interface BpcDerivedTicketInput {
  id: string          // UUID en Neon
  jira_key: string    // "KLAP-2041"
  summary: string
  description?: string | null
  status: string
}

export type CoverageStatus = 'covered' | 'likely_covered' | 'not_found'

export interface CoverageMatch {
  bpc_ticket_id: string
  jira_key: string
  summary: string
  status: CoverageStatus
  matched_ticket_id: string | null   // Ej: "B_PSGB-107436"
  matched_ticket_title: string | null
  confidence: number                 // 0..1
  reason: string
}

export interface CoverageResult {
  release_name: string
  total_pending_tickets: number
  covered: number
  likely_covered: number
  not_found: number
  matches: CoverageMatch[]
  summary: string[]
}

// Palabras sin valor discriminante para el matching (español + inglés,
// vocabulario típico de tickets de pagos/clearing).
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'to', 'for', 'with', 'is', 'are', 'was',
  'be', 'by', 'at', 'from', 'this', 'that', 'not', 'no', 'has', 'have', 'been', 'it', 'its',
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'o', 'en', 'con', 'por', 'para', 'que',
  'se', 'su', 'sus', 'del', 'al', 'no', 'es', 'son', 'fue', 'ha', 'han',
])

const CONFIDENCE_THRESHOLDS = {
  covered: 0.45,
  likely_covered: 0.2,
}

// Los tickets KLAP se redactan en español, los de BPC en inglés.
// Sin este glosario, la similitud por palabras exactas nunca coincide
// aunque hablen del mismo problema (ej. "anulación" vs "void"). No es
// traducción completa, solo normaliza el vocabulario de dominio de
// pagos/clearing más frecuente en ambos lados.
const DOMAIN_SYNONYMS: Record<string, string> = {
  // español → término canónico en inglés
  anulacion: 'void', anulaciones: 'void', anular: 'void',
  reversa: 'reversal', reversas: 'reversal', reverso: 'reversal',
  cuota: 'installment', cuotas: 'installment',
  liquidacion: 'settlement', liquidaciones: 'settlement',
  conciliacion: 'reconciliation',
  comercio: 'merchant', comercios: 'merchant',
  transaccion: 'transaction', transacciones: 'transaction', trx: 'transaction',
  tarificacion: 'pricing', tarifas: 'fee', tarifa: 'fee', interchange: 'interchange',
  migracion: 'migration',
  contracargo: 'chargeback', contracargos: 'chargeback',
  tablon: 'report', tablero: 'report', preliquidacion: 'presettlement',
  sucursal: 'branch', sucursales: 'branch',
  categoria: 'category',
  producto: 'product',
  cero: 'zero',
  monto: 'amount', montos: 'amount',
  archivo: 'file',
  reporte: 'report', reportes: 'report',
  clearing: 'clearing', switch: 'switch',
  defecto: 'defect', bug: 'defect', error: 'defect',
}

// Stemming minimalista: quita plurales simples en español/inglés
// (voids→void, installments→installment, reportes→reporte) para que
// el diccionario de dominio funcione sin listar cada forma flexionada.
// No es un stemmer lingüístico completo, solo lo suficiente para que
// la intersección de conjuntos de palabras detecte el mismo concepto
// aunque un lado esté en singular y el otro en plural.
function stem(word: string): string {
  if (word.length > 5 && word.endsWith('ciones')) return word.slice(0, -3) // "reversiones" → "reversion"
  if (word.length > 4 && (word.endsWith('es') || word.endsWith('as') || word.endsWith('os'))) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1)
  return word
}

function normalizeDomainTerms(word: string): string {
  // Quita tildes para matchear el diccionario sin depender del acento exacto
  const bare = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (DOMAIN_SYNONYMS[bare]) return DOMAIN_SYNONYMS[bare]

  const stemmed = stem(bare)
  return DOMAIN_SYNONYMS[stemmed] ?? stemmed
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-záéíóúñ0-9\s_]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w))
      .map(normalizeDomainTerms)
  )
}

/**
 * Similitud Jaccard simple sobre el conjunto de palabras clave de
 * ambos textos. Suficiente para detectar solapamiento temático
 * (ej. "Mercado Pago", "anulaciones", "MA en cero" vs el texto del
 * ticket BPC) sin necesitar embeddings ni un modelo externo.
 */
function textSimilarity(a: string, b: string): number {
  const setA = tokenize(a)
  const setB = tokenize(b)
  if (setA.size === 0 || setB.size === 0) return 0

  let intersection = 0
  for (const word of setA) {
    if (setB.has(word)) intersection++
  }
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

/**
 * Busca, para un ticket derivado a BPC, cuál ticket del Release Note
 * (si alguno) lo cubre. Además del texto, da un bonus fuerte si el
 * ticket del release menciona literalmente el jira_key del ticket KLAP
 * (a veces BPC referencia el número de ticket del cliente en su summary).
 */
export function matchBpcTicket(
  bpcTicket: BpcDerivedTicketInput,
  releaseTickets: AnalyzedTicket[]
): CoverageMatch {
  const bpcText = `${bpcTicket.summary} ${bpcTicket.description ?? ''}`

  let best: { ticket: AnalyzedTicket; score: number } | null = null

  for (const rt of releaseTickets) {
    let score = textSimilarity(bpcText, `${rt.title} ${rt.detail}`)

    // Bonus si el release menciona literalmente el jira_key del ticket KLAP
    const keyPattern = new RegExp(bpcTicket.jira_key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i')
    if (keyPattern.test(rt.title) || keyPattern.test(rt.detail)) {
      score = Math.max(score, 0.9)
    }

    if (!best || score > best.score) {
      best = { ticket: rt, score }
    }
  }

  if (!best || best.score < CONFIDENCE_THRESHOLDS.likely_covered) {
    return {
      bpc_ticket_id: bpcTicket.id,
      jira_key: bpcTicket.jira_key,
      summary: bpcTicket.summary,
      status: 'not_found',
      matched_ticket_id: null,
      matched_ticket_title: null,
      confidence: best?.score ?? 0,
      reason: 'No se encontró ningún ticket del release con contenido similar. Sigue pendiente con BPC.',
    }
  }

  const status: CoverageStatus = best.score >= CONFIDENCE_THRESHOLDS.covered ? 'covered' : 'likely_covered'

  return {
    bpc_ticket_id: bpcTicket.id,
    jira_key: bpcTicket.jira_key,
    summary: bpcTicket.summary,
    status,
    matched_ticket_id: best.ticket.id,
    matched_ticket_title: best.ticket.title,
    confidence: Math.round(best.score * 1000) / 1000,
    reason:
      status === 'covered'
        ? `Coincidencia fuerte con ${best.ticket.id} — "${best.ticket.title}".`
        : `Coincidencia parcial con ${best.ticket.id} — revisar manualmente antes de cerrar.`,
  }
}

/**
 * Cruza todos los tickets pendientes derivados a BPC contra los
 * tickets de un release ya analizado.
 */
export function computeCoverage(
  releaseName: string,
  pendingTickets: BpcDerivedTicketInput[],
  releaseTickets: AnalyzedTicket[]
): CoverageResult {
  const matches = pendingTickets.map(t => matchBpcTicket(t, releaseTickets))

  const covered = matches.filter(m => m.status === 'covered').length
  const likelyCovered = matches.filter(m => m.status === 'likely_covered').length
  const notFound = matches.filter(m => m.status === 'not_found').length

  const summary: string[] = [
    `Se cruzaron ${pendingTickets.length} tickets pendientes derivados a BPC contra ${releaseName}.`,
    `${covered} quedarían cubiertos, ${likelyCovered} con coincidencia parcial (revisar), ${notFound} sin evidencia de estar resueltos.`,
  ]
  if (notFound > 0) {
    const keys = matches.filter(m => m.status === 'not_found').map(m => m.jira_key).join(', ')
    summary.push(`Siguen pendientes con BPC: ${keys}.`)
  }

  return {
    release_name: releaseName,
    total_pending_tickets: pendingTickets.length,
    covered,
    likely_covered: likelyCovered,
    not_found: notFound,
    matches,
    summary,
  }
}

export const COVERAGE_STATUS_LABELS: Record<CoverageStatus, string> = {
  covered: 'Cubierto',
  likely_covered: 'Posible cobertura',
  not_found: 'Sigue pendiente',
}
