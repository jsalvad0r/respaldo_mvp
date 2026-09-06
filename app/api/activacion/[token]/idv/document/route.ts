import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/activacion/errors'
import { requireActivePolicy } from '@/lib/activacion/policy'
import { checkRateLimit } from '@/lib/activacion/rate-limit'
import { VerificationService } from '@/lib/idv/verification-service'
import { stampEscaneoAt } from '@/lib/panel/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!checkRateLimit(`idv-document:${token}`)) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Demasiadas solicitudes' },
        { status: 429 }
      )
    }

    const policy = await requireActivePolicy(token)
    const formData = await request.formData()
    const file = formData.get('file')
    const attemptId = formData.get('attemptId')

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'MISSING_FILE', message: 'Falta el archivo de imagen' },
        { status: 400 }
      )
    }

    if (typeof attemptId !== 'string' || !attemptId) {
      return NextResponse.json(
        { error: 'MISSING_ATTEMPT', message: 'Falta el identificador del intento' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const service = new VerificationService()
    const result = await service.processDocument(policy, attemptId, buffer)

    if (result.success) {
      await stampEscaneoAt(policy.id)
    }

    if (!result.success && result.error === 'document_unreadable') {
      return NextResponse.json(
        {
          error: result.error,
          message: result.message,
          canRetryCapture: true,
          canProceed: false,
        },
        { status: 400 }
      )
    }

    if (!result.success && result.error === 'data_mismatch') {
      return NextResponse.json(
        {
          error: result.error,
          message: result.message,
          extractedData: result.extractedData,
          matchResult: result.matchResult,
          attemptsRemaining: result.attemptsRemaining,
          canProceed: false,
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      extractedData: result.extractedData,
      matchResult: result.matchResult,
      canProceed: result.canProceed,
      stage: 'facial_capture',
    })
  } catch (error) {
    const { status, body } = errorResponse(error)
    return NextResponse.json(body, { status })
  }
}
