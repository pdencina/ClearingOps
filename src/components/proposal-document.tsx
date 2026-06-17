'use client'

import { Download } from 'lucide-react'

export function ProposalDocument() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      {/* Print button - hidden when printing */}
      <div className="fixed top-6 right-6 z-50 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accent to-purple-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-accent/20 hover:from-accent-hover hover:to-purple-500 transition-all"
        >
          <Download className="w-4 h-4" />
          Descargar PDF
        </button>
      </div>

      {/* Document */}
      <article className="max-w-4xl mx-auto px-8 py-12 print:px-0 print:py-0 print:max-w-none text-[#1a1a2e] bg-white print:bg-white min-h-screen">
        <style jsx global>{`
          @media print {
            body { background: white !important; color: #1a1a2e !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            aside, nav, .print\\:hidden { display: none !important; }
            main { margin-left: 0 !important; padding: 0 !important; }
            article { break-inside: avoid; }
            .page-break { break-before: page; }
            table { font-size: 11px; }
            h1, h2, h3 { break-after: avoid; }
          }
        `}</style>

        {/* Header */}
        <header className="text-center mb-12 pb-8 border-b-2 border-[#6366f1]">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#6366f1] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-[#6366f1]">KLAP CORE</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">Propuesta de Independencia Tecnológica</h1>
          <p className="text-lg text-gray-600">Plan Estratégico para Eliminar la Dependencia de BPC SmartVista</p>
          <div className="mt-6 flex items-center justify-center gap-8 text-sm text-gray-500">
            <span>Preparado por: Equipo de Tecnología KLAP</span>
            <span>Fecha: Junio 2026</span>
            <span>Confidencial</span>
          </div>
        </header>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#6366f1] mb-4 pb-2 border-b border-gray-200">1. Resumen Ejecutivo</h2>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            KLAP depende de BPC SmartVista para procesos críticos del negocio: autorización, clearing, liquidación y operación. 
            Esta dependencia genera <strong>14 tickets abiertos</strong> esperando resolución (algunos con 9+ meses de antigüedad), 
            <strong> 3 a 8 semanas</strong> de espera para cualquier cambio, y un <strong>riesgo de negocio</strong> por vendor lock-in total.
          </p>
          <p className="text-sm leading-relaxed text-gray-700 mb-4">
            Se construyó <strong>KLAP CORE</strong>, un prototipo funcional desplegado en producción que demuestra que la lógica de negocio 
            de BPC puede ser operada internamente con 17 engines, 22 APIs y datos reales.
          </p>
          <div className="bg-[#f0f0ff] border border-[#6366f1]/20 rounded-lg p-4 mt-4">
            <p className="text-sm font-medium text-[#1a1a2e]">
              <strong>Propuesta:</strong> Formar un equipo SWAT interno con inversión incremental de <strong>$147.000.000 CLP</strong> en 12 meses 
              para eliminar la dependencia de BPC en clearing, liquidación y conciliación.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#6366f1] mb-4 pb-2 border-b border-gray-200">2. Situación Actual</h2>
          
          <h3 className="text-base font-semibold text-[#1a1a2e] mb-3">2.1 Problemas operativos documentados</h3>
          <table className="w-full text-xs border-collapse mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left">Ticket</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Problema</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Tiempo sin resolver</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-200 px-3 py-1.5 font-mono">KLAP-1806</td><td className="border border-gray-200 px-3 py-1.5">CM Transaction Fee MC en cero</td><td className="border border-gray-200 px-3 py-1.5 text-red-600">2-4 semanas</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5 font-mono">KLAP-1804</td><td className="border border-gray-200 px-3 py-1.5">Error de tramo en cuotas MC</td><td className="border border-gray-200 px-3 py-1.5 text-red-600">3-6 semanas</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5 font-mono">KLAP-1802</td><td className="border border-gray-200 px-3 py-1.5">CM aplica a todas las cuotas</td><td className="border border-gray-200 px-3 py-1.5 text-red-600">4-6 semanas</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5 font-mono">KLAP-940</td><td className="border border-gray-200 px-3 py-1.5">Rechazos no en Clearing Out</td><td className="border border-gray-200 px-3 py-1.5 text-red-600 font-bold">9+ meses</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5 font-mono">KLAP-1086</td><td className="border border-gray-200 px-3 py-1.5">Cuadratura SVXP vs Outgoing</td><td className="border border-gray-200 px-3 py-1.5 text-red-600 font-bold">8+ meses</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5 font-mono">KLAP-1681</td><td className="border border-gray-200 px-3 py-1.5">Acceso a datos bloqueado</td><td className="border border-gray-200 px-3 py-1.5 text-red-600">5+ semanas</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5 font-mono">KLAP-1748</td><td className="border border-gray-200 px-3 py-1.5">Release Visa Q2 (esperando BPC)</td><td className="border border-gray-200 px-3 py-1.5 text-red-600">Indefinido</td></tr>
            </tbody>
          </table>

          <h3 className="text-base font-semibold text-[#1a1a2e] mb-3 mt-8">2.2 Incidente Crítico: Rechazo Masivo Mastercard (Mayo 2025)</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-xs text-red-800 leading-relaxed mb-3">
              El 22 de mayo de 2025, un release de SmartVista (R25.40) incluyó un campo en desarrollo (PDS0216 SF5) 
              en el archivo de clearing enviado a Mastercard. El campo no fue reconocido por la marca, provocando un 
              <strong> rechazo masivo de 1.149.826 transacciones</strong>.
            </p>
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr><td className="border border-red-200 px-3 py-1.5 font-medium bg-red-100/50">Transacciones rechazadas</td><td className="border border-red-200 px-3 py-1.5 font-bold text-red-700">1.149.826</td></tr>
                <tr><td className="border border-red-200 px-3 py-1.5 font-medium">Multa</td><td className="border border-red-200 px-3 py-1.5">Mastercard multó a KLAP por volumen de rechazos</td></tr>
                <tr><td className="border border-red-200 px-3 py-1.5 font-medium">Impacto flujo de caja</td><td className="border border-red-200 px-3 py-1.5">Demora en pago de marca a cta. compensación</td></tr>
                <tr><td className="border border-red-200 px-3 py-1.5 font-medium">Tiempo resolución</td><td className="border border-red-200 px-3 py-1.5">18 horas de war room (5 equipos)</td></tr>
                <tr><td className="border border-red-200 px-3 py-1.5 font-medium">Causa raíz</td><td className="border border-red-200 px-3 py-1.5">BPC incluyó campo no certificado en producción</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-red-800 font-medium mt-3">
              Con clearing propio de KLAP, este incidente no habría ocurrido: el sistema valida formato contra la especificación 
              de la marca antes de generar el archivo.
            </p>
          </div>

          <h3 className="text-base font-semibold text-[#1a1a2e] mb-3">2.3 Impacto financiero anual estimado</h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left">Concepto</th>
                <th className="border border-gray-200 px-3 py-2 text-right">Costo Anual (CLP)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-200 px-3 py-1.5">Fee de procesamiento BPC</td><td className="border border-gray-200 px-3 py-1.5 text-right">$300M - $600M</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5">Soporte y mantención</td><td className="border border-gray-200 px-3 py-1.5 text-right">$114M - $228M</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5">Releases y cambios</td><td className="border border-gray-200 px-3 py-1.5 text-right">$30M - $84M</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5">Productividad perdida</td><td className="border border-gray-200 px-3 py-1.5 text-right">$60M - $96M</td></tr>
              <tr className="font-bold bg-red-50"><td className="border border-gray-200 px-3 py-2">TOTAL ESTIMADO</td><td className="border border-gray-200 px-3 py-2 text-right text-red-600">$504M - $1.008M</td></tr>
            </tbody>
          </table>
        </section>

        {/* Section 3 */}
        <section className="mb-10 page-break">
          <h2 className="text-xl font-bold text-[#6366f1] mb-4 pb-2 border-b border-gray-200">3. KLAP CORE — Lo que ya construimos</h2>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-[#f0f0ff] rounded-lg">
              <p className="text-2xl font-bold text-[#6366f1]">17</p>
              <p className="text-[10px] text-gray-600 uppercase">Engines</p>
            </div>
            <div className="text-center p-3 bg-[#f0f0ff] rounded-lg">
              <p className="text-2xl font-bold text-[#6366f1]">22</p>
              <p className="text-[10px] text-gray-600 uppercase">APIs</p>
            </div>
            <div className="text-center p-3 bg-[#f0f0ff] rounded-lg">
              <p className="text-2xl font-bold text-[#6366f1]">21</p>
              <p className="text-[10px] text-gray-600 uppercase">Pantallas</p>
            </div>
            <div className="text-center p-3 bg-[#f0f0ff] rounded-lg">
              <p className="text-2xl font-bold text-[#6366f1]">100x</p>
              <p className="text-[10px] text-gray-600 uppercase">Más rápido</p>
            </div>
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left">Engine</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Función</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Reemplaza de BPC</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-200 px-3 py-1.5 font-medium">Authorization</td><td className="border border-gray-200 px-3 py-1.5">Aprobación con reglas y risk scoring</td><td className="border border-gray-200 px-3 py-1.5">Módulo autorización SmartVista</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5 font-medium">Fraud Detection</td><td className="border border-gray-200 px-3 py-1.5">8 checks antifraude + modelo ML</td><td className="border border-gray-200 px-3 py-1.5">Motor de fraude BPC</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5 font-medium">Clearing</td><td className="border border-gray-200 px-3 py-1.5">Generador CTF (Visa) e IPM (MC)</td><td className="border border-gray-200 px-3 py-1.5">Proceso clearing BPC</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5 font-medium">Settlement</td><td className="border border-gray-200 px-3 py-1.5">Comisiones, IVA, retenciones, neto</td><td className="border border-gray-200 px-3 py-1.5">Motor liquidación BPC</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5 font-medium">Reconciliation</td><td className="border border-gray-200 px-3 py-1.5">Conciliación KLAP vs Banco vs Marca</td><td className="border border-gray-200 px-3 py-1.5">No existe (KLAP-1086)</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5 font-medium">ISO 8583</td><td className="border border-gray-200 px-3 py-1.5">Parser/Builder protocolo tarjetas</td><td className="border border-gray-200 px-3 py-1.5">Capa comunicación SmartVista</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5 font-medium">BIN Table</td><td className="border border-gray-200 px-3 py-1.5">35 BINs chilenos + routing</td><td className="border border-gray-200 px-3 py-1.5">Tabla BINs BPC</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5 font-medium">Tokenization</td><td className="border border-gray-200 px-3 py-1.5">Vault PCI DSS</td><td className="border border-gray-200 px-3 py-1.5">Módulo tokens BPC</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5 font-medium">3D Secure</td><td className="border border-gray-200 px-3 py-1.5">Autenticación 3DS 2.2</td><td className="border border-gray-200 px-3 py-1.5">Integración 3DS BPC</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5 font-medium">Scheduler</td><td className="border border-gray-200 px-3 py-1.5">Jobs batch programados</td><td className="border border-gray-200 px-3 py-1.5">Scheduler BPC</td></tr>
            </tbody>
          </table>
        </section>

        {/* Section 4 */}
        <section className="mb-10 page-break">
          <h2 className="text-xl font-bold text-[#6366f1] mb-4 pb-2 border-b border-gray-200">4. Propuesta de Ejecución — Equipo SWAT</h2>
          
          <h3 className="text-base font-semibold text-[#1a1a2e] mb-3">4.1 Estructura del equipo</h3>
          <table className="w-full text-xs border-collapse mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left">Rol</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Origen</th>
                <th className="border border-gray-200 px-3 py-2 text-center">Dedicación</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Costo incremental</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-200 px-3 py-1.5">Lead técnico</td><td className="border border-gray-200 px-3 py-1.5">Equipo actual</td><td className="border border-gray-200 px-3 py-1.5 text-center">80%</td><td className="border border-gray-200 px-3 py-1.5 text-green-700">$0 (reasignación)</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5">Dev clearing/liquidación</td><td className="border border-gray-200 px-3 py-1.5">Equipo actual (opera SVXP)</td><td className="border border-gray-200 px-3 py-1.5 text-center">100%</td><td className="border border-gray-200 px-3 py-1.5 text-green-700">$0 (reasignación)</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5">Dev autorización/fraude</td><td className="border border-gray-200 px-3 py-1.5">Equipo actual (switch)</td><td className="border border-gray-200 px-3 py-1.5 text-center">100%</td><td className="border border-gray-200 px-3 py-1.5 text-green-700">$0 (reasignación)</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5">DevOps</td><td className="border border-gray-200 px-3 py-1.5">Infra actual</td><td className="border border-gray-200 px-3 py-1.5 text-center">50%</td><td className="border border-gray-200 px-3 py-1.5 text-green-700">$0 (reasignación)</td></tr>
              <tr className="font-medium"><td className="border border-gray-200 px-3 py-1.5">Senior Developer</td><td className="border border-gray-200 px-3 py-1.5 text-[#6366f1]">Contratación nueva</td><td className="border border-gray-200 px-3 py-1.5 text-center">100%</td><td className="border border-gray-200 px-3 py-1.5">$6.000.000/mes</td></tr>
            </tbody>
          </table>

          <h3 className="text-base font-semibold text-[#1a1a2e] mb-3">4.2 Inversión incremental (12 meses)</h3>
          <table className="w-full text-xs border-collapse mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left">Concepto</th>
                <th className="border border-gray-200 px-3 py-2 text-right">Costo mensual</th>
                <th className="border border-gray-200 px-3 py-2 text-right">12 meses</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-200 px-3 py-1.5">Contratación Senior Developer</td><td className="border border-gray-200 px-3 py-1.5 text-right">$6.000.000</td><td className="border border-gray-200 px-3 py-1.5 text-right">$72.000.000</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5">Infraestructura cloud</td><td className="border border-gray-200 px-3 py-1.5 text-right">$2.500.000</td><td className="border border-gray-200 px-3 py-1.5 text-right">$30.000.000</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5">Herramientas CI/CD y monitoring</td><td className="border border-gray-200 px-3 py-1.5 text-right">$800.000</td><td className="border border-gray-200 px-3 py-1.5 text-right">$9.600.000</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5">Consultoría (ISO 8583, PCI)</td><td className="border border-gray-200 px-3 py-1.5 text-right">—</td><td className="border border-gray-200 px-3 py-1.5 text-right">$15.000.000</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5">Re-certificación PCI módulo nuevo</td><td className="border border-gray-200 px-3 py-1.5 text-right">—</td><td className="border border-gray-200 px-3 py-1.5 text-right">$20.000.000</td></tr>
              <tr className="font-bold bg-[#f0f0ff]"><td className="border border-gray-200 px-3 py-2">TOTAL INVERSIÓN</td><td className="border border-gray-200 px-3 py-2 text-right"></td><td className="border border-gray-200 px-3 py-2 text-right text-[#6366f1]">$146.600.000</td></tr>
            </tbody>
          </table>

          <h3 className="text-base font-semibold text-[#1a1a2e] mb-3">4.3 Cronograma</h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left">Mes</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Hito</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Resultado</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-200 px-3 py-1.5 font-medium">1-2</td><td className="border border-gray-200 px-3 py-1.5">Clearing Engine</td><td className="border border-gray-200 px-3 py-1.5">Archivos CTF/IPM propios en paralelo</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5 font-medium">3-4</td><td className="border border-gray-200 px-3 py-1.5">Settlement Engine</td><td className="border border-gray-200 px-3 py-1.5">Comisiones correctas (7 tickets resueltos)</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5 font-medium">5-6</td><td className="border border-gray-200 px-3 py-1.5">Reconciliation</td><td className="border border-gray-200 px-3 py-1.5">Cuadratura automática SVXP vs Outgoing</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5 font-medium">7-8</td><td className="border border-gray-200 px-3 py-1.5">Switch propio</td><td className="border border-gray-200 px-3 py-1.5">Auth rules y BIN routing conectados</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5 font-medium">9-10</td><td className="border border-gray-200 px-3 py-1.5">Shadow mode</td><td className="border border-gray-200 px-3 py-1.5">Paralelo con BPC, validando paridad</td></tr>
              <tr className="bg-gray-50 font-medium"><td className="border border-gray-200 px-3 py-1.5">11-12</td><td className="border border-gray-200 px-3 py-1.5">Migración</td><td className="border border-gray-200 px-3 py-1.5">Corte de clearing a BPC</td></tr>
            </tbody>
          </table>
        </section>

        {/* Section 5 */}
        <section className="mb-10 page-break">
          <h2 className="text-xl font-bold text-[#6366f1] mb-4 pb-2 border-b border-gray-200">5. Análisis Financiero</h2>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-xs text-red-800 font-medium uppercase mb-1">Costo anual BPC (estimado)</p>
              <p className="text-2xl font-bold text-red-700">$504M - $1.008M</p>
              <p className="text-xs text-red-600 mt-1">Fee + soporte + releases + productividad perdida</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-green-800 font-medium uppercase mb-1">Inversión única KLAP propio</p>
              <p className="text-2xl font-bold text-green-700">$147M</p>
              <p className="text-xs text-green-600 mt-1">Equipo SWAT + infra + certificación (12 meses)</p>
            </div>
          </div>

          <table className="w-full text-xs border-collapse mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left">Métrica</th>
                <th className="border border-gray-200 px-3 py-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-200 px-3 py-1.5">Inversión total</td><td className="border border-gray-200 px-3 py-1.5 text-right font-medium">$147.000.000</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5">Ahorro mensual post-corte</td><td className="border border-gray-200 px-3 py-1.5 text-right">$30.000.000 - $58.000.000</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5 font-medium">Payback</td><td className="border border-gray-200 px-3 py-1.5 text-right font-bold text-green-700">3 a 5 meses</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5">Ahorro primer año post-migración</td><td className="border border-gray-200 px-3 py-1.5 text-right font-medium text-green-700">$213M - $549M</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5">Ahorro acumulado 3 años</td><td className="border border-gray-200 px-3 py-1.5 text-right font-bold text-green-700">$639M - $1.647M</td></tr>
            </tbody>
          </table>

          <h3 className="text-base font-semibold text-[#1a1a2e] mb-3">Velocidad de resolución</h3>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-red-600">3-8 semanas</p>
              <p className="text-[10px] text-gray-600">Con BPC</p>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-green-600">0-10 minutos</p>
              <p className="text-[10px] text-gray-600">Con KLAP propio</p>
            </div>
            <div className="text-center flex-1 bg-[#6366f1] text-white rounded-lg p-2">
              <p className="text-lg font-bold">100x</p>
              <p className="text-[10px]">Más rápido</p>
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#6366f1] mb-4 pb-2 border-b border-gray-200">6. Gestión de Riesgo</h2>
          
          <table className="w-full text-xs border-collapse mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left">Riesgo</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Mitigación</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-200 px-3 py-1.5">Sistema propio tiene bugs</td><td className="border border-gray-200 px-3 py-1.5">Shadow mode valida paridad antes de cortar</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5">Equipo no alcanza en 12 meses</td><td className="border border-gray-200 px-3 py-1.5">Fase 1 (clearing) da valor sin cortar BPC</td></tr>
              <tr><td className="border border-gray-200 px-3 py-1.5">Certificación demora</td><td className="border border-gray-200 px-3 py-1.5">Se mantiene BPC como fallback</td></tr>
              <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-1.5">Resistencia interna</td><td className="border border-gray-200 px-3 py-1.5">Prototipo ya funciona — no es teórico</td></tr>
            </tbody>
          </table>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-medium text-blue-800 mb-2">Enfoque de bajo riesgo:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Meses 1-6: Se construye en paralelo. BPC sigue operando normalmente.</li>
              <li>• Meses 7-10: Shadow mode. Ambos sistemas corren, se comparan.</li>
              <li>• Meses 11-12: Solo si hay 100% paridad, se corta BPC.</li>
            </ul>
            <p className="text-xs font-medium text-blue-800 mt-2">Si en algún punto no funciona, se mantiene BPC sin impacto.</p>
          </div>
        </section>

        {/* Section 7 */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-[#6366f1] mb-4 pb-2 border-b border-gray-200">7. Lo que Pedimos</h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-6 h-6 bg-[#6366f1] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <div>
                <p className="text-sm font-medium text-[#1a1a2e]">Aprobación para formar el equipo SWAT</p>
                <p className="text-xs text-gray-600">Reasignación de 3 personas internas + 1 contratación nueva</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-6 h-6 bg-[#6366f1] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <div>
                <p className="text-sm font-medium text-[#1a1a2e]">Presupuesto de $147.000.000 CLP para 12 meses</p>
                <p className="text-xs text-gray-600">Contratación + infraestructura + herramientas + certificación</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-6 h-6 bg-[#6366f1] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <div>
                <p className="text-sm font-medium text-[#1a1a2e]">Prioridad del proyecto en el roadmap</p>
                <p className="text-xs text-gray-600">Dedicación del equipo SWAT sin interrupciones de otros proyectos</p>
              </div>
            </div>
          </div>
        </section>

        {/* Conclusion */}
        <section className="mb-10 p-6 bg-[#f0f0ff] border border-[#6366f1]/30 rounded-lg">
          <h2 className="text-xl font-bold text-[#6366f1] mb-3">Conclusión</h2>
          <p className="text-sm leading-relaxed text-gray-700 mb-3">
            La dependencia de BPC no es un problema técnico insuperable — es una decisión de negocio que podemos cambiar. 
            KLAP CORE demuestra que el equipo interno tiene la capacidad de construir y operar los procesos críticos de forma autónoma.
          </p>
          <p className="text-sm leading-relaxed text-gray-700 mb-3">
            La inversión de $147M se recupera en 3-5 meses y genera un ahorro sostenido de $360M-$696M anuales. 
            El riesgo es bajo porque se opera en paralelo hasta validar paridad completa.
          </p>
          <p className="text-base font-bold text-[#1a1a2e]">
            La pregunta no es si podemos hacerlo — ya lo demostramos. La pregunta es cuándo empezamos.
          </p>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 pt-6 border-t border-gray-200">
          <p>KLAP CORE — Payment Operating System · Documento Confidencial · Junio 2026</p>
        </footer>
      </article>
    </>
  )
}
