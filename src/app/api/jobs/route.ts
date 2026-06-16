import { NextResponse } from 'next/server'
import { getScheduledJobs } from '@/lib/engines/scheduler'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const jobs = getScheduledJobs()
    return NextResponse.json({ jobs })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to get jobs' },
      { status: 500 }
    )
  }
}
