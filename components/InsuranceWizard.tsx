'use client'

import { useEffect, useRef, useState } from 'react'
import { WizardProgressBar } from '@/components/WizardProgressBar'
import { StepLanding } from '@/components/steps/StepLanding'
import { StepConsentimientoBiometrico } from '@/components/steps/StepConsentimientoBiometrico'
import { StepCapturaDocumento } from '@/components/steps/StepCapturaDocumento'
import { StepCapturaFacial } from '@/components/steps/StepCapturaFacial'
import { StepVerificando } from '@/components/steps/StepVerificando'
import { StepVerificacionFallida } from '@/components/steps/StepVerificacionFallida'
import { StepBloqueado } from '@/components/steps/StepBloqueado'
import { StepPadronIncompleto } from '@/components/steps/StepPadronIncompleto'
import { StepConsentimientoPoliza } from '@/components/steps/StepConsentimientoPoliza'
import { StepDatos } from '@/components/steps/StepDatos'
import { StepExito } from '@/components/steps/StepExito'
import {
  INITIAL_STATE,
  getProgressStep,
  MAX_VERIFICATION_ATTEMPTS,
  type WizardState,
  type InsuredData,
  type Beneficiary,
  type VerificationFailureReason,
} from '@/lib/types'
import { cn } from '@/lib/utils'

interface InsuranceWizardProps {
  token: string
  colaboradorNombre: string
  empresaNombre: string
  montoCobertura: number
  polizaNumero: string
}

interface ActivationResult {
  polizaNumero: string
  activatedAt: string
}

type WizardView = 'wizard' | 'failed' | 'blocked'

interface LinkStatusResponse {
  padronComplete?: boolean
  idv: {
    attemptsUsed: number
    maxAttempts: number
    isBlocked: boolean
    currentAttemptId: string | null
    currentStage: string | null
    biometricConsentGiven: boolean
    policyConsentGiven: boolean
    canProceedToActivation: boolean
    lastFailureReason: VerificationFailureReason | null
  }
  verifiedData?: InsuredData | null
}

async function postConsent(
  token: string,
  consentType: 'biometric_data_processing' | 'policy_activation',
  granted: boolean
) {
  const res = await fetch(`/api/activacion/${token}/consent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consentType, granted }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message =
      body.message ??
      (body.error === 'RATE_LIMITED'
        ? 'Demasiados intentos. Espera un momento e intenta de nuevo.'
        : 'No se pudo registrar el consentimiento')
    throw new Error(message)
  }
}

async function startVerification(token: string): Promise<string> {
  const startRes = await fetch(`/api/activacion/${token}/idv/start`, { method: 'POST' })
  const startBody = await startRes.json()

  if (startRes.ok) {
    return startBody.attemptId as string
  }

  if (
    startRes.status === 409 &&
    startBody.error === 'ATTEMPT_IN_PROGRESS' &&
    startBody.details?.attemptId
  ) {
    return startBody.details.attemptId as string
  }

  throw new Error(
    startBody.error === 'PADRON_INCOMPLETE'
      ? 'PADRON_INCOMPLETE'
      : startBody.message ??
          (startBody.error === 'RATE_LIMITED'
            ? 'Demasiados intentos. Espera un momento e intenta de nuevo.'
            : 'No se pudo iniciar la verificación')
  )
}

function stepForIdvStage(stage: string | null): WizardState['step'] {
  if (stage === 'facial_capture' || stage === 'facial_comparison') return 4
  if (stage === 'completed') return 6
  return 3
}

export function InsuranceWizard({
  token,
  colaboradorNombre,
  empresaNombre,
  montoCobertura,
  polizaNumero,
}: InsuranceWizardProps) {
  const [state, setState] = useState<WizardState>(INITIAL_STATE)
  const [view, setView] = useState<WizardView>('wizard')
  const [activation, setActivation] = useState<ActivationResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [consentError, setConsentError] = useState<string | null>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [facialFile, setFacialFile] = useState<File | null>(null)
  const [simulateVerificationFailure, setSimulateVerificationFailure] = useState(false)
  const [restoringSession, setRestoringSession] = useState(true)
  const [consentLoading, setConsentLoading] = useState(false)
  const [padronIncomplete, setPadronIncomplete] = useState(false)
  const autoResumeRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      try {
        const res = await fetch(`/api/activacion/${token}`)
        const data = (await res.json()) as LinkStatusResponse
        if (!res.ok || cancelled) return

        const { idv, verifiedData } = data

        if (data.padronComplete === false) {
          setPadronIncomplete(true)
          return
        }

        if (idv.isBlocked) {
          setView('blocked')
          setState((prev) => ({
            ...prev,
            idv: {
              ...prev.idv,
              attemptsUsed: idv.attemptsUsed,
              maxAttempts: idv.maxAttempts,
              verificationStatus: 'blocked',
            },
          }))
          return
        }

        if (idv.canProceedToActivation && verifiedData) {
          setState((prev) => ({
            ...prev,
            step: idv.policyConsentGiven ? 7 : 6,
            insuredData: verifiedData,
            policyConsentGiven: idv.policyConsentGiven,
            idv: {
              ...prev.idv,
              biometricConsentGiven: true,
              verificationStatus: 'verified',
              attemptsUsed: idv.attemptsUsed,
              maxAttempts: idv.maxAttempts,
            },
          }))
          return
        }

        if (idv.biometricConsentGiven) {
          if (idv.currentAttemptId) {
            setAttemptId(idv.currentAttemptId)
            setState((prev) => ({
              ...prev,
              step: stepForIdvStage(idv.currentStage),
              idv: {
                ...prev.idv,
                biometricConsentGiven: true,
                verificationStatus: 'in_progress',
                attemptsUsed: idv.attemptsUsed,
                maxAttempts: idv.maxAttempts,
              },
            }))
            return
          }

          if (idv.attemptsUsed > 0 && idv.lastFailureReason) {
            setView('failed')
            setState((prev) => ({
              ...prev,
              idv: {
                ...prev.idv,
                biometricConsentGiven: true,
                attemptsUsed: idv.attemptsUsed,
                maxAttempts: idv.maxAttempts,
                verificationStatus: 'failed',
                lastFailureReason: idv.lastFailureReason ?? undefined,
              },
            }))
            return
          }

          // Consentimiento otorgado pero sin intento activo: retomar verificación.
          try {
            const resumedAttemptId = await startVerification(token)
            if (cancelled) return
            setAttemptId(resumedAttemptId)
            setState((prev) => ({
              ...prev,
              step: 3,
              idv: {
                ...prev.idv,
                biometricConsentGiven: true,
                verificationStatus: 'in_progress',
                attemptsUsed: idv.attemptsUsed,
                maxAttempts: idv.maxAttempts,
              },
            }))
          } catch {
            setState((prev) => ({
              ...prev,
              step: 3,
              idv: {
                ...prev.idv,
                biometricConsentGiven: true,
                attemptsUsed: idv.attemptsUsed,
                maxAttempts: idv.maxAttempts,
              },
            }))
          }
        }
      } catch {
        // Si falla la restauración, el usuario puede continuar desde el landing.
      } finally {
        if (!cancelled) setRestoringSession(false)
      }
    }

    restoreSession()
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (restoringSession || consentLoading || attemptId || autoResumeRef.current || padronIncomplete)
      return
    if (state.step === 3 && state.idv.biometricConsentGiven) {
      autoResumeRef.current = true
      void proceedToVerification(true)
    }
  }, [restoringSession, consentLoading, attemptId, state.step, state.idv.biometricConsentGiven, padronIncomplete])

  const progressStep = getProgressStep(state.step)
  const showProgressBar =
    view === 'wizard' && state.step !== 1 && state.step !== 5 && state.step !== 8

  function goToStep(step: WizardState['step']) {
    setState((prev) => ({ ...prev, step }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleLandingNext() {
    if (state.idv.biometricConsentGiven) {
      void proceedToVerification(true)
      return
    }
    goToStep(2)
  }

  async function proceedToVerification(consentAlreadyGiven = false) {
    if (padronIncomplete) return

    setConsentLoading(true)
    setConsentError(null)
    try {
      if (!consentAlreadyGiven && !state.idv.biometricConsentGiven) {
        await postConsent(token, 'biometric_data_processing', true)
      }

      const newAttemptId = await startVerification(token)
      setAttemptId(newAttemptId)
      setState((prev) => ({
        ...prev,
        idv: {
          ...prev.idv,
          biometricConsentGiven: true,
          biometricConsentTimestamp: prev.idv.biometricConsentTimestamp ?? new Date().toISOString(),
          verificationStatus: 'in_progress',
        },
      }))
      goToStep(3)
    } catch (err) {
      if (err instanceof Error && err.message === 'PADRON_INCOMPLETE') {
        setPadronIncomplete(true)
        return
      }
      setConsentError(err instanceof Error ? err.message : 'No se pudo iniciar la verificación')
    } finally {
      setConsentLoading(false)
    }
  }

  async function handleBiometricConsentAccept() {
    await proceedToVerification(state.idv.biometricConsentGiven)
  }

  async function handleBiometricConsentReject() {
    setConsentError(null)
    try {
      await postConsent(token, 'biometric_data_processing', false)
      setState((prev) => ({
        ...prev,
        idv: {
          ...prev.idv,
          biometricConsentGiven: false,
          biometricConsentTimestamp: new Date().toISOString(),
        },
      }))
    } catch (err) {
      setConsentError(err instanceof Error ? err.message : 'Error al registrar consentimiento')
    }
  }

  function handleDocumentCaptured(file: File, insuredData: InsuredData) {
    setDocumentFile(file)
    setState((prev) => ({
      ...prev,
      insuredData,
      idv: { ...prev.idv, documentImageCaptured: true },
    }))
    goToStep(4)
  }

  function handleDocumentFailure(error: string, attemptsRemaining?: number) {
    const failureReason: VerificationFailureReason =
      error === 'data_mismatch' ? 'data_mismatch' : 'document_unreadable'

    setState((prev) => {
      const attemptsUsed =
        attemptsRemaining !== undefined
          ? MAX_VERIFICATION_ATTEMPTS - attemptsRemaining
          : prev.idv.attemptsUsed + 1
      const blocked = attemptsRemaining === 0

      if (blocked) setView('blocked')
      else if (error === 'data_mismatch') setView('failed')

      return {
        ...prev,
        idv: {
          ...prev.idv,
          attemptsUsed,
          verificationStatus: blocked ? 'blocked' : 'failed',
          lastFailureReason: failureReason,
        },
      }
    })

    if (attemptsRemaining !== 0 && error === 'data_mismatch') {
      setAttemptId(null)
    }
  }

  function handleFacialCaptured(file: File) {
    setFacialFile(file)
    setState((prev) => ({
      ...prev,
      idv: { ...prev.idv, facialImageCaptured: true },
    }))
    goToStep(5)
  }

  async function handleVerificationComplete(
    success: boolean,
    verifiedData?: InsuredData
  ) {
    if (success && verifiedData) {
      setState((prev) => ({
        ...prev,
        insuredData: verifiedData,
        idv: {
          ...prev.idv,
          verificationStatus: 'verified',
          lastAttempt: {
            timestamp: new Date().toISOString(),
            stage: 'data_match',
            result: 'success',
          },
        },
      }))
      goToStep(6)
      return
    }

    const failureReason: VerificationFailureReason = 'face_mismatch'

    try {
      const statusRes = await fetch(`/api/activacion/${token}/idv/status`)
      const statusBody = await statusRes.json()

      setState((prev) => {
        const attemptsUsed = statusBody.attemptsUsed ?? prev.idv.attemptsUsed + 1
        const blocked = statusBody.isBlocked || attemptsUsed >= MAX_VERIFICATION_ATTEMPTS
        setView(blocked ? 'blocked' : 'failed')
        return {
          ...prev,
          idv: {
            ...prev.idv,
            attemptsUsed,
            maxAttempts: statusBody.maxAttempts ?? MAX_VERIFICATION_ATTEMPTS,
            verificationStatus: blocked ? 'blocked' : 'failed',
            lastFailureReason: failureReason,
            lastAttempt: {
              timestamp: new Date().toISOString(),
              stage: 'comparison',
              result: 'failed',
              failureReason,
            },
          },
        }
      })
      setAttemptId(null)
    } catch {
      setView('failed')
    }
  }

  async function handleVerificationRetry() {
    try {
      const newAttemptId = await startVerification(token)

      setAttemptId(newAttemptId)
      setDocumentFile(null)
      setFacialFile(null)
      setState((prev) => ({
        ...prev,
        idv: {
          ...prev.idv,
          documentImageCaptured: false,
          facialImageCaptured: false,
          verificationStatus: 'in_progress',
        },
      }))
      setView('wizard')
      goToStep(3)
    } catch (err) {
      if (err instanceof Error && err.message.includes('agotado')) {
        setView('blocked')
        return
      }
      setSubmitError(err instanceof Error ? err.message : 'No se pudo reiniciar la verificación')
    }
  }

  async function handlePolicyConsentNext() {
    setConsentError(null)
    try {
      await postConsent(token, 'policy_activation', true)
      setState((prev) => ({
        ...prev,
        policyConsentGiven: true,
        policyConsentTimestamp: new Date().toISOString(),
      }))
      goToStep(7)
    } catch (err) {
      setConsentError(err instanceof Error ? err.message : 'Error al registrar consentimiento')
    }
  }

  async function handleDatosNext(_insuredData: InsuredData, beneficiaries: Beneficiary[]) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/activacion/${token}/activar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beneficiaries }),
      })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.message ?? body.error ?? 'No se pudo activar tu seguro')
      }
      setActivation(body as ActivationResult)
      setState((prev) => ({
        ...prev,
        insuredData: body.insuredData ?? prev.insuredData,
        beneficiaries,
        step: 8,
      }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error inesperado, intenta de nuevo')
    } finally {
      setSubmitting(false)
    }
  }

  if (padronIncomplete) {
    return <StepPadronIncompleto empresaNombre={empresaNombre} />
  }

  if (restoringSession) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Cargando tu activación...</p>
      </div>
    )
  }

  if (view === 'blocked' || state.idv.verificationStatus === 'blocked') {
    return <StepBloqueado empresaNombre={empresaNombre} />
  }

  if (view === 'failed') {
    const attemptsRemaining = state.idv.maxAttempts - state.idv.attemptsUsed
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <WizardProgressBar currentStep={2} />
        <main className="flex-1 w-full max-w-md mx-auto">
          <StepVerificacionFallida
            failureReason={state.idv.lastFailureReason ?? 'face_mismatch'}
            attemptsRemaining={attemptsRemaining}
            empresaNombre={empresaNombre}
            onRetry={handleVerificationRetry}
            onBlocked={() => setView('blocked')}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {showProgressBar && <WizardProgressBar currentStep={progressStep} />}

      <main
        className={cn(
          'flex-1 w-full max-w-md mx-auto transition-all duration-300',
          state.step === 1 && 'max-w-none',
          state.step === 5 && 'max-w-none',
          state.step === 8 && 'max-w-none'
        )}
        key={state.step}
      >
        {state.step === 1 && (
          <StepLanding
            colaboradorNombre={colaboradorNombre}
            empresaNombre={empresaNombre}
            montoCobertura={montoCobertura}
            onNext={handleLandingNext}
          />
        )}

        {state.step === 2 && (
          <>
            <StepConsentimientoBiometrico
              onAccept={handleBiometricConsentAccept}
              onReject={handleBiometricConsentReject}
              loading={consentLoading}
              consentAlreadyGiven={state.idv.biometricConsentGiven}
            />
            {consentError && (
              <p className="px-5 pb-4 text-center text-sm text-destructive">{consentError}</p>
            )}
          </>
        )}

        {state.step === 3 && !attemptId && (
          <div className="flex flex-col items-center justify-center gap-4 px-5 py-16 text-center">
            <p className="text-muted-foreground text-sm">
              Preparando tu verificación de identidad...
            </p>
            {consentError && (
              <p className="text-destructive text-sm">{consentError}</p>
            )}
            <button
              type="button"
              className="text-sm font-medium text-accent underline disabled:opacity-50"
              disabled={consentLoading}
              onClick={() => void proceedToVerification(true)}
            >
              {consentLoading ? 'Iniciando...' : 'Reintentar'}
            </button>
          </div>
        )}

        {state.step === 3 && attemptId && (
          <StepCapturaDocumento
            token={token}
            attemptId={attemptId}
            onNext={handleDocumentCaptured}
            onFailure={handleDocumentFailure}
          />
        )}

        {state.step === 4 && (
          <>
            <StepCapturaFacial onNext={handleFacialCaptured} />
            {process.env.NODE_ENV === 'development' && (
              <div className="px-5 pb-6 text-center">
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={() => setSimulateVerificationFailure((v) => !v)}
                >
                  Demo: {simulateVerificationFailure ? 'fallo IDV activo' : 'activar fallo IDV'}
                </button>
              </div>
            )}
          </>
        )}

        {state.step === 5 && attemptId && documentFile && facialFile && (
          <StepVerificando
            token={token}
            attemptId={attemptId}
            documentFile={documentFile}
            facialFile={facialFile}
            onComplete={handleVerificationComplete}
            simulateFailure={simulateVerificationFailure}
          />
        )}

        {state.step === 6 && (
          <>
            <StepConsentimientoPoliza
              empresaNombre={empresaNombre}
              montoCobertura={montoCobertura}
              onNext={handlePolicyConsentNext}
            />
            {consentError && (
              <p className="px-5 pb-4 text-center text-sm text-destructive">{consentError}</p>
            )}
          </>
        )}

        {state.step === 7 && (
          <StepDatos
            insuredData={state.insuredData}
            onNext={handleDatosNext}
            submitting={submitting}
            submitError={submitError}
          />
        )}

        {state.step === 8 && activation && (
          <StepExito
            insuredData={state.insuredData}
            beneficiaries={state.beneficiaries}
            polizaNumero={polizaNumero}
            activatedAt={activation.activatedAt}
            montoCobertura={montoCobertura}
            empresaNombre={empresaNombre}
          />
        )}
      </main>
    </div>
  )
}
