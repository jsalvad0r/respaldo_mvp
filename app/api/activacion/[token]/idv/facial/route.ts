import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/activacion/errors'
import { requireActivePolicy } from '@/lib/activacion/policy'
import { checkRateLimit } from '@/lib/activacion/rate-limit'
import { VerificationService } from '@/lib/idv/verification-service'
import { ActivationNotifier } from '@/lib/notifications/activation-notifier'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!checkRateLimit(`idv-facial:${token}`)) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Demasiadas solicitudes' },
        { status: 429 }
      )
    }

    const policy = await requireActivePolicy(token)
    const formData = await request.formData()
    const facialFile = formData.get('file')
    const documentFile = formData.get('documentFile')
    const attemptId = formData.get('attemptId')
    const simulateFailure = formData.get('simulateFailure') === 'true'

    if (!(facialFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'MISSING_FILE', message: 'Falta la imagen facial' },
        { status: 400 }
      )
    }

    if (!(documentFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'MISSING_DOCUMENT', message: 'Falta la imagen del documento' },
        { status: 400 }
      )
    }

    if (typeof attemptId !== 'string' || !attemptId) {
      return NextResponse.json(
        { error: 'MISSING_ATTEMPT', message: 'Falta el identificador del intento' },
        { status: 400 }
      )
    }

    const facialBuffer = Buffer.from(await facialFile.arrayBuffer())
    const documentBuffer = Buffer.from(await documentFile.arrayBuffer())

    const service = new VerificationService()
    const result = await service.processFacial(
      policy,
      attemptId,
      facialBuffer,
      documentBuffer,
      { simulateFailure }
    )

    if (!result.canProceed && result.error === 'provider_unavailable') {
      return NextResponse.json(
        {
          error: result.error,
          message: result.message,
          canProceed: false,
        },
        { status: 503 }
      )
    }

    if (!result.canProceed && result.error === 'liveness_failed') {
      return NextResponse.json(
        {
          error: result.error,
          message: result.message,
          canRetryCapture: true,
          canProceed: false,
        },
        { status: 422 }
      )
    }

    if (!result.canProceed && result.error === 'face_mismatch') {
      if (result.attemptsRemaining === 0) {
        const notifier = new ActivationNotifier()
        await notifier.notifyBlocked(policy.id, 'face_mismatch')
      }

      return NextResponse.json(
        {
          error: result.error,
          message: result.message,
          confidenceScore: result.confidenceScore,
          attemptsRemaining: result.attemptsRemaining,
          canProceed: false,
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      verificationResult: result.verificationResult,
      confidenceScore: result.confidenceScore,
      stage: 'completed',
      verifiedData: result.verifiedData,
    })
  } catch (error) {
    const { status, body } = errorResponse(error)
    return NextResponse.json(body, { status })
  }
}
