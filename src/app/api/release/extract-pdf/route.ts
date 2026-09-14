import { NextResponse } from 'next/server'
import { extractText, getDocumentProxy } from 'unpdf'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// POST /api/release/extract-pdf
// Recibe un PDF (multipart/form-data, campo "file") y devuelve el
// texto extraído para que el Release Analyzer lo clasifique.
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No se recibió ningún archivo (campo "file").' }, { status: 400 })
    }

    if (file.type && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'El archivo debe ser un PDF.' }, { status: 400 })
    }

    const MAX_SIZE = 20 * 1024 * 1024 // 20MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El PDF supera el tamaño máximo permitido (20MB).' }, { status: 413 })
    }

    const buffer = await file.arrayBuffer()
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const { totalPages, text } = await extractText(pdf, { mergePages: true })

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No se pudo extraer texto del PDF. Puede ser un PDF escaneado (imagen) sin texto seleccionable.' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      file_name: (file as File).name ?? 'release-note.pdf',
      total_pages: totalPages,
      text,
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Error extrayendo texto del PDF' },
      { status: 500 }
    )
  }
}
