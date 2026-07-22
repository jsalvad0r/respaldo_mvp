"use client"

import { MessageSquareText, Zap } from "lucide-react"

import { CopyButton } from "@/components/panel/copy-button"
import { PLANTILLAS } from "@/lib/panel/mock"

export default function PlantillasPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <MessageSquareText className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Plantillas</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Respuestas fijas para WhatsApp. Copia y pega. Sin improvisar.
        </p>
      </div>

      {/* Aviso de variables */}
      <div className="flex items-start gap-2.5 rounded-xl border border-accent/20 bg-[var(--brand-teal-light)] p-3.5">
        <Zap className="mt-0.5 size-4 shrink-0 text-accent" />
        <p className="text-sm text-foreground">
          Reemplaza{" "}
          <code className="rounded bg-background/60 px-1 py-0.5 font-mono text-xs">
            {"{MONTO}"}
          </code>{" "}
          y{" "}
          <code className="rounded bg-background/60 px-1 py-0.5 font-mono text-xs">
            {"{LINK}"}
          </code>{" "}
          con los datos del colaborador antes de enviar. Los encuentras en su
          detalle.
        </p>
      </div>

      {/* Tarjetas de plantillas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PLANTILLAS.map((p) => (
          <article
            key={p.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/5 transition-colors hover:border-accent/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <h2 className="text-sm font-semibold text-foreground">
                  {p.titulo}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {p.descripcion}
                </span>
              </div>
              <CopyButton
                value={p.texto}
                label="Copiar"
                copiedLabel="Copiado"
                variant="outline"
                size="sm"
                stopPropagation={false}
              />
            </div>
            <p className="rounded-lg bg-muted/40 p-3 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
              {p.texto}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
