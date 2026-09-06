'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShieldCheck, FileText, ScanFace, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepConsentimientoBiometricoProps {
  onAccept: () => void | Promise<void>
  onReject: () => void | Promise<void>
  loading?: boolean
  consentAlreadyGiven?: boolean
}

const CAPTURE_ITEMS = [
  {
    icon: FileText,
    title: 'Foto de tu documento de identidad',
    description: 'DNI peruano — parte frontal',
  },
  {
    icon: ScanFace,
    title: 'Foto de tu rostro',
    description: 'Selfie con detección de presencia física',
  },
]

export function StepConsentimientoBiometrico({
  onAccept,
  onReject,
  loading = false,
  consentAlreadyGiven = false,
}: StepConsentimientoBiometricoProps) {
  const [accepted, setAccepted] = useState(consentAlreadyGiven)
  const [rejected, setRejected] = useState(false)

  if (rejected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-120px)] px-6 py-12 gap-8 text-center">
        <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="size-10 text-destructive" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-3 max-w-xs">
          <h2 className="text-foreground text-xl font-bold text-balance">
            No puedes continuar sin consentimiento
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Para activar tu seguro necesitamos verificar tu identidad. Sin tu consentimiento para el
            tratamiento de datos biométricos, el flujo digital no puede continuar.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Si tienes dudas, contacta a Recursos Humanos de tu empresa.
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="w-full max-w-xs rounded-xl h-12 font-medium"
          onClick={() => setRejected(false)}
        >
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col px-5 py-8 gap-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="size-16 rounded-2xl bg-[var(--brand-blue-light)] flex items-center justify-center">
          <ShieldCheck className="size-8 text-accent" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-xl font-bold text-balance">
            Verificación de identidad
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Antes de activar tu póliza, necesitamos confirmar que eres el titular registrado.
            Este proceso toma aproximadamente 2 minutos.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {CAPTURE_ITEMS.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card"
          >
            <div className="size-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <item.icon className="size-5 text-accent" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <p className="text-foreground text-sm font-semibold">{item.title}</p>
              <p className="text-muted-foreground text-xs">{item.description}</p>
            </div>
          </div>
        ))}
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
          aria-label="Aceptar tratamiento de datos biométricos"
        />
        <span className="text-foreground text-xs leading-relaxed text-left">
          Autorizo el tratamiento de mis datos biométricos (imagen del documento y rostro) para
          verificar mi identidad, conforme a la Ley 29733 de Protección de Datos Personales del
          Perú. Entiendo que sin este consentimiento no podré continuar con la activación digital.
        </span>
      </label>

      <div className="flex flex-col gap-3 mt-auto">
        <Button
          size="lg"
          disabled={!accepted || loading}
          className="w-full rounded-xl h-14 text-base font-semibold shadow-md bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50"
          onClick={() => void onAccept()}
        >
          {loading ? 'Iniciando verificación...' : 'Continuar'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground text-sm h-10"
          onClick={() => {
            setRejected(true)
            onReject()
          }}
        >
          Rechazar
        </Button>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--brand-blue-light)] border border-accent/20">
        <CheckCircle2 className="size-4 text-accent shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-foreground text-xs leading-relaxed">
          Respaldo no almacena imágenes de tu documento ni de tu rostro. La evidencia queda
          custodiada por nuestro proveedor de verificación.
        </p>
      </div>
    </div>
  )
}
