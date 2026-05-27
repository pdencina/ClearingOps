'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react'

interface ResultadoUpload {
  ok: boolean
  archivo?: {
    id: string
    nombre: string
    marca: string
    fecha_proceso: string
    total_trx: number
    insertadas: number
    estado: string
  }
  resumen?: {
    por_tipo: Record<string, number>
    monto_total: number
    con_errores_validacion: number
    reversales: number
  }
  alertas_generadas?: string[]
  error?: string
  detalle?: string
}

interface Props {
  onSuccess?: () => void
}

export function SVXPUploader({ onSuccess }: Props) {
  const [arrastrando, setArrastrando]   = useState(false)
  const [procesando,  setProcesando]    = useState(false)
  const [resultado,   setResultado]     = useState<ResultadoUpload | null>(null)

  const procesarArchivo = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xml') && !file.name.endsWith('.gpg')) {
      setResultado({ ok: false, error: 'Solo se aceptan archivos .xml o .gpg' })
      return
    }

    setProcesando(true)
    setResultado(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res  = await fetch('/api/ingestor', { method: 'POST', body: formData })
      const data = await res.json() as ResultadoUpload
      setResultado(data)
      if (data.ok && onSuccess) onSuccess()
    } catch {
      setResultado({ ok: false, error: 'Error de conexión al procesar el archivo' })
    } finally {
      setProcesando(false)
    }
  }, [onSuccess])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setArrastrando(false)
    const file = e.dataTransfer.files[0]
    if (file) procesarArchivo(file)
  }, [procesarArchivo])

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) procesarArchivo(file)
    e.target.value = ''
  }, [procesarArchivo])

  const fmtNum = (n: number) => n.toLocaleString('es-CL')

  return (
    <div className="space-y-4">
      {/* Zona de drop */}
      <div
        onDragOver={e => { e.preventDefault(); setArrastrando(true) }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          arrastrando
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <input
          type="file"
          accept=".xml,.gpg"
          onChange={onInputChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={procesando}
        />

        {procesando ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm font-medium text-gray-700">Procesando archivo...</p>
            <p className="text-xs text-gray-400">Parseando, validando y guardando en Supabase</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${arrastrando ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Upload className={`w-6 h-6 ${arrastrando ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {arrastrando ? 'Suelta el archivo aquí' : 'Arrastra un archivo SVXP aquí'}
              </p>
              <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar — .xml o .gpg</p>
            </div>
            <p className="text-xs text-gray-300">VISA · Mastercard · AMEX · Maestro</p>
          </div>
        )}
      </div>

      {/* Resultado */}
      {resultado && (
        <div className={`rounded-xl border p-4 ${
          resultado.ok
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {resultado.ok
              ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              : <XCircle    className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            }
            <div className="flex-1 min-w-0">
              {resultado.ok && resultado.archivo ? (
                <>
                  <p className="text-sm font-medium text-green-800 mb-2">
                    Archivo procesado — {fmtNum(resultado.archivo.insertadas)} TRX guardadas
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white rounded-lg p-2 border border-green-100">
                      <p className="text-gray-400">Marca</p>
                      <p className="font-medium text-gray-700">{resultado.archivo.marca}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-green-100">
                      <p className="text-gray-400">Fecha proceso</p>
                      <p className="font-medium text-gray-700">{resultado.archivo.fecha_proceso}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-green-100">
                      <p className="text-gray-400">Total TRX</p>
                      <p className="font-medium text-gray-700">{fmtNum(resultado.archivo.total_trx)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-green-100">
                      <p className="text-gray-400">Con errores</p>
                      <p className={`font-medium ${(resultado.resumen?.con_errores_validacion ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {resultado.resumen?.con_errores_validacion ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* Alertas generadas */}
                  {(resultado.alertas_generadas ?? []).length > 0 && (
                    <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-amber-700">Alertas generadas automáticamente</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          {resultado.alertas_generadas!.join(', ')} — revisa la pestaña Alertas
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="text-sm font-medium text-red-800">Error al procesar el archivo</p>
                  <p className="text-xs text-red-600 mt-1">{resultado.error}</p>
                  {resultado.detalle && resultado.detalle !== '[object Object]' && (
                    <p className="text-xs text-red-400 mt-1 font-mono bg-red-100 rounded p-1">{resultado.detalle}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    💡 Si el error es de tablas o permisos, abre{' '}
                    <a href="/api/diagnostico" target="_blank" className="text-blue-500 underline">
                      /api/diagnostico
                    </a>{' '}
                    para ver el diagnóstico completo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Modal de upload — para abrir desde el dashboard
// ============================================================
export function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Subir archivo SVXP</h2>
              <p className="text-xs text-gray-400">Parsea, valida y guarda en Supabase</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <SVXPUploader onSuccess={() => { onSuccess(); setTimeout(onClose, 2000) }} />

        <p className="text-xs text-gray-400 text-center mt-4">
          Los archivos se procesan en memoria — no se almacena el XML original, solo las TRX parseadas.
        </p>
      </div>
    </div>
  )
}
