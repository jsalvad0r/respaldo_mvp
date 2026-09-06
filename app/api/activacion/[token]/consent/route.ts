import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/activacion/errors'
import { getClientMeta, requireActivePolicy } from '@/lib/activacion/policy'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface ConsentBody {
  consentType: 'biometric_data_processing' | 'policy_activation'
  granted: boolean
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const policy = await requireActivePolicy(token)
    const body = (await request.json()) as ConsentBody

    if (
      body.consentType !== 'biometric_data_processing' &&
      body.consentType !== 'policy_activation'
    ) {
      return NextResponse.json(
        { error: 'INVALID_CONSENT', message: 'Tipo de consentimiento inválido' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()
    const { ipAddress, userAgent } = getClientMeta(request)

    const { data: existing } = await supabase
      .from('consents')
      .select('id, granted, created_at')
      .eq('employee_policy_id', policy.id)
      .eq('consent_type', body.consentType)
      .maybeSingle()

    if (existing) {
      // Idempotente: si el consentimiento ya existe con el mismo valor, permitir continuar.
      if (existing.granted === body.granted) {
        return NextResponse.json({
          consentId: existing.id,
          consentType: body.consentType,
          granted: existing.granted,
          timestamp: existing.created_at,
          alreadyRegistered: true,
        })
      }

      // Re-consentimiento: antes rechazó, ahora acepta.
      if (!existing.granted && body.granted) {
        const { data: updated, error: updateError } = await supabase
          .from('consents')
          .update({
            granted: true,
            ip_address: ipAddress,
            user_agent: userAgent,
          })
          .eq('id', existing.id)
          .select('id, consent_type, granted, created_at')
          .single()

        if (updateError || !updated) {
          return NextResponse.json(
            { error: 'INTERNAL_ERROR', message: 'No se pudo actualizar el consentimiento' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          consentId: updated.id,
          consentType: updated.consent_type,
          granted: updated.granted,
          timestamp: updated.created_at,
          updated: true,
        })
      }

      // Ya otorgó consentimiento; no permitir revocarlo en el flujo digital.
      return NextResponse.json({
        consentId: existing.id,
        consentType: body.consentType,
        granted: existing.granted,
        timestamp: existing.created_at,
        alreadyRegistered: true,
      })
    }

    const { data: consent, error } = await supabase
      .from('consents')
      .insert({
        employee_policy_id: policy.id,
        consent_type: body.consentType,
        granted: body.granted,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select('id, consent_type, granted, created_at')
      .single()

    if (error || !consent) {
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'No se pudo registrar el consentimiento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      consentId: consent.id,
      consentType: consent.consent_type,
      granted: consent.granted,
      timestamp: consent.created_at,
    })
  } catch (error) {
    const { status, body } = errorResponse(error)
    return NextResponse.json(body, { status })
  }
}
