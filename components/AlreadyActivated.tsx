'use client'

import { CheckCircle2, MessageCircle } from 'lucide-react'

import { RespaldoWordmark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'

interface AlreadyActivatedProps {
  colaboradorNombre: string
  polizaNumero: string
}

export function AlreadyActivated({ colaboradorNombre, polizaNumero }: AlreadyActivatedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12 gap-8 text-center bg-background">
      <RespaldoWordmark />

      {/* Success icon */}
      <div className="size-24 rounded-full bg-[var(--brand-blue-light)] flex items-center justify-center">
        <div className="size-16 rounded-full bg-[var(--brand-success)]/10 flex items-center justify-center">
          <CheckCircle2 className="size-9 text-[var(--brand-success)]" strokeWidth={2} />
        </div>
      </div>

      {/* Message */}
      <div className="flex flex-col gap-3 max-w-xs">
        <h1 className="text-foreground text-2xl font-bold text-balance">
          ¡{colaboradorNombre}, ya estás protegida!
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Este link ya fue utilizado. Tu seguro de vida fue activado exitosamente y tu póliza está vigente.
        </p>
        <div className="mt-2 px-4 py-2 rounded-xl bg-muted inline-block">
          <p className="text-muted-foreground text-xs">Número de póliza</p>
          <p className="text-foreground text-sm font-mono font-semibold mt-0.5">{polizaNumero}</p>
        </div>
      </div>

      {/* Info */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--brand-blue-light)] border border-accent/20">
          <MessageCircle className="size-4 text-accent shrink-0" strokeWidth={2} />
          <p className="text-foreground text-xs leading-relaxed text-left">
            Si tienes dudas sobre tu cobertura, comunícate con Recursos Humanos o responde el mensaje de WhatsApp.
          </p>
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full rounded-xl h-12 font-medium"
          onClick={() => {}}
        >
          Contactar soporte
        </Button>
      </div>
    </div>
  )
}
