'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Clock, CheckCircle2 } from 'lucide-react'

interface StepLandingProps {
  colaboradorNombre: string
  empresaNombre: string
  montoCobertura: number
  onNext: () => void
}

const BENEFITS = [
  'Sin costo para ti — tu empresa ya lo paga',
  'Cobertura activa desde hoy mismo',
  'Tus beneficiarios reciben el apoyo si algo pasa',
]

export function StepLanding({ colaboradorNombre, empresaNombre, montoCobertura, onNext }: StepLandingProps) {
  const formattedAmount = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(montoCobertura)

  return (
    <div className="flex flex-col min-h-[calc(100dvh-120px)]">
      {/* Hero section */}
      <div className="bg-primary px-6 pt-2 pb-10 flex flex-col items-center text-center gap-4">
        {/* Shield icon */}
        <div className="relative">
          <div className="size-24 rounded-full bg-accent/20 flex items-center justify-center mt-4">
            <div className="size-16 rounded-full bg-accent/30 flex items-center justify-center">
              <Shield className="size-8 text-accent" strokeWidth={1.5} />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-accent flex items-center justify-center shadow-md">
            <CheckCircle2 className="size-4 text-primary" strokeWidth={2.5} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-primary-foreground/70 text-sm font-medium uppercase tracking-widest">
            {empresaNombre} te protege
          </p>
          <h1 className="text-primary-foreground text-2xl font-bold leading-snug text-balance">
            Hola {colaboradorNombre}, tienes un seguro de vida esperándote
          </h1>
          <p className="text-primary-foreground/70 text-sm leading-relaxed text-balance">
            Tu empresa ya lo pagó por ti. Solo necesitas activarlo — toma menos de 1 minuto.
          </p>
        </div>

        {/* Coverage amount */}
        <div className="bg-accent/20 rounded-2xl px-6 py-4 w-full max-w-xs border border-accent/30">
          <p className="text-primary-foreground/70 text-xs uppercase tracking-wider mb-1">Cobertura total</p>
          <p className="text-accent text-3xl font-bold">{formattedAmount}</p>
          <p className="text-primary-foreground/60 text-xs mt-1">para tu familia</p>
        </div>
      </div>

      {/* Content section */}
      <div className="flex-1 px-6 pt-8 pb-6 flex flex-col gap-6 bg-background">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-accent shrink-0" />
          <p className="text-muted-foreground text-sm">
            Activación en menos de <span className="text-foreground font-semibold">1 minuto</span>
          </p>
        </div>

        {/* Benefits list */}
        <div className="flex flex-col gap-3">
          {BENEFITS.map((benefit, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="size-5 rounded-full bg-[var(--brand-teal-light)] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="size-3 text-accent" strokeWidth={2.5} />
              </div>
              <p className="text-foreground text-sm leading-relaxed">{benefit}</p>
            </div>
          ))}
        </div>

        <Badge variant="secondary" className="self-start text-xs px-3 py-1">
          100% gratuito para ti
        </Badge>

        <div className="mt-auto flex flex-col gap-3 pt-4">
          <Button
            size="lg"
            className="w-full rounded-xl h-14 text-base font-semibold shadow-md bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={onNext}
          >
            <Shield className="size-5 mr-2" data-icon="inline-start" />
            Activar mi seguro
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Tus datos están protegidos y nunca se comparten con terceros
          </p>
        </div>
      </div>
    </div>
  )
}
