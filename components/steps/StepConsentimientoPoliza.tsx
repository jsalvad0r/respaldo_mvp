'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepConsentimientoPolizaProps {
  empresaNombre: string
  montoCobertura: number
  onNext: () => void
}

export function StepConsentimientoPoliza({
  empresaNombre,
  montoCobertura,
  onNext,
}: StepConsentimientoPolizaProps) {
  const [accepted, setAccepted] = useState(false)

  const formattedAmount = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
  }).format(montoCobertura)

  return (
    <div className="flex flex-col min-h-[calc(100dvh-120px)]">
      {/* Hero — identidad verificada */}
      <div className="bg-primary px-6 pt-8 pb-10 flex flex-col items-center text-center gap-5">
        <div className="size-20 rounded-full bg-accent/20 flex items-center justify-center">
          <ShieldCheck className="size-10 text-accent" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-primary-foreground/70 text-sm font-medium uppercase tracking-widest">
            Verificación exitosa
          </p>
          <h1 className="text-primary-foreground text-2xl font-bold leading-snug text-balance">
            Identidad verificada
          </h1>
          <p className="text-primary-foreground/70 text-sm leading-relaxed">
            Ahora acepta los términos de tu seguro para continuar
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 py-8 flex flex-col gap-6 bg-background">
        {/* Resumen de póliza */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Tu póliza</span>
            <Badge variant="secondary" className="text-xs">
              Vida colectivo
            </Badge>
          </div>
          <div className="px-4 py-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">Cobertura</span>
              <span className="text-foreground text-lg font-bold text-accent">
                {formattedAmount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">Empresa</span>
              <span className="text-foreground text-sm font-medium">{empresaNombre}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">Tipo</span>
              <span className="text-foreground text-sm font-medium">Seguro de vida colectivo</span>
            </div>
          </div>
        </div>

        <label
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
            accepted ? 'border-accent bg-[var(--brand-blue-light)]/50' : 'border-border bg-card'
          )}
        >
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-input accent-accent cursor-pointer"
            aria-label="Aceptar términos de la póliza"
          />
          <span className="text-foreground text-xs leading-relaxed text-left">
            He leído y acepto los{' '}
            <a href="#" className="text-accent underline underline-offset-2">
              términos y condiciones
            </a>{' '}
            de la póliza de seguro de vida colectivo.
          </span>
        </label>

        <div className="mt-auto flex flex-col gap-3">
          <Button
            size="lg"
            disabled={!accepted}
            className="w-full rounded-xl h-14 text-base font-semibold shadow-md bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50"
            onClick={onNext}
          >
            Continuar a designar beneficiarios
          </Button>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--brand-blue-light)] border border-accent/20">
          <CheckCircle2 className="size-4 text-accent shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-foreground text-xs leading-relaxed">
            Este consentimiento es independiente del consentimiento de datos biométricos otorgado
            anteriormente.
          </p>
        </div>
      </div>
    </div>
  )
}
