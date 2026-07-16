'use client'

import { useState } from 'react'
import { WizardProgressBar } from '@/components/WizardProgressBar'
import { StepLanding } from '@/components/steps/StepLanding'
import { StepDocumento } from '@/components/steps/StepDocumento'
import { StepDatos } from '@/components/steps/StepDatos'
import { StepExito } from '@/components/steps/StepExito'
import { AlreadyActivated } from '@/components/AlreadyActivated'
import { INITIAL_STATE, type WizardState, type InsuredData, type Beneficiary } from '@/lib/types'
import { cn } from '@/lib/utils'

export function InsuranceWizard() {
  const [state, setState] = useState<WizardState>(INITIAL_STATE)

  // Simulate "already activated" state — toggle via URL param or prop
  // In production this would come from the backend link validation
  if (state.alreadyActivated) {
    return (
      <AlreadyActivated
        colaboradorNombre={state.colaboradorNombre}
        polizaNumero={state.polizaNumero}
      />
    )
  }

  function goToStep(step: WizardState['step']) {
    setState((prev) => ({ ...prev, step }))
    // Scroll to top on step change
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleLandingNext() {
    goToStep(2)
  }

  function handleDocumentoNext(insuredData: InsuredData) {
    setState((prev) => ({ ...prev, insuredData, step: 3 }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleDatosNext(insuredData: InsuredData, beneficiaries: Beneficiary[]) {
    setState((prev) => ({ ...prev, insuredData, beneficiaries, step: 4 }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Progress bar — hidden on step 1 (landing) and step 4 (success) */}
      {state.step !== 1 && state.step !== 4 && (
        <WizardProgressBar currentStep={state.step} />
      )}

      {/* Step content with fade transition */}
      <main
        className={cn(
          'flex-1 w-full max-w-md mx-auto transition-all duration-300',
          state.step === 1 && 'max-w-none'
        )}
        key={state.step}
      >
        {state.step === 1 && (
          <StepLanding
            colaboradorNombre={state.colaboradorNombre}
            empresaNombre={state.empresaNombre}
            montoCobertura={state.montoCobertura}
            onNext={handleLandingNext}
          />
        )}
        {state.step === 2 && (
          <StepDocumento onNext={handleDocumentoNext} />
        )}
        {state.step === 3 && (
          <StepDatos
            insuredData={state.insuredData}
            onNext={handleDatosNext}
          />
        )}
        {state.step === 4 && (
          <StepExito
            insuredData={state.insuredData}
            beneficiaries={state.beneficiaries}
            polizaNumero={state.polizaNumero}
            montoCobertura={state.montoCobertura}
            empresaNombre={state.empresaNombre}
          />
        )}
      </main>
    </div>
  )
}
