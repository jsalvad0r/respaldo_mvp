'use client'

import { Button } from '@/components/ui/button'
import { RespaldoWordmark } from '@/components/brand/logo'
import { Lock, Phone, Mail } from 'lucide-react'

interface StepBloqueadoProps {
  empresaNombre: string
}

export function StepBloqueado({ empresaNombre }: StepBloqueadoProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12 gap-8 text-center bg-background">
      <RespaldoWordmark />

      <div className="size-24 rounded-full bg-destructive/10 flex items-center justify-center">
        <div className="size-16 rounded-full bg-destructive/15 flex items-center justify-center">
          <Lock className="size-9 text-destructive" strokeWidth={1.5} />
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-xs">
        <h1 className="text-foreground text-2xl font-bold text-balance">
          Verificación bloqueada
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Has agotado los 3 intentos de verificación. Para continuar con la activación de tu
          seguro, contacta a Recursos Humanos de {empresaNombre}.
        </p>
      </div>

      <div className="w-full max-w-xs rounded-xl border border-border bg-card overflow-hidden text-left">
        <div className="px-4 py-3 bg-muted/50">
          <span className="text-sm font-semibold text-foreground">Datos de contacto</span>
        </div>
        <div className="px-4 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Phone className="size-4 text-accent shrink-0" />
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Teléfono</span>
              <a href="tel:+5112345678" className="text-foreground text-sm font-medium">
                +51 1 234 5678
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="size-4 text-accent shrink-0" />
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Correo</span>
              <a
                href="mailto:rrhh@empresa.com"
                className="text-foreground text-sm font-medium"
              >
                rrhh@empresa.com
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <a
          href="tel:+5112345678"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl h-14 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground transition-all"
        >
          <Phone className="size-5" />
          Contactar soporte
        </a>
        <p className="text-center text-xs text-muted-foreground">
          Tu aseguradora podrá ayudarte con un proceso alternativo de activación
        </p>
      </div>
    </div>
  )
}
