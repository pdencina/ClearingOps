import { NextRequest, NextResponse } from 'next/server'
import {
  tokenize,
  detokenize,
  getTokenInfo,
  getVaultStats,
  type TokenType,
} from '@/lib/engines/tokenization'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // Tokenize a PAN
    if (action === 'tokenize') {
      const { pan, token_type, merchant_id } = body

      if (!pan || pan.replace(/[\s-]/g, '').length < 13) {
        return NextResponse.json(
          { error: 'Se requiere un PAN válido (mínimo 13 dígitos)' },
          { status: 400 }
        )
      }

      const result = tokenize(
        pan,
        (token_type as TokenType) || 'permanent',
        merchant_id || null
      )

      return NextResponse.json({
        success: true,
        action: 'tokenize',
        ...result,
        vault_stats: getVaultStats(),
        timestamp: new Date().toISOString(),
      })
    }

    // Detokenize
    if (action === 'detokenize') {
      const { token } = body

      if (!token) {
        return NextResponse.json(
          { error: 'Se requiere un token' },
          { status: 400 }
        )
      }

      const pan = detokenize(token)

      if (!pan) {
        return NextResponse.json({
          success: false,
          action: 'detokenize',
          error: 'Token no encontrado o expirado',
          timestamp: new Date().toISOString(),
        })
      }

      return NextResponse.json({
        success: true,
        action: 'detokenize',
        pan,
        masked_pan: pan.substring(0, 6) + '******' + pan.slice(-4),
        timestamp: new Date().toISOString(),
      })
    }

    // Get token info (without PAN)
    if (action === 'info') {
      const { token } = body

      if (!token) {
        return NextResponse.json(
          { error: 'Se requiere un token' },
          { status: 400 }
        )
      }

      const info = getTokenInfo(token)

      if (!info) {
        return NextResponse.json({
          success: false,
          action: 'info',
          error: 'Token no encontrado',
          timestamp: new Date().toISOString(),
        })
      }

      return NextResponse.json({
        success: true,
        action: 'info',
        ...info,
        timestamp: new Date().toISOString(),
      })
    }

    // Get vault stats
    if (action === 'stats') {
      return NextResponse.json({
        success: true,
        action: 'stats',
        ...getVaultStats(),
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json(
      { error: 'Acción no válida. Use: tokenize, detokenize, info, stats' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: `Error en tokenización: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}
