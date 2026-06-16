import { NextRequest, NextResponse } from 'next/server'
import { getAuditTrail, getAuditSummary } from '@/lib/engines/audit'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const summary = searchParams.get('summary')
  if (summary === 'true') {
    return NextResponse.json(getAuditSummary())
  }

  const filters = {
    user: searchParams.get('user') || undefined,
    action: searchParams.get('action') || undefined,
    resource_type: searchParams.get('resource_type') || undefined,
    risk_level: (searchParams.get('risk_level') as 'low' | 'medium' | 'high') || undefined,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
  }

  const trail = getAuditTrail(filters)
  const auditSummary = getAuditSummary()

  return NextResponse.json({ entries: trail, summary: auditSummary })
}
