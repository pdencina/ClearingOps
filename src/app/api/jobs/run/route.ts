import { NextResponse } from 'next/server'
import { runJob } from '@/lib/engines/scheduler'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { job_id } = body

    if (!job_id) {
      return NextResponse.json(
        { error: 'Missing required field: job_id' },
        { status: 400 }
      )
    }

    const execution = runJob(job_id)
    return NextResponse.json({ execution })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to run job' },
      { status: 500 }
    )
  }
}
