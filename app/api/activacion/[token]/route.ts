import { NextResponse } from 'next/server'

import { ActivacionError, errorResponse } from '@/lib/activacion/errors'
import {
  daysUntilExpiration,
  resolvePolicyByToken,
} from '@/lib/activacion/policy'
import { VerificationService } from '@/lib/idv/verification-service'
import { MAX_VERIFICATION_ATTEMPTS } from '@/lib/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { policy, linkStatus } = await resolvePolicyByToken(token)
    const supabase = createServerSupabaseClient()

    const { data: biometricConsent } = await supabase
      .from('consents')
      .select('granted')
      .eq('employee_policy_id', policy.id)
      .eq('consent_type', 'biometric_data_processing')
      .maybeSingle()

    const idvService = new VerificationService()
    const idvStatus = await idvService.getStatus(policy.id)

    return NextResponse.json({
      status: linkStatus,
      colaboradorNombre: policy.colaborador_nombre,
      empresaNombre: policy.companies?.nombre ?? '',
      montoCobertura: policy.monto_cobertura,
      polizaNumero: policy.poliza_numero,
      idv: {
        attemptsUsed: idvStatus.attemptsUsed,
        maxAttempts: MAX_VERIFICATION_ATTEMPTS,
        isBlocked: idvStatus.isBlocked,
        currentAttemptId: idvStatus.currentAttempt?.attemptId ?? null,
        currentStage: idvStatus.currentAttempt?.stage ?? null,
        biometricConsentGiven: biometricConsent?.granted ?? false,
        canProceedToActivation: idvStatus.canProceedToActivation,
      },
      expiresAt: policy.expires_at ?? null,
      daysUntilExpiration: daysUntilExpiration(policy.expires_at),
    })
  } catch (error) {
    const { status, body } = errorResponse(error)
    return NextResponse.json(body, { status })
  }
}
