'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { type InsuredData, type Beneficiary, PARENTESCO_OPTIONS } from '@/lib/types'
import { Download, MessageCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepExitoProps {
  insuredData: InsuredData
  beneficiaries: Beneficiary[]
  polizaNumero: string
  activatedAt: string
  montoCobertura: number
  empresaNombre: string
}

function AnimatedCheck() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={cn(
        'size-24 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center transition-all duration-500',
        visible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
      )}
    >
      <div className="size-16 rounded-full bg-green-200 dark:bg-green-900 flex items-center justify-center">
        <CheckCircle2
          className={cn(
            'size-9 text-[var(--brand-success)] transition-all duration-700 delay-200',
            visible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          )}
          strokeWidth={2}
        />
      </div>
    </div>
  )
}

export function StepExito({
  insuredData,
  beneficiaries,
  polizaNumero,
  activatedAt,
  montoCobertura,
  empresaNombre,
}: StepExitoProps) {
  const [contentVisible, setContentVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setContentVisible(true), 500)
    return () => clearTimeout(t)
  }, [])

  const formattedAmount = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(montoCobertura)

  const parentescoLabel = (value: string) =>
    PARENTESCO_OPTIONS.find((p) => p.value === value)?.label ?? value

  const formattedDate = new Date(activatedAt).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col min-h-[calc(100dvh-120px)]">
      {/* Hero */}
      <div className="bg-primary px-6 pt-8 pb-10 flex flex-col items-center text-center gap-5">
        <AnimatedCheck />

        <div
          className={cn(
            'flex flex-col gap-2 transition-all duration-700 delay-300',
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <p className="text-primary-foreground/70 text-sm uppercase tracking-widest font-medium">
            Seguro activado
          </p>
          <h1 className="text-primary-foreground text-2xl font-bold text-balance leading-snug">
            ¡Listo! Tu familia está protegida
          </h1>
          <div className="bg-accent/20 rounded-2xl px-6 py-3 border border-accent/30 mt-2">
            <p className="text-accent text-3xl font-bold">{formattedAmount}</p>
            <p className="text-primary-foreground/60 text-xs mt-1">cobertura de vida</p>
          </div>
        </div>
      </div>

      {/* Policy summary */}
      <div
        className={cn(
          'flex-1 px-5 py-8 flex flex-col gap-6 bg-background transition-all duration-700 delay-500',
          contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        {/* Policy details card */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Resumen de póliza</span>
            <Badge variant="secondary" className="text-xs">Activa</Badge>
          </div>
          <div className="px-4 py-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground text-xs">Asegurado</span>
              <span className="text-foreground text-sm font-medium text-right max-w-[60%]">
                {insuredData.nombreCompleto}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">Empresa</span>
              <span className="text-foreground text-sm font-medium">{empresaNombre}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">Número de póliza</span>
              <span className="text-foreground text-sm font-mono">{polizaNumero}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs">Fecha de activación</span>
              <span className="text-foreground text-sm">{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Beneficiaries */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/50">
            <span className="text-sm font-semibold text-foreground">
              Beneficiarios registrados
            </span>
          </div>
          <div className="px-4 py-4 flex flex-col gap-3">
            {beneficiaries.map((b, i) => (
              <div key={b.id}>
                {i > 0 && <Separator className="mb-3" />}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-foreground text-sm font-medium">{b.nombre}</span>
                    <span className="text-muted-foreground text-xs">{parentescoLabel(b.parentesco)}</span>
                  </div>
                  <Badge className="bg-[var(--brand-teal-light)] text-accent border-0 font-semibold">
                    {b.porcentaje}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp note */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--brand-teal-light)] border border-accent/20">
          <MessageCircle className="size-4 text-accent shrink-0" strokeWidth={2} />
          <p className="text-foreground text-xs leading-relaxed">
            Recibirás la confirmación también por <span className="font-semibold">WhatsApp</span> en los próximos minutos.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-2">
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-xl h-12 font-medium"
            onClick={() => {}}
            aria-label="Descargar comprobante de seguro (próximamente)"
          >
            <Download className="size-4" data-icon="inline-start" />
            Descargar comprobante
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Tu póliza también fue enviada al correo de Recursos Humanos
          </p>
        </div>
      </div>
    </div>
  )
}
