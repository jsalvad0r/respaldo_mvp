import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { EmployeePolicyRow } from '@/lib/supabase/types'
import {
  FUNNEL_ORDER,
  computeMetricas,
  type Colaborador,
  type FunnelEvent,
  type FunnelStage,
  type Metrica,
} from '@/lib/panel/model'

const timestampFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const fechaAltaFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function formatTimestamp(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return timestampFormatter.format(d)
}

function formatFechaAlta(dateStr: string | null | undefined, fallbackIso?: string): string {
  const raw = dateStr ?? fallbackIso?.slice(0, 10)
  if (!raw) return "—"
  const d = new Date(`${raw}T12:00:00`)
  if (Number.isNaN(d.getTime())) return "—"
  return fechaAltaFormatter.format(d)
}

function deriveStage(row: EmployeePolicyRow): FunnelStage {
  if (row.status === 'activated' || row.activated_at) return 'activado'
  if (row.escaneo_at) return 'escaneo'
  if (row.clic_at) return 'clic'
  if (row.respondio_at) return 'respondio'
  if (row.enviado_at || row.created_at) return 'enviado'
  return 'enviado'
}

function buildHistorial(row: EmployeePolicyRow): FunnelEvent[] {
  const timestamps: Partial<Record<FunnelStage, string | null>> = {
    enviado: row.enviado_at ?? row.created_at,
    respondio: row.respondio_at,
    clic: row.clic_at,
    escaneo: row.escaneo_at,
    activado: row.activated_at,
  }

  return FUNNEL_ORDER.flatMap((stage) => {
    const iso = timestamps[stage]
    const formatted = formatTimestamp(iso)
    if (!formatted) return []
    return [{ stage, timestamp: formatted }]
  })
}

export function mapPolicyToColaborador(row: EmployeePolicyRow): Colaborador {
  const fechaAlta = row.fecha_alta ?? row.created_at.slice(0, 10)
  return {
    id: row.id,
    nombre: row.colaborador_nombre,
    empresa: row.companies?.nombre ?? '',
    fechaAlta,
    fechaAltaLabel: formatFechaAlta(row.fecha_alta, row.created_at),
    stage: deriveStage(row),
    token: row.token,
    montoCobertura: Number(row.monto_cobertura),
    tipoPlan: row.tipo_plan ?? 'Vida Básico',
    telefono: row.telefono ?? '—',
    notas: row.notas ?? '',
    historial: buildHistorial(row),
    enviadoAt: row.enviado_at ?? row.created_at,
    activatedAt: row.activated_at,
  }
}

const POLICY_SELECT =
  '*, companies(nombre)'

export async function listColaboradores(): Promise<Colaborador[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('employee_policies')
    .select(POLICY_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('No se pudieron cargar los colaboradores')
  }

  return (data as EmployeePolicyRow[]).map(mapPolicyToColaborador)
}

export async function getColaborador(id: string): Promise<Colaborador | null> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('employee_policies')
    .select(POLICY_SELECT)
    .eq('id', id)
    .maybeSingle<EmployeePolicyRow>()

  if (error || !data) return null
  return mapPolicyToColaborador(data)
}

export async function listCompanies(): Promise<string[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('companies')
    .select('nombre')
    .order('nombre')

  if (error) {
    throw new Error('No se pudieron cargar las empresas')
  }

  return (data ?? []).map((c) => c.nombre)
}

export async function getMetricas(): Promise<Metrica> {
  const colaboradores = await listColaboradores()
  return computeMetricas(colaboradores)
}

export async function stampClicAt(policyId: string): Promise<void> {
  const supabase = createServerSupabaseClient()
  await supabase
    .from('employee_policies')
    .update({ clic_at: new Date().toISOString() })
    .eq('id', policyId)
    .is('clic_at', null)
}

export async function stampEscaneoAt(policyId: string): Promise<void> {
  const supabase = createServerSupabaseClient()
  await supabase
    .from('employee_policies')
    .update({ escaneo_at: new Date().toISOString() })
    .eq('id', policyId)
    .is('escaneo_at', null)
}
