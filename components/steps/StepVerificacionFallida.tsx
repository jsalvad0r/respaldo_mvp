'use client'

import { Button } from '@/components/ui/button'
import { RespaldoWordmark } from '@/components/brand/logo'
import {
  type VerificationFailureReason,
  FAILURE_MESSAGES,
} from '@/lib/types'
import { AlertCircle, Phone, Mail, RefreshCw } from 'lucide-react'

interface StepVerificacionFallidaProps {
  failureReason: VerificationFailureReason
  attemptsRemaining: number
  empresaNombre: string
  onRetry: () => void
  onBlocked: () => void
}

export function StepVerificacionFallida({
  failureReason,
  attemptsRemaining,
  empresaNombre,
  onRetry,
  onBlocked,
}: StepVerificacionFallidaProps) {
  function handleRetry() {
    if (attemptsRemaining <= 0) {
      onBlocked()
    } else {
      onRetry()
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-120px)]">
      <div className="px-5 pt-6 pb-4">
        <RespaldoWordmark compact />
      </div>

      <div className="flex-1 flex flex-col px-5 py-6 gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="size-10 text-destructive" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-2 max-w-xs">
            <h2 className="text-foreground text-xl font-bold text-balance">
              No pudimos verificar tu identidad
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {FAILURE_MESSAGES[failureReason]}
            </p>
          </div>
        </div>

        {attemptsRemaining > 0 ? (
          <div className="px-4 py-3 rounded-xl bg-muted text-center">
            <p className="text-foreground text-sm font-medium">
              Te quedan{' '}
              <span className="text-accent font-bold">{attemptsRemaining}</span>{' '}
              {attemptsRemaining === 1 ? 'intento' : 'intentos'}
            </p>
          </div>
        ) : (
          <div className="px-4 py-3 rounded-xl bg-destructive/10 text-center">
            <p className="text-destructive text-sm font-medium">
              Has agotado todos tus intentos de verificación
            </p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/50">
            <span className="text-sm font-semibold text-foreground">
              Contacto — {empresaNombre}
            </span>
          </div>
          <div className="px-4 py-4 flex flex-col gap-3">
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

        <div className="mt-auto flex flex-col gap-3">
          {attemptsRemaining > 0 ? (
            <Button
              size="lg"
              className="w-full rounded-xl h-14 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleRetry}
            >
              <RefreshCw className="size-5" data-icon="inline-start" />
              Reintentar verificación
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-xl h-14 text-base font-medium"
              onClick={onBlocked}
            >
              Ver opciones de contacto
            </Button>
          )}
          <p className="text-center text-xs text-muted-foreground">
            Si el problema persiste, contacta a Recursos Humanos
          </p>
        </div>
      </div>
    </div>
  )
}
