import { NextRequest, NextResponse } from 'next/server'
import { getAvailableReports, generateReport } from '@/lib/engines/reporting'

export async function GET() {
  const reports = getAvailableReports()
  return NextResponse.json(reports)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { report_id, from, to } = body

  if (!report_id) {
    return NextResponse.json(
      { error: 'Missing required field: report_id' },
      { status: 400 }
    )
  }

  const report = generateReport(report_id, { from, to })
  if (!report) {
    return NextResponse.json(
      { error: 'Report definition not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(report)
}
