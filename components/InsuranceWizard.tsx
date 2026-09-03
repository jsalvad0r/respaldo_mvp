'use client'

import { useState } from 'react'
import { WizardProgressBar } from '@/components/WizardProgressBar'
import { StepLanding } from '@/components/steps/StepLanding'
import { StepConsentimientoBiometrico } from '@/components/steps/StepConsentimientoBiometrico'
import { StepCapturaDocumento } from '@/components/steps/StepCapturaDocumento'
import { StepCapturaFacial } from '@/components/steps/StepCapturaFacial'
import { StepVerificando } from '@/components/steps/StepVerificando'
import { StepVerificacionFallida } from '@/components/steps/StepVerificacionFallida'
import { StepBloqueado } from '@/components/steps/StepBloqueado'
import { StepConsentimientoPoliza } from '@/components/steps/StepConsentimientoPoliza'
import { StepDatos } from '@/components/steps/StepDatos'
import { StepExito } from '@/components/steps/StepExito'
import {
  INITIAL_STATE,
  getProgressStep,
  MOCK_OCR_DATA,
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
  const [simulateVerificationFailure, setSimulateVerificationFailure] = useState(false)

  const progressStep = getProgressStep(state.step)
  const showProgressBar =
    view === 'wizard' && state.step !== 1 && state.step !== 5 && state.step !== 8

  function goToStep(step: WizardState['step']) {
    setState((prev) => ({ ...prev, step }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleLandingNext() {
    goToStep(2)
  }

  function handleBiometricConsentAccept() {
    setState((prev) => ({
      ...prev,
      idv: {
        ...prev.idv,
        biometricConsentGiven: true,
        biometricConsentTimestamp: new Date().toISOString(),
        verificationStatus: 'in_progress',
      },
    }))
    goToStep(3)
  }

  function handleBiometricConsentReject() {
    setState((prev) => ({
      ...prev,
      idv: {
        ...prev.idv,
        biometricConsentGiven: false,
        biometricConsentTimestamp: new Date().toISOString(),
      },
    }))
  }

  function handleDocumentCaptured() {
    setState((prev) => ({
      ...prev,
      idv: { ...prev.idv, documentImageCaptured: true },
    }))
    goToStep(4)
  }

  function handleFacialCaptured() {
    setState((prev) => ({
      ...prev,
      idv: { ...prev.idv, facialImageCaptured: true },
    }))
    goToStep(5)
  }

  function handleVerificationComplete(success: boolean) {
    if (success) {
      setState((prev) => ({
        ...prev,
        insuredData: MOCK_OCR_DATA,
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
    setState((prev) => {
      const attemptsUsed = prev.idv.attemptsUsed + 1
      const blocked = attemptsUsed >= MAX_VERIFICATION_ATTEMPTS
      setView(blocked ? 'blocked' : 'failed')
      return {
        ...prev,
        idv: {
          ...prev.idv,
          attemptsUsed,
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
  }

  function handleVerificationRetry() {
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
  }

  function handlePolicyConsentNext() {
    setState((prev) => ({
      ...prev,
      policyConsentGiven: true,
      policyConsentTimestamp: new Date().toISOString(),
    }))
    goToStep(7)
  }

  async function handleDatosNext(insuredData: InsuredData, beneficiaries: Beneficiary[]) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/activacion/${token}/activar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insuredData,
          beneficiaries,
          documentImagePath: state.documentImagePath,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.error ?? 'No se pudo activar tu seguro')
      }
      setActivation(body as ActivationResult)
      setState((prev) => ({ ...prev, insuredData, beneficiaries, step: 8 }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error inesperado, intenta de nuevo')
    } finally {
      setSubmitting(false)
    }
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
          <StepConsentimientoBiometrico
            onAccept={handleBiometricConsentAccept}
            onReject={handleBiometricConsentReject}
          />
        )}

        {state.step === 3 && (
          <StepCapturaDocumento onNext={handleDocumentCaptured} />
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

        {state.step === 5 && (
          <StepVerificando
            onComplete={handleVerificationComplete}
            simulateFailure={simulateVerificationFailure}
          />
        )}

        {state.step === 6 && (
          <StepConsentimientoPoliza
            empresaNombre={empresaNombre}
            montoCobertura={montoCobertura}
            onNext={handlePolicyConsentNext}
          />
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
