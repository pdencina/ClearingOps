import { NextResponse } from 'next/server'
import { getJobHistory } from '@/lib/engines/scheduler'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing required query param: job_id' },
        { status: 400 }
      )
    }

    const history = getJobHistory(jobId)
    return NextResponse.json({ history })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to get job history' },
      { status: 500 }
    )
  }
}
