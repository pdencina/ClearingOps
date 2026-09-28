// ============================================================
// KLAP CORE — Cliente Jira Cloud
// Trae los issues derivados a BPC usando JQL configurable.
//
// Requiere en .env.local:
//   JIRA_BASE_URL   ej: https://tuempresa.atlassian.net
//   JIRA_EMAIL      email de la cuenta que genera el API token
//   JIRA_API_TOKEN  generado en id.atlassian.com/manage-profile/security/api-tokens
//   JIRA_DERIVED_JQL (opcional) JQL por defecto para "derivado a BPC",
//                    ej: project in (KLAP, ESV2) AND labels = derivado-bpc AND status != Done
//
// Usa el endpoint vigente de búsqueda (Jira deprecó y removió
// /rest/api/3/search en oct-2025; el reemplazo es /rest/api/3/search/jql,
// con paginación via nextPageToken en vez de startAt).
// ============================================================

export interface JiraIssue {
  jira_key: string
  jira_id: string
  summary: string
  description: string | null
  project_key: string
  status: string
  priority: string | null
  jira_url: string
  labels: string[]
}

export interface JiraConfig {
  baseUrl: string
  email: string
  apiToken: string
}

function getJiraConfig(): JiraConfig {
  const baseUrl = process.env.JIRA_BASE_URL
  const email = process.env.JIRA_EMAIL
  const apiToken = process.env.JIRA_API_TOKEN

  if (!baseUrl || !email || !apiToken) {
    throw new Error(
      'Jira no configurado — agrega JIRA_BASE_URL, JIRA_EMAIL y JIRA_API_TOKEN en .env.local.'
    )
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ''), email, apiToken }
}

function authHeader(config: JiraConfig): string {
  const token = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')
  return `Basic ${token}`
}

/**
 * Verifica que las credenciales de Jira son válidas, sin traer issues.
 */
export async function testJiraConnection(): Promise<{ ok: boolean; user?: string; error?: string }> {
  try {
    const config = getJiraConfig()
    const res = await fetch(`${config.baseUrl}/rest/api/3/myself`, {
      headers: { Authorization: authHeader(config), Accept: 'application/json' },
    })
    if (!res.ok) {
      return { ok: false, error: `Jira respondió ${res.status}: ${await res.text()}` }
    }
    const data = await res.json()
    return { ok: true, user: data.displayName || data.emailAddress }
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message }
  }
}

const DEFAULT_FIELDS = ['summary', 'description', 'project', 'status', 'priority', 'labels']

/**
 * Busca issues en Jira usando JQL, paginando con nextPageToken (endpoint
 * vigente /rest/api/3/search/jql — el legado /rest/api/3/search fue
 * removido por Atlassian en octubre 2025).
 */
export async function searchJiraIssues(jql: string, maxTotal = 200): Promise<JiraIssue[]> {
  const config = getJiraConfig()
  const issues: JiraIssue[] = []
  let nextPageToken: string | undefined

  do {
    const body: Record<string, unknown> = {
      jql,
      maxResults: Math.min(100, maxTotal - issues.length),
      fields: DEFAULT_FIELDS,
    }
    if (nextPageToken) body.nextPageToken = nextPageToken

    const res = await fetch(`${config.baseUrl}/rest/api/3/search/jql`, {
      method: 'POST',
      headers: {
        Authorization: authHeader(config),
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Jira search falló (${res.status}): ${text || res.statusText}`)
    }

    const data = await res.json()
    for (const raw of data.issues ?? []) {
      issues.push(mapJiraIssue(raw, config.baseUrl))
    }

    nextPageToken = data.nextPageToken
  } while (nextPageToken && issues.length < maxTotal)

  return issues
}

function mapJiraIssue(raw: {
  key: string
  id: string
  fields: {
    summary?: string
    description?: unknown
    project?: { key: string }
    status?: { name: string }
    priority?: { name: string } | null
    labels?: string[]
  }
}, baseUrl: string): JiraIssue {
  return {
    jira_key: raw.key,
    jira_id: raw.id,
    summary: raw.fields?.summary ?? '(sin título)',
    description: extractPlainText(raw.fields?.description),
    project_key: raw.fields?.project?.key ?? '',
    status: raw.fields?.status?.name ?? 'Unknown',
    priority: raw.fields?.priority?.name ?? null,
    labels: raw.fields?.labels ?? [],
    jira_url: `${baseUrl}/browse/${raw.key}`,
  }
}

// El campo "description" en la API v3 viene en formato ADF (Atlassian
// Document Format, un JSON estructurado tipo ProseMirror), no texto plano.
// Extraemos solo el texto para guardarlo simple en la base.
function extractPlainText(adf: unknown): string | null {
  if (!adf || typeof adf !== 'object') return null
  const parts: string[] = []

  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return
    const n = node as { type?: string; text?: string; content?: unknown[] }
    if (n.type === 'text' && n.text) parts.push(n.text)
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }
  walk(adf)

  const text = parts.join(' ').trim()
  return text.length > 0 ? text : null
}
