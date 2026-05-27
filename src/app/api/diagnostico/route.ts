import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const checks: Record<string, unknown> = {
    env_url: url ? '✅ configurada' : '❌ falta NEXT_PUBLIC_SUPABASE_URL',
    env_key: key ? '✅ configurada' : '❌ falta NEXT_PUBLIC_SUPABASE_ANON_KEY',
  }

  if (!url || !key) {
    return NextResponse.json({ ok: false, checks }, { status: 500 })
  }

  const sb = createClient(url, key)

  // Verificar cada tabla
  for (const tabla of ['archivos', 'transacciones', 'cuadratura_diaria', 'alertas', 'configuracion']) {
    const { error, count } = await sb.from(tabla).select('*', { count: 'exact', head: true })
    checks[`tabla_${tabla}`] = error
      ? `❌ ${error.message} (code: ${error.code})`
      : `✅ existe (${count ?? 0} filas)`
  }

  // Test insert
  const { error: insertError } = await sb.from('archivos').insert({
    nombre: 'test-diagnostico.xml', tipo: 'SVXP', marca: 'VISA',
    fecha_proceso: new Date().toISOString().split('T')[0],
    total_trx: 0, estado: 'ok', notas: 'test diagnostico'
  })

  if (insertError) {
    checks.test_insert = `❌ ${insertError.message} (code: ${insertError.code})`
  } else {
    checks.test_insert = '✅ insert funciona'
    await sb.from('archivos').delete().eq('nombre', 'test-diagnostico.xml')
  }

  const todoOk = Object.values(checks).every(v => String(v).startsWith('✅'))
  return NextResponse.json({ ok: todoOk, checks }, { status: todoOk ? 200 : 500 })
}
