// ============================================================
// KLAP CORE — ISO 8583 Message Parser & Builder
// Protocolo estándar de la industria de pagos con tarjeta
// Reemplaza la capa de comunicación de BPC SmartVista
// ============================================================

export type MTI = '0100' | '0110' | '0200' | '0210' | '0400' | '0410'

export interface FieldDefinition {
  id: number
  name: string
  length: number
  type: 'n' | 'an' | 'ans' // numeric, alphanumeric, alphanumeric+special
  variable: boolean // true = LLVAR/LLLVAR
  maxLength?: number
}

export interface ParsedMessage {
  mti: MTI
  bitmap: string
  fields: Record<number, string>
  fieldNames: Record<number, string>
}

export interface AuthRequestParams {
  pan: string
  processingCode: string
  amount: number
  stan: string
  terminalId: string
  merchantId: string
  merchantName: string
  currencyCode: string
  posEntryMode?: string
  posConditionCode?: string
}

export interface AuthResponseParams {
  pan: string
  processingCode: string
  amount: number
  stan: string
  retrievalRef: string
  authCode: string
  responseCode: string
  terminalId: string
  merchantId: string
  currencyCode: string
}

// Field definitions for the most important Data Elements
const FIELD_DEFINITIONS: Record<number, FieldDefinition> = {
  2:  { id: 2,  name: 'Primary Account Number (PAN)', length: 19, type: 'n', variable: true, maxLength: 19 },
  3:  { id: 3,  name: 'Processing Code', length: 6, type: 'n', variable: false },
  4:  { id: 4,  name: 'Amount, Transaction', length: 12, type: 'n', variable: false },
  7:  { id: 7,  name: 'Transmission Date & Time', length: 10, type: 'n', variable: false },
  11: { id: 11, name: 'System Trace Audit Number (STAN)', length: 6, type: 'n', variable: false },
  12: { id: 12, name: 'Local Transaction Time', length: 6, type: 'n', variable: false },
  13: { id: 13, name: 'Local Transaction Date', length: 4, type: 'n', variable: false },
  22: { id: 22, name: 'Point of Service Entry Mode', length: 3, type: 'n', variable: false },
  25: { id: 25, name: 'POS Condition Code', length: 2, type: 'n', variable: false },
  37: { id: 37, name: 'Retrieval Reference Number', length: 12, type: 'an', variable: false },
  38: { id: 38, name: 'Authorization ID Response', length: 6, type: 'an', variable: false },
  39: { id: 39, name: 'Response Code', length: 2, type: 'an', variable: false },
  41: { id: 41, name: 'Card Acceptor Terminal ID', length: 8, type: 'ans', variable: false },
  42: { id: 42, name: 'Card Acceptor ID Code', length: 15, type: 'ans', variable: false },
  43: { id: 43, name: 'Card Acceptor Name/Location', length: 40, type: 'ans', variable: false },
  49: { id: 49, name: 'Currency Code, Transaction', length: 3, type: 'n', variable: false },
}

const MTI_DESCRIPTIONS: Record<string, string> = {
  '0100': 'Authorization Request',
  '0110': 'Authorization Response',
  '0200': 'Financial Transaction Request',
  '0210': 'Financial Transaction Response',
  '0400': 'Reversal Request',
  '0410': 'Reversal Response',
}

// ============================================================
// Utility functions
// ============================================================

function strToHex(str: string): string {
  let hex = ''
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, '0')
  }
  return hex
}

function hexToStr(hex: string): string {
  let str = ''
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16))
  }
  return str
}

function padField(value: string, def: FieldDefinition): string {
  if (def.type === 'n') {
    return value.padStart(def.length, '0')
  }
  return value.padEnd(def.length, ' ')
}

function generateBitmap(fields: Record<number, string>): string {
  // Primary bitmap: 64 bits representing fields 1-64
  const bitmap = new Array(64).fill(0)
  for (const fieldId of Object.keys(fields)) {
    const id = parseInt(fieldId)
    if (id >= 1 && id <= 64) {
      bitmap[id - 1] = 1
    }
  }
  // Convert to hex (8 bytes = 16 hex chars)
  let hex = ''
  for (let i = 0; i < 64; i += 4) {
    const nibble = bitmap.slice(i, i + 4)
    hex += parseInt(nibble.join(''), 2).toString(16)
  }
  return hex.toUpperCase()
}

function parseBitmap(hex: string): number[] {
  const fields: number[] = []
  // Convert hex to binary
  let binary = ''
  for (let i = 0; i < hex.length; i++) {
    binary += parseInt(hex[i], 16).toString(2).padStart(4, '0')
  }
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      fields.push(i + 1)
    }
  }
  return fields
}

// ============================================================
// Build ISO 8583 message
// ============================================================

/**
 * Builds an ISO 8583 message from MTI and field values.
 * Returns a hex-encoded string representation.
 */
export function buildMessage(mti: MTI, fields: Record<number, string>): string {
  // MTI (4 bytes as ASCII hex)
  let message = strToHex(mti)

  // Bitmap (16 hex chars = 8 bytes)
  const bitmap = generateBitmap(fields)
  message += bitmap

  // Fields in order
  const sortedFields = Object.keys(fields).map(Number).sort((a, b) => a - b)

  for (const fieldId of sortedFields) {
    const def = FIELD_DEFINITIONS[fieldId]
    const value = fields[fieldId]

    if (!def) {
      // Unknown field — encode as LLVAR
      const len = value.length.toString().padStart(2, '0')
      message += strToHex(len + value)
      continue
    }

    if (def.variable) {
      // LLVAR: 2-digit length prefix + value
      const len = value.length.toString().padStart(2, '0')
      message += strToHex(len + value)
    } else {
      // Fixed length: pad and encode
      const padded = padField(value, def)
      message += strToHex(padded)
    }
  }

  return message.toUpperCase()
}

// ============================================================
// Parse ISO 8583 message
// ============================================================

/**
 * Parses a hex-encoded ISO 8583 message into its components.
 */
export function parseMessage(hex: string): ParsedMessage {
  let offset = 0

  // MTI: first 4 bytes (8 hex chars)
  const mtiHex = hex.substring(offset, offset + 8)
  const mti = hexToStr(mtiHex) as MTI
  offset += 8

  // Bitmap: next 8 bytes (16 hex chars)
  const bitmapHex = hex.substring(offset, offset + 16)
  offset += 16

  // Determine which fields are present
  const presentFields = parseBitmap(bitmapHex)

  const fields: Record<number, string> = {}
  const fieldNames: Record<number, string> = {}

  for (const fieldId of presentFields) {
    const def = FIELD_DEFINITIONS[fieldId]

    if (!def) {
      // Unknown field — try LLVAR
      const lenStr = hexToStr(hex.substring(offset, offset + 4))
      offset += 4
      const len = parseInt(lenStr, 10)
      if (!isNaN(len) && len > 0 && len <= 999) {
        const value = hexToStr(hex.substring(offset, offset + len * 2))
        offset += len * 2
        fields[fieldId] = value
        fieldNames[fieldId] = `Field ${fieldId}`
      }
      continue
    }

    if (def.variable) {
      // LLVAR: read 2-byte length prefix
      const lenStr = hexToStr(hex.substring(offset, offset + 4))
      offset += 4
      const len = parseInt(lenStr, 10)
      const value = hexToStr(hex.substring(offset, offset + len * 2))
      offset += len * 2
      fields[fieldId] = value
    } else {
      // Fixed length
      const value = hexToStr(hex.substring(offset, offset + def.length * 2))
      offset += def.length * 2
      fields[fieldId] = value.trim()
    }

    fieldNames[fieldId] = def.name
  }

  return { mti, bitmap: bitmapHex, fields, fieldNames }
}

// ============================================================
// High-level builders
// ============================================================

/**
 * Builds a 0100 Authorization Request message.
 */
export function buildAuthRequest(params: AuthRequestParams): string {
  const now = new Date()
  const fields: Record<number, string> = {
    2: params.pan,
    3: params.processingCode,
    4: params.amount.toString().padStart(12, '0'),
    7: formatDateTime(now),
    11: params.stan,
    12: formatTime(now),
    13: formatDate(now),
    22: params.posEntryMode || '051',  // chip
    25: params.posConditionCode || '00',
    41: params.terminalId,
    42: params.merchantId,
    43: params.merchantName,
    49: params.currencyCode,
  }
  return buildMessage('0100', fields)
}

/**
 * Builds a 0110 Authorization Response message.
 */
export function buildAuthResponse(params: AuthResponseParams): string {
  const now = new Date()
  const fields: Record<number, string> = {
    2: params.pan,
    3: params.processingCode,
    4: params.amount.toString().padStart(12, '0'),
    7: formatDateTime(now),
    11: params.stan,
    12: formatTime(now),
    13: formatDate(now),
    37: params.retrievalRef,
    38: params.authCode,
    39: params.responseCode,
    41: params.terminalId,
    42: params.merchantId,
    49: params.currencyCode,
  }
  return buildMessage('0110', fields)
}

// ============================================================
// Response codes
// ============================================================

export const RESPONSE_CODES: Record<string, string> = {
  '00': 'Approved',
  '01': 'Refer to issuer',
  '03': 'Invalid merchant',
  '04': 'Pick-up card',
  '05': 'Do not honor',
  '12': 'Invalid transaction',
  '13': 'Invalid amount',
  '14': 'Invalid card number',
  '30': 'Format error',
  '41': 'Lost card',
  '43': 'Stolen card',
  '51': 'Insufficient funds',
  '54': 'Expired card',
  '55': 'Incorrect PIN',
  '57': 'Transaction not permitted',
  '61': 'Exceeds withdrawal limit',
  '65': 'Exceeds frequency limit',
  '91': 'Issuer unavailable',
  '96': 'System malfunction',
}

export function getResponseDescription(code: string): string {
  return RESPONSE_CODES[code] || 'Unknown response code'
}

export function getMTIDescription(mti: string): string {
  return MTI_DESCRIPTIONS[mti] || 'Unknown MTI'
}

export function getFieldDefinition(id: number): FieldDefinition | undefined {
  return FIELD_DEFINITIONS[id]
}

export function getAllFieldDefinitions(): Record<number, FieldDefinition> {
  return { ...FIELD_DEFINITIONS }
}

// ============================================================
// Date/Time formatting helpers
// ============================================================

function formatDateTime(date: Date): string {
  // MMDDhhmmss
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  const dd = date.getDate().toString().padStart(2, '0')
  const hh = date.getHours().toString().padStart(2, '0')
  const min = date.getMinutes().toString().padStart(2, '0')
  const ss = date.getSeconds().toString().padStart(2, '0')
  return `${mm}${dd}${hh}${min}${ss}`
}

function formatTime(date: Date): string {
  // hhmmss
  const hh = date.getHours().toString().padStart(2, '0')
  const min = date.getMinutes().toString().padStart(2, '0')
  const ss = date.getSeconds().toString().padStart(2, '0')
  return `${hh}${min}${ss}`
}

function formatDate(date: Date): string {
  // MMDD
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  const dd = date.getDate().toString().padStart(2, '0')
  return `${mm}${dd}`
}
