"use client"

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

import { STAGE_CONFIG, type FunnelStage } from "@/lib/panel/model"

interface FunnelChartProps {
  counts: { stage: FunnelStage; count: number }[]
}

export function FunnelChart({ counts }: FunnelChartProps) {
  const total = counts[0]?.count ?? 0

  const data = counts.map(({ stage, count }) => ({
    stage,
    label: STAGE_CONFIG[stage].short,
    count,
    pct: total ? Math.round((count / total) * 100) : 0,
    color: STAGE_CONFIG[stage].chartColor,
  }))

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 56, bottom: 4, left: 8 }}
          barCategoryGap={10}
        >
          <XAxis type="number" hide domain={[0, total]} />
          <YAxis
            type="category"
            dataKey="label"
            axisLine={false}
            tickLine={false}
            width={92}
            tick={{
              fontSize: 13,
              fill: "var(--muted-foreground)",
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 4, 4]} isAnimationActive={false}>
            {data.map((entry) => (
              <Cell key={entry.stage} fill={entry.color} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              formatter={(value) => {
                const n = Number(value ?? 0)
                const pct = total ? Math.round((n / total) * 100) : 0
                return `${n}  ·  ${pct}%`
              }}
              style={{
                fill: "var(--foreground)",
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
