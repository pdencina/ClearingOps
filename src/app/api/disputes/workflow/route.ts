import { NextRequest, NextResponse } from 'next/server'
import { getAllDisputeWorkflows, getDisputeWorkflow, advanceStage, calculateWinProbability } from '@/lib/engines/disputes'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const disputeId = searchParams.get('id')

  if (disputeId) {
    const workflow = getDisputeWorkflow(disputeId)
    if (!workflow) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }
    return NextResponse.json({
      ...workflow,
      win_probability: calculateWinProbability(workflow),
    })
  }

  const workflows = getAllDisputeWorkflows()
  const withProbabilities = workflows.map(w => ({
    ...w,
    win_probability: calculateWinProbability(w),
  }))

  return NextResponse.json(withProbabilities)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { dispute_id, action, notes } = body

  if (!dispute_id || !action || !notes) {
    return NextResponse.json(
      { error: 'Missing required fields: dispute_id, action, notes' },
      { status: 400 }
    )
  }

  const updated = advanceStage(dispute_id, action, notes)
  if (!updated) {
    return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...updated,
    win_probability: calculateWinProbability(updated),
  })
}
