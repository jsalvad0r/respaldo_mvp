"use client"

import * as React from "react"
import { Building2, Calendar, CircleDot, MessageCircle, Phone } from "lucide-react"

import { CopyButton } from "@/components/panel/copy-button"
import { StatusBadge } from "@/components/panel/status-badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { guardarNotas, marcarRespondio } from "@/lib/panel/actions"
import {
  FUNNEL_ORDER,
  STAGE_CONFIG,
  linkFor,
  type Colaborador,
} from "@/lib/panel/model"
import { cn } from "@/lib/utils"

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
})

function DataRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  )
}

interface ColaboradorDetailProps {
  colaborador: Colaborador
  onUpdated?: (colaborador: Colaborador) => void
}

export function ColaboradorDetail({
  colaborador,
  onUpdated,
}: ColaboradorDetailProps) {
  const [current, setCurrent] = React.useState(colaborador)
  const [notas, setNotas] = React.useState(colaborador.notas)
  const [saved, setSaved] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [marking, setMarking] = React.useState(false)

  React.useEffect(() => {
    setCurrent(colaborador)
    setNotas(colaborador.notas)
    setSaved(false)
    setActionError(null)
  }, [colaborador])

  const link = linkFor(current.token)
  const historialMap = new Map(
    current.historial.map((e) => [e.stage, e.timestamp])
  )

  async function handleSaveNotas() {
    setSaving(true)
    setActionError(null)
    const result = await guardarNotas(current.id, notas)
    setSaving(false)
    if (!result.ok) {
      setActionError(result.error ?? "Error al guardar")
      return
    }
    setSaved(true)
    if (result.colaborador) {
      setCurrent(result.colaborador)
      onUpdated?.(result.colaborador)
    }
  }

  async function handleMarcarRespondio() {
    setMarking(true)
    setActionError(null)
    const result = await marcarRespondio(current.id)
    setMarking(false)
    if (!result.ok) {
      setActionError(result.error ?? "Error al actualizar")
      return
    }
    if (result.colaborador) {
      setCurrent(result.colaborador)
      onUpdated?.(result.colaborador)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-3 border-b border-border px-6 py-5 pr-14">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">
              {current.nombre}
            </h2>
            <span className="text-sm text-muted-foreground">
              {current.tipoPlan}
            </span>
          </div>
          <StatusBadge stage={current.stage} />
        </div>
        {current.stage === "enviado" && (
          <Button
            size="sm"
            variant="outline"
            className="w-fit"
            disabled={marking}
            onClick={handleMarcarRespondio}
          >
            <MessageCircle data-icon="inline-start" />
            {marking ? "Marcando…" : "Marcar como respondió"}
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-6 px-6 py-6">
        <section className="flex flex-col gap-4">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Datos de la póliza
          </h3>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                Monto de cobertura
              </span>
              <span className="text-xl font-bold text-foreground tabular-nums">
                {currency.format(current.montoCobertura)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DataRow icon={Building2} label="Empresa" value={current.empresa} />
            <DataRow
              icon={Calendar}
              label="Fecha de alta"
              value={current.fechaAltaLabel}
            />
            <DataRow icon={Phone} label="WhatsApp" value={current.telefono} />
            <DataRow icon={CircleDot} label="Plan" value={current.tipoPlan} />
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-2.5">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Link único de activación
          </h3>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-foreground">
              {link}
            </code>
            <CopyButton
              value={link}
              label="Copiar"
              copiedLabel="Copiado"
              variant="default"
            />
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Historial del funnel
          </h3>
          <ol className="flex flex-col">
            {FUNNEL_ORDER.map((stage, i) => {
              const timestamp = historialMap.get(stage)
              const done = timestamp != null
              const config = STAGE_CONFIG[stage]
              const isLast = i === FUNNEL_ORDER.length - 1
              return (
                <li key={stage} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "mt-0.5 flex size-3.5 items-center justify-center rounded-full border-2",
                        done
                          ? "border-[var(--brand-teal)] bg-[var(--brand-teal)]"
                          : "border-border bg-background"
                      )}
                    />
                    {!isLast && (
                      <span
                        className={cn(
                          "w-px flex-1",
                          done ? "bg-[var(--brand-teal)]/40" : "bg-border"
                        )}
                      />
                    )}
                  </div>
                  <div className={cn("flex flex-col pb-4", isLast && "pb-0")}>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        done ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {config.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {done ? timestamp : "Pendiente"}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <Separator />

        <section className="flex flex-col gap-2.5">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Notas del operador
          </h3>
          <Textarea
            value={notas}
            onChange={(e) => {
              setNotas(e.target.value)
              setSaved(false)
            }}
            placeholder="Anota detalles de la conversación, dudas del colaborador, seguimientos pendientes…"
            className="min-h-28 resize-none"
          />
          {actionError && (
            <p className="text-xs text-destructive">{actionError}</p>
          )}
          <div className="flex items-center justify-end gap-2">
            {saved && (
              <span className="text-xs text-[var(--brand-success)]">
                Nota guardada
              </span>
            )}
            <Button size="sm" disabled={saving} onClick={handleSaveNotas}>
              {saving ? "Guardando…" : "Guardar nota"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
