"use client"

import * as React from "react"
import { Plus, Search, Users } from "lucide-react"

import { ColaboradorDetail } from "@/components/panel/colaborador-detail"
import { CopyButton } from "@/components/panel/copy-button"
import { StatusBadge } from "@/components/panel/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { crearColaborador } from "@/lib/panel/actions"
import {
  FUNNEL_ORDER,
  PLAN_OPTIONS,
  STAGE_CONFIG,
  linkFor,
  type Colaborador,
  type FunnelStage,
} from "@/lib/panel/model"

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
})

interface ColaboradoresClientProps {
  colaboradores: Colaborador[]
  empresas: string[]
}

export function ColaboradoresClient({
  colaboradores,
  empresas,
}: ColaboradoresClientProps) {
  const [query, setQuery] = React.useState("")
  const [estado, setEstado] = React.useState<FunnelStage | "todos">("todos")
  const [empresa, setEmpresa] = React.useState<string>("todos")
  const [selected, setSelected] = React.useState<Colaborador | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [createdLink, setCreatedLink] = React.useState<string | null>(null)

  const [form, setForm] = React.useState({
    nombre: "",
    empresa: "",
    telefono: "",
    tipoPlan: PLAN_OPTIONS[1].nombre,
    montoCobertura: PLAN_OPTIONS[1].monto,
    fechaAlta: new Date().toISOString().slice(0, 10),
  })

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return colaboradores.filter((c) => {
      if (estado !== "todos" && c.stage !== estado) return false
      if (empresa !== "todos" && c.empresa !== empresa) return false
      if (q && !c.nombre.toLowerCase().includes(q)) return false
      return true
    })
  }, [colaboradores, query, estado, empresa])

  function openDetail(colaborador: Colaborador) {
    setSelected(colaborador)
    setDetailOpen(true)
  }

  function resetCreateForm() {
    setForm({
      nombre: "",
      empresa: "",
      telefono: "",
      tipoPlan: PLAN_OPTIONS[1].nombre,
      montoCobertura: PLAN_OPTIONS[1].monto,
      fechaAlta: new Date().toISOString().slice(0, 10),
    })
    setCreateError(null)
    setCreatedLink(null)
  }

  function handlePlanChange(planNombre: string) {
    const plan = PLAN_OPTIONS.find((p) => p.nombre === planNombre)
    if (plan) {
      setForm((prev) => ({
        ...prev,
        tipoPlan: plan.nombre,
        montoCobertura: plan.monto,
      }))
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    setCreatedLink(null)

    const result = await crearColaborador({
      nombre: form.nombre,
      empresa: form.empresa,
      telefono: form.telefono || undefined,
      tipoPlan: form.tipoPlan,
      montoCobertura: form.montoCobertura,
      fechaAlta: form.fechaAlta,
    })

    setCreating(false)

    if (!result.ok) {
      setCreateError(result.error ?? "Error al crear colaborador")
      return
    }

    setCreatedLink(result.link ?? null)
    setForm({
      nombre: "",
      empresa: "",
      telefono: "",
      tipoPlan: PLAN_OPTIONS[1].nombre,
      montoCobertura: PLAN_OPTIONS[1].monto,
      fechaAlta: new Date().toISOString().slice(0, 10),
    })
    setCreateError(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
        <Button
          className="shrink-0"
          onClick={() => {
            resetCreateForm()
            setCreateOpen(true)
          }}
        >
          <Plus data-icon="inline-start" />
          Nuevo colaborador
        </Button>
      </div>

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
              {empresas.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
                  {colaboradores.length === 0
                    ? "Aún no hay colaboradores. Crea el primero con el botón de arriba."
                    : "No hay colaboradores que coincidan con los filtros."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando {filtered.length} de {colaboradores.length} colaboradores del
        piloto.
      </p>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="p-0">
          {selected && (
            <ColaboradorDetail
              colaborador={selected}
              onUpdated={(updated) => {
                setSelected(updated)
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) resetCreateForm()
        }}
      >
        <SheetContent className="flex flex-col p-0">
          <SheetHeader>
            <SheetTitle>Nuevo colaborador</SheetTitle>
            <SheetDescription>
              Registra un alta del piloto y genera su link único de activación.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleCreate}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Nombre completo</label>
              <Input
                required
                value={form.nombre}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Ej. Sofía Ramírez"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Empresa</label>
              <Input
                required
                list="empresas-list"
                value={form.empresa}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, empresa: e.target.value }))
                }
                placeholder="Nombre de la empresa"
              />
              <datalist id="empresas-list">
                {empresas.map((e) => (
                  <option key={e} value={e} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">WhatsApp (opcional)</label>
              <Input
                value={form.telefono}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, telefono: e.target.value }))
                }
                placeholder="+52 55 1234 5678"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Plan</label>
              <Select value={form.tipoPlan} onValueChange={handlePlanChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((plan) => (
                    <SelectItem key={plan.nombre} value={plan.nombre}>
                      {plan.nombre} · {currency.format(plan.monto)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Fecha de alta</label>
              <Input
                type="date"
                required
                value={form.fechaAlta}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fechaAlta: e.target.value }))
                }
              />
            </div>

            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}

            {createdLink && (
              <div className="flex flex-col gap-2 rounded-xl border border-[var(--brand-success)]/30 bg-emerald-50 p-3 dark:bg-emerald-950/30">
                <p className="text-sm font-medium text-foreground">
                  Colaborador creado. Copia el link de activación:
                </p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-background px-2 py-1.5 font-mono text-xs">
                    {createdLink}
                  </code>
                  <CopyButton
                    value={createdLink}
                    label="Copiar"
                    variant="default"
                    size="sm"
                    stopPropagation={false}
                  />
                </div>
              </div>
            )}
          </form>

          <SheetFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              type="submit"
              disabled={creating}
              onClick={handleCreate}
            >
              {creating ? "Creando…" : "Crear y generar link"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
