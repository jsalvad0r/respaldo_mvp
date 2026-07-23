import { MetricasView } from '@/components/panel/metricas-view'
import { funnelCounts } from '@/lib/panel/model'
import { getMetricas, listColaboradores } from '@/lib/panel/server'

export const dynamic = 'force-dynamic'

export default async function MetricasPage() {
  const [colaboradores, metricas] = await Promise.all([
    listColaboradores(),
    getMetricas(),
  ])

  const counts = funnelCounts(colaboradores)

  return <MetricasView metricas={metricas} counts={counts} />
}
