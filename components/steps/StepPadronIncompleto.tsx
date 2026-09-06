'use client'

import { RespaldoWordmark } from '@/components/brand/logo'
import { AlertCircle } from 'lucide-react'

interface StepPadronIncompletoProps {
  empresaNombre: string
}

export function StepPadronIncompleto({ empresaNombre }: StepPadronIncompletoProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12 gap-8 text-center bg-background">
      <RespaldoWordmark />

      <div className="size-20 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
        <AlertCircle className="size-10 text-amber-600" strokeWidth={1.5} />
      </div>

      <div className="flex flex-col gap-3 max-w-sm">
        <h1 className="text-foreground text-xl font-bold text-balance">
          Tu registro está incompleto
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          No podemos iniciar la verificación de identidad porque faltan tu número de documento
          o fecha de nacimiento en el registro de {empresaNombre}.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Contacta a Recursos Humanos o al equipo de la aseguradora para que completen tu
          registro. Una vez corregido, podrás usar el mismo link de activación.
        </p>
      </div>
    </div>
  )
}
