"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, MessageSquareText, Shield, Users } from "lucide-react"

import { cn } from "@/lib/utils"

const NAV = [
  { href: "/panel", label: "Colaboradores", icon: Users },
  { href: "/panel/plantillas", label: "Plantillas", icon: MessageSquareText },
  { href: "/panel/metricas", label: "Métricas", icon: BarChart3 },
]

export function PanelSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Shield className="size-4" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold text-sidebar-foreground">
            VidaSegura
          </span>
          <span className="text-[11px] text-muted-foreground">
            Panel del piloto
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <p className="px-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Operación
        </p>
        {NAV.map((item) => {
          const active =
            item.href === "/panel"
              ? pathname === "/panel"
              : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
            OP
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium text-sidebar-foreground">
              Operador
            </span>
            <span className="text-[11px] text-muted-foreground">
              Turno activo · SLA &lt;5 min
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
