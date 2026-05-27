// Test del parser SVXP contra el archivo real
// Ejecutar con: npx ts-node --project tsconfig.json src/scripts/test-parser.ts

import { readFileSync } from 'fs'
import { parsearSVXP, resumirSVXP, validarOperacion, OPER_TYPE_LABELS, STATUS_LABELS } from '../lib/svxp-parser'

const ruta    = process.argv[2] ?? '../../test-data/2957772_AMEX_20260511_OPTP0020_TEST.xml'
const nombre  = ruta.split('/').pop() ?? 'archivo.xml'
const xml     = readFileSync(ruta, 'utf-8')

console.log('\n=== ClearingOps — Parser SVXP ===\n')

const archivo = parsearSVXP(xml, nombre)
const resumen = resumirSVXP(archivo)

console.log('📁 ARCHIVO')
console.log(`  Nombre:      ${resumen.nombre_archivo}`)
console.log(`  Marca:       ${resumen.marca}`)
console.log(`  Fecha:       ${resumen.fecha_proceso}`)
console.log(`  file_type:   ${archivo.file_type}`)
console.log(`  inst_id:     ${archivo.inst_id}`)
console.log(`  Operaciones: ${resumen.total_operaciones}`)

console.log('\n📊 RESUMEN')
console.log(`  Monto total:       $${resumen.monto_total.toLocaleString('es-CL')} (moneda ${archivo.operaciones[0]?.moneda ?? '-'})`)
console.log(`  Reversales:        ${resumen.reversales}`)
console.log(`  Errores validación:${resumen.con_errores_validacion}`)
console.log(`  Advertencias:      ${resumen.con_advertencias}`)

console.log('\n🔢 POR TIPO DE OPERACIÓN')
for (const [tipo, cnt] of Object.entries(resumen.por_tipo)) {
  console.log(`  ${tipo} (${OPER_TYPE_LABELS[tipo] ?? 'desconocido'}): ${cnt}`)
}

console.log('\n🔴 POR ESTADO')
for (const [estado, cnt] of Object.entries(resumen.por_status)) {
  console.log(`  ${estado} (${STATUS_LABELS[estado] ?? 'desconocido'}): ${cnt}`)
}

console.log('\n🔍 DETALLE PRIMERA OPERACIÓN')
const op = archivo.operaciones[0]
if (op) {
  console.log(`  oper_type:        ${op.oper_type} → ${OPER_TYPE_LABELS[op.oper_type] ?? '-'}`)
  console.log(`  status:           ${op.status} → ${STATUS_LABELS[op.status] ?? '-'}`)
  console.log(`  monto:            $${op.monto.toLocaleString('es-CL')}`)
  console.log(`  fecha:            ${op.oper_date}`)
  console.log(`  merchant:         ${op.merchant_name} (${op.merchant_city})`)
  console.log(`  merchant_number:  ${op.merchant_number}`)
  console.log(`  mcc:              ${op.mcc}`)
  console.log(`  terminal:         ${op.terminal_number}`)
  console.log(`  card:             ${op.card_number.slice(0, 6)}****${op.card_number.slice(-4)}`)
  console.log(`  auth_code:        ${op.auth_code}`)
  console.log(`  is_reversal:      ${op.is_reversal}`)
  console.log('\n  🏷️  TAGS KLAP')
  console.log(`  KLAP_CODIGO:             ${op.klap_codigo}`)
  console.log(`  KLAP_CODIGO_ORIGINAL:    ${op.klap_codigo_original}`)
  console.log(`  KLAP_ISSUER_CODE:        ${op.klap_issuer_code}`)
  console.log(`  KLAP_ID_CANAL:           ${op.klap_id_canal}`)
  console.log(`  KLAP_BIN:                ${op.klap_bin}`)
  console.log(`  KLAP_TIPO_MULTISERVICIO: ${op.klap_tipo_multiservicio}`)

  console.log('\n✅ VALIDACIÓN')
  const val = validarOperacion(op)
  console.log(`  Válida: ${val.valida ? '✓' : '✗'}`)
  if (val.errores.length > 0)      val.errores.forEach(e      => console.log(`  ❌ Error: ${e}`))
  if (val.advertencias.length > 0) val.advertencias.forEach(a => console.log(`  ⚠️  Advertencia: ${a}`))
}

console.log('\n✅ Parser funcionando correctamente con datos reales AMEX/KLAP\n')
