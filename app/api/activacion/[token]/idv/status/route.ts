import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/activacion/errors'
import { requireActivePolicy } from '@/lib/activacion/policy'
import { VerificationService } from '@/lib/idv/verification-service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const policy = await requireActivePolicy(token)
    const service = new VerificationService()
    const status = await service.getStatus(policy.id)

    return NextResponse.json(status)
  } catch (error) {
    const { status, body } = errorResponse(error)
    return NextResponse.json(body, { status })
  }
}
