import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/activacion/errors'
import { requireActivePolicy } from '@/lib/activacion/policy'
import { checkRateLimit } from '@/lib/activacion/rate-limit'
import { VerificationService } from '@/lib/idv/verification-service'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!checkRateLimit(`idv-start:${token}`)) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Demasiadas solicitudes' },
        { status: 429 }
      )
    }

    const policy = await requireActivePolicy(token)
    const service = new VerificationService()
    const result = await service.startVerification(policy)

    return NextResponse.json(
      {
        attemptId: result.attemptId,
        attemptNumber: result.attemptNumber,
        attemptsRemaining: result.attemptsRemaining,
        providerConfig: {
          provider: process.env.IDV_PROVIDER ?? 'mock',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const { status, body } = errorResponse(error)
    return NextResponse.json(body, { status })
  }
}
