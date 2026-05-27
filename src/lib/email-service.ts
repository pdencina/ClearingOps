// ============================================================
// ClearingOps — Servicio de Email con Resend
// Envía alertas automáticas cuando hay diferencias de cuadratura
// ============================================================

import type { ResultadoCuadratura } from './cuadratura-engine'

// ============================================================
// Enviar email de alerta de cuadratura
// ============================================================
export async function enviarEmailCuadratura(
  resultados: ResultadoCuadratura[],
  fecha: string,
  destinatarios: string[]
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY no configurada — email no enviado')
    return false
  }

  const conDiferencia = resultados.filter(r => r.estado === 'diferencia')
  const totalAlertas  = resultados.reduce((s, r) => s + r.alertas.length, 0)

  // Solo enviar si hay diferencias o alertas
  if (conDiferencia.length === 0 && totalAlertas === 0) {
    console.log('[email] Cuadratura ok — no se envía email')
    return true
  }

  const asunto = conDiferencia.length > 0
    ? `⚠️ ClearingOps — Diferencia de cuadratura ${fecha} (${conDiferencia.length} marca${conDiferencia.length > 1 ? 's' : ''})`
    : `ℹ️ ClearingOps — Reporte de cuadratura ${fecha}`

  const html = generarHTMLEmail(resultados, fecha)

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'ClearingOps <alertas@clearingops.com>',
        to:      destinatarios,
        subject: asunto,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[email] Error Resend:', err)
      return false
    }

    console.log(`[email] Enviado a ${destinatarios.join(', ')}`)
    return true

  } catch (e) {
    console.error('[email] Error de red:', e)
    return false
  }
}

// ============================================================
// Template HTML del email de alerta
// ============================================================
function generarHTMLEmail(resultados: ResultadoCuadratura[], fecha: string): string {
  const fmtNum = (n: number) => n.toLocaleString('es-CL')
  const conDiferencia = resultados.filter(r => r.estado === 'diferencia')
  const ok            = resultados.filter(r => r.estado === 'ok')

  const filasResultados = resultados.map(r => {
    const color    = r.estado === 'ok' ? '#16a34a' : '#dc2626'
    const bgColor  = r.estado === 'ok' ? '#f0fdf4' : '#fef2f2'
    const icono    = r.estado === 'ok' ? '✅' : '⚠️'
    return `
      <tr style="background:${bgColor}">
        <td style="padding:10px 12px;font-weight:500">${icono} ${r.marca}</td>
        <td style="padding:10px 12px;text-align:right">${fmtNum(r.trx_svxp)}</td>
        <td style="padding:10px 12px;text-align:right">${fmtNum(r.trx_ctf + r.trx_ipm)}</td>
        <td style="padding:10px 12px;text-align:right;color:${r.trx_error > 0 ? '#dc2626' : '#6b7280'}">${fmtNum(r.trx_error)}</td>
        <td style="padding:10px 12px;text-align:right;color:${r.trx_frozen > 0 ? '#dc2626' : '#6b7280'}">${fmtNum(r.trx_frozen)}</td>
        <td style="padding:10px 12px;text-align:right;font-weight:600;color:${color}">${r.diferencia > 0 ? '+' : ''}${fmtNum(r.diferencia)}</td>
      </tr>`
  }).join('')

  const filasAlertas = resultados.flatMap(r => r.alertas).map(a => {
    const colores: Record<string, string> = {
      critica: '#fee2e2', alta: '#ffedd5', media: '#fefce8', baja: '#f9fafb'
    }
    return `
      <tr>
        <td style="padding:10px 12px;background:${colores[a.severidad] ?? '#f9fafb'}">
          <div style="font-weight:500;font-size:13px">${a.titulo}</div>
          <div style="color:#6b7280;font-size:12px;margin-top:2px">${a.detalle}</div>
        </td>
        <td style="padding:10px 12px;text-align:center;background:${colores[a.severidad] ?? '#f9fafb'}">
          <span style="font-size:11px;font-weight:600;text-transform:uppercase">${a.severidad}</span>
        </td>
        <td style="padding:10px 12px;text-align:right;background:${colores[a.severidad] ?? '#f9fafb'};font-weight:500">
          ${fmtNum(a.cantidad_trx)}
        </td>
      </tr>`
  }).join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:640px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">

    <!-- Header -->
    <div style="background:#111827;padding:24px 32px;display:flex;align-items:center;gap:12px">
      <div style="width:32px;height:32px;background:#374151;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px">⚡</div>
      <div>
        <div style="color:white;font-weight:600;font-size:16px">ClearingOps</div>
        <div style="color:#9ca3af;font-size:12px">Reporte de cuadratura — ${fecha}</div>
      </div>
    </div>

    <!-- Resumen ejecutivo -->
    <div style="padding:24px 32px;border-bottom:1px solid #f3f4f6">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
        <div style="background:#f9fafb;border-radius:8px;padding:14px">
          <div style="font-size:11px;color:#6b7280;margin-bottom:4px">Marcas procesadas</div>
          <div style="font-size:24px;font-weight:600;color:#111827">${resultados.length}</div>
        </div>
        <div style="background:${conDiferencia.length > 0 ? '#fef2f2' : '#f0fdf4'};border-radius:8px;padding:14px">
          <div style="font-size:11px;color:#6b7280;margin-bottom:4px">Con diferencia</div>
          <div style="font-size:24px;font-weight:600;color:${conDiferencia.length > 0 ? '#dc2626' : '#16a34a'}">${conDiferencia.length}</div>
        </div>
        <div style="background:#f0fdf4;border-radius:8px;padding:14px">
          <div style="font-size:11px;color:#6b7280;margin-bottom:4px">Ok</div>
          <div style="font-size:24px;font-weight:600;color:#16a34a">${ok.length}</div>
        </div>
      </div>
    </div>

    <!-- Tabla cuadratura -->
    <div style="padding:24px 32px">
      <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#111827">Resultado por marca</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb">
            <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:500">Marca</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:500">SVXP</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:500">CTF/IPM</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:500">Error</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:500">Frozen</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:500">Diferencia</th>
          </tr>
        </thead>
        <tbody>${filasResultados}</tbody>
      </table>
    </div>

    <!-- Alertas generadas -->
    ${resultados.flatMap(r => r.alertas).length > 0 ? `
    <div style="padding:0 32px 24px">
      <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#111827">Alertas generadas</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb">
            <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:500">Descripción</th>
            <th style="padding:8px 12px;text-align:center;color:#6b7280;font-weight:500">Severidad</th>
            <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:500">TRX afectadas</th>
          </tr>
        </thead>
        <tbody>${filasAlertas}</tbody>
      </table>
    </div>` : ''}

    <!-- Footer -->
    <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center">
      <a href="https://clearing-ops.vercel.app" style="display:inline-block;background:#111827;color:white;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:500">
        Ver dashboard completo →
      </a>
      <p style="margin:12px 0 0;font-size:11px;color:#9ca3af">
        ClearingOps · Reporte automático generado a las ${new Date().toLocaleTimeString('es-CL')}
      </p>
    </div>
  </div>
</body>
</html>`
}
