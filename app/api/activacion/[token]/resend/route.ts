import { NextResponse } from 'next/server'

import { ActivacionError, errorResponse } from '@/lib/activacion/errors'
import { resolvePolicyByToken } from '@/lib/activacion/policy'
import { checkRateLimit } from '@/lib/activacion/rate-limit'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!checkRateLimit(`resend:${token}`, 3, 60 * 60 * 1000)) {
      throw new ActivacionError(
        'RATE_LIMITED',
        'Debes esperar antes de solicitar otro reenvío',
        429,
        { retryAfter: 3600 }
      )
    }

    const { policy, linkStatus } = await resolvePolicyByToken(token)

    if (linkStatus === 'activated') {
      throw new ActivacionError('ALREADY_ACTIVATED', 'Este link ya fue activado', 409)
    }

    if (!policy.email) {
      throw new ActivacionError(
        'EMAIL_MISSING',
        'No hay correo registrado para reenviar el enlace',
        422
      )
    }

    const supabase = createServerSupabaseClient()
    const newToken = crypto.randomUUID().replace(/-/g, '').slice(0, 24)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from('employee_policies')
      .update({
        token: newToken,
        expires_at: expiresAt,
        verification_attempts_count: 0,
        is_blocked: false,
        blocked_at: null,
      })
      .eq('id', policy.id)

    if (error) {
      throw new ActivacionError('INTERNAL_ERROR', 'No se pudo regenerar el enlace', 500)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const link = `${baseUrl}/activar/${newToken}`

    const { sendActivationEmail } = await import('@/lib/email/send')
    await sendActivationEmail({
      to: policy.email,
      nombre: policy.colaborador_nombre,
      empresa: policy.companies?.nombre ?? '',
      montoCobertura: Number(policy.monto_cobertura),
      link,
    })

    return NextResponse.json({
      message: 'Se ha enviado un nuevo enlace a tu correo',
      newExpiresAt: expiresAt,
    })
  } catch (error) {
    const { status, body } = errorResponse(error)
    return NextResponse.json(body, { status })
  }
}
