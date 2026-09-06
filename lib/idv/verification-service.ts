import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ActivacionError } from '@/lib/activacion/errors'
import { assertPadronComplete } from '@/lib/activacion/policy'
import { getConfidenceThreshold, idvProvider } from '@/lib/idv/index'
import { toInsuredData, type ExtractedInsuredData } from '@/lib/idv/provider'
import type { EmployeePolicyRow } from '@/lib/supabase/types'
import { ActivationNotifier } from '@/lib/notifications/activation-notifier'
import { MAX_VERIFICATION_ATTEMPTS } from '@/lib/types'

export interface StartVerificationResult {
  attemptId: string
  attemptNumber: number
  attemptsRemaining: number
}

export interface ProcessDocumentResult {
  success: boolean
  extractedData?: ExtractedInsuredData
  matchResult?: {
    documentoMatches: boolean
    fechaNacimientoMatches: boolean
    allFieldsExtracted: boolean
  }
  canProceed: boolean
  error?: string
  attemptsRemaining?: number
  message?: string
}

export interface ProcessFacialResult {
  verificationResult: 'success' | 'failed'
  confidenceScore: number
  canProceed: boolean
  error?: string
  attemptsRemaining?: number
  verifiedData?: ExtractedInsuredData
  message?: string
}

type AttemptRow = {
  id: string
  employee_policy_id: string
  attempt_number: number
  stage: string
  status: string
  extracted_data: Record<string, unknown> | null
}

export class VerificationService {
  private supabase = createServerSupabaseClient()
  private confidenceThreshold = getConfidenceThreshold()

  async startVerification(policy: EmployeePolicyRow): Promise<StartVerificationResult> {
    assertPadronComplete(policy)

    if (policy.is_blocked) {
      throw new ActivacionError(
        'BLOCKED',
        'Has agotado los intentos de verificación',
        423
      )
    }

    const { data: consent } = await this.supabase
      .from('consents')
      .select('granted')
      .eq('employee_policy_id', policy.id)
      .eq('consent_type', 'biometric_data_processing')
      .maybeSingle()

    if (!consent?.granted) {
      throw new ActivacionError(
        'CONSENT_REQUIRED',
        'Debe otorgar consentimiento biométrico antes de iniciar la verificación',
        403
      )
    }

    const { data: inProgress } = await this.supabase
      .from('verification_attempts')
      .select('id, attempt_number')
      .eq('employee_policy_id', policy.id)
      .eq('status', 'in_progress')
      .maybeSingle<AttemptRow>()

    if (inProgress) {
      throw new ActivacionError(
        'ATTEMPT_IN_PROGRESS',
        'Ya existe una verificación en progreso',
        409,
        { attemptId: inProgress.id }
      )
    }

    const attemptNumber = (policy.verification_attempts_count ?? 0) + 1
    if (attemptNumber > MAX_VERIFICATION_ATTEMPTS) {
      throw new ActivacionError(
        'BLOCKED',
        'Has agotado los intentos de verificación',
        423
      )
    }

    const { data: attempt, error } = await this.supabase
      .from('verification_attempts')
      .insert({
        employee_policy_id: policy.id,
        attempt_number: attemptNumber,
        stage: 'document_capture',
        status: 'in_progress',
      })
      .select('id')
      .single()

    if (error || !attempt) {
      throw new ActivacionError('INTERNAL_ERROR', 'No se pudo iniciar la verificación', 500)
    }

    await this.supabase
      .from('employee_policies')
      .update({ verification_attempts_count: attemptNumber })
      .eq('id', policy.id)

    return {
      attemptId: attempt.id,
      attemptNumber,
      attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - attemptNumber,
    }
  }

  async processDocument(
    policy: EmployeePolicyRow,
    attemptId: string,
    documentImage: Buffer
  ): Promise<ProcessDocumentResult> {
    const attempt = await this.getAttemptForPolicy(attemptId, policy.id)

    const extraction = await idvProvider.extractDocument(documentImage)

    if (!extraction.success || !extraction.allFieldsExtracted) {
      await this.updateAttempt(attemptId, {
        stage: 'document_capture',
        extracted_data: extraction.rawResponse as Record<string, unknown>,
        provider_transaction_id: extraction.transactionId,
      })

      return {
        success: false,
        canProceed: false,
        error: 'document_unreadable',
        message: 'No se pudo leer el documento. Asegúrate de que esté bien iluminado.',
      }
    }

    const extractedData = toInsuredData(extraction.extractedFields)
    const documentoMatches =
      extractedData.numeroDocumento === policy.colaborador_documento
    const fechaNacimientoMatches =
      extractedData.fechaNacimiento === policy.colaborador_fecha_nacimiento

    const matchResult = {
      documentoMatches,
      fechaNacimientoMatches,
      allFieldsExtracted: true,
    }

    if (!documentoMatches || !fechaNacimientoMatches) {
      const attemptsRemaining = await this.failAttempt(attempt, 'data_mismatch', {
        extracted_data: extractedData,
        match_result: matchResult,
        provider_transaction_id: extraction.transactionId,
      })

      return {
        success: false,
        extractedData,
        matchResult,
        canProceed: false,
        error: 'data_mismatch',
        attemptsRemaining,
        message: 'Los datos del documento no coinciden con tu registro.',
      }
    }

    await this.updateAttempt(attemptId, {
      stage: 'facial_capture',
      extracted_data: extractedData,
      match_result: matchResult,
      provider_transaction_id: extraction.transactionId,
    })

    return {
      success: true,
      extractedData,
      matchResult,
      canProceed: true,
    }
  }

  async processFacial(
    policy: EmployeePolicyRow,
    attemptId: string,
    facialImage: Buffer,
    documentImage: Buffer,
    options?: { simulateFailure?: boolean }
  ): Promise<ProcessFacialResult> {
    const attempt = await this.getAttemptForPolicy(attemptId, policy.id)

    if (attempt.stage !== 'facial_capture' && attempt.stage !== 'facial_comparison') {
      throw new ActivacionError(
        'INVALID_STAGE',
        'Debes completar la captura del documento primero',
        400
      )
    }

    await this.updateAttempt(attemptId, { stage: 'facial_comparison' })

    let comparison
    try {
      comparison = await idvProvider.compareFacial(facialImage, documentImage, options)
    } catch {
      await this.updateAttempt(attemptId, {
        stage: 'facial_capture',
        status: 'provider_error',
        failure_reason: 'provider_unavailable',
        completed_at: new Date().toISOString(),
      })

      return {
        verificationResult: 'failed',
        confidenceScore: 0,
        canProceed: false,
        error: 'provider_unavailable',
        message: 'El servicio de verificación no está disponible en este momento.',
      }
    }

    if (!comparison.livenessDetected) {
      await this.updateAttempt(attemptId, { stage: 'facial_capture' })
      return {
        verificationResult: 'failed',
        confidenceScore: comparison.confidenceScore,
        canProceed: false,
        error: 'liveness_failed',
        message: 'No se pudo confirmar tu presencia física. Intenta de nuevo.',
      }
    }

    const matches =
      comparison.matchesDocument &&
      comparison.confidenceScore >= this.confidenceThreshold

    if (!matches) {
      const attemptsRemaining = await this.failAttempt(attempt, 'face_mismatch', {
        confidence_score: comparison.confidenceScore,
        provider_transaction_id: comparison.transactionId,
      })

      return {
        verificationResult: 'failed',
        confidenceScore: comparison.confidenceScore,
        canProceed: false,
        error: 'face_mismatch',
        attemptsRemaining,
        message: 'El rostro no coincide con la fotografía del documento.',
      }
    }

    const extracted = (attempt.extracted_data ?? {}) as ExtractedInsuredData
    const verifiedData: ExtractedInsuredData = {
      nombreCompleto: extracted.nombreCompleto ?? '',
      numeroDocumento: extracted.numeroDocumento ?? '',
      fechaNacimiento: extracted.fechaNacimiento ?? '',
      documentType: extracted.documentType,
    }

    await this.updateAttempt(attemptId, {
      stage: 'completed',
      status: 'success',
      confidence_score: comparison.confidenceScore,
      provider_transaction_id: comparison.transactionId,
      completed_at: new Date().toISOString(),
    })

    return {
      verificationResult: 'success',
      confidenceScore: comparison.confidenceScore,
      canProceed: true,
      verifiedData,
    }
  }

  async getStatus(policyId: string) {
    const { data: policy } = await this.supabase
      .from('employee_policies')
      .select('verification_attempts_count, is_blocked')
      .eq('id', policyId)
      .single()

    const { data: attempts } = await this.supabase
      .from('verification_attempts')
      .select('*')
      .eq('employee_policy_id', policyId)
      .order('attempt_number', { ascending: false })

    const inProgress = attempts?.find((a) => a.status === 'in_progress') ?? null
    const successful = attempts?.find((a) => a.status === 'success') ?? null
    const lastFailed = attempts?.find((a) => a.status === 'failed') ?? null

    return {
      currentAttempt: inProgress
        ? {
            attemptId: inProgress.id,
            attemptNumber: inProgress.attempt_number,
            stage: inProgress.stage,
            status: inProgress.status,
            startedAt: inProgress.started_at,
            failureReason: inProgress.failure_reason,
          }
        : null,
      lastFailedAttempt: lastFailed
        ? {
            attemptId: lastFailed.id,
            failureReason: lastFailed.failure_reason,
            completedAt: lastFailed.completed_at,
          }
        : null,
      attemptsUsed: policy?.verification_attempts_count ?? 0,
      maxAttempts: MAX_VERIFICATION_ATTEMPTS,
      isBlocked: policy?.is_blocked ?? false,
      canProceedToActivation: Boolean(successful),
      verifiedData: successful?.extracted_data ?? undefined,
    }
  }

  async getSuccessfulAttempt(policyId: string) {
    const { data } = await this.supabase
      .from('verification_attempts')
      .select('*')
      .eq('employee_policy_id', policyId)
      .eq('status', 'success')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return data
  }

  private async getAttemptForPolicy(attemptId: string, policyId: string): Promise<AttemptRow> {
    const { data, error } = await this.supabase
      .from('verification_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('employee_policy_id', policyId)
      .maybeSingle<AttemptRow>()

    if (error || !data) {
      throw new ActivacionError('ATTEMPT_NOT_FOUND', 'Intento de verificación no encontrado', 404)
    }

    if (data.status !== 'in_progress') {
      throw new ActivacionError('ATTEMPT_CLOSED', 'Este intento de verificación ya finalizó', 409)
    }

    return data
  }

  private async updateAttempt(attemptId: string, data: Record<string, unknown>) {
    const { error } = await this.supabase
      .from('verification_attempts')
      .update(data)
      .eq('id', attemptId)

    if (error) {
      throw new ActivacionError('INTERNAL_ERROR', 'No se pudo actualizar la verificación', 500)
    }
  }

  private async failAttempt(
    attempt: AttemptRow,
    reason: string,
    data: Record<string, unknown>
  ): Promise<number> {
    await this.updateAttempt(attempt.id, {
      status: 'failed',
      failure_reason: reason,
      completed_at: new Date().toISOString(),
      ...data,
    })

    const attemptsRemaining = MAX_VERIFICATION_ATTEMPTS - attempt.attempt_number

    if (attempt.attempt_number >= MAX_VERIFICATION_ATTEMPTS) {
      await this.supabase
        .from('employee_policies')
        .update({
          is_blocked: true,
          blocked_at: new Date().toISOString(),
        })
        .eq('id', attempt.employee_policy_id)

      const notifier = new ActivationNotifier()
      await notifier.notifyBlocked(attempt.employee_policy_id, reason).catch((err) => {
        console.error('Failed to notify blocked verification:', err)
      })
    }

    return Math.max(0, attemptsRemaining)
  }
}
