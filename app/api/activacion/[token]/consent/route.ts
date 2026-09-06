import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/activacion/errors'
import { getClientMeta, requireActivePolicy } from '@/lib/activacion/policy'
import { checkRateLimit } from '@/lib/activacion/rate-limit'
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

    if (!checkRateLimit(`consent:${token}`)) {
      return NextResponse.json(
        { error: 'RATE_LIMITED', message: 'Demasiadas solicitudes' },
        { status: 429 }
      )
    }

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
      .select('id, granted')
      .eq('employee_policy_id', policy.id)
      .eq('consent_type', body.consentType)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'CONSENT_EXISTS', message: 'El consentimiento ya fue registrado' },
        { status: 409 }
      )
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
