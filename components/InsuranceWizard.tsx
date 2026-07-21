'use client'

import { useState } from 'react'
import { WizardProgressBar } from '@/components/WizardProgressBar'
import { StepLanding } from '@/components/steps/StepLanding'
import { StepDocumento } from '@/components/steps/StepDocumento'
import { StepDatos } from '@/components/steps/StepDatos'
import { StepExito } from '@/components/steps/StepExito'
import { INITIAL_STATE, type WizardState, type InsuredData, type Beneficiary } from '@/lib/types'
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

export function InsuranceWizard({
  token,
  colaboradorNombre,
  empresaNombre,
  montoCobertura,
  polizaNumero,
}: InsuranceWizardProps) {
  const [state, setState] = useState<WizardState>(INITIAL_STATE)
  const [activation, setActivation] = useState<ActivationResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function goToStep(step: WizardState['step']) {
    setState((prev) => ({ ...prev, step }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleLandingNext() {
    goToStep(2)
  }

  function handleDocumentoNext(insuredData: InsuredData, documentImagePath: string | null) {
    setState((prev) => ({ ...prev, insuredData, documentImagePath, step: 3 }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      setState((prev) => ({ ...prev, insuredData, beneficiaries, step: 4 }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error inesperado, intenta de nuevo')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {state.step !== 1 && state.step !== 4 && (
        <WizardProgressBar currentStep={state.step} />
      )}

      <main
        className={cn(
          'flex-1 w-full max-w-md mx-auto transition-all duration-300',
          state.step === 1 && 'max-w-none'
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
          <StepDocumento token={token} onNext={handleDocumentoNext} />
        )}
        {state.step === 3 && (
          <StepDatos
            insuredData={state.insuredData}
            onNext={handleDatosNext}
            submitting={submitting}
            submitError={submitError}
          />
        )}
        {state.step === 4 && activation && (
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
