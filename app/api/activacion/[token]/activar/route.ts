import { NextResponse } from 'next/server'

import { ActivacionError, errorResponse } from '@/lib/activacion/errors'
import { getClientMeta, requireActivePolicy } from '@/lib/activacion/policy'
import { IDV_ENABLED } from '@/lib/feature-flags'
import { VerificationService } from '@/lib/idv/verification-service'
import { ActivationNotifier } from '@/lib/notifications/activation-notifier'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MAX_BENEFICIARIES, type Beneficiary } from '@/lib/types'

interface ActivarBody {
  beneficiaries: Beneficiary[]
  insuredData?: {
    nombreCompleto: string
    numeroDocumento: string
    fechaNacimiento: string
  }
  documentImagePath?: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = (await request.json()) as ActivarBody
    const { beneficiaries } = body

    if (!beneficiaries?.length || beneficiaries.length > MAX_BENEFICIARIES) {
      return NextResponse.json(
        { error: `Puedes registrar hasta ${MAX_BENEFICIARIES} beneficiarios` },
        { status: 400 }
      )
    }

    const totalPorcentaje = beneficiaries.reduce((sum, b) => sum + (b.porcentaje || 0), 0)
    if (totalPorcentaje !== 100) {
      return NextResponse.json(
        { error: 'Los porcentajes de beneficiarios deben sumar 100%' },
        { status: 400 }
      )
    }

    const policy = await requireActivePolicy(token)
    const supabase = createServerSupabaseClient()
    const idvService = new VerificationService()

    let insuredData = body.insuredData
    let verificationAttemptId: string | null = null

    if (IDV_ENABLED) {
      const { data: policyConsent } = await supabase
        .from('consents')
        .select('granted')
        .eq('employee_policy_id', policy.id)
        .eq('consent_type', 'policy_activation')
        .maybeSingle()

      if (!policyConsent?.granted) {
        throw new ActivacionError(
          'CONSENT_REQUIRED',
          'Debe otorgar consentimiento de póliza antes de activar',
          403
        )
      }

      const successfulAttempt = await idvService.getSuccessfulAttempt(policy.id)
      if (!successfulAttempt) {
        throw new ActivacionError(
          'VERIFICATION_REQUIRED',
          'Debe completar la verificación de identidad antes de activar',
          403
        )
      }

      verificationAttemptId = successfulAttempt.id
      const extracted = successfulAttempt.extracted_data as {
        nombreCompleto?: string
        numeroDocumento?: string
        fechaNacimiento?: string
      }

      insuredData = {
        nombreCompleto: extracted.nombreCompleto ?? '',
        numeroDocumento: extracted.numeroDocumento ?? '',
        fechaNacimiento: extracted.fechaNacimiento ?? '',
      }
    }

    if (
      !insuredData?.nombreCompleto ||
      !insuredData?.numeroDocumento ||
      !insuredData?.fechaNacimiento
    ) {
      return NextResponse.json({ error: 'Faltan datos del asegurado' }, { status: 400 })
    }

    const { data: activation, error: activationError } = await supabase
      .from('activations')
      .insert({
        employee_policy_id: policy.id,
        verification_attempt_id: verificationAttemptId,
        nombre_completo: insuredData.nombreCompleto,
        numero_documento: insuredData.numeroDocumento,
        fecha_nacimiento: insuredData.fechaNacimiento,
        document_image_path: body.documentImagePath ?? null,
      })
      .select('id, created_at')
      .single()

    if (activationError || !activation) {
      return NextResponse.json({ error: 'No se pudo guardar la activación' }, { status: 500 })
    }

    const { error: beneficiariesError } = await supabase.from('beneficiaries').insert(
      beneficiaries.map((b) => ({
        activation_id: activation.id,
        nombre: b.nombre,
        parentesco: b.parentesco,
        porcentaje: b.porcentaje,
      }))
    )

    if (beneficiariesError) {
      return NextResponse.json({ error: 'No se pudieron guardar los beneficiarios' }, { status: 500 })
    }

    const activatedAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('employee_policies')
      .update({ status: 'activated', activated_at: activatedAt })
      .eq('id', policy.id)

    if (updateError) {
      return NextResponse.json({ error: 'No se pudo confirmar la activación' }, { status: 500 })
    }

    const notifier = new ActivationNotifier()
    await notifier.notifyActivation(activation.id).catch((err) => {
      console.error('Activation notification failed:', err)
    })

    return NextResponse.json({
      polizaNumero: policy.poliza_numero,
      activatedAt,
      verificationId: verificationAttemptId,
      insuredData,
    })
  } catch (error) {
    const { status, body } = errorResponse(error)
    return NextResponse.json(body, { status })
  }
}
