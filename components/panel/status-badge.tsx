import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { STAGE_CONFIG, type FunnelStage } from "@/lib/panel/mock"

export function StatusBadge({
  stage,
  className,
}: {
  stage: FunnelStage
  className?: string
}) {
  const config = STAGE_CONFIG[stage]
  return (
    <Badge
      variant="secondary"
      className={cn("border-transparent", config.badgeClass, className)}
    >
      {config.label}
    </Badge>
  )
}
