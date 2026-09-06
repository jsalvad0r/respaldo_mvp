import { NextResponse } from 'next/server'

import { ActivacionError, errorResponse } from '@/lib/activacion/errors'
import { requireActivePolicy } from '@/lib/activacion/policy'
import { EvidenceService } from '@/lib/evidence/evidence-service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string; attemptId: string }> }
) {
  try {
    const secret = process.env.INTERNAL_API_SECRET
    if (!secret || _request.headers.get('x-internal-secret') !== secret) {
      throw new ActivacionError('UNAUTHORIZED', 'No autorizado', 401)
    }

    const { token, attemptId } = await params
    await requireActivePolicy(token)

    const evidenceService = new EvidenceService()
    const evidence = await evidenceService.getEvidence(attemptId)

    if (!evidence) {
      throw new ActivacionError('NOT_FOUND', 'Evidencia no encontrada', 404)
    }

    return NextResponse.json(evidence)
  } catch (error) {
    const { status, body } = errorResponse(error)
    return NextResponse.json(body, { status })
  }
}
