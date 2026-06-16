import { NextRequest, NextResponse } from 'next/server'
import { lookupBIN, routeTransaction } from '@/lib/engines/bin-table'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pan } = body

    if (!pan || pan.length < 8) {
      return NextResponse.json(
        { error: 'Se requiere un PAN válido (mínimo 8 dígitos)' },
        { status: 400 }
      )
    }

    // Lookup BIN info
    const binInfo = lookupBIN(pan)

    // Get routing decision
    const routing = routeTransaction(pan)

    return NextResponse.json({
      success: true,
      bin_info: binInfo,
      routing,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Error en BIN lookup: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}
