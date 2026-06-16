// ============================================================
// KLAP CORE — Tokenization Vault
// Motor de tokenización que protege datos de tarjeta (PCI DSS)
// Reemplaza el vault de tokens de BPC SmartVista
// ============================================================

export type TokenType = 'permanent' | 'temporary' | 'payment'

export interface TokenEntry {
  token: string
  pan_hash: string
  last_four: string
  card_brand: string
  masked_pan: string
  token_type: TokenType
  created_at: string
  expires_at: string | null
  merchant_id: string | null
  usage_count: number
}

export interface TokenizeResult {
  token: string
  last_four: string
  card_brand: string
  masked_pan: string
  token_type: TokenType
  created_at: string
  expires_at: string | null
}

export interface TokenInfo {
  token: string
  last_four: string
  card_brand: string
  masked_pan: string
  token_type: TokenType
  created_at: string
  expires_at: string | null
  is_expired: boolean
  usage_count: number
}

// ============================================================
// In-memory vault (simulated secure storage)
// ============================================================

const TOKEN_VAULT: Map<string, TokenEntry> = new Map()
const PAN_TO_TOKEN: Map<string, string> = new Map() // pan_hash → token

// Token prefix to ensure tokens are identifiable
const TOKEN_PREFIX = '9999' // Tokens start with 9999 (non-routable BIN)

// ============================================================
// Utility functions
// ============================================================

function detectCardBrand(pan: string): string {
  const first = pan[0]
  const firstTwo = pan.substring(0, 2)
  if (first === '4') return 'visa'
  if (first === '5' || (firstTwo >= '51' && firstTwo <= '55')) return 'mastercard'
  if (firstTwo === '34' || firstTwo === '37') return 'amex'
  if (first === '6') return 'redcompra'
  return 'unknown'
}

function hashPAN(pan: string): string {
  // Simple hash for demo (in production: use HMAC-SHA256 with HSM)
  let hash = 0
  for (let i = 0; i < pan.length; i++) {
    const char = pan.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).padStart(12, '0')
}

function generateToken(pan: string): string {
  // Format-preserving: same length as original PAN
  // Starts with TOKEN_PREFIX (9999) to be identifiable
  // Includes last 4 digits for reference
  const lastFour = pan.slice(-4)
  const middleLength = pan.length - 4 - 4 // minus prefix and last four
  let middle = ''
  for (let i = 0; i < middleLength; i++) {
    middle += Math.floor(Math.random() * 10).toString()
  }
  return TOKEN_PREFIX + middle + lastFour
}

function getExpirationDate(tokenType: TokenType): string | null {
  const now = new Date()
  switch (tokenType) {
    case 'temporary':
      // 30 minutes
      return new Date(now.getTime() + 30 * 60 * 1000).toISOString()
    case 'payment':
      // 24 hours
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    case 'permanent':
      return null // Never expires
  }
}

// ============================================================
// Core tokenization functions
// ============================================================

/**
 * Tokenizes a PAN (card number) and stores the mapping in the vault.
 * If the PAN was already tokenized, returns the existing token.
 */
export function tokenize(
  pan: string,
  tokenType: TokenType = 'permanent',
  merchantId: string | null = null
): TokenizeResult {
  const cleanPan = pan.replace(/[\s-]/g, '')
  const panHash = hashPAN(cleanPan)

  // Check if already tokenized (for permanent tokens)
  if (tokenType === 'permanent') {
    const existingToken = PAN_TO_TOKEN.get(panHash)
    if (existingToken) {
      const entry = TOKEN_VAULT.get(existingToken)
      if (entry) {
        entry.usage_count++
        return {
          token: entry.token,
          last_four: entry.last_four,
          card_brand: entry.card_brand,
          masked_pan: entry.masked_pan,
          token_type: entry.token_type,
          created_at: entry.created_at,
          expires_at: entry.expires_at,
        }
      }
    }
  }

  // Generate new token
  const token = generateToken(cleanPan)
  const lastFour = cleanPan.slice(-4)
  const cardBrand = detectCardBrand(cleanPan)
  const maskedPan = cleanPan.substring(0, 6) + '******' + lastFour
  const expiresAt = getExpirationDate(tokenType)

  const entry: TokenEntry = {
    token,
    pan_hash: panHash,
    last_four: lastFour,
    card_brand: cardBrand,
    masked_pan: maskedPan,
    token_type: tokenType,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
    merchant_id: merchantId,
    usage_count: 1,
  }

  // Store in vault
  TOKEN_VAULT.set(token, entry)
  if (tokenType === 'permanent') {
    PAN_TO_TOKEN.set(panHash, token)
  }

  // Also store the reverse mapping (token → original PAN) in a separate structure
  // In production this would be in an HSM/encrypted store
  tokenToPanMap.set(token, cleanPan)

  return {
    token,
    last_four: lastFour,
    card_brand: cardBrand,
    masked_pan: maskedPan,
    token_type: tokenType,
    created_at: entry.created_at,
    expires_at: expiresAt,
  }
}

/**
 * Detokenizes — returns the original PAN for a given token.
 * Returns null if token not found or expired.
 */
export function detokenize(token: string): string | null {
  const entry = TOKEN_VAULT.get(token)
  if (!entry) return null

  // Check expiration
  if (entry.expires_at) {
    const expiresAt = new Date(entry.expires_at)
    if (new Date() > expiresAt) {
      return null // Token expired
    }
  }

  entry.usage_count++
  return tokenToPanMap.get(token) || null
}

/**
 * Returns metadata about a token WITHOUT revealing the PAN.
 */
export function getTokenInfo(token: string): TokenInfo | null {
  const entry = TOKEN_VAULT.get(token)
  if (!entry) return null

  const isExpired = entry.expires_at
    ? new Date() > new Date(entry.expires_at)
    : false

  return {
    token: entry.token,
    last_four: entry.last_four,
    card_brand: entry.card_brand,
    masked_pan: entry.masked_pan,
    token_type: entry.token_type,
    created_at: entry.created_at,
    expires_at: entry.expires_at,
    is_expired: isExpired,
    usage_count: entry.usage_count,
  }
}

/**
 * Returns vault statistics.
 */
export function getVaultStats(): {
  total_tokens: number
  permanent: number
  temporary: number
  payment: number
  expired: number
} {
  let permanent = 0
  let temporary = 0
  let payment = 0
  let expired = 0

  for (const entry of TOKEN_VAULT.values()) {
    switch (entry.token_type) {
      case 'permanent': permanent++; break
      case 'temporary': temporary++; break
      case 'payment': payment++; break
    }
    if (entry.expires_at && new Date() > new Date(entry.expires_at)) {
      expired++
    }
  }

  return {
    total_tokens: TOKEN_VAULT.size,
    permanent,
    temporary,
    payment,
    expired,
  }
}

// Private: stores the actual PAN ↔ token mapping (simulated HSM)
const tokenToPanMap: Map<string, string> = new Map()
