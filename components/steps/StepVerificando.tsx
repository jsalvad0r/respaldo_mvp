'use client'

import { useEffect, useState } from 'react'
import { RespaldoWordmark } from '@/components/brand/logo'
import { ShieldCheck } from 'lucide-react'

interface StepVerificandoProps {
  onComplete: (success: boolean) => void
  /** Prototipo: forzar resultado de verificación */
  simulateFailure?: boolean
}

const SUBMESSAGES = [
  'Comparando tu rostro con el documento...',
  'Validando número de documento...',
  'Validando fecha de nacimiento...',
  'Casi listo...',
]

export function StepVerificando({ onComplete, simulateFailure = false }: StepVerificandoProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % SUBMESSAGES.length)
    }, 2000)

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 4, 95))
    }, 200)

    const completeTimeout = setTimeout(() => {
      setProgress(100)
      setTimeout(() => onComplete(!simulateFailure), 400)
    }, 4000)

    return () => {
      clearInterval(messageInterval)
      clearInterval(progressInterval)
      clearTimeout(completeTimeout)
    }
  }, [onComplete, simulateFailure])

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12 gap-8 text-center bg-background">
      <RespaldoWordmark />

      <div className="relative">
        <div className="size-24 rounded-full bg-[var(--brand-blue-light)] flex items-center justify-center">
          <ShieldCheck className="size-12 text-accent animate-pulse" strokeWidth={1.5} />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>

      <div className="flex flex-col gap-3 max-w-xs">
        <h2 className="text-foreground text-xl font-bold text-balance">
          Verificando tu identidad...
        </h2>
        <p
          className="text-muted-foreground text-sm leading-relaxed transition-opacity duration-300"
          key={messageIndex}
        >
          {SUBMESSAGES[messageIndex]}
        </p>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-2">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Este proceso puede tomar hasta 2 minutos
        </p>
      </div>
    </div>
  )
}
