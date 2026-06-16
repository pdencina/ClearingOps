import { NextRequest, NextResponse } from 'next/server'
import {
  buildMessage,
  parseMessage,
  buildAuthRequest,
  buildAuthResponse,
  getMTIDescription,
  getResponseDescription,
  type MTI,
} from '@/lib/engines/iso8583'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Action: build a message
    if (body.action === 'build') {
      const { mti, fields } = body

      if (!mti || !fields) {
        return NextResponse.json(
          { error: 'Se requieren "mti" y "fields"' },
          { status: 400 }
        )
      }

      // Convert field keys to numbers
      const numericFields: Record<number, string> = {}
      for (const [key, value] of Object.entries(fields)) {
        numericFields[parseInt(key)] = value as string
      }

      const hexMessage = buildMessage(mti as MTI, numericFields)

      return NextResponse.json({
        success: true,
        action: 'build',
        mti,
        mti_description: getMTIDescription(mti),
        hex_message: hexMessage,
        message_length: hexMessage.length / 2,
        field_count: Object.keys(fields).length,
        timestamp: new Date().toISOString(),
      })
    }

    // Action: build auth request
    if (body.action === 'build_auth_request') {
      const hexMessage = buildAuthRequest(body.params)
      const parsed = parseMessage(hexMessage)

      return NextResponse.json({
        success: true,
        action: 'build_auth_request',
        hex_message: hexMessage,
        message_length: hexMessage.length / 2,
        parsed,
        timestamp: new Date().toISOString(),
      })
    }

    // Action: build auth response
    if (body.action === 'build_auth_response') {
      const hexMessage = buildAuthResponse(body.params)
      const parsed = parseMessage(hexMessage)

      return NextResponse.json({
        success: true,
        action: 'build_auth_response',
        hex_message: hexMessage,
        message_length: hexMessage.length / 2,
        parsed,
        timestamp: new Date().toISOString(),
      })
    }

    // Default: parse a hex message
    if (body.message) {
      const parsed = parseMessage(body.message)

      // Enrich with descriptions
      const enrichedFields: Record<string, { value: string; name: string; description?: string }> = {}
      for (const [id, value] of Object.entries(parsed.fields)) {
        enrichedFields[id] = {
          value,
          name: parsed.fieldNames[parseInt(id)] || `Field ${id}`,
          description: parseInt(id) === 39 ? getResponseDescription(value) : undefined,
        }
      }

      return NextResponse.json({
        success: true,
        action: 'parse',
        mti: parsed.mti,
        mti_description: getMTIDescription(parsed.mti),
        bitmap: parsed.bitmap,
        fields: enrichedFields,
        field_count: Object.keys(parsed.fields).length,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json(
      { error: 'Se requiere "message" (hex) para parsear, o "action": "build" con "mti" y "fields"' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: `Error procesando mensaje ISO 8583: ${(error as Error).message}` },
      { status: 500 }
    )
  }
}
