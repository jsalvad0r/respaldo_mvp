import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { EmployeePolicyRow } from '@/lib/supabase/types'
import { ActivacionError } from '@/lib/activacion/errors'

export type LinkStatus = 'pending' | 'activated' | 'expired' | 'blocked'

export interface ResolvedPolicy {
  policy: EmployeePolicyRow
  linkStatus: LinkStatus
}

const POLICY_SELECT = '*, companies(nombre, webhook_url, notification_email)'

export function getLinkStatus(policy: EmployeePolicyRow): LinkStatus {
  if (policy.status === 'activated') return 'activated'
  if (policy.is_blocked) return 'blocked'
  if (policy.expires_at && new Date(policy.expires_at) < new Date()) return 'expired'
  return 'pending'
}

export function assertPadronComplete(policy: EmployeePolicyRow): void {
  if (!policy.colaborador_documento || !policy.colaborador_fecha_nacimiento) {
    throw new ActivacionError(
      'PADRON_INCOMPLETE',
      'El registro del elegible está incompleto. Contacta a tu aseguradora.',
      422
    )
  }
}

export async function resolvePolicyByToken(token: string): Promise<ResolvedPolicy> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('employee_policies')
    .select(POLICY_SELECT)
    .eq('token', token)
    .maybeSingle<EmployeePolicyRow>()

  if (error) {
    throw new ActivacionError('INTERNAL_ERROR', 'No se pudo resolver el link', 500)
  }

  if (!data) {
    throw new ActivacionError('LINK_NOT_FOUND', 'Link no válido', 404)
  }

  return {
    policy: data,
    linkStatus: getLinkStatus(data),
  }
}

export async function requireActivePolicy(token: string): Promise<EmployeePolicyRow> {
  const { policy, linkStatus } = await resolvePolicyByToken(token)

  if (linkStatus === 'activated') {
    throw new ActivacionError('ALREADY_ACTIVATED', 'Este link ya fue activado', 409)
  }

  if (linkStatus === 'expired') {
    throw new ActivacionError('LINK_EXPIRED', 'Este enlace ha expirado', 410, {
      canRequestResend: true,
    })
  }

  if (linkStatus === 'blocked') {
    throw new ActivacionError(
      'BLOCKED',
      'Has agotado los intentos de verificación',
      423
    )
  }

  return policy
}

export function getClientMeta(request: Request): { ipAddress: string | null; userAgent: string | null } {
  const forwarded = request.headers.get('x-forwarded-for')
  const ipAddress = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip')
  const userAgent = request.headers.get('user-agent')
  return { ipAddress, userAgent }
}

export function daysUntilExpiration(expiresAt: string | null | undefined): number {
  if (!expiresAt) return 30
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
