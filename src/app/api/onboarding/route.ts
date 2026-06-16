import { NextRequest, NextResponse } from 'next/server'
import { getOnboardingProcesses, createOnboarding, advanceOnboarding } from '@/lib/engines/onboarding'

export async function GET() {
  const processes = getOnboardingProcesses()
  return NextResponse.json(processes)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action } = body

  if (action === 'create') {
    const { name, rut, assigned_to } = body
    if (!name || !rut || !assigned_to) {
      return NextResponse.json(
        { error: 'Missing required fields: name, rut, assigned_to' },
        { status: 400 }
      )
    }
    const process = createOnboarding({ name, rut, assigned_to })
    return NextResponse.json(process, { status: 201 })
  }

  if (action === 'advance') {
    const { id } = body
    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 })
    }
    const updated = advanceOnboarding(id)
    if (!updated) {
      return NextResponse.json({ error: 'Onboarding process not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Invalid action. Use "create" or "advance"' }, { status: 400 })
}
