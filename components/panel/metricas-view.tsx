"use client"

import {
  BarChart3,
  Clock,
  MousePointerClick,
  TrendingUp,
} from "lucide-react"

import { FunnelChart } from "@/components/panel/funnel-chart"
import { cn } from "@/lib/utils"
import {
  STAGE_CONFIG,
  type FunnelStage,
  type Metrica,
} from "@/lib/panel/model"

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  meta: string
  metGoal?: boolean
  hint?: string
}

function KpiCard({ icon: Icon, label, value, meta, metGoal, hint }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              metGoal == null
                ? "bg-muted text-muted-foreground"
                : metGoal
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            )}
          >
            Meta: {meta}
          </span>
          {hint && (
            <span className="text-xs text-muted-foreground">{hint}</span>
          )}
        </div>
      </div>
    </div>
  )
}

interface MetricasViewProps {
  metricas: Metrica
  counts: { stage: FunnelStage; count: number }[]
}

export function MetricasView({ metricas, counts }: MetricasViewProps) {
  const total = counts[0]?.count ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Métricas</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Desempeño del piloto sobre {metricas.total} colaboradores.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          icon={TrendingUp}
          label="Tasa de activación a 7 días"
          value={`${metricas.activationRate}%`}
          meta=">28%"
          metGoal={metricas.activationRate > 28}
          hint={`${metricas.activados}/${metricas.total}`}
        />
        <KpiCard
          icon={MousePointerClick}
          label="Tasa de clic en link"
          value={`${metricas.clickRate}%`}
          meta="≥60%"
          metGoal={metricas.clickRate >= 60}
        />
        <KpiCard
          icon={Clock}
          label="Tiempo promedio de activación"
          value={metricas.avgActivationLabel}
          meta="<5 min"
          metGoal={metricas.avgActivationMetGoal}
          hint="1er mensaje → activó"
        />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">
            Embudo de activación
          </h2>
          <p className="text-sm text-muted-foreground">
            Cuántos colaboradores llegaron a cada etapa del funnel.
          </p>
        </div>
        <FunnelChart counts={counts} />

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-5">
          {counts.map(({ stage, count }, i) => {
            const prev = i > 0 ? counts[i - 1].count : count
            const drop = prev > 0 ? Math.round((count / prev) * 100) : 100
            return (
              <div key={stage} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: STAGE_CONFIG[stage].chartColor }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {STAGE_CONFIG[stage].short}
                  </span>
                </div>
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {count}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {i === 0
                    ? `${total > 0 ? Math.round((count / total) * 100) : 0}% del total`
                    : `${drop}% de la etapa previa`}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
