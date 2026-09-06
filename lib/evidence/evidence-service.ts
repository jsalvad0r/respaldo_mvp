import { createServerSupabaseClient } from '@/lib/supabase/server'
import { idvProvider } from '@/lib/idv/index'

export class EvidenceService {
  private supabase = createServerSupabaseClient()

  async getEvidence(attemptId: string) {
    const { data: attempt, error } = await this.supabase
      .from('verification_attempts')
      .select('*, employee_policies(poliza_numero, colaborador_documento)')
      .eq('id', attemptId)
      .maybeSingle()

    if (error || !attempt) {
      return null
    }

    const record = {
      attemptId: attempt.id,
      policyNumber: attempt.employee_policies?.poliza_numero ?? '',
      memberDocument: attempt.employee_policies?.colaborador_documento ?? '',
      timestamp: attempt.started_at,
      stage: attempt.stage,
      status: attempt.status,
      failureReason: attempt.failure_reason,
      providerTransactionId: attempt.provider_transaction_id,
      confidenceScore: attempt.confidence_score,
      extractedData: attempt.extracted_data,
      matchResult: attempt.match_result,
    }

    let images
    if (attempt.provider_transaction_id) {
      try {
        images = await idvProvider.getEvidence(attempt.provider_transaction_id)
      } catch (err) {
        console.error('Failed to retrieve provider evidence:', err)
      }
    }

    return { record, images }
  }

  async listAttempts(policyId: string) {
    const { data } = await this.supabase
      .from('verification_attempts')
      .select('*')
      .eq('employee_policy_id', policyId)
      .order('attempt_number', { ascending: true })

    return data ?? []
  }
}
