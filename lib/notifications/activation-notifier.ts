import { createHmac } from 'crypto'

import { createServerSupabaseClient } from '@/lib/supabase/server'

interface ActivationPayload {
  event: 'activation.completed' | 'verification.blocked'
  timestamp: string
  data: Record<string, unknown>
}

export class ActivationNotifier {
  private supabase = createServerSupabaseClient()

  async notifyActivation(activationId: string): Promise<void> {
    const { data: activation } = await this.supabase
      .from('activations')
      .select(`
        *,
        beneficiaries(*),
        employee_policies(
          *,
          companies(nombre, webhook_url, notification_email)
        ),
        verification_attempts(id, provider_transaction_id)
      `)
      .eq('id', activationId)
      .maybeSingle()

    if (!activation) return

    const policy = activation.employee_policies
    const company = policy?.companies
    const webhookUrl = company?.webhook_url

    if (!webhookUrl) return

    const payload: ActivationPayload = {
      event: 'activation.completed',
      timestamp: new Date().toISOString(),
      data: {
        policyNumber: policy.poliza_numero,
        memberDocument: activation.numero_documento,
        memberName: activation.nombre_completo,
        companyId: policy.company_id,
        activatedAt: policy.activated_at,
        verificationId: activation.verification_attempt_id,
        beneficiaries: (activation.beneficiaries ?? []).map(
          (b: { nombre: string; parentesco: string; porcentaje: number }) => ({
            name: b.nombre,
            relationship: b.parentesco,
            percentage: b.porcentaje,
          })
        ),
      },
    }

    const { data: notification } = await this.supabase
      .from('activation_notifications')
      .insert({
        activation_id: activationId,
        target_type: 'webhook',
        target_url: webhookUrl,
        payload,
      })
      .select('id')
      .single()

    if (notification) {
      await this.sendWebhook(notification.id, webhookUrl, payload)
    }
  }

  async notifyBlocked(policyId: string, reason: string): Promise<void> {
    const { data: policy } = await this.supabase
      .from('employee_policies')
      .select('*, companies(webhook_url)')
      .eq('id', policyId)
      .maybeSingle()

    const webhookUrl = policy?.companies?.webhook_url
    if (!webhookUrl || !policy) return

    const payload: ActivationPayload = {
      event: 'verification.blocked',
      timestamp: new Date().toISOString(),
      data: {
        policyNumber: policy.poliza_numero,
        memberDocument: policy.colaborador_documento,
        memberName: policy.colaborador_nombre,
        companyId: policy.company_id,
        blockedAt: policy.blocked_at,
        attemptsCount: policy.verification_attempts_count,
        lastFailureReason: reason,
      },
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Respaldo-Signature': this.signPayload(payload),
        'X-Respaldo-Event': payload.event,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    }).catch((err) => {
      console.error('Failed to notify blocked verification:', err)
    })
  }

  private async sendWebhook(
    notificationId: string,
    url: string,
    payload: ActivationPayload
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Respaldo-Signature': this.signPayload(payload),
          'X-Respaldo-Event': payload.event,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      })

      await this.supabase
        .from('activation_notifications')
        .update({
          status: response.ok ? 'sent' : 'failed',
          sent_at: new Date().toISOString(),
          response: {
            status: response.status,
            body: await response.text().catch(() => null),
          },
        })
        .eq('id', notificationId)
    } catch (error) {
      await this.supabase
        .from('activation_notifications')
        .update({
          status: 'failed',
          response: {
            error: error instanceof Error ? error.message : 'unknown_error',
          },
        })
        .eq('id', notificationId)
    }
  }

  private signPayload(payload: ActivationPayload): string {
    const secret = process.env.WEBHOOK_SIGNING_SECRET ?? 'dev-secret'
    return createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex')
  }
}
