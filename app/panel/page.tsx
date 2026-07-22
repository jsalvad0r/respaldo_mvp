"use client"

import * as React from "react"
import { Search, Users } from "lucide-react"

import { ColaboradorDetail } from "@/components/panel/colaborador-detail"
import { CopyButton } from "@/components/panel/copy-button"
import { StatusBadge } from "@/components/panel/status-badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  COLABORADORES,
  EMPRESAS_LIST,
  FUNNEL_ORDER,
  STAGE_CONFIG,
  linkFor,
  type Colaborador,
  type FunnelStage,
} from "@/lib/panel/mock"

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
})

export default function ColaboradoresPage() {
  const [query, setQuery] = React.useState("")
  const [estado, setEstado] = React.useState<FunnelStage | "todos">("todos")
  const [empresa, setEmpresa] = React.useState<string>("todos")
  const [selected, setSelected] = React.useState<Colaborador | null>(null)
  const [open, setOpen] = React.useState(false)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return COLABORADORES.filter((c) => {
      if (estado !== "todos" && c.stage !== estado) return false
      if (empresa !== "todos" && c.empresa !== empresa) return false
      if (q && !c.nombre.toLowerCase().includes(q)) return false
      return true
    })
  }, [query, estado, empresa])

  function openDetail(colaborador: Colaborador) {
    setSelected(colaborador)
    setOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">
            Colaboradores
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Gestiona la activación de cada colaborador del piloto y copia sus
          links.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre…"
            className="h-9 pl-8"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={estado}
            onValueChange={(v) => setEstado(v as FunnelStage | "todos")}
          >
            <SelectTrigger size="default" className="h-9 min-w-44">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {FUNNEL_ORDER.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {STAGE_CONFIG[stage].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={empresa} onValueChange={setEmpresa}>
            <SelectTrigger size="default" className="h-9 min-w-44">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las empresas</SelectItem>
              {EMPRESAS_LIST.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-border bg-card ring-1 ring-foreground/5">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Nombre</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Cobertura</TableHead>
              <TableHead>Fecha de alta</TableHead>
              <TableHead>Estado del funnel</TableHead>
              <TableHead className="pr-4 text-right">Link único</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow
                key={c.id}
                onClick={() => openDetail(c)}
                className="cursor-pointer"
              >
                <TableCell className="pl-4 font-medium text-foreground">
                  {c.nombre}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.empresa}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {currency.format(c.montoCobertura)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.fechaAltaLabel}
                </TableCell>
                <TableCell>
                  <StatusBadge stage={c.stage} />
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <CopyButton
                    value={linkFor(c.token)}
                    label="Copiar link"
                    variant="outline"
                    size="sm"
                  />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-muted-foreground whitespace-normal"
                >
                  No hay colaboradores que coincidan con los filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando {filtered.length} de {COLABORADORES.length} colaboradores del
        piloto.
      </p>

      {/* Drawer de detalle */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="p-0">
          {selected && <ColaboradorDetail colaborador={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}
