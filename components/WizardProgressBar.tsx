'use client'

import { cn } from '@/lib/utils'
import type { WizardStep } from '@/lib/types'

const STEPS = [
  { num: 1, label: 'Bienvenida' },
  { num: 2, label: 'Documento' },
  { num: 3, label: 'Datos' },
  { num: 4, label: 'Listo' },
]

interface WizardProgressBarProps {
  currentStep: WizardStep
}

export function WizardProgressBar({ currentStep }: WizardProgressBarProps) {
  return (
    <header className="sticky top-0 z-10 bg-primary px-4 pt-4 pb-5 shadow-sm">
      {/* Logo / brand strip */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-accent flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 1L2 4v4c0 3.31 2.57 6.4 6 7 3.43-.6 6-3.69 6-7V4L8 1z" fill="currentColor" className="text-primary" />
            </svg>
          </div>
          <span className="text-primary-foreground font-semibold text-sm tracking-wide">VidaSegura</span>
        </div>
        <span className="text-primary-foreground/60 text-xs">
          Paso {currentStep} de 4
        </span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.num
          const isActive = currentStep === step.num
          const isLast = index === STEPS.length - 1

          return (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={cn(
                    'size-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                    isCompleted && 'bg-accent text-primary',
                    isActive && 'bg-primary-foreground text-primary ring-2 ring-accent',
                    !isCompleted && !isActive && 'bg-primary-foreground/20 text-primary-foreground/50'
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-label="Completado">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    step.num
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors duration-300',
                    isActive ? 'text-primary-foreground' : 'text-primary-foreground/50'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-1 rounded-full transition-all duration-500 mb-4',
                    isCompleted ? 'bg-accent' : 'bg-primary-foreground/20'
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>
    </header>
  )
}
