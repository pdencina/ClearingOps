// ============================================================
// KLAP CORE — BIN Table Management
// Tabla de BINs para routing de transacciones en Chile
// Reemplaza el módulo de routing de BPC SmartVista
// ============================================================

export interface BINEntry {
  bin_range_start: string
  bin_range_end: string
  issuer: string
  country: string
  card_brand: 'visa' | 'mastercard' | 'amex' | 'redcompra' | 'magna'
  card_type: 'credit' | 'debit' | 'prepaid'
  product_name: string
}

export interface BINLookupResult {
  found: boolean
  bin: string
  issuer: string
  country: string
  card_brand: string
  card_type: string
  product_name: string
  masked_pan: string
  last_four: string
}

export interface RoutingDecision {
  network: string
  processor: string
  priority: number
  fallback_network: string | null
  routing_reason: string
  estimated_cost_bps: number // basis points
}

// ============================================================
// Chilean BIN Table — 35+ entries
// ============================================================

const BIN_TABLE: BINEntry[] = [
  // Banco de Chile - Visa
  { bin_range_start: '405918', bin_range_end: '405918', issuer: 'Banco de Chile', country: 'CL', card_brand: 'visa', card_type: 'credit', product_name: 'Visa Gold' },
  { bin_range_start: '405919', bin_range_end: '405919', issuer: 'Banco de Chile', country: 'CL', card_brand: 'visa', card_type: 'credit', product_name: 'Visa Platinum' },
  { bin_range_start: '411111', bin_range_end: '411111', issuer: 'Banco de Chile', country: 'CL', card_brand: 'visa', card_type: 'credit', product_name: 'Visa Classic' },
  { bin_range_start: '448800', bin_range_end: '448899', issuer: 'Banco de Chile', country: 'CL', card_brand: 'visa', card_type: 'debit', product_name: 'Visa Débito' },

  // BCI - Visa & Mastercard
  { bin_range_start: '424242', bin_range_end: '424242', issuer: 'BCI', country: 'CL', card_brand: 'visa', card_type: 'credit', product_name: 'Visa Infinite' },
  { bin_range_start: '455500', bin_range_end: '455599', issuer: 'BCI', country: 'CL', card_brand: 'visa', card_type: 'credit', product_name: 'Visa Gold' },
  { bin_range_start: '517805', bin_range_end: '517805', issuer: 'BCI', country: 'CL', card_brand: 'mastercard', card_type: 'credit', product_name: 'Mastercard Black' },
  { bin_range_start: '530600', bin_range_end: '530699', issuer: 'BCI', country: 'CL', card_brand: 'mastercard', card_type: 'credit', product_name: 'Mastercard Gold' },
  { bin_range_start: '650100', bin_range_end: '650199', issuer: 'BCI', country: 'CL', card_brand: 'redcompra', card_type: 'debit', product_name: 'Cuenta Corriente BCI' },

  // Santander Chile - Visa & MC
  { bin_range_start: '462000', bin_range_end: '462099', issuer: 'Santander Chile', country: 'CL', card_brand: 'visa', card_type: 'credit', product_name: 'Visa Signature' },
  { bin_range_start: '478900', bin_range_end: '478999', issuer: 'Santander Chile', country: 'CL', card_brand: 'visa', card_type: 'credit', product_name: 'Visa Classic' },
  { bin_range_start: '541700', bin_range_end: '541799', issuer: 'Santander Chile', country: 'CL', card_brand: 'mastercard', card_type: 'credit', product_name: 'Mastercard Platinum' },
  { bin_range_start: '542200', bin_range_end: '542299', issuer: 'Santander Chile', country: 'CL', card_brand: 'mastercard', card_type: 'credit', product_name: 'Mastercard World' },
  { bin_range_start: '650200', bin_range_end: '650299', issuer: 'Santander Chile', country: 'CL', card_brand: 'redcompra', card_type: 'debit', product_name: 'Cuenta Vista Santander' },

  // Banco Estado
  { bin_range_start: '434300', bin_range_end: '434399', issuer: 'Banco Estado', country: 'CL', card_brand: 'visa', card_type: 'credit', product_name: 'Visa Classic Estado' },
  { bin_range_start: '440000', bin_range_end: '440099', issuer: 'Banco Estado', country: 'CL', card_brand: 'visa', card_type: 'debit', product_name: 'CuentaRUT Visa' },
  { bin_range_start: '650300', bin_range_end: '650399', issuer: 'Banco Estado', country: 'CL', card_brand: 'redcompra', card_type: 'debit', product_name: 'CuentaRUT' },
  { bin_range_start: '600200', bin_range_end: '600299', issuer: 'Banco Estado', country: 'CL', card_brand: 'redcompra', card_type: 'debit', product_name: 'CuentaRUT Electron' },

  // Scotiabank Chile
  { bin_range_start: '450900', bin_range_end: '450999', issuer: 'Scotiabank Chile', country: 'CL', card_brand: 'visa', card_type: 'credit', product_name: 'Visa Gold Scotia' },
  { bin_range_start: '459000', bin_range_end: '459099', issuer: 'Scotiabank Chile', country: 'CL', card_brand: 'visa', card_type: 'credit', product_name: 'Visa Platinum Scotia' },
  { bin_range_start: '525300', bin_range_end: '525399', issuer: 'Scotiabank Chile', country: 'CL', card_brand: 'mastercard', card_type: 'credit', product_name: 'Mastercard Scotia Gold' },
  { bin_range_start: '650400', bin_range_end: '650499', issuer: 'Scotiabank Chile', country: 'CL', card_brand: 'redcompra', card_type: 'debit', product_name: 'Scotia Débito' },

  // Banco Falabella
  { bin_range_start: '474700', bin_range_end: '474799', issuer: 'Banco Falabella', country: 'CL', card_brand: 'visa', card_type: 'credit', product_name: 'CMR Visa' },
  { bin_range_start: '544400', bin_range_end: '544499', issuer: 'Banco Falabella', country: 'CL', card_brand: 'mastercard', card_type: 'credit', product_name: 'CMR Mastercard' },
  { bin_range_start: '650500', bin_range_end: '650599', issuer: 'Banco Falabella', country: 'CL', card_brand: 'redcompra', card_type: 'debit', product_name: 'Cuenta Falabella' },

  // Banco Ripley
  { bin_range_start: '460600', bin_range_end: '460699', issuer: 'Banco Ripley', country: 'CL', card_brand: 'visa', card_type: 'credit', product_name: 'Visa Ripley' },
  { bin_range_start: '533100', bin_range_end: '533199', issuer: 'Banco Ripley', country: 'CL', card_brand: 'mastercard', card_type: 'credit', product_name: 'Mastercard Ripley' },

  // Itaú Chile
  { bin_range_start: '423400', bin_range_end: '423499', issuer: 'Itaú Chile', country: 'CL', card_brand: 'visa', card_type: 'credit', product_name: 'Visa Itaú Platinum' },
  { bin_range_start: '549100', bin_range_end: '549199', issuer: 'Itaú Chile', country: 'CL', card_brand: 'mastercard', card_type: 'credit', product_name: 'Mastercard Itaú' },

  // Banco Security
  { bin_range_start: '421500', bin_range_end: '421599', issuer: 'Banco Security', country: 'CL', card_brand: 'visa', card_type: 'credit', product_name: 'Visa Security Gold' },
  { bin_range_start: '553800', bin_range_end: '553899', issuer: 'Banco Security', country: 'CL', card_brand: 'mastercard', card_type: 'credit', product_name: 'Mastercard Security' },

  // BICE
  { bin_range_start: '431200', bin_range_end: '431299', issuer: 'Banco BICE', country: 'CL', card_brand: 'visa', card_type: 'credit', product_name: 'Visa BICE Platinum' },

  // Prepaid cards
  { bin_range_start: '491700', bin_range_end: '491799', issuer: 'MACH (BCI)', country: 'CL', card_brand: 'visa', card_type: 'prepaid', product_name: 'MACH Visa Prepago' },
  { bin_range_start: '537800', bin_range_end: '537899', issuer: 'Tenpo', country: 'CL', card_brand: 'mastercard', card_type: 'prepaid', product_name: 'Tenpo Mastercard Prepago' },
  { bin_range_start: '522500', bin_range_end: '522599', issuer: 'Mercado Pago', country: 'CL', card_brand: 'mastercard', card_type: 'prepaid', product_name: 'Mercado Pago Prepago' },

  // American Express
  { bin_range_start: '370000', bin_range_end: '379999', issuer: 'American Express Chile', country: 'CL', card_brand: 'amex', card_type: 'credit', product_name: 'Amex Gold' },
]

// ============================================================
// BIN Lookup
// ============================================================

/**
 * Looks up a PAN in the BIN table and returns issuer information.
 */
export function lookupBIN(pan: string): BINLookupResult {
  const cleanPan = pan.replace(/\s/g, '')
  const bin6 = cleanPan.substring(0, 6)
  const lastFour = cleanPan.slice(-4)
  const maskedPan = cleanPan.substring(0, 6) + '******' + lastFour

  // Search for matching BIN range
  for (const entry of BIN_TABLE) {
    const start = entry.bin_range_start
    const end = entry.bin_range_end

    // Compare BIN prefix against range
    const binToCheck = bin6.substring(0, start.length)
    if (binToCheck >= start && binToCheck <= end) {
      return {
        found: true,
        bin: bin6,
        issuer: entry.issuer,
        country: entry.country,
        card_brand: entry.card_brand,
        card_type: entry.card_type,
        product_name: entry.product_name,
        masked_pan: maskedPan,
        last_four: lastFour,
      }
    }
  }

  // Fallback detection by first digit
  const firstDigit = cleanPan[0]
  let brand = 'unknown'
  let issuer = 'Emisor Desconocido'
  if (firstDigit === '4') { brand = 'visa'; issuer = 'Visa International' }
  else if (firstDigit === '5') { brand = 'mastercard'; issuer = 'Mastercard International' }
  else if (firstDigit === '3') { brand = 'amex'; issuer = 'American Express' }
  else if (firstDigit === '6') { brand = 'redcompra'; issuer = 'Redcompra / Local' }

  return {
    found: false,
    bin: bin6,
    issuer,
    country: 'CL',
    card_brand: brand,
    card_type: 'credit',
    product_name: 'Producto no identificado',
    masked_pan: maskedPan,
    last_four: lastFour,
  }
}

// ============================================================
// Transaction Routing
// ============================================================

/**
 * Determines the optimal routing path for a transaction based on BIN.
 */
export function routeTransaction(pan: string): RoutingDecision {
  const binInfo = lookupBIN(pan)

  // Routing rules based on card brand and type
  if (binInfo.card_brand === 'redcompra' || binInfo.card_type === 'debit') {
    return {
      network: 'Redcompra',
      processor: 'Transbank Local Switch',
      priority: 1,
      fallback_network: 'VisaNet',
      routing_reason: `Débito local (${binInfo.issuer}) → Redcompra directo`,
      estimated_cost_bps: 45, // 0.45%
    }
  }

  if (binInfo.card_brand === 'visa') {
    return {
      network: 'VisaNet',
      processor: 'Visa Inc. - LAC Region',
      priority: 1,
      fallback_network: 'Redcompra',
      routing_reason: `Visa crédito (${binInfo.issuer}) → VisaNet internacional`,
      estimated_cost_bps: 180, // 1.80%
    }
  }

  if (binInfo.card_brand === 'mastercard') {
    return {
      network: 'Banknet',
      processor: 'Mastercard - LAC Hub',
      priority: 1,
      fallback_network: 'VisaNet',
      routing_reason: `Mastercard (${binInfo.issuer}) → Banknet`,
      estimated_cost_bps: 175, // 1.75%
    }
  }

  if (binInfo.card_brand === 'amex') {
    return {
      network: 'AEXP Network',
      processor: 'American Express Direct',
      priority: 1,
      fallback_network: null,
      routing_reason: `Amex (${binInfo.issuer}) → Red propietaria AEXP`,
      estimated_cost_bps: 250, // 2.50%
    }
  }

  // Default routing
  return {
    network: 'VisaNet',
    processor: 'Default Gateway',
    priority: 2,
    fallback_network: 'Redcompra',
    routing_reason: `Marca no identificada — routing por defecto`,
    estimated_cost_bps: 200,
  }
}

/**
 * Returns all BIN entries (for display/admin purposes).
 */
export function getAllBINEntries(): BINEntry[] {
  return [...BIN_TABLE]
}
